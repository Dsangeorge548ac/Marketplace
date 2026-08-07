const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');
const pubRoutes = require('./routes/publication.routes');
const noticesRoutes = require('./routes/notices.routes');
const { validateSessionOptional } = require('./middleware/auth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json({ limit: '20mb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

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

// Serve Uploads (Antes de los middlewares de validación)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(validateSessionOptional);
app.use(requireDeveloperBrowserView);

// Routes
app.use('/notices', noticesRoutes);
app.use('/', pubRoutes);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Publications Service running on port ${PORT}`);
});
