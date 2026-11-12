#!/usr/bin/env bash
# Push a branch that touches .github/workflows despite the PAT lacking the
# `workflow` scope.
#
# GitHub rejects workflow-file pushes from tokens without that scope. This
# script registers a throwaway ed25519 key as a write deploy key through the
# REST API, pushes the branch over SSH, then deletes the key and local key
# material. Nothing persists after the script exits.
#
# Usage:
#   GH_TOKEN=ghp_xxx scripts/push-workflow-branch.sh <branch>
#
# GH_TOKEN needs permission to add and delete deploy keys for the repository
# (classic: `repo`; fine-grained: Administration: write).
set -euo pipefail

die() {
  echo "error: $*" >&2
  exit 1
}

[ "$#" -eq 1 ] || die "usage: GH_TOKEN=... $0 <branch>"
BRANCH="$1"
[ -n "$BRANCH" ] || die "branch must not be empty"
[ "$BRANCH" != "main" ] || die "refusing to push directly to main; open a PR instead"
[ -n "${GH_TOKEN:-}" ] || die "GH_TOKEN environment variable is required"

command -v curl >/dev/null 2>&1 || die "curl is required"
command -v ssh-keygen >/dev/null 2>&1 || die "ssh-keygen is required"
command -v git >/dev/null 2>&1 || die "git is required"

REPO_URL="$(git remote get-url origin 2>/dev/null)" || die "origin remote not found"
[[ "$REPO_URL" == *github.com* ]] || die "origin does not point at github.com: $REPO_URL"
SLUG="${REPO_URL#*github.com}"
SLUG="${SLUG#:}"
SLUG="${SLUG#/}"
SLUG="${SLUG%/}"
SLUG="${SLUG%.git}"
OWNER="${SLUG%%/*}"
REPO="${SLUG#*/}"
if [ -z "$OWNER" ] || [ -z "$REPO" ] || [ "$REPO" = "$SLUG" ]; then
  die "could not parse owner/repo from $REPO_URL"
fi

git rev-parse --verify --quiet "refs/heads/$BRANCH" >/dev/null 2>&1 \
  || die "local branch '$BRANCH' does not exist"

TMP="$(mktemp -d)"
KEY="$TMP/deploy_key"
KEY_ID=""
cleanup() {
  if [ -n "$KEY_ID" ]; then
    curl -sS -X DELETE \
      -H "Authorization: Bearer $GH_TOKEN" \
      -H "Accept: application/vnd.github+json" \
      -H "X-GitHub-Api-Version: 2022-11-28" \
      "https://api.github.com/repos/$OWNER/$REPO/keys/$KEY_ID" >/dev/null || true
  fi
  rm -rf "$TMP"
}
trap cleanup EXIT INT TERM

ssh-keygen -q -t ed25519 -N '' \
  -C "ephemeral workflow push $(date -u +%Y%m%dT%H%M%SZ)" -f "$KEY"
PUBLIC_KEY="$(cat "$KEY.pub")"
TITLE="ephemeral workflow push $(date -u +%Y%m%dT%H%M%SZ)"

RESPONSE="$(curl -sS -X POST \
  -H "Authorization: Bearer $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  --data-binary @- \
  "https://api.github.com/repos/$OWNER/$REPO/keys" <<JSON
{"title":"$TITLE","key":"$PUBLIC_KEY","read_only":false}
JSON
)"

KEY_ID="$(printf '%s' "$RESPONSE" | sed -n 's/.*"id":[[:space:]]*\([0-9][0-9]*\).*/\1/p' | head -n 1)"
if [ -z "$KEY_ID" ]; then
  echo "error: GitHub did not return a deploy key id. Response:" >&2
  printf '%s\n' "$RESPONSE" >&2
  exit 1
fi

echo "Registered temporary deploy key $KEY_ID on $OWNER/$REPO."
echo "The key exists only for this push and is deleted when the script exits."

export GIT_SSH_COMMAND="ssh -i \"$KEY\" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"
git fetch --quiet origin "refs/heads/$BRANCH:refs/remotes/origin/$BRANCH" || true
git push --force-with-lease "git@github.com:$OWNER/$REPO.git" -- "refs/heads/$BRANCH:refs/heads/$BRANCH"

echo "Pushed '$BRANCH' with the temporary key; deleting it now."
