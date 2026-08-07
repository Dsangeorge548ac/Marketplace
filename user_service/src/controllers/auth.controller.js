// src/controllers/auth.controller.js
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const SECRET_KEY = process.env.JWT_SECRET || 'super_secret_jwt_key_should_be_in_env';

// Helper: Generate Token
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        },
        SECRET_KEY,
        { expiresIn: '30d' }
    );
};

// Helper: Generate Random String
const generateCaptchaText = (length = 6) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 1, 0 for clarity
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

exports.getCaptcha = (req, res) => {
    const text = generateCaptchaText();

    // Store text in cookie (encrypted/signed ideally, but httpOnly plain text ok for this level)
    res.cookie('captcha_text', text, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: 'lax'
    });

    // Generate SVG
    // Improved SVG generation with better spacing
    const width = 200;
    const height = 40;
    const fontSize = 16;
    // Calculate approximate text width (6 chars + spaces)
    // 6 chars * ~20px + spacing

    const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background-color: #f0f0f0; border-radius: 4px;">
        <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:rgb(245,245,245);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgb(220,220,220);stop-opacity:1" />
            </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad1)" />
        
        <!-- Noise lines -->
        <line x1="10" y1="10" x2="${width - 10}" y2="${height - 10}" stroke="#ddd" stroke-width="2" />
        <line x1="10" y1="${height - 10}" x2="${width - 10}" y2="10" stroke="#ddd" stroke-width="2" />
        <path d="M 10 30 Q ${width / 2} 5, ${width - 10} 30" stroke="#e0e0e0" fill="transparent" stroke-width="2"/>

        <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}" fill="#2c3e50" font-weight="bold" letter-spacing="8">
            ${text.split('').join(' ')}
        </text>
    </svg>`;

    res.type('image/svg+xml');
    res.send(svg);
};

exports.login = async (req, res) => {
    try {
        const { email, password, captcha } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Email and password are required' });
        }

        // Validate Captcha
        const storedCaptcha = req.cookies.captcha_text;

        // Clear captcha cookie immediately to prevent replay
        res.clearCookie('captcha_text');

        if (!captcha) {
            return res.status(200).json({ status: 'error', message: 'Captcha requerido' });
        }

        if (!storedCaptcha || captcha.toUpperCase() !== storedCaptcha.toUpperCase()) {
            return res.status(200).json({ status: 'error', message: 'Captcha incorrecto o expirado' });
        }

        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (!user) {
            console.log('[Login Debug] User not found for email:', email);
            return res.status(200).json({ status: 'error', message: 'Credenciales inválidas' });
        }

        console.log('[Login Debug] User found:', user.id);

        let validPassword = await bcrypt.compare(password, user.password);
        console.log('[Login Debug] Bcrypt compare result:', validPassword);

        // Fallback for plain text (Legacy support)
        if (!validPassword && password === user.password) {
            console.log('[Login Debug] Plain text match found (Legacy)');
            validPassword = true;
        }

        if (!validPassword) {
            return res.status(200).json({ status: 'error', message: 'Credenciales inválidas' });
        }

        const token = generateToken(user);

        // Send Token in HTTP-Only Cookie
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: false, // Set true in production (HTTPS)
            sameSite: 'lax',
            path: '/', // Ensure cookie is available for all paths
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({
            status: 'success',
            message: 'Logged in successfully',
            redirect: '#/dashboard/home',
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            token: token // Optional: Send in body for local storage if needed
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

exports.googleLogin = async (req, res) => {
    try {
        const { credential, access_token } = req.body;

        if (!credential && !access_token) {
            return res.status(400).json({ status: 'error', message: 'Google credential or access_token is required' });
        }

        let email, name, googleId;

        try {
            if (credential) {
                const ticket = await googleClient.verifyIdToken({
                    idToken: credential,
                    audience: process.env.GOOGLE_CLIENT_ID,
                });
                const payload = ticket.getPayload();
                email = payload.email;
                name = payload.name;
                googleId = payload.sub;
            } else if (access_token) {
                const axios = require('axios'); // Asegurar importe local si no es global
                const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${access_token}` }
                });
                email = data.email;
                name = data.name;
                googleId = data.sub;
            }
        } catch (error) {
            console.error('Google Token Verification Error:', error);
            return res.status(200).json({ status: 'error', message: 'Credenciales de Google inválidas o expiradas' });
        }

        if (!email) {
            return res.status(200).json({ status: 'error', message: 'No se obtuvo el correo de Google' });
        }

        let [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        let user = users[0];

        if (!user) {
            console.log('[Google Login] User not found, creating new account for:', email);
            const salt = await bcrypt.genSalt(4);
            const randomPassword = Math.random().toString(36).slice(-10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);

            const [result] = await pool.query(
                'INSERT INTO users (name, email, password, role, security_question, security_answer) VALUES (?, ?, ?, ?, ?, ?)',
                [name, email, hashedPassword, 'Usuario', 'Google Auth', googleId]
            );

            user = { id: result.insertId, name: name, email: email, role: 'Usuario' };
        }

        const token = generateToken(user);

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: false, // Set true in production (HTTPS)
            sameSite: 'lax',
            path: '/',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({
            status: 'success',
            message: 'Logged in successfully with Google',
            redirect: '#/dashboard/home',
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            token: token
        });

    } catch (error) {
        console.error('Google Login Error:', error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

exports.register = async (req, res) => {
    try {
        const { name_up, email_up, password_up, security_question, security_answer } = req.body;

        if (!name_up || !email_up || !password_up || !security_question || !security_answer) {
            return res.status(400).json({ status: 'error', message: 'All fields are required' });
        }

        // Check exists
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email_up]);
        if (existing.length > 0) {
            return res.status(200).json({ status: 'error', message: 'Email already exists' });
        }

        // Hash password
        // OPTIMIZATION: Reduced salt rounds from 10 to 4 for stress testing performance.
        const salt = await bcrypt.genSalt(4);
        const hashedPassword = await bcrypt.hash(password_up, salt);

        // Insert
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password, role, security_question, security_answer) VALUES (?, ?, ?, ?, ?, ?)',
            [name_up, email_up, hashedPassword, 'Usuario', security_question, security_answer]
        );

        const newUser = { id: result.insertId, name: name_up, email: email_up, role: 'Usuario' };

        // Auto-login
        const token = generateToken(newUser);
        res.cookie('auth_token', token, { httpOnly: true, maxAge: 86400000 });

        res.status(201).json({
            status: 'success',
            message: 'User registered',
            user: newUser,
            token
        });

    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

exports.validate = async (req, res) => {
    if (!req.user) {
        return res.json(null);
    }

    try {
        const [rows] = await pool.query(
            `SELECT
                u.id,
                u.name,
                u.email,
                u.role,
                COALESCE(vp.status, 'No verificado') AS status,
                ti.business_name AS business_name,
                ti.business_name AS verification_business_name,
                ti.tax_address AS verification_tax_address,
                ti.tax_id AS verification_tax_id,
                ti.phone AS verification_phone
             FROM users u
             LEFT JOIN account_verification_process vp ON vp.account_id = u.id
             LEFT JOIN account_verification_tax_information ti ON ti.verification_id = vp.id
             WHERE u.id = ?
             LIMIT 1`,
            [req.user.id]
        );

        if (!rows.length) {
            return res.json(req.user);
        }

        const payload = rows[0];

        res.json({
            ...req.user,
            ...payload,
            business_name: payload.business_name || payload.verification_business_name || null,
            phone: payload.phone || payload.verification_phone || null,
        });
    } catch (error) {
        console.error('validate DB error:', error);
        // Fallback: devolver el payload del JWT para no romper la sesión
        res.json(req.user);
    }
};

exports.logout = (req, res) => {
    res.clearCookie('auth_token');
    res.json({ status: 'success', message: 'Logged out' });
};

exports.recoverInit = async (req, res) => {
    try {
        const { email } = req.body;
        const [users] = await pool.query('SELECT security_question FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(200).json({ status: 'error', message: 'Usuario no encontrado' });
        }

        res.json({ status: 'success', question: users[0].security_question });
    } catch (error) {
        console.error('Recover Init Error:', error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};

exports.recoverReset = async (req, res) => {
    try {
        const { email, answer, newPassword } = req.body;
        const [users] = await pool.query('SELECT security_answer FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(200).json({ status: 'error', message: 'Usuario no encontrado' });
        }

        if (users[0].security_answer !== answer) {
            return res.status(200).json({ status: 'error', message: 'Respuesta incorrecta' });
        }

        const salt = await bcrypt.genSalt(4);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);

        res.json({ status: 'success', message: 'Password updated successfully' });
    } catch (error) {
        console.error('Recover Reset Error:', error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
};
