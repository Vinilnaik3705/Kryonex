const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const https = require('https');

let jwksCache = null;
let jwksLastFetched = 0;
let jwksRequest = null;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const fetchJwks = async (supabaseUrl) => {
    const now = Date.now();
    if (jwksCache && (now - jwksLastFetched < CACHE_TTL)) {
        return jwksCache;
    }
    
    if (jwksRequest) return jwksRequest;
    jwksRequest = new Promise((resolve, reject) => {
        const cleanUrl = supabaseUrl.replace(/\/$/, '');
        const jwksUrl = `${cleanUrl}/auth/v1/.well-known/jwks.json`;
        const request = https.get(jwksUrl, (res) => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                res.resume();
                reject(new Error(`JWKS request failed with status ${res.statusCode}`));
                return;
            }
            let data = '';
            let size = 0;
            res.on('data', chunk => {
                size += chunk.length;
                if (size > 256 * 1024) {
                    request.destroy(new Error('JWKS response too large'));
                    return;
                }
                data += chunk;
            });
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
        request.setTimeout(3000, () => request.destroy(new Error('JWKS request timed out')));
    }).finally(() => { jwksRequest = null; });
    return jwksRequest;
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
        const supabaseUrl = process.env.SUPABASE_URL;
        if (!supabaseUrl) throw new Error('SUPABASE_URL is not configured');
        const issuer = `${supabaseUrl.replace(/\/$/, '')}/auth/v1`;

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
            decoded = jwt.verify(token, secret, {
                algorithms: ['HS256'],
                issuer,
                audience: process.env.SUPABASE_JWT_AUDIENCE || 'authenticated'
            });
        } else if (alg === 'ES256') {
            console.log('Verifying ES256 token using Supabase JWKS...');
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

            decoded = jwt.verify(token, publicKey, {
                algorithms: ['ES256'],
                issuer,
                audience: process.env.SUPABASE_JWT_AUDIENCE || 'authenticated'
            });
        } else {
            throw new Error(`Unsupported JWT algorithm: ${alg}`);
        }
        
        // Map decoded sub (user ID) to req.auth.userId for project compatibility
        if (!decoded.sub || !decoded.exp) throw new Error('Token is missing required claims');
        req.auth = {
            userId: decoded.sub,
            email: decoded.email,
            role: decoded.role || decoded.user_role || decoded.user_metadata?.role
        };
        
        next();
    } catch (error) {
        console.error('JWT Verification Error Detail:', error);
        return res.status(401).json({ success: false, error: 'Not authenticated, invalid token' });
    }
};

// Admin middleware - checks if user has admin role
const admin = (req, res, next) => {
    if (!req.auth?.userId || !['admin'].includes(req.auth.role)) {
        return res.status(401).json({ success: false, error: 'Not authorized, no user' });
    }
    next();
};

module.exports = { protect, admin };
