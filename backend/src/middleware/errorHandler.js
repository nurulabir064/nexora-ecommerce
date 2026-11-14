export function notFound(req, res) { res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }); }
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error?.name === 'ValidationError' || error?.name === 'CastError') return res.status(400).json({ message: 'Invalid data provided.' });
  if (error?.code === 11000) return res.status(409).json({ message: 'A record with this value already exists.' });
  const status = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  if (status >= 500) console.error({ name: error.name, message: error.message, path: req.originalUrl });
  res.status(status).json({ message: status >= 500 ? 'Internal server error.' : error.message });
}
