const db = require('../db');

async function ensureNewsUrlColumn(connection) {
    const [columns] = await connection.query("SHOW COLUMNS FROM notices LIKE 'news_url'");

    if (columns.length === 0) {
        await connection.query(
            'ALTER TABLE notices ADD COLUMN news_url VARCHAR(500) NULL AFTER description'
        );
    }
}

exports.createNotice = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await ensureNewsUrlColumn(connection);

        const { title, description, news_url, url } = req.body;
        const normalizedUrl = (news_url || url || '').trim();

        if (!title || !description || !normalizedUrl) {
            return res.status(400).json({ error: true, message: 'title, description and news_url are required' });
        }

        let parsedUrl;
        try {
            parsedUrl = new URL(normalizedUrl);
        } catch (e) {
            return res.status(400).json({ error: true, message: 'Invalid URL format' });
        }

        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            return res.status(400).json({ error: true, message: 'URL must start with http:// or https://' });
        }

        const image = req.file ? `/publications_service/uploads/${req.file.filename}` : '';

        const [result] = await connection.query(
            'INSERT INTO notices (title, description, news_url, image) VALUES (?, ?, ?, ?)',
            [title, description, normalizedUrl, image]
        );

        res.json({ success: true, message: 'Notice created', id: result.insertId });

    } catch (error) {
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

exports.updateNotice = async (req, res) => {
    const { id } = req.params;
    const connection = await db.getConnection();
    try {
        await ensureNewsUrlColumn(connection);

        const { title, description, news_url, url, existing_image } = req.body;
        const normalizedUrl = (news_url || url || '').trim();

        if (!title || !description || !normalizedUrl) {
            return res.status(400).json({ error: true, message: 'title, description and news_url are required' });
        }

        let parsedUrl;
        try {
            parsedUrl = new URL(normalizedUrl);
        } catch (e) {
            return res.status(400).json({ error: true, message: 'Invalid URL format' });
        }

        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            return res.status(400).json({ error: true, message: 'URL must start with http:// or https://' });
        }

        const [existingRows] = await connection.query('SELECT image FROM notices WHERE id = ?', [id]);
        if (existingRows.length === 0) {
            return res.status(404).json({ error: true, message: 'Notice not found' });
        }

        const imagePath = req.file
            ? `/publications_service/uploads/${req.file.filename}`
            : (existing_image || existingRows[0].image || '');

        await connection.query(
            'UPDATE notices SET title = ?, description = ?, news_url = ?, image = ? WHERE id = ?',
            [title, description, normalizedUrl, imagePath, id]
        );

        res.json({ success: true, message: 'Notice updated' });
    } catch (error) {
        console.error('Error updating notice:', error);
        res.status(500).json({ error: true, message: 'Error updating notice' });
    } finally {
        connection.release();
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
