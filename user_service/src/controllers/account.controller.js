const db = require('../db');

const ALLOWED_REVIEW_ROLES = new Set(['administrador', 'developer']);

function normalizeRole(role) {
    return String(role || '').trim().toLowerCase();
}

function isReviewer(req) {
    return req.user && ALLOWED_REVIEW_ROLES.has(normalizeRole(req.user.role));
}

// account_verification_process.account_id now maps directly to users.id
async function ensureVerificationProcess(userId) {
    const [rows] = await db.query(
        'SELECT id FROM account_verification_process WHERE account_id = ? LIMIT 1',
        [userId]
    );

    if (rows.length > 0) return rows[0].id;

    const [result] = await db.query(
        'INSERT INTO account_verification_process (account_id, status) VALUES (?, ?)',
        [userId, 'No verificado']
    );

    return result.insertId;
}

async function getVerificationByUserId(userId) {
    const [rows] = await db.query(
        `SELECT
            u.id AS user_id,
            u.name AS user_name,
            u.email AS user_email,
            vp.account_id,
            COALESCE(vp.status, 'No verificado') AS verification,
            COALESCE(vp.feedback, 'Sin mensajes') AS message,
            vp.feedback AS verification_feedback,
            vp.submitted_at,
            vp.reviewed_at,
            vp.reviewed_by,
            ti.business_name,
            ti.tax_address,
            ti.tax_id,
            ti.phone,
            MAX(CASE WHEN docs.document_type = 'cbm_alliance_document' THEN docs.file_path END) AS cbm_alliance_document,
            MAX(CASE WHEN docs.document_type = 'tax_id_document' THEN docs.file_path END) AS tax_id_document,
            MAX(CASE WHEN docs.document_type = 'face_photo' THEN docs.file_path END) AS face_photo
        FROM users u
        LEFT JOIN account_verification_process vp ON vp.account_id = u.id
        LEFT JOIN account_verification_tax_information ti ON ti.verification_id = vp.id
        LEFT JOIN account_verification_documents docs ON docs.verification_id = vp.id
        WHERE u.id = ?
        GROUP BY
            u.id, u.name, u.email,
            vp.account_id, vp.status, vp.feedback, vp.submitted_at, vp.reviewed_at, vp.reviewed_by,
            ti.business_name, ti.tax_address, ti.tax_id, ti.phone
        LIMIT 1`,
        [userId]
    );

    return rows[0] || null;
}

exports.getMyVerification = async (req, res) => {
    try {
        const userId = req.user.id;
        await ensureVerificationProcess(userId);
        const payload = await getVerificationByUserId(userId);
        res.json({ success: true, data: payload });
    } catch (error) {
        console.error('getMyVerification error:', error);
        res.status(500).json({ error: true, message: 'Error fetching verification data' });
    }
};

exports.saveStepOne = async (req, res) => {
    const { business_name, tax_address, tax_id, phone } = req.body;

    if (!business_name || !tax_address || !tax_id || !phone) {
        return res.status(400).json({ error: true, message: 'business_name, tax_address, tax_id and phone are required' });
    }

    try {
        const userId = req.user.id;
        const verificationId = await ensureVerificationProcess(userId);

        await db.query(
            `UPDATE account_verification_process
             SET status = ?, feedback = NULL, reviewed_at = NULL, reviewed_by = NULL
             WHERE id = ?`,
            ['No verificado', verificationId]
        );

        await db.query(
            `INSERT INTO account_verification_tax_information (verification_id, business_name, tax_address, tax_id, phone)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               business_name = VALUES(business_name),
               tax_address = VALUES(tax_address),
               tax_id = VALUES(tax_id),
               phone = VALUES(phone),
               updated_at = CURRENT_TIMESTAMP`,
            [verificationId, business_name, tax_address, tax_id, phone]
        );

        res.json({ success: true, message: 'Paso 1 guardado correctamente' });
    } catch (error) {
        console.error('saveStepOne error:', error);
        res.status(500).json({ error: true, message: 'Error saving verification step 1' });
    }
};

exports.saveStepTwo = async (req, res) => {
    try {
        const userId = req.user.id;
        const verificationId = await ensureVerificationProcess(userId);

        const files = req.files || {};
        const cbmDoc = files.cbm_alliance_document && files.cbm_alliance_document[0]
            ? `uploads/verifications/${files.cbm_alliance_document[0].filename}`
            : null;
        const taxDoc = files.tax_id_document && files.tax_id_document[0]
            ? `uploads/verifications/${files.tax_id_document[0].filename}`
            : null;
        const facePhoto = files.face_photo && files.face_photo[0]
            ? `uploads/verifications/${files.face_photo[0].filename}`
            : null;

        const docsToUpsert = [];
        if (cbmDoc) docsToUpsert.push(['cbm_alliance_document', cbmDoc]);
        if (taxDoc) docsToUpsert.push(['tax_id_document', taxDoc]);
        if (facePhoto) docsToUpsert.push(['face_photo', facePhoto]);

        for (const [documentType, filePath] of docsToUpsert) {
            await db.query(
                `INSERT INTO account_verification_documents (verification_id, document_type, file_path)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE file_path = VALUES(file_path), updated_at = CURRENT_TIMESTAMP`,
                [verificationId, documentType, filePath]
            );
        }

        res.json({ success: true, message: 'Paso 2 guardado correctamente' });
    } catch (error) {
        console.error('saveStepTwo error:', error);
        res.status(500).json({ error: true, message: 'Error saving verification step 2' });
    }
};

exports.submitVerification = async (req, res) => {
    try {
        const userId = req.user.id;
        const verificationId = await ensureVerificationProcess(userId);

        const data = await getVerificationByUserId(userId);
        if (!data) {
            return res.status(404).json({ error: true, message: 'Verification data not found' });
        }

        const missing = [];
        if (!data.business_name) missing.push('Nombre o razon social');
        if (!data.tax_address) missing.push('Domicilio fiscal');
        if (!data.tax_id) missing.push('RIF o cedula');
        if (!data.phone) missing.push('Numero de telefono');
        if (!data.cbm_alliance_document) missing.push('Documento de alianza con la CBM');
        if (!data.tax_id_document) missing.push('Foto de la cedula o RIF');
        if (!data.face_photo) missing.push('Foto del rostro');

        if (missing.length > 0) {
            return res.status(400).json({
                error: true,
                message: 'Faltan campos/documentos para enviar a revision',
                missing
            });
        }

        await db.query(
            `UPDATE account_verification_process
             SET status = ?, submitted_at = NOW(), reviewed_at = NULL, reviewed_by = NULL, feedback = NULL
             WHERE id = ?`,
            ['Pendiente revision', verificationId]
        );

        res.json({ success: true, message: 'Solicitud enviada a revision' });
    } catch (error) {
        console.error('submitVerification error:', error);
        res.status(500).json({ error: true, message: 'Error submitting verification' });
    }
};

exports.listVerificationRequests = async (req, res) => {
    try {
        if (!isReviewer(req)) {
            return res.status(403).json({ error: true, message: 'Forbidden' });
        }

        const status = req.query.status ? String(req.query.status) : null;

        let query = `SELECT
            u.id AS user_id,
            u.name AS user_name,
            u.email AS user_email,
            ti.business_name,
            ti.phone,
            ti.tax_id,
            vp.status AS verification,
            vp.feedback AS verification_feedback,
            vp.submitted_at,
            vp.reviewed_at
        FROM users u
        INNER JOIN account_verification_process vp ON vp.account_id = u.id
        LEFT JOIN account_verification_tax_information ti ON ti.verification_id = vp.id`;

        const params = [];
        if (status) {
            query += ' WHERE vp.status = ?';
            params.push(status);
        }

        query += ' ORDER BY COALESCE(vp.submitted_at, vp.reviewed_at) DESC, u.id DESC';

        const [rows] = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('listVerificationRequests error:', error);
        res.status(500).json({ error: true, message: 'Error listing verification requests' });
    }
};

exports.getVerificationRequestByUserId = async (req, res) => {
    try {
        if (!isReviewer(req)) {
            return res.status(403).json({ error: true, message: 'Forbidden' });
        }

        const userId = parseInt(req.params.userId, 10);
        if (!Number.isInteger(userId)) {
            return res.status(400).json({ error: true, message: 'Invalid user id' });
        }

        await ensureVerificationProcess(userId);

        const payload = await getVerificationByUserId(userId);
        if (!payload) {
            return res.status(404).json({ error: true, message: 'Verification request not found' });
        }

        res.json({ success: true, data: payload });
    } catch (error) {
        console.error('getVerificationRequestByUserId error:', error);
        res.status(500).json({ error: true, message: 'Error fetching verification request' });
    }
};

exports.approveVerification = async (req, res) => {
    try {
        if (!isReviewer(req)) {
            return res.status(403).json({ error: true, message: 'Forbidden' });
        }

        const userId = parseInt(req.params.userId, 10);
        if (!Number.isInteger(userId)) {
            return res.status(400).json({ error: true, message: 'Invalid user id' });
        }

        const verificationId = await ensureVerificationProcess(userId);

        await db.query(
            `UPDATE account_verification_process
             SET status = ?, reviewed_at = NOW(), reviewed_by = ?, feedback = ?
             WHERE id = ?`,
            ['Verificado', req.user.id, req.body.feedback || 'Verificacion aprobada', verificationId]
        );

        res.json({ success: true, message: 'Usuario verificado correctamente' });
    } catch (error) {
        console.error('approveVerification error:', error);
        res.status(500).json({ error: true, message: 'Error approving verification' });
    }
};

exports.cancelVerification = async (req, res) => {
    try {
        if (!isReviewer(req)) {
            return res.status(403).json({ error: true, message: 'Forbidden' });
        }

        const userId = parseInt(req.params.userId, 10);
        const feedback = String(req.body.feedback || '').trim();

        if (!Number.isInteger(userId)) {
            return res.status(400).json({ error: true, message: 'Invalid user id' });
        }

        if (!feedback) {
            return res.status(400).json({ error: true, message: 'feedback is required to cancel verification process' });
        }

        await db.query(
            'UPDATE account_verification_process SET status = ?, feedback = ? WHERE account_id = ?',
            ['No verificado', feedback, userId]
        );

        res.json({ success: true, message: 'Proceso de verificacion cancelado y el usuario recibira tus comentarios' });
    } catch (error) {
        console.error('cancelVerification error:', error);
        res.status(500).json({ error: true, message: 'Error cancelling verification' });
    }
};

exports.revokeVerification = async (req, res) => {
    try {
        if (!isReviewer(req)) {
            return res.status(403).json({ error: true, message: 'Forbidden' });
        }

        const userId = parseInt(req.params.userId, 10);
        if (!Number.isInteger(userId)) {
            return res.status(400).json({ error: true, message: 'Invalid user id' });
        }

        await db.query(
            'DELETE FROM account_verification_process WHERE account_id = ?',
            [userId]
        );

        res.json({ success: true, message: 'Verificacion removida y registros relacionados eliminados' });
    } catch (error) {
        console.error('revokeVerification error:', error);
        res.status(500).json({ error: true, message: 'Error revoking verification' });
    }
};
