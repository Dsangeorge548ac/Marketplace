// src/controllers/order.controller.js
const db = require('../db');

// Genera un código de pedido único con formato: XX-AAAAAA (2 letras, guion, 6 alfanuméricos)
function randomChars(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let out = '';
    for (let i = 0; i < length; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
    return out;
}

async function createUniqueOrderCode(connection) {
    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const prefix = randomChars(2).replace(/[^A-Z]/g, 'A');
        const code = `${prefix}-${randomChars(6)}`;
        const [[existsRow]] = await connection.query('SELECT COUNT(*) AS cnt FROM orders WHERE order_number = ?', [code]);
        if (existsRow.cnt === 0) return code;
    }
    throw new Error('No se pudo generar un código de pedido único después de varios intentos');
}

// Helper: formatea created_at como "DD/MM/YYYY" (solo fecha, sin hora)
function formatDateOnly(dateValue) {
    if (!dateValue) return '';
    const d = new Date(dateValue);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

// Helper: formatea filas con items JSON y añade campos calculados
function formatRow(row) {
    let items = row.items;
    if (typeof items === 'string') {
        try { items = JSON.parse(items); } catch (e) { items = []; }
    }
    const safeOrderNumber = row.order_number || row.id || '';
    return {
        ...row,
        items,
        order_number: String(safeOrderNumber),
        created_date: formatDateOnly(row.created_at),
    };
}

function parsePagination(query) {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const requestedLimit = parseInt(query.limit, 10) || 9;
    const limit = Math.min(Math.max(requestedLimit, 1), 50);
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}

// -------------------------------------------------------
// POST /  → Crear pedido
// -------------------------------------------------------
exports.createOrder = async (req, res) => {
    const { user_id, items } = req.body;

    if (!user_id || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'User ID y un array de items no vacío son requeridos' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [[verificationRow]] = await connection.query(
            `SELECT COALESCE(vp.status, 'No verificado') AS verification_status
             FROM users u
             LEFT JOIN account_verification_process vp ON vp.account_id = u.id
             WHERE u.id = ?
             LIMIT 1`,
            [user_id]
        );

        if (!verificationRow || String(verificationRow.verification_status || '').toLowerCase() !== 'verificado') {
            await connection.rollback();
            return res.status(403).json({
                error: 'Cuenta no verificada',
                message: 'Debes verificar tu cuenta antes de poder realizar un pedido.'
            });
        }

        // 1. Limitar pedidos pendientes por usuario
        const [[countRow]] = await connection.query(
            'SELECT COUNT(*) as count FROM orders WHERE user_id = ? AND status = "pendiente"',
            [user_id]
        );
        if (countRow.count >= 5) {
            await connection.rollback();
            return res.status(400).json({
                error: 'Limit exceeded',
                message: 'Has alcanzado el límite de 5 pedidos pendientes. Espera a que sean aprobados.'
            });
        }

        // Agrupar items por seller_id
        const itemsBySeller = {};
        for (const item of items) {
            const sellerId = item.seller_id || 0;
            if (!itemsBySeller[sellerId]) {
                itemsBySeller[sellerId] = [];
            }
            itemsBySeller[sellerId].push(item);
        }

        const createdOrderIds = [];
        const createdOrderNumbers = [];

        // Crear un pedido por cada vendedor
        for (const [sellerIdStr, sellerItems] of Object.entries(itemsBySeller)) {
            const sellerId = parseInt(sellerIdStr, 10);
            
            // 2. Generar un código de pedido único y aleatorio para este pedido
            const uniqueCode = await createUniqueOrderCode(connection);
            const [result] = await connection.query(
                'INSERT INTO orders (user_id, seller_id, order_number) VALUES (?, ?, ?)',
                [user_id, sellerId, uniqueCode]
            );
            const orderId = result.insertId;
            createdOrderIds.push(orderId);
            createdOrderNumbers.push(uniqueCode);

            // 4. Insertar items
            const orderItemsValues = sellerItems.map(item => [
                orderId,
                item.machine_id || item.id,
                item.seller_id || 0,
                item.quantity || 1
            ]);

            await connection.query(
                'INSERT INTO order_items (order_id, machine_id, seller_id, quantity) VALUES ?',
                [orderItemsValues]
            );
        }

        await connection.commit();

        res.status(201).json({
            message: 'Pedidos creados exitosamente',
            ids: createdOrderIds,
            order_numbers: createdOrderNumbers
        });

    } catch (err) {
        await connection.rollback();
        console.error('[createOrder]', err);
        res.status(500).json({ error: 'Error al crear el pedido' });
    } finally {
        connection.release();
    }
};

// -------------------------------------------------------
// GET /user/:user_id  → Pedidos del comprador
// -------------------------------------------------------
exports.getOrdersByUser = async (req, res) => {
    const userId = req.params.user_id;
    const { page, limit, offset } = parsePagination(req.query);

    try {
        const [[countRow]] = await db.query(
            'SELECT COUNT(*) as total FROM orders WHERE user_id = ?',
            [userId]
        );
        const total = countRow.total;

        const [rows] = await db.query(`
                 SELECT o.id, o.order_number, o.user_id, o.status, o.created_at,
                     u.name AS buyer_name, u.email AS buyer_email,
                   json_arrayagg(
                     json_object('machine_id', oi.machine_id, 'seller_id', oi.seller_id, 'quantity', oi.quantity)
                   ) AS items
            FROM orders o
                 JOIN users u ON u.id = o.user_id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = ?
                 GROUP BY o.id, o.order_number, o.user_id, o.status, o.created_at, u.name, u.email
            ORDER BY o.created_at DESC
            LIMIT ? OFFSET ?
        `, [userId, limit, offset]);

        res.json({ data: rows.map(formatRow), total, page, limit });

    } catch (err) {
        console.error('[getOrdersByUser]', err);
        res.status(500).json({ error: 'Error al obtener los pedidos' });
    }
};

// -------------------------------------------------------
// GET /seller/:seller_id  → Pedidos del vendedor
// -------------------------------------------------------
exports.getOrdersBySeller = async (req, res) => {
    const sellerId = req.params.seller_id;
    const { page, limit, offset } = parsePagination(req.query);

    try {
        const [[countRow]] = await db.query(`
            SELECT COUNT(*) as total
            FROM orders o
            WHERE o.seller_id = ?
        `, [sellerId]);
        const total = countRow.total;

        const [rows] = await db.query(`
             SELECT o.id, o.order_number, o.user_id, o.status, o.created_at,
                 u.name AS buyer_name, u.email AS buyer_email,
                   json_arrayagg(
                     json_object('machine_id', oi.machine_id, 'seller_id', oi.seller_id, 'quantity', oi.quantity)
                   ) AS items
            FROM orders o
             JOIN users u ON u.id = o.user_id
             LEFT JOIN order_items oi ON o.id = oi.order_id
             WHERE o.seller_id = ?
             GROUP BY o.id, o.order_number, o.user_id, o.status, o.created_at, u.name, u.email
            ORDER BY o.created_at DESC
            LIMIT ? OFFSET ?
        `, [sellerId, limit, offset]);

        res.json({ data: rows.map(formatRow), total, page, limit });

    } catch (err) {
        console.error('[getOrdersBySeller]', err);
        res.status(500).json({ error: 'Error al obtener los pedidos del vendedor' });
    }
};

// -------------------------------------------------------
// GET /  → Todos los pedidos (Admin)
// -------------------------------------------------------
exports.getAllOrders = async (req, res) => {
    const { page, limit, offset } = parsePagination(req.query);

    try {
        const [[countRow]] = await db.query('SELECT COUNT(*) as total FROM orders');
        const total = countRow.total;

        const [rows] = await db.query(`
                 SELECT o.id, o.order_number, o.user_id, o.status, o.created_at,
                     u.name AS buyer_name, u.email AS buyer_email,
                   json_arrayagg(
                     json_object('machine_id', oi.machine_id, 'seller_id', oi.seller_id, 'quantity', oi.quantity)
                   ) AS items
            FROM orders o
                 JOIN users u ON u.id = o.user_id
            LEFT JOIN order_items oi ON o.id = oi.order_id
                 GROUP BY o.id, o.order_number, o.user_id, o.status, o.created_at, u.name, u.email
            ORDER BY o.created_at DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        res.json({ data: rows.map(formatRow), total, page, limit });

    } catch (err) {
        console.error('[getAllOrders]', err);
        res.status(500).json({ error: 'Error al obtener los pedidos' });
    }
};

// -------------------------------------------------------
// PUT /:id/status  → Actualizar estado
// -------------------------------------------------------
exports.updateOrderStatus = async (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'El campo status es requerido' });
    }

    try {
        const [result] = await db.query(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, orderId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        res.json({ message: 'Estado del pedido actualizado', id: orderId, status });

    } catch (err) {
        console.error('[updateOrderStatus]', err);
        res.status(500).json({ error: 'Error al actualizar el estado del pedido' });
    }
};

// -------------------------------------------------------
// DELETE /:id  → Eliminar pedido
// -------------------------------------------------------
exports.deleteOrder = async (req, res) => {
    const orderId = req.params.id;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);
        const [result] = await connection.query('DELETE FROM orders WHERE id = ?', [orderId]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        await connection.commit();
        res.json({ message: 'Pedido eliminado exitosamente' });

    } catch (err) {
        await connection.rollback();
        console.error('[deleteOrder]', err);
        res.status(500).json({ error: 'Error al eliminar el pedido' });
    } finally {
        connection.release();
    }
};
