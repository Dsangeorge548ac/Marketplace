// ============================================================
// backup_service/src/routes/backup.routes.js
// Define todos los endpoints HTTP que expone el servicio de
// respaldo. Actúa como "enrutador" que delega la lógica real
// al controlador correspondiente.
// ============================================================

const express    = require('express');
const router     = express.Router();
const path       = require('path');
const multer     = require('multer');
const backupCtrl = require('../controllers/backup.controller');

const BACKUP_DIR = backupCtrl.BACKUP_DIR || process.env.BACKUP_DIR || '/app/uploads';

// Configuración de almacenamiento Multer para subir volcados .sql
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, BACKUP_DIR);
    },
    filename: (_req, file, cb) => {
        // Sanitizar y acortar nombre base para no exceder VARCHAR(40) en DB
        let base = path.basename(file.originalname, path.extname(file.originalname))
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .replace(/_{2,}/g, '_')
            .slice(0, 20);
        if (!base) base = 'upload';

        const timestamp = Date.now().toString().slice(-8); // 8 dígitos
        const safeName = `${base}_${timestamp}.sql`; // total <= 33 caracteres
        cb(null, safeName);
    }
});

const fileFilter = (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.sql') {
        cb(null, true);
    } else {
        cb(new Error('Formato no permitido. Solo se pueden subir archivos SQL (.sql)'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 200 * 1024 * 1024 } // 200 MB
});

// Middleware seguro para capturar errores de Multer antes del controlador
const handleUpload = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            console.error('[BackupService] Error en upload Multer:', err.message);
            const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
            return res.status(status).json({
                error: err.code === 'LIMIT_FILE_SIZE'
                    ? 'El archivo excede el tamaño máximo permitido (200MB)'
                    : err.message
            });
        }
        next();
    });
};

// POST /backup
// Genera un nuevo respaldo completo de la base de datos.
router.post('/backup', backupCtrl.createBackup);

// POST /backups/upload (y alias /backup/upload)
// Sube un archivo .sql al directorio de respaldos y lo registra en la base de datos.
// Opcionalmente puede restaurar la BD de inmediato si se envía restore=true.
router.post('/backups/upload', handleUpload, backupCtrl.uploadBackup);
router.post('/backup/upload', handleUpload, backupCtrl.uploadBackup);

// GET /backups
// Devuelve la lista de todos los archivos de respaldo
router.get('/backups', backupCtrl.listBackups);

// GET /backups/download/:filename
// Descarga un archivo de respaldo específico al cliente
router.get('/backups/download/:filename', backupCtrl.downloadBackup);

// POST /backups/restore/:filename
// Restaura la base de datos a partir de un archivo de respaldo
router.post('/backups/restore/:filename', backupCtrl.restoreBackup);

// DELETE /backups/:filename
// Elimina permanentemente un archivo de respaldo del disco.
router.delete('/backups/:filename', backupCtrl.deleteBackup);

module.exports = router;

