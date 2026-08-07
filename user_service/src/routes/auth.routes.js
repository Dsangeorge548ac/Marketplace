// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateSession, validateSessionOptional } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/logout', authController.logout);
router.post('/google-login', authController.googleLogin);

// Validate endpoint (Optional Auth - Returns null if guest)
router.get('/validate', validateSessionOptional, authController.validate);

// Captcha endpoint
router.get('/captcha', authController.getCaptcha);

// Password Recovery
router.post('/recover-init', authController.recoverInit);
router.post('/recover-reset', authController.recoverReset);

module.exports = router;
