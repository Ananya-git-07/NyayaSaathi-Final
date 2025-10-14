
export const errorMiddleware = (err, req, res, next) => {
  console.error('\n❌ ERROR CAUGHT BY MIDDLEWARE:');
  console.error('Time:', new Date().toISOString());
  console.error('Method:', req.method);
  console.error('URL:', req.originalUrl);
  console.error('IP:', req.ip);
  console.error('User Agent:', req.get('User-Agent'));
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  console.error('─'.repeat(50));

  let error = { ...err };
  error.message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid ID format';
    error = {
      message,
      statusCode: 400
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value for ${field}`;
    error = {
      message,
      statusCode: 400
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      message,
      statusCode: 400
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = {
      message,
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = {
      message,
      statusCode: 401
    };
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large. Maximum size is 10MB';
    error = {
      message,
      statusCode: 400
    };
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    const message = 'Too many files. Only one file allowed per upload';
    error = {
      message,
      statusCode: 400
    };
  }

  if (err.code === 'INVALID_FILE_TYPE') {
    error = {
      message: err.message,
      statusCode: 400
    };
  }

  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    error = {
      message: 'Cross-origin request blocked',
      statusCode: 403
    };
  }

  // Database connection errors
  if (err.message && err.message.includes('ECONNREFUSED')) {
    error = {
      message: 'Database connection failed',
      statusCode: 503
    };
  }

  // Rate limiting errors
  if (err.statusCode === 429) {
    error = {
      message: 'Too many requests. Please try again later',
      statusCode: 429
    };  
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && {
      error: err,
      stack: err.stack,
      details: {
        name: err.name,
        code: err.code,
        statusCode: err.statusCode
      }
    })
  });
};