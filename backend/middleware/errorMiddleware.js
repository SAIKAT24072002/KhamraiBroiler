// Handles route page not found (404)
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose CastError (invalid ObjectId format)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Resource not found: Invalid ID format.';
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  // Mongoose Duplicate Key Error (e.g. unique field constraint violation)
  if (err.code === 11000) {
    statusCode = 400;
    const duplicatedFieldName = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered: '${duplicatedFieldName}' already exists.`;
  }

  console.error(`[Error Handler] ${err.stack}`);

  res.status(statusCode).json({
    message: message || 'An internal server error occurred.',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = {
  notFound,
  errorHandler
};
