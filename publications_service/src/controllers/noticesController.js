const db = require('../db');

exports.createNotice = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { title, subtitle, description } = req.body;
        const image = req.file ? `/publications_service/uploads/${req.file.filename}` : '';

        const [result] = await connection.query(
            'INSERT INTO notices (title, subtitle, description, image) VALUES (?, ?, ?, ?)',
            [title, subtitle, description, image]
        );

        await connection.commit();
        res.json({ success: true, message: 'Notice created', id: result.insertId });

    } catch (error) {
        await connection.rollback();
        console.error("Error creating notice:", error);
        res.status(500).json({ error: true, message: 'Error creating notice' });
    } finally {
        connection.release();
    }
};

exports.getAllNotices = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100; // Default to 100 if not specified (backward compat)
        const offset = (page - 1) * limit;

        // Count Total
        const [countResult] = await db.query('SELECT COUNT(*) as total FROM notices');
        const totalCount = countResult[0].total;

        // Fetch Data
        const [rows] = await db.query('SELECT * FROM notices ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]);

        // Return structured response
        res.json({
            data: rows,
            totalCount,
            page,
            limit
        });

    } catch (error) {
        console.error("Error fetching notices:", error);
        res.status(500).json({ error: true, message: 'Error fetching notices' });
    }
};

exports.getNoticeById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM notices WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ error: true, message: 'Notice not found' });
        res.json(rows[0]);
    } catch (error) {
        console.error("Error fetching notice:", error);
        res.status(500).json({ error: true, message: 'Error fetching notice' });
    }
};

exports.deleteNotice = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM notices WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: true, message: 'Notice not found' });
        res.json({ success: true, message: 'Notice deleted' });
    } catch (error) {
        console.error("Error deleting notice:", error);
        res.status(500).json({ error: true, message: 'Error deleting notice' });
    }
};
