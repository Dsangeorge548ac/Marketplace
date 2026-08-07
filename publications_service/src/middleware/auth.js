const jwt = require('jsonwebtoken');
const db = require('../db');

function validateSession(req, res, next) {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(401).json({ error: true, message: 'No auth token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_should_be_in_env');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: true, message: 'Invalid or expired token' });
    }
}

function validateSessionOptional(req, res, next) {
    const token = req.cookies.auth_token;

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        next();
    }
}

/**
 * Middleware que exige que el usuario autenticado tenga status = 'Verificado'.
 * Debe usarse DESPUÉS de validateSession.
 */
async function requireVerified(req, res, next) {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ error: true, message: 'No autenticado' });
    }

    try {
        const [rows] = await db.query(
            `SELECT COALESCE(vp.status, 'No verificado') AS status
             FROM users u
             LEFT JOIN account_verification_process vp ON vp.account_id = u.id
             WHERE u.id = ?
             LIMIT 1`,
            [req.user.id]
        );

        if (!rows.length) {
            return res.status(403).json({ error: true, message: 'Usuario no encontrado' });
        }

        const userStatus = rows[0].status;
        if (userStatus !== 'Verificado') {
            return res.status(403).json({
                error: true,
                verified: false,
                message: 'Solo los usuarios verificados pueden crear publicaciones.'
            });
        }

        next();
    } catch (error) {
        console.error('requireVerified error:', error);
        return res.status(500).json({ error: true, message: 'Error al verificar el estado del usuario' });
    }
}

module.exports = { validateSession, validateSessionOptional, requireVerified };
