// src/index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser'); // Added
const path = require('path');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const paymentMethodRoutes = require('./routes/payment_method.routes');
const accountRoutes = require('./routes/account.routes');
const { validateSessionOptional } = require('./middleware/auth');

dotenv.config();

const app = express();
app.set('trust proxy', true)
const port = 3000; // Changed from PORT = process.env.PORT || 3000;

app.use(cors({
    origin: true, // Allow request origin seamlessly (required for staging/prod subdomains)
    credentials: true
}));

// Request Logger
app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
});

app.use(express.json());
app.use(cookieParser()); // Added
app.use(express.urlencoded({ extended: true })); // Added

function isBrowserDocumentRequest(req) {
    const accept = String(req.headers.accept || '');
    const destination = String(req.headers['sec-fetch-dest'] || '');
    return destination === 'document' || accept.includes('text/html') || accept.includes('application/xhtml+xml');
}

function requireDeveloperBrowserView(req, res, next) {
    if (!isBrowserDocumentRequest(req)) {
        return next();
    }

    const role = String(req.user && req.user.role ? req.user.role : '').trim().toLowerCase();
    if (role !== 'developer') {
        return res.status(403).json({
            error: true,
            message: 'No autorizado para visualizar esta respuesta en el navegador.'
        });
    }

    next();
}

app.use(validateSessionOptional);
app.use(requireDeveloperBrowserView);

// Serve verification uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use(`/auth`, authRoutes);
app.use(`/payment-methods`, paymentMethodRoutes); // Register payment methods endpoints
app.use(`/account`, accountRoutes); // Register account management endpoints
app.use(`/`, userRoutes);

// Debug 404
app.use((req, res, next) => {
    console.log(`[404 DEBUG] Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Not Found', path: req.url });
});

// Compatibility Routes (alias OLD paths to NEW handlers if strictly needed, but I plan to update frontend)
// Example: app.post('/src/delete-user.php', userRoutes) -> But this expects params in body vs url
// I'll stick to updating frontend.

app.listen(port, () => {
    console.log(`User service listening at http://localhost:${port}`);
});






