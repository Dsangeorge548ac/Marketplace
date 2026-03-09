// src/controllers/auth.controller.js
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
        { expiresIn: '24h' }
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
        maxAge: 300000, // 5 mins
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
            redirect: '#/dashboard',
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            token: token // Optional: Send in body for local storage if needed
        });

    } catch (error) {
        console.error('Login Error:', error);
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

exports.validate = (req, res) => {
    // Middleware already put user in req.user
    // If optional middleware used, req.user might be undefined
    if (!req.user) {
        // Return 200 OK with null to avoid browser console 401 errors
        return res.json(null);
    }
    res.json(req.user);
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
