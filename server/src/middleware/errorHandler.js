const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err.message || 'Server error', { stack: err.stack });

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: messages.join(', ') });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ error: `${field} already exists` });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
  });
};

module.exports = errorHandler;
