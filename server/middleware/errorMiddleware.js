const errorHandler = (err, req, res, next) => {
    // Log the error for internal tracking
    console.error(`[CRITICAL ERROR] ${req.method} ${req.originalUrl}:`, {
        message: err.message,
        timestamp: new Date().toISOString(),
        stack: process.env.NODE_ENV === 'production' ? 'REDACTED' : err.stack
    });

    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message || 'An unexpected server error occurred';

    // Handle Mongoose Validation Errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
    }

    // Handle Mongoose Bad ObjectIDs (CastError)
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Resource not found with id of ${err.value}`;
    }

    // Handle Mongoose Duplicate Key Errors
    if (err.code === 11000) {
        statusCode = 400;
        message = 'Duplicate field value entered. Please use a unique value.';
    }

    res.status(statusCode).json({
        success: false,
        message: message,
        error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.stack,
        timestamp: new Date().toISOString()
    });
};

const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

module.exports = { errorHandler, notFound };
