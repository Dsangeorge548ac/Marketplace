// src/index.js
const express     = require('express');
const cors        = require('cors');
const dotenv      = require('dotenv');
const cookieParser = require('cookie-parser');
const orderRoutes = require('./routes/order.routes');
const { validateSessionOptional } = require('./middleware/auth');

dotenv.config();

const app  = express();
const port = 3000;

app.use(cors({
    origin: true,
    credentials: true
}));

// Request logger
app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
});

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

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

// Routes
app.use('/', orderRoutes);

// 404 handler
app.use((req, res) => {
    console.log(`[404] Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Not Found', path: req.url });
});

app.listen(port, () => {
    console.log(`[Orders Service] Listening at http://localhost:${port}  || ${process.env.VITE_API_BASE_URL_PRODUCCION }`);
});
