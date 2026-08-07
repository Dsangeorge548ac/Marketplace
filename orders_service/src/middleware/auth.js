const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'super_secret_jwt_key_should_be_in_env';

function validateSessionOptional(req, res, next) {
    try {
        let token = null;

        if (req.cookies && req.cookies.auth_token) {
            token = req.cookies.auth_token;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next();
        }

        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        next();
    }
}

module.exports = { validateSessionOptional };