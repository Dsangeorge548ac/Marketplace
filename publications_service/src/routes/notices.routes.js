const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const noticesController = require('../controllers/noticesController');

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
const upload = multer({ storage: storage });

// Routes
router.get('/', noticesController.getAllNotices);
router.get('/:id', noticesController.getNoticeById);
router.post('/', upload.single('image'), noticesController.createNotice);
router.put('/:id', upload.single('image'), noticesController.updateNotice);
router.delete('/:id', noticesController.deleteNotice);

module.exports = router;
