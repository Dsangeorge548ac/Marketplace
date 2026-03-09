// src/controllers/user.controller.js
const db = require('../db');

exports.getAllUsers = async (req, res) => {
    try {
        // 1. DataTables Parameters (with fallback to standard page/limit)
        let limit = parseInt(req.query.limit) || 10;
        let page = parseInt(req.query.page) || 1;

        // DataTables 'length' overrides 'limit' if present
        if (req.query.length) limit = parseInt(req.query.length);

        // DataTables 'start' override logic: start is offset.
        // If 'start' is present, use it. Else use (page-1)*limit.
        let offset = (page - 1) * limit;
        if (req.query.start !== undefined) offset = parseInt(req.query.start);

        const draw = parseInt(req.query.draw) || 1;

        const searchValue = req.query.search && req.query.search.value ? req.query.search.value : '';
        const orderColumnIndex = req.query.order && req.query.order[0] ? parseInt(req.query.order[0].column) : 0;
        const orderDir = req.query.order && req.query.order[0] ? req.query.order[0].dir : 'desc';

        // Column mapping for sorting
        const columns = ['id', 'name', 'email', 'role'];
        const orderBy = columns[orderColumnIndex] || 'id';
        const validOrderDir = ['asc', 'desc'].includes(orderDir) ? orderDir : 'desc';

        // 2. Base Query and Values
        let query = 'SELECT id, name, email, role FROM users';
        let countQuery = 'SELECT COUNT(*) as total FROM users';
        const queryParams = [];
        const countParams = [];

        // 3. Search / Filtering
        if (searchValue) {
            const searchClause = ' WHERE name LIKE ? OR email LIKE ?';
            query += searchClause;
            countQuery += searchClause;
            const likeTerm = `%${searchValue}%`;
            queryParams.push(likeTerm, likeTerm);
            countParams.push(likeTerm, likeTerm);
        }

        // 4. Sorting & Pagination
        query += ` ORDER BY ${orderBy} ${validOrderDir}`;
        query += ' LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        // 5. Execute Queries
        // Total records (without filter) - Optimized: cache or separate query if needed, 
        // but for now strict count is fine.
        const [totalResult] = await db.query('SELECT COUNT(*) as total FROM users');
        const recordsTotal = totalResult[0].total;

        // Filtered records
        const [filteredResult] = await db.query(countQuery, countParams);
        const recordsFiltered = filteredResult[0].total;

        // Data
        const [data] = await db.query(query, queryParams);

        // 6. Response
        res.json({
            draw: draw,
            recordsTotal: recordsTotal,
            recordsFiltered: recordsFiltered,
            data: data
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, message: 'Error fetching users' });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name, email, role FROM users WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: true, message: 'User not found' });
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, message: 'Error fetching user' });
    }
};

exports.updateUser = async (req, res) => {
    const { email, name, role } = req.body;
    try {
        await db.query('UPDATE users SET email = ?, name = ?, role = ? WHERE id = ?', [email, name, role, req.params.id]);
        res.json({ success: true, message: 'User updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, message: 'Error updating user' });
    }
};

exports.deleteUser = async (req, res) => {
    const userId = req.params.id;
    const connection = await db.getConnection();
    const authenticatedUserId = req.user.id;

    try {
        await connection.beginTransaction();

        if (authenticatedUserId === userId) {
            throw new Error("No puedes eliminar a ti mismo");
        }
        // Check if user exists and role
        const [users] = await connection.query("SELECT role FROM users WHERE id = ?", [userId]);
        if (users.length === 0) throw new Error("User not found");

        const userRole = users[0].role;
        if (userRole === 'Developer' || userRole === 'Administrador') {
            throw new Error("No puedes eliminar a un usuario con el rol de Developer o Administrador");
        }

        // Delete dependencies (replicating PHP logic)
        /*
        await connection.query("DELETE FROM account_address_location WHERE id_user = ?", [userId]);
        await connection.query("DELETE FROM account_personal_information WHERE id_user = ?", [userId]);
        await connection.query("DELETE FROM account WHERE id_user = ?", [userId]);
        await connection.query("DELETE FROM users WHERE id = ?", [userId]);
        */
        // Con las nuevas relaciones ON DELETE CASCADE, solo necesitarías esta línea:
        await connection.query("DELETE FROM users WHERE id = ?", [userId]);

        await connection.commit();
        res.json({ success: true, message: 'User deleted' });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(400).json({ error: true, message: error.message || 'Error deleting user' });
    } finally {
        connection.release();
    }
};
