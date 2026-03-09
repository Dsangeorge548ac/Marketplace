const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 50,
});

// Middleware to check db connection
app.use((req, res, next) => {
    db.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to database:', err);
            return res.status(500).json({ error: 'Database connection failed' });
        }
        connection.release();
        next();
    });
});


app.post('/', (req, res) => {
    const { user_id, items } = req.body;

    if (!user_id || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'User ID and a non-empty items array are required' });
    }

    // 1. Check Order Limit
    const countQuery = 'SELECT COUNT(*) as count FROM orders WHERE user_id = ? AND status = "pending"';
    db.query(countQuery, [user_id], (err, countResult) => {
        if (err) {
            console.error("Error checking order limit:", err);
            return res.status(500).json({ error: 'Failed to check order limit' });
        }

        const pendingCount = countResult[0].count;
        if (pendingCount >= 5) {
            return res.status(400).json({
                error: 'Limit exceeded',
                message: 'Has alcanzado el límite de 5 pedidos pendientes. Espera a que sean aprobados.'
            });
        }

        // 2. Proceed with creation
        const createOrderQuery = 'INSERT INTO orders (user_id) VALUES (?)';

        db.query(createOrderQuery, [user_id], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Failed to create order' });
            }

            const orderId = result.insertId;

            console.log("Creating order items for Order ID:", orderId, "Items:", items);

            const orderItemsValues = items.map(item => [
                orderId,
                item.machine_id || item.id,
                item.seller_id || 0,
                item.quantity || 1
            ]);

            if (orderItemsValues.length === 0) {
                return res.status(201).json({ message: 'Order created (empty details)', id: orderId });
            }

            const createItemsQuery = 'INSERT INTO order_items (order_id, machine_id, seller_id, quantity) VALUES ?';
            db.query(createItemsQuery, [orderItemsValues], (err, itemsResult) => {
                if (err) {
                    console.error("Error inserting items:", err);
                    return res.status(500).json({ error: 'Failed to create order items' });
                }
                res.status(201).json({ message: 'Order created successfully', id: orderId });
            });
        });
    });
});

// Get orders for a user (BUYER) with Pagination
app.get('/user/:user_id', (req, res) => {
    const userId = req.params.user_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // 1. Get Total Count
    const countQuery = 'SELECT COUNT(*) as total FROM orders WHERE user_id = ?';
    db.query(countQuery, [userId], (err, countResult) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to fetch count' });
        }
        const total = countResult[0].total;

        // 2. Get Data
        const queryJson = `
        SELECT o.id, o.user_id, o.status, o.created_at,
               json_arrayagg(
                 json_object('machine_id', oi.machine_id, 'seller_id', oi.seller_id, 'quantity', oi.quantity)
               ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = ?
        GROUP BY o.id, o.user_id, o.status, o.created_at
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
      `;

        db.query(queryJson, [userId, limit, offset], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Failed to fetch orders' });
            }
            const formatted = results.map(row => {
                let items = row.items;
                if (typeof items === 'string') {
                    try { items = JSON.parse(items); } catch (e) { }
                }
                return { ...row, items };
            });
            res.json({
                data: formatted,
                total,
                page,
                limit
            });
        });
    });
});

// Get orders for a SELLER with Pagination
app.get('/seller/:seller_id', (req, res) => {
    const sellerId = req.params.seller_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // 1. Get Count of Orders involving this seller
    const countQuery = `
        SELECT COUNT(DISTINCT o.id) as total 
        FROM orders o 
        JOIN order_items oi ON o.id = oi.order_id 
        WHERE oi.seller_id = ?
    `;

    db.query(countQuery, [sellerId], (err, countResult) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to fetch count' });
        }
        const total = countResult[0].total;

        // 2. Get Data
        const queryJson = `
        SELECT o.id, o.user_id, o.status, o.created_at,
               json_arrayagg(
                 json_object('machine_id', oi.machine_id, 'seller_id', oi.seller_id, 'quantity', oi.quantity)
               ) as items
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id IN (SELECT DISTINCT order_id FROM order_items WHERE seller_id = ?)
        GROUP BY o.id, o.user_id, o.status, o.created_at
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
      `;

        db.query(queryJson, [sellerId, limit, offset], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Failed to fetch orders' });
            }
            const formatted = results.map(row => {
                let items = row.items;
                if (typeof items === 'string') {
                    try { items = JSON.parse(items); } catch (e) { }
                }
                return { ...row, items };
            });
            res.json({
                data: formatted,
                total,
                page,
                limit
            });
        });
    });
});

// Get all orders (Admin) (with items) with Pagination
app.get('/', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // 1. Get Total Count
    const countQuery = 'SELECT COUNT(*) as total FROM orders';
    db.query(countQuery, (err, countResult) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to fetch count' });
        }
        const total = countResult[0].total;

        // 2. Get Data
        const queryJson = `
        SELECT o.id, o.user_id, o.status, o.created_at,
               json_arrayagg(
                 json_object('machine_id', oi.machine_id, 'seller_id', oi.seller_id, 'quantity', oi.quantity)
               ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        GROUP BY o.id, o.user_id, o.status, o.created_at
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
      `;

        db.query(queryJson, [limit, offset], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Failed to fetch orders' });
            }
            const formatted = results.map(row => {
                let items = row.items;
                if (typeof items === 'string') {
                    try { items = JSON.parse(items); } catch (e) { }
                }
                return { ...row, items };
            });
            res.json({
                data: formatted,
                total,
                page,
                limit
            });
        });
    });
});

// Update order status
app.put('/:id/status', (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }

    const query = 'UPDATE orders SET status = ? WHERE id = ?';
    db.query(query, [status, orderId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to update order status' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json({ message: 'Order status updated', id: orderId, status });
    });
});

// Delete order
app.delete('/:id', (req, res) => {
    const orderId = req.params.id;

    // Transaction-like: Delete items first (FK constraints might require this, or CASCADE)
    // Assuming we need to manually delete items if no CASCADE.
    const deleteItems = 'DELETE FROM order_items WHERE order_id = ?';
    db.query(deleteItems, [orderId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to delete order items' });
        }

        const deleteOrder = 'DELETE FROM orders WHERE id = ?';
        db.query(deleteOrder, [orderId], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Failed to delete order' });
            }
            res.json({ message: 'Order deleted successfully' });
        });
    });
});

app.listen(port, () => {
    console.log(`Orders service listening at http://localhost:${port}`);
});
