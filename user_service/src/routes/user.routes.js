// src/routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { validateSession } = require('../middleware/auth');

router.use(validateSession); // Protect all routes

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
// Legacy path support? Maybe frontend can just stick to /src/delete-user.php mapped to delete via middleware rewrite or just UPDATE frontend.
// I will update frontend.

module.exports = router;
