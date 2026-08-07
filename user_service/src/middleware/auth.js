// src/middleware/auth.js
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'super_secret_jwt_key_should_be_in_env';

function validateSession(req, res, next) {
    try {
        let token = null;

        // 1. Check Cookies
        if (req.cookies && req.cookies.auth_token) {
            token = req.cookies.auth_token;
        }
        // 2. Check Authorization Header (Bearer)
        else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ error: true, message: 'No auth token provided' });
        }

        // Verify Token
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();

    } catch (error) {
        return res.status(401).json({ error: true, message: 'Invalid token' });
    }
}

function validateSessionOptional(req, res, next) {
    try {
        let token = null;

        if (req.cookies && req.cookies.auth_token) {
            token = req.cookies.auth_token;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            // No token? No problem. Just don't set req.user
            return next();
        }

        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();

    } catch (error) {
        // Invalid token? Also treat as guest
        // console.warn("Optional auth token invalid:", error.message);
        next();
    }
}

function requireRole(role) {
    return (req, res, next) => {
        if (!req.user || (req.user.role !== role && req.user.role !== 'admin' && req.user.role !== 'Administrador')) {
            return res.status(403).json({ error: true, message: 'Forbidden' });
        }
        next();
    };
}

module.exports = { validateSession, validateSessionOptional, requireRole };
