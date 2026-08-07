// src/controllers/user.controller.js
const db = require('../db');

exports.getAllUsers = async (req, res) => {
    try {
        // 1. DataTables Parameters (with fallback to standard page/limit)
        let limit = parseInt(req.query.limit) || 9;
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
        const columns = [
            'u.id',
            'u.name',
            'u.email',
            'u.role',
            'verification_status',
            'verification_submitted_at'
        ];
        const orderBy = columns[orderColumnIndex] || 'id';
        const validOrderDir = ['asc', 'desc'].includes(orderDir) ? orderDir : 'desc';

        // 2. Base Query and Values
        let query = `
            SELECT
                u.id,
                u.name,
                u.email,
                u.role,
                COALESCE(vp.status, 'No verificado') AS verification_status,
                ti.business_name AS verification_business_name,
                ti.tax_id AS verification_tax_id,
                ti.phone AS verification_phone,
                vp.submitted_at AS verification_submitted_at,
                vp.reviewed_at AS verification_reviewed_at
            FROM users u
            LEFT JOIN account_verification_process vp ON vp.account_id = u.id
            LEFT JOIN account_verification_tax_information ti ON ti.verification_id = vp.id`;

        let countQuery = `
            SELECT COUNT(DISTINCT u.id) as total
            FROM users u
            LEFT JOIN account_verification_process vp ON vp.account_id = u.id
            LEFT JOIN account_verification_tax_information ti ON ti.verification_id = vp.id`;
        const queryParams = [];
        const countParams = [];

        // 3. Search / Filtering
        if (searchValue) {
            const searchClause = `
                WHERE
                    u.name LIKE ? OR
                    u.email LIKE ? OR
                    u.role LIKE ? OR
                    ti.business_name LIKE ? OR
                    ti.tax_id LIKE ? OR
                    COALESCE(vp.status, 'No verificado') LIKE ?`;
            query += searchClause;
            countQuery += searchClause;
            const likeTerm = `%${searchValue}%`;
            queryParams.push(likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm);
            countParams.push(likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm);
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
        const query = `
            SELECT
                u.id,
                u.name,
                u.email,
                u.role,
                NULL AS first_name,
                NULL AS last_name,
                ti.phone AS phone,
                COALESCE(vp.feedback, 'Sin mensajes') AS message,
                COALESCE(vp.status, 'No verificado') AS verification_status,
                vp.feedback AS verification_feedback,
                vp.submitted_at AS verification_submitted_at,
                vp.reviewed_at AS verification_reviewed_at,
                vp.reviewed_by AS verification_reviewed_by,
                ti.business_name AS verification_business_name,
                ti.tax_address AS verification_tax_address,
                ti.tax_id AS verification_tax_id,
                ti.phone AS verification_phone,
                vd.cbm_alliance_document,
                vd.tax_id_document,
                vd.face_photo
            FROM users u
            LEFT JOIN account_verification_process vp ON vp.account_id = u.id
            LEFT JOIN account_verification_tax_information ti ON ti.verification_id = vp.id
            LEFT JOIN (
                SELECT
                    verification_id,
                    MAX(CASE WHEN document_type = 'cbm_alliance_document' THEN file_path END) AS cbm_alliance_document,
                    MAX(CASE WHEN document_type = 'tax_id_document' THEN file_path END) AS tax_id_document,
                    MAX(CASE WHEN document_type = 'face_photo' THEN file_path END) AS face_photo
                FROM account_verification_documents
                GROUP BY verification_id
            ) vd ON vd.verification_id = vp.id
            WHERE u.id = ?
            LIMIT 1`;

        const [rows] = await db.query(query, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: true, message: 'User not found' });
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, message: 'Error fetching user' });
    }
};

exports.updateUser = async (req, res) => {
    const { email, name, role, message, status, business_name, tax_address, tax_id, phone } = req.body;
    try {
        const [verificationRows] = await db.query(
            `SELECT COALESCE(vp.status, 'No verificado') AS verification_status, vp.id AS verification_id
             FROM users u
             LEFT JOIN account_verification_process vp ON vp.account_id = u.id
             WHERE u.id = ?
             LIMIT 1`,
            [req.params.id]
        );

        if (verificationRows.length === 0) {
            return res.status(404).json({ error: true, message: 'User not found' });
        }

        const verificationStatus = String(verificationRows[0].verification_status || '').toLowerCase();
        const isVerified = verificationStatus === 'verificado';

        if (isVerified) {
            await db.query(
                'UPDATE users SET email = ?, name = ?, role = ? WHERE id = ?',
                [email, name, role, req.params.id]
            );

            if (message !== undefined || status !== undefined) {
                const setClauses = [];
                const queryParams = [];
                if (message !== undefined) {
                    setClauses.push('feedback = ?');
                    queryParams.push(message);
                }
                if (status !== undefined) {
                    setClauses.push('status = ?');
                    queryParams.push(status);
                }

                if (setClauses.length > 0) {
                    queryParams.push(req.params.id);
                    await db.query(
                        `UPDATE account_verification_process SET ${setClauses.join(', ')} WHERE account_id = ?`,
                        queryParams
                    );
                }
            }

            if (business_name !== undefined || tax_address !== undefined || tax_id !== undefined || phone !== undefined) {
                const verificationId = verificationRows[0].verification_id;

                if (verificationId) {
                    await db.query(
                        `INSERT INTO account_verification_tax_information (verification_id, business_name, tax_address, tax_id, phone)
                         VALUES (?, ?, ?, ?, ?)
                         ON DUPLICATE KEY UPDATE
                           business_name = VALUES(business_name),
                           tax_address = VALUES(tax_address),
                           tax_id = VALUES(tax_id),
                           phone = VALUES(phone),
                           updated_at = CURRENT_TIMESTAMP`,
                        [
                            verificationId,
                            business_name ?? '',
                            tax_address ?? '',
                            tax_id ?? '',
                            phone ?? ''
                        ]
                    );
                }
            }
        } else {
            await db.query(
                'UPDATE users SET name = ?, role = ? WHERE id = ?',
                [name, role, req.params.id]
            );
        }

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

        // Con las relaciones actuales ON DELETE CASCADE, solo se elimina el usuario.
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
