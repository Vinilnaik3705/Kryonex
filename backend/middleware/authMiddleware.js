const { requireAuth } = require('@clerk/express');

// Middleware to require authenticated user
const protect = requireAuth();

// Admin middleware - checks if user has admin role
const admin = (req, res, next) => {
    if (!req.auth?.userId) {
        return res.status(401).json({ message: 'Not authorized, no user' });
    }
    // You can add additional admin checks here if needed
    // For now, we'll just verify authentication
    next();
};

module.exports = { protect, admin };
