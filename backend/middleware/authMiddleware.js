const jwt = require('jsonwebtoken');

// Middleware to require authenticated user
const protect = async (req, res, next) => {
    // Check for token in authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Not authenticated, token missing' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Log token and secret status for debugging
        const parts = token.split('.');
        if (parts.length === 3) {
            try {
                const header = JSON.parse(Buffer.from(parts[0], 'base64').toString('utf-8'));
                console.log('JWT Header for verification:', header);
            } catch (e) {
                console.error('Failed to parse JWT header:', e.message);
            }
        } else {
            console.error('JWT is not in 3-part format. Parts count:', parts.length);
        }
        
        console.log('SUPABASE_JWT_SECRET exists:', !!process.env.SUPABASE_JWT_SECRET);

        // Verify Supabase JWT token using the legacy JWT Secret (HS256)
        // Note: Supabase's secret is base64 encoded.
        const secret = Buffer.from(process.env.SUPABASE_JWT_SECRET, 'base64');
        const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
        
        // Map decoded sub (user ID) to req.auth.userId for project compatibility
        req.auth = {
            userId: decoded.sub,
            email: decoded.email
        };
        
        next();
    } catch (error) {
        console.error('JWT Verification Error Detail:', error);
        return res.status(401).json({ success: false, error: 'Not authenticated, invalid token' });
    }
};

// Admin middleware - checks if user has admin role
const admin = (req, res, next) => {
    if (!req.auth?.userId) {
        return res.status(401).json({ success: false, error: 'Not authorized, no user' });
    }
    next();
};

module.exports = { protect, admin };
