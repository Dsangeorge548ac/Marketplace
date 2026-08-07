// ============================================================
// backup_service/src/routes/backup.routes.js
// Define todos los endpoints HTTP que expone el servicio de
// respaldo. Actúa como "enrutador" que delega la lógica real
// al controlador correspondiente.
// ============================================================

const express    = require('express');
const router     = express.Router();
const backupCtrl = require('../controllers/backup.controller');

// POST /backup
// Genera un nuevo respaldo completo de la base de datos.
// El archivo resultante se guarda en el volumen /app/backups/
// dentro del contenedor.
router.post('/backup', backupCtrl.createBackup);

// GET /backups
// Devuelve la lista de todos los archivos de respaldo
// disponibles en el directorio /app/backups/ con metadatos
// como nombre, tamaño y fecha de creación.
router.get('/backups', backupCtrl.listBackups);

// GET /backups/download/:filename
// Descarga un archivo de respaldo específico al cliente
// (como archivo adjunto .sql).
router.get('/backups/download/:filename', backupCtrl.downloadBackup);

// POST /backups/restore/:filename
// Restaura la base de datos a partir de un archivo de respaldo
// específico. El archivo debe existir en el directorio de
// respaldos y se ejecuta un comando para importar su contenido
// a la base de datos.
router.post('/backups/restore/:filename', backupCtrl.restoreBackup);

// DELETE /backups/:filename
// Elimina permanentemente un archivo de respaldo del disco.
router.delete('/backups/:filename', backupCtrl.deleteBackup);

module.exports = router;
