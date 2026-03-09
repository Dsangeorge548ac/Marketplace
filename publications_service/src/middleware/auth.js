const jwt = require('jsonwebtoken');

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

module.exports = { validateSession };
