const express = require('express');
const router = express.Router();
const paymentMethodController = require('../controllers/payment_method.controller');
const { validateSession } = require('../middleware/auth');
// Public route to get a seller's payment methods
router.get('/public/:userId', paymentMethodController.getPaymentMethodsByUserId);

// Protect all routes with session validation
router.use(validateSession);

// GET /api/payment-methods
router.get('/', paymentMethodController.getPaymentMethodsByUser);

// POST /api/payment-methods
router.post('/', paymentMethodController.createPaymentMethod);

// PUT /api/payment-methods/:id
router.put('/:id', paymentMethodController.updatePaymentMethod);

// DELETE /api/payment-methods/:id
router.delete('/:id', paymentMethodController.deletePaymentMethod);

module.exports = router;
