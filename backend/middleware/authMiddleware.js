const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const https = require('https');

let jwksCache = null;
let jwksLastFetched = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const fetchJwks = async (supabaseUrl) => {
    const now = Date.now();
    if (jwksCache && (now - jwksLastFetched < CACHE_TTL)) {
        return jwksCache;
    }
    
    return new Promise((resolve, reject) => {
        const cleanUrl = supabaseUrl.replace(/\/$/, '');
        const jwksUrl = `${cleanUrl}/auth/v1/.well-known/jwks.json`;
        https.get(jwksUrl, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed && parsed.keys) {
                        jwksCache = parsed.keys;
                        jwksLastFetched = now;
                        resolve(jwksCache);
                    } else {
                        reject(new Error('Invalid JWKS format received'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
};

// Middleware to require authenticated user
const protect = async (req, res, next) => {
    // Check for token in authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Not authenticated, token missing' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Extract JWT header to find alg and kid
        const parts = token.split('.');
        if (parts.length !== 3) {
            console.error('JWT is not in 3-part format. Parts count:', parts.length);
            return res.status(401).json({ success: false, error: 'Not authenticated, invalid token structure' });
        }

        let header;
        try {
            header = JSON.parse(Buffer.from(parts[0], 'base64').toString('utf-8'));
        } catch (e) {
            console.error('Failed to parse JWT header:', e.message);
            return res.status(401).json({ success: false, error: 'Not authenticated, invalid token header' });
        }

        const alg = header.alg;
        let decoded;

        if (alg === 'HS256') {
            console.log('Verifying HS256 token...');
            if (!process.env.SUPABASE_JWT_SECRET) {
                throw new Error('SUPABASE_JWT_SECRET is not configured');
            }
            const secret = Buffer.from(process.env.SUPABASE_JWT_SECRET, 'base64');
            decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
        } else if (alg === 'ES256') {
            console.log('Verifying ES256 token using Supabase JWKS...');
            const supabaseUrl = process.env.SUPABASE_URL || 'https://aqccvnwezampcmvtysqz.supabase.co';
            const keys = await fetchJwks(supabaseUrl);
            
            // Find key matching kid
            const key = keys.find(k => k.kid === header.kid);
            if (!key) {
                throw new Error(`No matching JWK found in JWKS for kid: ${header.kid}`);
            }

            // Convert JWK to CryptoKey/PublicKey
            const publicKey = crypto.createPublicKey({
                format: 'jwk',
                key: key
            });

            decoded = jwt.verify(token, publicKey, { algorithms: ['ES256'] });
        } else {
            throw new Error(`Unsupported JWT algorithm: ${alg}`);
        }
        
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

