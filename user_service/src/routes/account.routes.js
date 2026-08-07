const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const accountController = require('../controllers/account.controller');
const { validateSession } = require('../middleware/auth');

const router = express.Router();

const accountUploadDir = path.join(__dirname, '../../uploads/verifications');
fs.mkdirSync(accountUploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, accountUploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedImageTypes = /^image\//;
    const allowedDocTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedImageTypes.test(file.mimetype) || allowedDocTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo imagenes, PDF o Word.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 15 * 1024 * 1024 }
});

const uploadAccountFiles = upload.fields([
    { name: 'cbm_alliance_document', maxCount: 1 },
    { name: 'tax_id_document', maxCount: 1 },
    { name: 'face_photo', maxCount: 1 }
]);

router.use(validateSession);

router.get('/me', accountController.getMyVerification);
router.post('/me/step-1', accountController.saveStepOne);
router.post('/me/step-2', (req, res, next) => {
    uploadAccountFiles(req, res, (err) => {
        if (err) {
            const statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
            return res.status(statusCode).json({ error: true, message: err.message });
        }
        next();
    });
}, accountController.saveStepTwo);
router.post('/me/submit', accountController.submitVerification);

router.get('/requests', accountController.listVerificationRequests);
router.get('/requests/:userId', accountController.getVerificationRequestByUserId);
router.put('/requests/:userId/approve', accountController.approveVerification);
router.put('/requests/:userId/cancel', accountController.cancelVerification);
router.put('/requests/:userId/revoke', accountController.revokeVerification);

module.exports = router;
