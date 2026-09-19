import { AppError } from '../lib/errors.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, _req, res, _next) {
  const status = error instanceof AppError ? error.status : 500;

  if (status >= 500) console.error('[error]', error);

  res.status(status).json({
    error: status >= 500 && !(error instanceof AppError) ? 'Something went wrong on the server.' : error.message,
    ...(error.details ? { details: error.details } : {}),
  });
}
