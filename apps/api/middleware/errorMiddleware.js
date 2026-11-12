// apps/api/middleware/errorMiddleware.js - JSON error responses.
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let status = Number(err.status || err.statusCode) || 0;
  let message = err.message || 'Server error';

  if (err.name === 'ValidationError') {
    status = status || 400;
    const details = Object.values(err.errors || {})
      .map((entry) => entry.message)
      .filter(Boolean);
    message = details.length > 0 ? details.join(', ') : 'Validation failed';
  } else if (err.code === 11000) {
    status = status || 409;
    message = 'A record with that value already exists';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    status = 413;
    message = 'File is too large';
  }

  if (!status || status < 400 || status >= 600) status = 500;

  const isDevelopment = process.env.NODE_ENV === 'development';
  if (status >= 500 && !isDevelopment) {
    message = 'Server error';
  }

  const body = { message };
  if (isDevelopment) body.stack = err.stack;

  res.status(status).json(body);
};

module.exports = { errorHandler };
