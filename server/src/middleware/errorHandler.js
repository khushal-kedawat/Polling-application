import { HttpError } from '../utils/httpError.js';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: err.message,
      code: err.code,
      details: err.details,
    });
  }

  // Postgres unique violation
  if (err && err.code === '23505') {
    return res.status(409).json({ error: 'Conflict', code: 'UNIQUE_VIOLATION' });
  }

  console.error('[unhandled]', err);
  return res.status(500).json({ error: 'Internal server error' });
}
