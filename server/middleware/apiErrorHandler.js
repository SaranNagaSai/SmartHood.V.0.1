const apiErrorHandler = (err, req, res, next) => {
    console.error('🔥 [API Error Handler]:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    res.status(statusCode).json({
        message: err.message || 'An unexpected server error occurred',
        error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.stack,
        status: 'error'
    });
};

module.exports = apiErrorHandler;
