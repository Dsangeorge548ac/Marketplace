// ============================================================
// backup_service/src/index.js
// Punto de entrada del servicio de respaldo.
// Levanta un servidor HTTP en el puerto 3000 y registra
// todas las rutas relacionadas con los respaldos de la base
// de datos.
// ============================================================

const express    = require('express');
const cors       = require('cors');
const dotenv     = require('dotenv');
const cookieParser = require('cookie-parser');
const path       = require('path');
const backupRoutes = require('./routes/backup.routes');
const { validateSessionOptional } = require('./middleware/auth');

// Carga las variables de entorno definidas en el archivo .env
dotenv.config();

const app  = express();
const PORT = process.env.BACKUP_PORT || 3000;

// ─── Middlewares generales ────────────────────────────────────

// Permite peticiones desde cualquier origen dentro de la red
// Docker (el API Gateway ya filtra los orígenes externos)
app.use(cors({ origin: true, credentials: true }));

// Parsea cuerpos JSON en las peticiones entrantes
app.use(express.json());
app.use(cookieParser());

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

// Logger de peticiones: muestra en consola cada solicitud con
// su método HTTP, URL y timestamp de llegada
app.use((req, _res, next) => {
    console.log(`[BackupService] ${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// ─── Rutas ────────────────────────────────────────────────────

// Todas las rutas de respaldo se montan en la raíz "/"
// El API Gateway las expone como /api/backup_service/...
app.use('/', backupRoutes);

// ─── Manejador de rutas no encontradas (404) ──────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada en backup_service' });
});

// ─── Inicio del servidor ──────────────────────────────────────
app.listen(PORT, () => {
    console.log(`[BackupService] Servidor corriendo en el puerto ${PORT}`);
});
