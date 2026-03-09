// src/routes/publication.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const pubController = require('../controllers/publication.controller');
const { validateSession } = require('../middleware/auth');

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Filter: accept images AND pdf/docx documents
const fileFilter = (req, file, cb) => {
    const allowedImageTypes = /^image\//;
    const allowedDocTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ];

    if (allowedImageTypes.test(file.mimetype) || allowedDocTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo imágenes, PDF o Word (.docx).'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 15 * 1024 * 1024 } // 15 MB max per file
});

// Shared upload fields config
const uploadFields = upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'document', maxCount: 1 }
]);

// Routes

// Public Routes (Marketplace view)
router.get('/', pubController.getAllPublications);
router.get('/user/:user_id', pubController.getPublicationsByUser);
router.get('/:id', pubController.getPublicationById);
// Legacy Get Card support (POST id)
router.post('/get-card', upload.none(), pubController.getPublicationById);

// Protected Routes
router.post('/', validateSession, (req, res, next) => {
    console.log("Auth passed, starting upload...");
    uploadFields(req, res, (err) => {
        if (err) {
            console.error("Multer Error:", err);
            const statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 500;
            return res.status(statusCode).json({ error: true, message: "Upload failed: " + err.message });
        }
        console.log("Upload finished, calling controller...");
        next();
    });
}, pubController.createPublication);

router.put('/:id', validateSession, (req, res, next) => {
    uploadFields(req, res, (err) => {
        if (err) {
            console.error("Multer Error:", err);
            const statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 500;
            return res.status(statusCode).json({ error: true, message: "Upload failed: " + err.message });
        }
        next();
    });
}, pubController.updatePublication);

router.delete('/:id', validateSession, pubController.deletePublication);

module.exports = router;
