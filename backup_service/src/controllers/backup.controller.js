// ============================================================
// backup_service/src/controllers/backup.controller.js
//
// RESPONSABILIDAD: contiene TODA la lógica de negocio para
// gestionar los respaldos de la base de datos MySQL:
//   • createBackup  → ejecuta mysqldump y guarda el .sql
//   • listBackups   → lista los archivos existentes
//   • downloadBackup→ envía el archivo al cliente
//   • deleteBackup  → elimina un archivo del disco
//
// MANEJO DE CLAVES FORÁNEAS:
// MySQL puede lanzar errores al restaurar una base de datos
// si los datos se insertan en un orden que viola las
// restricciones de clave foránea (FOREIGN KEY).
// Para evitar esto, el respaldo incluye dos instrucciones SQL
// especiales al inicio y al final del archivo:
//
//   SET FOREIGN_KEY_CHECKS = 0;  ← desactiva las validaciones
//   ... (inserts de todas las tablas) ...
//   SET FOREIGN_KEY_CHECKS = 1;  ← las reactiva al terminar
//
// Esto le dice a MySQL "inserta todo sin verificar relaciones"
// y luego vuelve al comportamiento normal. Es la práctica
// estándar usada por mysqldump y phpMyAdmin.
// ============================================================

const { execFile } = require('child_process'); // Para ejecutar programas externos
const fs = require('fs');             // Para operaciones de archivos
const path = require('path');           // Para rutas de sistema de archivos
const { exec } = require('child_process');

const db = require('../db');

// ─── Directorio donde se guardarán los respaldos ─────────────
// Dentro del contenedor Docker, este path apunta al volumen
// compartido "backup_data" definido en docker-compose.yml.
// Así los archivos persisten aunque el contenedor se reinicie.
const BACKUP_DIR = process.env.BACKUP_DIR || '/app/uploads';

// ─── Asegura que el directorio de respaldos exista ───────────
// Si no existe (primer arranque), lo crea automáticamente
// con todos los directorios intermedios necesarios.
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`[BackupService] Directorio de uploads creado: ${BACKUP_DIR}`);
}

const buildBackupUrl = (filename) => `/api/backup_service/backups/download/${encodeURIComponent(filename)}`;

// ============================================================
// createBackup
// Genera un nuevo respaldo completo de la base de datos.
//
// Proceso:
//  1. Genera un nombre de archivo único con timestamp
//  2. Ejecuta `mysqldump` con las opciones correctas para
//     incluir automáticamente SET FOREIGN_KEY_CHECKS=0
//  3. Envía una respuesta con el nombre del archivo generado
// ============================================================
exports.createBackup = (req, res) => {

    // Genera un timestamp en formato YYYYMMDD_HHMMSS para
    // nombrar el archivo de forma única y ordenada
    const now = new Date();
    const timestamp = now.toISOString()
        .replace(/[-:T]/g, match => match === 'T' ? '_' : match.replace(':', ''))
        .slice(0, 15); // → "20260420_085834"

    const filename = `backup_${timestamp}.sql`;
    const outputPath = path.join(BACKUP_DIR, filename);

    // Variables de entorno de la base de datos.
    // Se leen desde el proceso ya que el contenedor de Docker
    // las inyecta automáticamente vía docker-compose.yml
    const DB_HOST = process.env.DB_HOST || 'marketplace_db';
    const DB_USER = process.env.DB_USER || 'root';
    const DB_PASS = process.env.DB_PASSWORD || '';
    const DB_NAME = process.env.DB_NAME || 'marketplace';

    // ── Opciones de mysqldump ──────────────────────────────────
    //
    // --single-transaction
    //   Realiza el respaldo dentro de una transacción para que
    //   los datos sean consistentes sin bloquear las tablas.
    //   Ideal para tablas InnoDB (el tipo que usa MySQL 8).
    //
    // --routines
    //   Incluye los procedimientos almacenados (stored procs)
    //   y funciones definidas en la base de datos.
    //
    // --triggers
    //   Incluye los triggers (disparadores) de cada tabla.
    //
    // --disable-keys
    //   Rodea cada INSERT con ALTER TABLE ... DISABLE KEYS /
    //   ENABLE KEYS, acelerando la importación al deshabilitar
    //   índices secundarios durante la carga masiva.
    //
    // --add-drop-table
    //   Añade DROP TABLE IF EXISTS antes de cada CREATE TABLE,
    //   para que el archivo de restauración no falle si las
    //   tablas ya existen.
    //
    // **CLAVE FORÁNEA**: mysqldump incluye por defecto las
    // instrucciones SET FOREIGN_KEY_CHECKS=0 al inicio y
    // SET FOREIGN_KEY_CHECKS=1 al final del archivo cuando
    // se usa con el flag --add-drop-table. Esto garantiza
    // que al restaurar no haya conflictos de orden entre
    // tablas relacionadas.
    const args = [
        `--host=${DB_HOST}`,
        `--user=${DB_USER}`,
        `--password=${DB_PASS}`,
        '--single-transaction',   // consistencia sin bloqueos
        '--routines',             // incluye stored procedures
        '--triggers',             // incluye triggers
        '--disable-keys',         // acelera la importación
        '--add-drop-table',       // DROP TABLE antes de CREATE (activa FOREIGN_KEY_CHECKS=0)
        '--result-file', outputPath, // archivo de salida
        DB_NAME                   // nombre de la base de datos
    ];

    console.log(`[BackupService] Iniciando respaldo → ${filename}`);

    // execFile es más seguro que exec() porque no pasa los
    // argumentos por un shell, evitando inyecciones de comandos
    execFile('mysqldump', args, async (error, _stdout, stderr) => {

        if (error) {
            // Error al ejecutar mysqldump (credenciales incorrectas,
            // servidor no disponible, etc.)
            console.error('[BackupService] Error en mysqldump:', stderr || error.message);
            return res.status(500).json({
                error: 'No se pudo crear el respaldo',
                detalle: stderr || error.message
            });
        }

        // Verifica que el archivo fue creado y tiene contenido
        const stats = fs.statSync(outputPath);
        if (stats.size === 0) {
            fs.unlinkSync(outputPath); // Borra el archivo vacío
            return res.status(500).json({ error: 'El respaldo generado está vacío' });
        }

        const backupUrl = buildBackupUrl(filename);

        try {
            await db.query(
                'INSERT INTO backups (contenido, nombre, fecha) VALUES (?, ?, NOW())',
                [backupUrl, filename]
            );
        } catch (dbError) {
            console.error('[BackupService] Error guardando registro de respaldo:', dbError.message);
            return res.status(500).json({
                error: 'Respaldo creado en disco, pero no se pudo registrar en la base de datos',
                detalle: dbError.message
            });
        }

        console.log(`[BackupService] Respaldo creado exitosamente: ${filename} (${stats.size} bytes)`);

        res.status(201).json({
            mensaje: 'Respaldo creado exitosamente',
            archivo: filename,
            url: backupUrl,
            tamano_kb: Math.round(stats.size / 1024),
            fecha: now.toISOString()
        });
    });
};

// ============================================================
// listBackups
// Devuelve la lista de todos los archivos .sql disponibles
// en el directorio de respaldos, ordenados del más reciente
// al más antiguo.
// ============================================================
exports.listBackups = async (_req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT idr, contenido, nombre, fecha FROM backups ORDER BY fecha DESC'
        );

        const backups = rows.map(row => {
            const rutaCompleta = path.join(BACKUP_DIR, row.nombre);
            let tamano_kb = 0;
            let creadoEn = row.fecha instanceof Date ? row.fecha.toISOString() : new Date(row.fecha).toISOString();
            let modificado = creadoEn;

            if (fs.existsSync(rutaCompleta)) {
                const stats = fs.statSync(rutaCompleta);
                tamano_kb = Math.round(stats.size / 1024);
                creadoEn = stats.birthtime.toISOString();
                modificado = stats.mtime.toISOString();
            }

            return {
                idr: row.idr,
                archivo: row.nombre,
                url: row.contenido,
                tamano_kb,
                creado_en: creadoEn,
                modificado
            };
        });

        res.json({
            total: backups.length,
            backups
        });

    } catch (err) {
        console.error('[BackupService] Error al listar respaldos:', err.message);
        res.status(500).json({ error: 'No se pudo leer el directorio de respaldos' });
    }
};

// ============================================================
// downloadBackup
// Envía al cliente el archivo de respaldo solicitado.
// Express lo entrega como descarga adjunta (Content-Disposition
// attachment) para que el navegador abra el diálogo "Guardar".
//
// Seguridad: se sanitiza el nombre del archivo para evitar
// ataques de "path traversal" como ../../etc/passwd
// ============================================================
exports.downloadBackup = (req, res) => {

    // Sanitiza el nombre: extrae solo el basename para evitar
    // que un atacante use rutas relativas como "../../../etc/passwd"
    const filename = path.basename(req.params.filename);
    const rutaArchivo = path.join(BACKUP_DIR, filename);

    // Verifica que el archivo realmente exista antes de enviarlo
    if (!fs.existsSync(rutaArchivo)) {
        return res.status(404).json({ error: `Archivo no encontrado: ${filename}` });
    }

    console.log(`[BackupService] Descargando: ${filename}`);

    // res.download() envía el archivo y añade automáticamente
    // el header Content-Disposition: attachment; filename="..."
    // para que el navegador lo trate como descarga
    res.download(rutaArchivo, filename, (err) => {
        if (err) {
            console.error('[BackupService] Error al enviar archivo:', err.message);
            // Solo responde si los headers aún no fueron enviados
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error al descargar el archivo' });
            }
        }
    });
};



function runRestore(filename) {
    return new Promise(async (resolve, reject) => {
        const rutaArchivo = path.join(BACKUP_DIR, filename);

        if (!fs.existsSync(rutaArchivo)) {
            console.error(`[BackupService] Archivo no encontrado en la ruta: ${rutaArchivo}`);
            return reject(new Error(`El archivo físico '${filename}' no existe en el servidor.`));
        }

        try {
            const [historialOriginal] = await db.query('SELECT idr, nombre, contenido, fecha FROM backups');
            console.log(`[Backup] Resguardados ${historialOriginal.length} registros de la tabla 'backups' en memoria.`);

            const DB_HOST = process.env.DB_HOST || 'marketplace_db';
            const DB_USER = process.env.DB_USER || 'root';
            const DB_PASS = process.env.DB_PASSWORD || '';
            const DB_NAME = process.env.DB_NAME || 'marketplace';

            const args = [
                '-h', DB_HOST,
                '-u', DB_USER,
                `--password=${DB_PASS}`,
                `--init-command=SET FOREIGN_KEY_CHECKS=0;`,
                DB_NAME
            ];

            console.log(`[Backup] Iniciando inyección del archivo: ${filename}...`);

            const child = execFile('mysql', args, async (execErr, _stdout, stderr) => {
                if (execErr) {
                    console.error('[BackupService] Error crítico en CLI de MySQL:', stderr || execErr.message);
                    return reject(new Error(stderr || execErr.message));
                }

                try {
                    await db.query('SET FOREIGN_KEY_CHECKS = 0');
                    await db.query('TRUNCATE TABLE backups');

                    if (historialOriginal.length > 0) {
                        const insertQuery = 'INSERT INTO backups (idr, nombre, contenido, fecha) VALUES ?';
                        const values = historialOriginal.map(b => [b.idr, b.nombre, b.contenido, b.fecha]);
                        await db.query(insertQuery, [values]);
                        console.log('[Backup] Tabla de registros reinsertada con éxito.');
                    }

                    await db.query('SET FOREIGN_KEY_CHECKS = 1');

                    resolve({
                        success: true,
                        message: `Base de datos restaurada con éxito desde el archivo ${filename}. Historial preservado.`
                    });

                } catch (reinsertErr) {
                    await db.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => { });
                    console.error('[BackupService] Error al reinsertar el historial de la tabla:', reinsertErr.message);
                    reject(new Error('La base de datos se restauró, pero los registros de la tabla se perdieron.'));
                }
            });

            const readStream = fs.createReadStream(rutaArchivo);
            readStream.on('error', (streamErr) => {
                console.error('[BackupService] Error leyendo el archivo de respaldo:', streamErr.message);
                if (child && !child.killed) child.kill();
                reject(new Error('Error leyendo el archivo de respaldo.'));
            });

            readStream.pipe(child.stdin);

        } catch (err) {
            console.error('[BackupService] Error general en el proceso:', err.message);
            reject(err);
        }
    });
}

exports.restoreBackup = async (req, res) => {
    const filename = path.basename(req.params.filename);
    try {
        const result = await runRestore(filename);
        return res.json(result);
    } catch (err) {
        return res.status(500).json({
            error: 'No se pudo procesar la solicitud de restauración.',
            detalle: err.message
        });
    }
};

// ============================================================
// uploadBackup
// Recibe un archivo .sql subido por el usuario, lo guarda en el
// directorio de respaldos y lo registra en la base de datos.
// Opcionalmente lo restaura de inmediato si restore=true.
// ============================================================
exports.uploadBackup = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se recibió ningún archivo .sql válido' });
    }

    const filename = req.file.filename;
    const rutaArchivo = path.join(BACKUP_DIR, filename);

    try {
        const stats = fs.statSync(rutaArchivo);
        if (stats.size === 0) {
            fs.unlinkSync(rutaArchivo);
            return res.status(400).json({ error: 'El archivo SQL subido está vacío.' });
        }

        const backupUrl = buildBackupUrl(filename);
        const now = new Date();

        await db.query(
            'INSERT INTO backups (contenido, nombre, fecha) VALUES (?, ?, NOW())',
            [backupUrl, filename]
        );

        console.log(`[BackupService] Respaldo SQL subido y registrado: ${filename} (${stats.size} bytes)`);

        const restoreImmediately = req.body.restore === 'true' || req.query.restore === 'true';

        if (restoreImmediately) {
            console.log(`[BackupService] Restaurando base de datos inmediatamente tras subida de: ${filename}`);
            try {
                const restoreResult = await runRestore(filename);
                return res.status(201).json({
                    success: true,
                    mensaje: `Archivo ${filename} subido y base de datos restaurada exitosamente`,
                    archivo: filename,
                    url: backupUrl,
                    tamano_kb: Math.round(stats.size / 1024),
                    fecha: now.toISOString(),
                    restaurado: true,
                    restoreResult
                });
            } catch (restoreErr) {
                console.error('[BackupService] Error al restaurar tras subida:', restoreErr.message);
                return res.status(500).json({
                    error: 'El archivo se subió y registró, pero falló la restauración automática.',
                    archivo: filename,
                    tamano_kb: Math.round(stats.size / 1024),
                    detalle: restoreErr.message
                });
            }
        }

        return res.status(201).json({
            success: true,
            mensaje: 'Archivo SQL subido y registrado exitosamente',
            archivo: filename,
            url: backupUrl,
            tamano_kb: Math.round(stats.size / 1024),
            fecha: now.toISOString(),
            restaurado: false
        });

    } catch (err) {
        console.error('[BackupService] Error al procesar subida de respaldo:', err.message);
        if (fs.existsSync(rutaArchivo)) {
            try { fs.unlinkSync(rutaArchivo); } catch (_) { }
        }
        return res.status(500).json({
            error: 'No se pudo guardar el archivo de respaldo en el servidor',
            detalle: err.message
        });
    }
};

// ============================================================
// deleteBackup
// Elimina permanentemente un archivo de respaldo del disco.
//
// Seguridad: igual que en downloadBackup, se sanitiza el
// nombre del archivo para prevenir path traversal.
// ============================================================
exports.deleteBackup = async (req, res) => {

    // Sanitiza el nombre del archivo
    const filename = path.basename(req.params.filename);
    const rutaArchivo = path.join(BACKUP_DIR, filename);

    try {
        if (fs.existsSync(rutaArchivo)) {
            fs.unlinkSync(rutaArchivo);
        }

        const [result] = await db.query('DELETE FROM backups WHERE nombre = ?', [filename]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: `Respaldo no encontrado en base de datos: ${filename}` });
        }

        console.log(`[BackupService] Archivo eliminado: ${filename}`);

        res.json({ mensaje: `Respaldo eliminado correctamente: ${filename}` });

    } catch (err) {
        console.error('[BackupService] Error al eliminar archivo:', err.message);
        res.status(500).json({ error: 'No se pudo eliminar el archivo de respaldo' });
    }
};

exports.BACKUP_DIR = BACKUP_DIR;
exports.buildBackupUrl = buildBackupUrl;
exports.runRestore = runRestore;

