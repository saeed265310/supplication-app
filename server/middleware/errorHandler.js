const AppError = require('../utils/AppError');

/**
 * Handle JWT errors
 */
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

/**
 * Handle JWT expired error
 */
const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again.', 401);

/**
 * Handle SQLite constraint errors
 */
const handleSQLiteConstraintError = (err) => {
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return new AppError('A record with this value already exists', 409);
  }
  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return new AppError('Invalid reference to related record', 400);
  }
  return new AppError('Database constraint violation', 400);
};

/**
 * Send error response in development
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

/**
 * Send error response in production
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }
  // Programming or unknown error: don't leak error details
  else {
    console.error('ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  }
};

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (err.code && err.code.startsWith('SQLITE_CONSTRAINT')) {
      error = handleSQLiteConstraintError(err);
    }

    sendErrorProd(error, res);
  }
};

/**
 * Async error wrapper to catch errors in async route handlers
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = {
  errorHandler,
  catchAsync
};
