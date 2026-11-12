/**
 * Meridian PR review bot.
 *
 * Runs from the trusted base commit of a `pull_request_target` workflow. It never
 * checks out, installs, or executes pull request code: the only inputs are GitHub
 * REST metadata and file contents for changed files. The token is never printed.
 *
 * Exit code is 0 unless a blocking finding exists (or the GitHub API fails).
 */

const MARKER = '<!-- meridian-pr-review -->';
const API_ORIGIN = 'https://api.github.com';
const API_VERSION = '2022-11-28';
const MAX_PAGES = 100;
const MAX_FINDINGS_PER_SECTION = 25;
const MAX_COMMENT_CHARS = 60000;
const DEMO_MEDIA_PREFIX = 'apps/web/src/pages/demos/';
const LARGE_FILE_BYTES = 1024 * 1024;

const SECRET_PATTERNS = [
  { name: 'GitHub personal access token', re: /\bghp_[A-Za-z0-9]{16,}/ },
  { name: 'GitHub fine-grained token', re: /\bgithub_pat_[A-Za-z0-9_]{20,}/ },
  { name: 'AWS access key id', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'private key block', re: /-----BEGIN (?:[A-Z0-9]+ )?PRIVATE KEY-----/ },
  { name: 'MongoDB URI with credentials', re: /mongodb(?:\+srv)?:\/\/[^\s:@/]+:[^\s@/]+@/ },
  { name: 'Stripe live secret key', re: /\bsk_live_[A-Za-z0-9]{10,}\b/ },
  { name: 'Slack token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
];

const CONFLICT_MARKERS = [/^<{7,}/, /^>{7,}/];

const UNTRUSTED_REF_SOURCE = 'github\\.event\\.pull_request\\.head\\.(?:sha|ref)|github\\.head_ref';

// Only a checkout target matters: `ref: <untrusted ref>` or a git fetch/checkout
// command. A pull_request_target workflow may legitimately pass the head SHA to a
// read-only API script through `env:` (this bot does exactly that).
const UNTRUSTED_CHECKOUT_RE = new RegExp(
  `(?:\\bref\\s*:[^\\n]*(?:${UNTRUSTED_REF_SOURCE})|` +
    `\\bgit\\s+(?:checkout|switch|fetch|pull|reset)\\b[^\\n]*(?:${UNTRUSTED_REF_SOURCE}))`,
);

const BINARY_EXTENSION_RE =
  /\.(?:png|jpe?g|gif|webp|avif|ico|bmp|tiff?|psd|ai|sketch|pdf|zip|gz|tgz|bz2|xz|7z|rar|tar|iso|exe|dll|so|dylib|bin|dat|wasm|node|o|a|jar|class|pyc|mp4|mov|avi|mkv|webm|mp3|wav|ogg|flac|ttf|otf|woff2?|eot|db|sqlite)$/i;

const CODE_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.html',
  '.htm',
  '.css',
  '.scss',
  '.less',
  '.vue',
  '.svelte',
  '.yml',
  '.yaml',
]);

// Keys whose semver-looking values are not dependencies.
const NON_DEPENDENCY_KEYS = new Set([
  'name',
  'version',
  'private',
  'description',
  'license',
  'author',
  'contributors',
  'main',
  'module',
  'browser',
  'types',
  'typings',
  'exports',
  'imports',
  'type',
  'homepage',
  'repository',
  'bugs',
  'engines',
  'os',
  'cpu',
  'workspaces',
  'scripts',
  'files',
  'publishConfig',
  'packageManager',
  'keywords',
  'funding',
  'man',
  'bin',
  'directories',
  'config',
  'node',
  'npm',
]);

const DEPENDENCY_LINE_RE =
  /^\s*"([^"]+)"\s*:\s*"(?:[~^]|[<>]=?)?\s*(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)"\s*,?\s*$/;

// Built by concatenation so this script never flags its own source text when the
// review workflow file is itself part of a pull request diff.
const REVIEW_MARKER_WORDS_RE = new RegExp(
  `\\b(?:${['TO' + 'DO', 'FIX' + 'ME'].join('|')})\\b`,
);
const REVIEW_MARKER_LABEL = ['TO' + 'DO', 'FIX' + 'ME'].join('/');

let authToken = '';

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function apiUrl(path) {
  return path.startsWith('https://') ? path : `${API_ORIGIN}${path}`;
}

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(apiUrl(path), {
    method,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${authToken}`,
      'x-github-api-version': API_VERSION,
      'user-agent': 'meridian-pr-review',
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw new Error(`GitHub API ${method} ${path} returned ${res.status} ${res.statusText}`);
  }

  if (res.status === 204) return { data: null, link: '' };
  return { data: await res.json(), link: res.headers.get('link') ?? '' };
}

async function apiList(path) {
  const items = [];
  let next = path;

  for (let page = 1; next && page <= MAX_PAGES; page += 1) {
    const { data, link } = await api(next);
    if (!Array.isArray(data)) {
      throw new Error(`Expected a JSON list from ${next}`);
    }
    items.push(...data);
    const match = /<([^>]+)>;\s*rel="next"/.exec(link);
    next = match ? match[1] : null;
  }

  return items;
}

function encodePath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

function baseName(path) {
  return path.split('/').pop() ?? '';
}

function isLockfile(path) {
  const name = baseName(path);
  return (
    name === 'package-lock.json' ||
    name === 'npm-shrinkwrap.json' ||
    name === 'yarn.lock' ||
    name === 'pnpm-lock.yaml'
  );
}

function isManifest(path) {
  return baseName(path) === 'package.json';
}

function isTestPath(path) {
  return (
    /(^|\/)(?:__tests__|test|tests)\//.test(path) || /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(path)
  );
}

function isDocsPath(path) {
  return /^docs\//.test(path) || /\.(?:md|mdx)$/i.test(path);
}

function isEnvFile(path) {
  const name = baseName(path);
  return name === '.env' || name.startsWith('.env.');
}

function isCodeFile(path) {
  if (isDocsPath(path) || isLockfile(path) || isTestPath(path)) return false;
  const dot = path.lastIndexOf('.');
  return dot !== -1 && CODE_EXTENSIONS.has(path.slice(dot).toLowerCase());
}

function isSourceFile(path) {
  return !isDocsPath(path) && !isLockfile(path) && !isEnvFile(path);
}

function describeFiles(files) {
  const counts = { source: 0, test: 0, docs: 0, workflow: 0, dependency: 0, other: 0 };

  for (const file of files) {
    const path = file.filename;
    if (/^\.github\/workflows\//.test(path)) counts.workflow += 1;
    else if (isTestPath(path)) counts.test += 1;
    else if (isDocsPath(path)) counts.docs += 1;
    else if (isLockfile(path) || isManifest(path)) counts.dependency += 1;
    else if (isCodeFile(path)) counts.source += 1;
    else counts.other += 1;
  }

  const labels = [
    ['source', 'source'],
    ['test', 'test'],
    ['docs', 'docs'],
    ['workflow', 'workflow'],
    ['dependency', 'dependency'],
    ['other', 'other'],
  ];

  const parts = labels
    .filter(([key]) => counts[key] > 0)
    .map(([key, label]) => `${counts[key]} ${label}${counts[key] === 1 ? '' : 's'}`);

  return parts.join(', ') || 'no files';
}

/**
 * Split a patch into added, removed, and target-side (context + added) lines,
 * tracking the new-file line number. Binary files have no patch.
 */
function parsePatch(patch) {
  const added = [];
  const removed = [];
  const target = [];
  if (typeof patch !== 'string') return { added, removed, target };

  let newLine = 0;
  let sawHunk = false;

  for (const raw of patch.split('\n')) {
    const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;

    if (line.startsWith('@@')) {
      const match = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
      if (match) newLine = Number(match[1]);
      sawHunk = true;
      continue;
    }

    // Only the file header can be `+++` or `---`; inside a hunk these are content.
    if (!sawHunk && (line.startsWith('+++') || line.startsWith('---'))) continue;

    if (line.startsWith('+')) {
      const text = line.slice(1);
      added.push({ line: newLine, text });
      target.push({ line: newLine, text });
      newLine += 1;
    } else if (line.startsWith('-')) {
      removed.push({ line: 0, text: line.slice(1) });
    } else if (line.startsWith(' ')) {
      target.push({ line: newLine, text: line.slice(1) });
      newLine += 1;
    }
  }

  return { added, removed, target };
}

function stripYamlComment(line) {
  if (line.trimStart().startsWith('#')) return '';
  const commentAt = line.search(/\s#/);
  return commentAt === -1 ? line : line.slice(0, commentAt);
}

function dependencyChanges(parsed) {
  const oldVersions = new Map();
  const newVersions = new Map();

  for (const { text } of parsed.removed) {
    const match = DEPENDENCY_LINE_RE.exec(text);
    if (match && !NON_DEPENDENCY_KEYS.has(match[1])) oldVersions.set(match[1], match[2]);
  }

  for (const { text } of parsed.added) {
    const match = DEPENDENCY_LINE_RE.exec(text);
    if (match && !NON_DEPENDENCY_KEYS.has(match[1])) newVersions.set(match[1], match[2]);
  }

  const changes = [];

  for (const [name, to] of newVersions) {
    const from = oldVersions.get(name);
    if (from !== to) changes.push({ name, from, to });
  }

  for (const [name, from] of oldVersions) {
    if (!newVersions.has(name)) changes.push({ name, from, to: null });
  }

  return changes;
}

function majorOf(version) {
  const match = /^(\d+)\./.exec(version ?? '');
  return match ? Number(match[1]) : null;
}

function isDeployConfig(path) {
  const name = baseName(path);
  return (
    /nginx/i.test(path) ||
    /^ecosystem(?:\.config)?\.(?:js|cjs|mjs|json|ya?ml)$/i.test(name) ||
    /^pm2[^/]*\.(?:js|cjs|mjs|json|ya?ml)$/i.test(name) ||
    path === 'scripts/deploy.sh'
  );
}

function addFinding(findings, section, title, location, detail) {
  findings[section].push({ title, location, detail });
}

function analyzeAddedLines(file, parsed, findings) {
  const path = file.filename;

  for (const { line, text } of parsed.added) {
    const location = `${path}:${line}`;

    for (const rule of SECRET_PATTERNS) {
      if (rule.re.test(text)) {
        addFinding(findings, 'blocking', `Secret-shaped string (${rule.name})`, location);
      }
    }

    if (CONFLICT_MARKERS.some((re) => re.test(text))) {
      addFinding(findings, 'blocking', 'Merge conflict marker', location);
    }

    if (/^\s*permissions\s*:\s*write-all\s*$/.test(text)) {
      addFinding(findings, 'blocking', '`permissions: write-all`', location);
    }

    if (
      /^apps\/(?:api|web\/src)\//.test(path) &&
      !isTestPath(path) &&
      !isEnvFile(path) &&
      /\bconsole\.log\s*\(/.test(text)
    ) {
      addFinding(findings, 'shouldFix', '`console.log` added', location);
    }

    if (
      /^apps\/(?:api|web\/src)\//.test(path) &&
      !isTestPath(path) &&
      !isEnvFile(path) &&
      /^\s*debugger\s*;?\s*$/.test(text)
    ) {
      addFinding(findings, 'shouldFix', '`debugger` statement added', location);
    }

    if (isCodeFile(path) && /http:\/\//i.test(text)) {
      const urls = text.match(/http:\/\/[^\s"'`)<>\]]+/gi) ?? [];
      for (const raw of urls) {
        let hostname;
        try {
          hostname = new URL(raw).hostname.toLowerCase();
        } catch {
          continue;
        }
        const exemptHost =
          hostname === 'localhost' ||
          hostname === '127.0.0.1' ||
          hostname === '::1' ||
          hostname === '[::1]' ||
          hostname === '0.0.0.0';
        const xmlNamespace =
          /\bxmlns\b/i.test(text) ||
          hostname === 'www.w3.org' ||
          hostname.endsWith('.w3.org') ||
          hostname.startsWith('schemas.');
        if (!exemptHost && !xmlNamespace) {
          addFinding(
            findings,
            'shouldFix',
            'Hardcoded non-TLS URL in source',
            location,
            `\`${raw}\` should use https or the shared API client.`,
          );
        }
      }
    }

    if (isSourceFile(path) && REVIEW_MARKER_WORDS_RE.test(text)) {
      addFinding(findings, 'shouldFix', `\`${REVIEW_MARKER_LABEL}\` added`, location);
    }
  }
}

async function checkWorkflows(workflowFiles, parsedByPath, owner, repo, headSha, findings) {
  for (const file of workflowFiles) {
    if (file.status === 'removed') continue;

    const path = file.filename;
    const contents = await api(
      `/repos/${owner}/${repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(headSha)}`,
    );

    let lines = parsedByPath.get(path)?.target ?? [];

    if (
      contents?.data?.type === 'file' &&
      typeof contents.data.content === 'string' &&
      contents.data.content.length > 0
    ) {
      lines = Buffer.from(contents.data.content, 'base64')
        .toString('utf8')
        .split('\n')
        .map((text, index) => ({ line: index + 1, text }));
    }

    const cleanLines = lines.map(({ line, text }) => ({
      line,
      text: stripYamlComment(text),
    }));

    const hasPullRequestTarget = cleanLines.some(({ text }) =>
      /\bpull_request_target\b/.test(text),
    );
    if (!hasPullRequestTarget) continue;

    const hit = cleanLines.find(({ text }) => UNTRUSTED_CHECKOUT_RE.test(text));
    if (hit) {
      addFinding(
        findings,
        'blocking',
        '`pull_request_target` workflow checks out untrusted PR code',
        `${path}:${hit.line}`,
        'This workflow runs with a write token; checking out the pull request head executes untrusted code.',
      );
    }
  }
}

function analyzeLargeFiles(files, treeEntries, treeTruncated, findings) {
  const candidates = files.filter(
    (file) => file.status === 'added' && !file.filename.startsWith(DEMO_MEDIA_PREFIX),
  );
  if (candidates.length === 0) return;

  for (const file of candidates) {
    const entry = treeEntries.get(file.filename);
    if (!entry || typeof entry.size !== 'number' || entry.size <= LARGE_FILE_BYTES) continue;
    const executable = entry.mode === '100755';
    const binary = BINARY_EXTENSION_RE.test(file.filename);
    if (executable || binary) {
      addFinding(
        findings,
        'blocking',
        'Large binary or executable file added',
        file.filename,
        `${Math.round(entry.size / 1024)} KiB added outside demo assets.`,
      );
    }
  }

  if (treeTruncated) {
    addFinding(
      findings,
      'notes',
      'Large-file scan was partial',
      '',
      'GitHub truncated the repository tree listing, so some added files could not be sized.',
    );
  }
}

function renderFinding(finding) {
  const location = finding.location ? ` — \`${finding.location.replace(/`/g, "'")}\`` : '';
  const detail = finding.detail ? `: ${finding.detail}` : '';
  return `- **${finding.title}**${location}${detail}`;
}

function renderSection(items) {
  const visible = items.slice(0, MAX_FINDINGS_PER_SECTION).map(renderFinding);
  if (items.length > MAX_FINDINGS_PER_SECTION) {
    visible.push(`- …and ${items.length - MAX_FINDINGS_PER_SECTION} more.`);
  }
  return visible.join('\n');
}

function buildCommentBody({ files, additions, deletions, headSha, baseSha, findings }) {
  const shortHead = headSha.slice(0, 7);
  const shortBase = baseSha.slice(0, 7);
  const lgtm = findings.blocking.length === 0 && findings.shouldFix.length === 0;

  const summary =
    `Reviewed ${files.length} changed file${files.length === 1 ? '' : 's'} ` +
    `at \`${shortHead}\` against base \`${shortBase}\` ` +
    `(inspected ${describeFiles(files)}; +${additions}/−${deletions}).`;

  const lines = [MARKER, '', `## PR review — \`${shortHead}\``, ''];

  if (lgtm) {
    lines.push('LGTM — no blocking or should-fix findings.', '', summary, '');
  } else {
    lines.push(summary, '');
    if (findings.blocking.length > 0) {
      lines.push('### Blocking', '', renderSection(findings.blocking), '');
    }
    if (findings.shouldFix.length > 0) {
      lines.push('### Should fix', '', renderSection(findings.shouldFix), '');
    }
  }

  if (findings.notes.length > 0) {
    lines.push('### Notes', '', renderSection(findings.notes), '');
  }

  lines.push(
    `<sub>Automated review of \`${shortHead}\`; findings are heuristic. ` +
      'Re-runs update this comment.</sub>',
  );

  let body = lines.join('\n');
  if (body.length > MAX_COMMENT_CHARS) {
    body = `${body.slice(0, MAX_COMMENT_CHARS - 40)}\n\n…comment truncated.</sub>`;
  }
  return body;
}

async function main() {
  authToken = requiredEnv('GITHUB_TOKEN');
  const repository = requiredEnv('GITHUB_REPOSITORY');
  const prNumber = Number(requiredEnv('PR_NUMBER'));
  const author = requiredEnv('PR_AUTHOR');
  const baseSha = requiredEnv('PR_BASE_SHA');
  const headSha = requiredEnv('PR_HEAD_SHA');

  if (!Number.isInteger(prNumber) || prNumber <= 0) {
    throw new Error('PR_NUMBER must be a positive integer');
  }

  const [owner, repo] = repository.split('/');
  if (!owner || !repo) {
    throw new Error('GITHUB_REPOSITORY must have the form owner/repo');
  }

  console.log(`Reviewing ${repository}#${prNumber} by ${author} at ${headSha.slice(0, 7)}`);

  const files = await apiList(
    `/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=100`,
  );

  const findings = { blocking: [], shouldFix: [], notes: [] };
  const parsedByPath = new Map();
  const manifestChanges = new Map();
  let additions = 0;
  let deletions = 0;

  for (const file of files) {
    const parsed = parsePatch(file.patch);
    parsedByPath.set(file.filename, parsed);
    additions += Number.isFinite(file.additions) ? file.additions : 0;
    deletions += Number.isFinite(file.deletions) ? file.deletions : 0;

    const envFileTouched =
      file.status !== 'removed' &&
      isEnvFile(file.filename) &&
      baseName(file.filename) !== '.env.example' &&
      (file.status !== 'modified' || parsed.added.length > 0);

    if (envFileTouched) {
      addFinding(
        findings,
        'blocking',
        'Committed environment file',
        file.filename,
        '`.env` files are not allowed; use `.env.example` with placeholder values.',
      );
    }

    analyzeAddedLines(file, parsed, findings);

    if (isManifest(file.filename) && file.status !== 'removed') {
      manifestChanges.set(file.filename, dependencyChanges(parsed));
    }
  }

  const workflowFiles = files.filter((file) =>
    /^\.github\/workflows\/.+\.ya?ml$/i.test(file.filename),
  );
  if (workflowFiles.length > 0) {
    const names = workflowFiles.slice(0, 5).map((file) => file.filename).join(', ');
    const extra = workflowFiles.length > 5 ? ` and ${workflowFiles.length - 5} more` : '';
    addFinding(
      findings,
      'notes',
      'Workflow changes require the deploy-key workaround',
      '',
      `${names}${extra} changed. Pushes that modify workflows ` +
        'need the temporary deploy key because the PAT lacks workflow scope.',
    );
  }
  await checkWorkflows(workflowFiles, parsedByPath, owner, repo, headSha, findings);

  const routeFiles = files.filter(
    (file) => file.status !== 'removed' && /^apps\/api\/routes\//.test(file.filename),
  );
  const testFiles = files.filter((file) => isTestPath(file.filename));
  if (routeFiles.length > 0 && testFiles.length === 0) {
    addFinding(
      findings,
      'shouldFix',
      'API routes changed without tests',
      routeFiles[0].filename,
      `${routeFiles.length} route file${routeFiles.length === 1 ? '' : 's'} changed but no ` +
        '`test/*.test.js` or `*.test.ts` file changed in this PR.',
    );
  }

  const lockfileChanged = files.some((file) => isLockfile(file.filename));
  for (const [path, changes] of manifestChanges) {
    if (changes.length > 0 && !lockfileChanged) {
      const names = changes.slice(0, 8).map((change) => `\`${change.name}\``).join(', ');
      const extra = changes.length > 8 ? ` and ${changes.length - 8} more` : '';
      addFinding(
        findings,
        'shouldFix',
        'Dependency version changed without lockfile update',
        path,
        `${names}${extra} changed but \`package-lock.json\` was not updated.`,
      );
    }
  }

  const deployConfigFiles = files.filter(
    (file) => file.status !== 'removed' && isDeployConfig(file.filename),
  );
  const deploymentDocChanged = files.some((file) => file.filename === 'docs/DEPLOYMENT.md');
  if (deployConfigFiles.length > 0 && !deploymentDocChanged) {
    addFinding(
      findings,
      'shouldFix',
      'Deployment configuration changed without deployment docs',
      deployConfigFiles[0].filename,
      'nginx/PM2 changes need documented validation in `docs/DEPLOYMENT.md`.',
    );
  }

  const hasAddedOutsideDemos = files.some(
    (file) => file.status === 'added' && !file.filename.startsWith(DEMO_MEDIA_PREFIX),
  );
  if (hasAddedOutsideDemos) {
    // The pull request files API has no byte size or file mode. Read tree metadata
    // for the head commit instead of downloading any blob content.
    const tree = await api(
      `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(headSha)}?recursive=1`,
    );
    const entries = new Map();
    for (const entry of tree.data?.tree ?? []) {
      if (entry && entry.type === 'blob' && typeof entry.path === 'string') {
        entries.set(entry.path, entry);
      }
    }
    analyzeLargeFiles(files, entries, Boolean(tree.data?.truncated), findings);
  }

  const dependencyOnly =
    files.length > 0 &&
    files.every((file) => isManifest(file.filename) || isLockfile(file.filename));

  if (dependencyOnly) {
    if (!files.some((file) => isManifest(file.filename))) {
      addFinding(
        findings,
        'notes',
        'Lockfile-only diff',
        '',
        'Only lockfiles changed; confirm the update is intentional.',
      );
    } else {
      addFinding(
        findings,
        'notes',
        'Dependency-only PR',
        '',
        'Only manifests and lockfiles changed; review the version ranges rather than application code.',
      );
    }

    for (const [path, changes] of manifestChanges) {
      for (const change of changes) {
        const from = majorOf(change.from);
        const to = majorOf(change.to);
        if (from !== null && to !== null && from !== to) {
          addFinding(
            findings,
            'notes',
            'Major version bump',
            path,
            `\`${change.name}\` moves from ${change.from} to ${change.to}.`,
          );
        }
      }
    }
  }

  if (files.length >= 3000) {
    addFinding(
      findings,
      'notes',
      'File list may be truncated',
      '',
      'GitHub reports at most 3000 changed files; review was limited to those files.',
    );
  }

  const body = buildCommentBody({ files, additions, deletions, headSha, baseSha, findings });
  const comments = await apiList(
    `/repos/${owner}/${repo}/issues/${prNumber}/comments?per_page=100`,
  );

  const existing = comments.find(
    (comment) =>
      comment?.user?.login === 'github-actions[bot]' &&
      typeof comment.body === 'string' &&
      comment.body.includes(MARKER),
  );

  if (existing) {
    await api(`/repos/${owner}/${repo}/issues/comments/${existing.id}`, {
      method: 'PATCH',
      body: { body },
    });
    console.log('Updated the existing PR review comment.');
  } else {
    await api(`/repos/${owner}/${repo}/issues/${prNumber}/comments`, {
      method: 'POST',
      body: { body },
    });
    console.log('Created a new PR review comment.');
  }

  console.log(
    `Findings: ${findings.blocking.length} blocking, ${findings.shouldFix.length} should fix, ` +
      `${findings.notes.length} note${findings.notes.length === 1 ? '' : 's'}.`,
  );

  if (findings.blocking.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`PR review failed: ${error.message}`);
  process.exitCode = 1;
});
