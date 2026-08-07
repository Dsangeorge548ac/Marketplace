// src/routes/order.routes.js
const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/order.controller');

// POST   /            → Crear pedido
router.post('/', controller.createOrder);

// GET    /            → Todos los pedidos (Admin)
router.get('/', controller.getAllOrders);

// GET    /user/:user_id  → Pedidos del comprador
router.get('/user/:user_id', controller.getOrdersByUser);

// GET    /seller/:seller_id → Pedidos del vendedor
router.get('/seller/:seller_id', controller.getOrdersBySeller);

// PUT    /:id/status   → Actualizar estado
router.put('/:id/status', controller.updateOrderStatus);

// DELETE /:id          → Eliminar pedido
router.delete('/:id', controller.deleteOrder);

module.exports = router;
