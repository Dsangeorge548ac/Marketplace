// src/controllers/publication.controller.js
const db = require('../db');

exports.getAllPublications = async (req, res) => {
    console.log("GET /getAllPublications called. Query:", req.query);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const offset = (page - 1) * limit;

    const { search, categories, sub_categories, locations, minPrice, maxPrice } = req.query;

    // Build shared WHERE based on unified fields (works for products AND minerals)
    // For minerals: category is stored in mineral_details.category, sub_category in mineral_details.sub_category

    try {
        let whereClauses = ['p.is_deleted = 0'];
        let params = [];

        if (search) {
            whereClauses.push('(p.name LIKE ? OR COALESCE(pd.description, min_d.description) LIKE ? OR pd.model LIKE ? OR min_d.mineral_name LIKE ?)');
            const term = `%${search}%`;
            params.push(term, term, term, term);
        }

        if (categories) {
            const catList = categories.split(',');
            if (!catList.includes('todas')) {
                whereClauses.push('COALESCE(pd.category, min_d.category) IN (?)');
                params.push(catList);
            }
        }

        if (sub_categories) {
            const subCatList = sub_categories.split(',');
            whereClauses.push('COALESCE(pd.sub_category, min_d.sub_category) IN (?)');
            params.push(subCatList);
        }

        if (locations) {
            const locList = locations.split(',');
            whereClauses.push('l.state IN (?)');
            params.push(locList);
        }

        if (minPrice) {
            whereClauses.push('p.price >= ?');
            params.push(minPrice);
        }
        if (maxPrice) {
            whereClauses.push('p.price <= ?');
            params.push(maxPrice);
        }

        const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

        // Count Query
        let countQuery = `
            SELECT COUNT(DISTINCT p.id) as total 
            FROM products p
            LEFT JOIN product_details pd ON p.id = pd.id_product
            LEFT JOIN mineral_details min_d ON p.id = min_d.id_product
            LEFT JOIN locations l ON p.id = l.id_product
        ` + whereSQL;

        const [countResult] = await db.query(countQuery, params);
        const totalCount = countResult[0].total;

        // Main Query — includes both products and minerals
        const query = `
            SELECT p.*,
                   COALESCE(pd.description, min_d.description) AS description,
                   COALESCE(pd.image, min_d.image)             AS image,
                   COALESCE(pd.document, min_d.document)       AS document,
                   COALESCE(pd.category, min_d.category)       AS category,
                   COALESCE(pd.sub_category, min_d.sub_category) AS sub_category,
                   pd.model, pd.type_product,
                   min_d.mineral_name, min_d.purity, min_d.unit,
                   IF(min_d.id IS NOT NULL, 'mineral', 'product') AS publication_type,
                   l.country, l.state, l.city,
                   m.manufacturer, m.contact,
                   (
                       SELECT JSON_ARRAYAGG(
                           JSON_OBJECT('id', med.id, 'image', med.image, 'item', med.item)
                       ) 
                       FROM media med WHERE med.id_product = p.id
                   ) as media_gallery
            FROM products p
            LEFT JOIN product_details pd ON p.id = pd.id_product
            LEFT JOIN mineral_details min_d ON p.id = min_d.id_product
            LEFT JOIN locations l ON p.id = l.id_product
            LEFT JOIN manufacturers m ON p.id = m.id_product
        ` + (whereSQL ? '\n            ' + whereSQL : '') + `
            ORDER BY p.id DESC
            LIMIT ? OFFSET ?
        `;

        const mainParams = params.concat([limit, offset]);
        const [rows] = await db.query(query, mainParams);

        res.json({ data: rows, totalCount });
    } catch (error) {
        console.error("Error in getAllPublications:", error);
        res.status(500).json({ error: true, message: 'Error fetching publications' });
    }
};

exports.getPublicationsByUser = async (req, res) => {
    console.log("GET /getPublicationsByUser called. Params:", req.params, "Query:", req.query);
    const userId = req.params.user_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const offset = (page - 1) * limit;

    try {
        const [countResult] = await db.query('SELECT COUNT(DISTINCT p.id) as total FROM products p WHERE p.id_user = ? AND p.is_deleted = 0', [userId]);
        const totalCount = countResult[0].total;

        const query = `
            SELECT p.*,
                   COALESCE(pd.description, min_d.description) AS description,
                   COALESCE(pd.image, min_d.image)             AS image,
                   COALESCE(pd.document, min_d.document)       AS document,
                   COALESCE(pd.category, min_d.category)       AS category,
                   COALESCE(pd.sub_category, min_d.sub_category) AS sub_category,
                   pd.model, pd.type_product,
                   min_d.mineral_name, min_d.purity, min_d.unit,
                   IF(min_d.id IS NOT NULL, 'mineral', 'product') AS publication_type,
                   l.country, l.state, l.city,
                   m.manufacturer, m.contact,
                   (
                       SELECT JSON_ARRAYAGG(
                           JSON_OBJECT('id', med.id, 'image', med.image, 'item', med.item)
                       ) 
                       FROM media med WHERE med.id_product = p.id
                   ) as media_gallery
            FROM products p
            LEFT JOIN product_details pd ON p.id = pd.id_product
            LEFT JOIN mineral_details min_d ON p.id = min_d.id_product
            LEFT JOIN locations l ON p.id = l.id_product
            LEFT JOIN manufacturers m ON p.id = m.id_product
            WHERE p.id_user = ? AND p.is_deleted = 0
            ORDER BY p.id DESC
            LIMIT ? OFFSET ?
        `;
        const [rows] = await db.query(query, [userId, limit, offset]);
        res.json({ data: rows, totalCount });
    } catch (error) {
        console.error("Error in getPublicationsByUser:", error);
        res.status(500).json({ error: true, message: 'Error fetching user publications' });
    }
};

exports.getPublicationById = async (req, res) => {
    console.log("getPublicationById called. Params:", req.params, "Body:", req.body);
    const id = req.params.id || req.body.id;
    try {
        const query = `
            SELECT p.id, p.id_user as seller_id, p.name, p.price, p.quantity,
                   COALESCE(pd.description, min_d.description) AS description,
                   COALESCE(pd.image, min_d.image)             AS image,
                   COALESCE(pd.document, min_d.document)       AS document,
                   COALESCE(pd.category, min_d.category)       AS category,
                   COALESCE(pd.sub_category, min_d.sub_category) AS sub_category,
                   pd.model, pd.type_product,
                   min_d.mineral_name, min_d.purity, min_d.unit,
                   IF(min_d.id IS NOT NULL, 'mineral', 'product') AS publication_type,
                   l.country, l.state, l.city,
                   m.manufacturer, m.contact,
                   (
                       SELECT JSON_ARRAYAGG(
                           JSON_OBJECT('id', med.id, 'image', med.image, 'item', med.item)
                       ) 
                       FROM media med WHERE med.id_product = p.id
                   ) as media_gallery
            FROM products p
            LEFT JOIN product_details pd ON p.id = pd.id_product
            LEFT JOIN mineral_details min_d ON p.id = min_d.id_product
            LEFT JOIN locations l ON p.id = l.id_product
            LEFT JOIN manufacturers m ON p.id = m.id_product
            WHERE p.id = ?
            LIMIT 1
        `;
        const [rows] = await db.query(query, [id]);
        if (rows.length === 0) return res.status(404).json({ error: true, message: 'Not found' });

        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, message: 'Error fetching publication' });
    }
};

exports.createPublication = async (req, res) => {
    const connection = await db.getConnection();
    try {
        console.log("Starting createPublication transaction...");
        await connection.beginTransaction();
        console.log("Transaction started. Body:", req.body);
        console.log("Files:", req.files);

        const {
            name,
            category,
            sub_category,
            type_product,
            model,
            price,
            price_on_request,
            quantity,
            manufacturer,
            contact,
            country,
            state,
            city,
            description
        } = req.body;

        const normalizedPrice = price_on_request === 'true' || price_on_request === true || price === '' ? null : price;

        const imageFiles = (req.files && req.files['images']) ? req.files['images'] : [];
        const documentFile = (req.files && req.files['document']) ? req.files['document'][0] : null;

        const imageUrls = imageFiles.map(file => `/publications_service/uploads/${file.filename}`);
        const mainImage = imageUrls.length > 0 ? imageUrls[0] : '';
        const documentUrl = documentFile ? `/publications_service/uploads/${documentFile.filename}` : null;

        // 1. Insert Product
        const id_user = req.user ? req.user.id : (req.body.id_user || 0);
        const [pRes] = await connection.query('INSERT INTO products (id_user, name, price, quantity) VALUES (?, ?, ?, ?)',
            [id_user, name, normalizedPrice, quantity]);
        const id_product = pRes.insertId;

        // 2. Insert Manufacturer
        await connection.query('INSERT INTO manufacturers (id_product, manufacturer, contact) VALUES (?, ?, ?)',
            [id_product, manufacturer, contact]);

        // 3. Insert Location
        await connection.query('INSERT INTO locations (id_product, country, state, city) VALUES (?, ?, ?, ?)',
            [id_product, country, state, city]);

        // 4. Insert Details (including optional document)
        await connection.query('INSERT INTO product_details (id_product, category, sub_category, type_product, model, description, image, document) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id_product, category, sub_category, type_product, model, description, mainImage, documentUrl]);

        // 5. Insert Media Gallery
        if (imageUrls.length > 0) {
            for (let i = 0; i < imageUrls.length; i++) {
                await connection.query('INSERT INTO media (id_product, item, image) VALUES (?, ?, ?)',
                    [id_product, `image_${i + 1}`, imageUrls[i]]);
            }
        }

        await connection.commit();
        res.json({ success: true, message: 'Publication created', id: id_product });

    } catch (error) {
        await connection.rollback();
        console.error("Error creating publication:", error);
        res.status(500).json({ error: true, message: 'Error creating publication' });
    } finally {
        connection.release();
    }
};

exports.updatePublication = async (req, res) => {
    const id = req.params.id;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const {
            name,
            category,
            sub_category,
            type_product,
            model,
            price,
            price_on_request,
            quantity,
            country,
            state,
            city,
            manufacturer,
            contact,
            description
        } = req.body;

        const normalizedPrice = price_on_request === 'true' || price_on_request === true || price === '' ? null : price;

        // This will be a JSON string of URLs representing images the user kept
        const keptImagesRaw = req.body.keptImages;
        let keptImages = [];
        try {
            if (keptImagesRaw) {
                keptImages = JSON.parse(keptImagesRaw);
            }
        } catch (e) {
            console.error("Error parsing keptImages:", e);
        }

        const newImagesFiles = (req.files && req.files['images']) ? req.files['images'] : [];
        const newDocumentFile = (req.files && req.files['document']) ? req.files['document'][0] : null;

        const newImagesUrls = newImagesFiles.map(file => `/publications_service/uploads/${file.filename}`);
        const newDocumentUrl = newDocumentFile ? `/publications_service/uploads/${newDocumentFile.filename}` : null;

        await connection.query('UPDATE manufacturers SET manufacturer = ?, contact = ? WHERE id_product = ?',
            [manufacturer, contact, id]);

        await connection.query('UPDATE locations SET country = ?, state = ?, city = ? WHERE id_product = ?',
            [country, state, city, id]);

        await connection.query('UPDATE products SET name = ?, price = ?, quantity = ? WHERE id = ?',
            [name, normalizedPrice, quantity, id]);

        let detailQuery = 'UPDATE product_details SET category = ?, sub_category = ?, type_product = ?, model = ?, description = ?';
        const detailParams = [category, sub_category, type_product, model, description];

        // Final image list combining kept + newly uploaded
        const finalImageList = [...keptImages, ...newImagesUrls];
        const newMainImage = finalImageList.length > 0 ? finalImageList[0] : null;

        if (newMainImage) {
            detailQuery += ', image = ?';
            detailParams.push(newMainImage);
        } else if (finalImageList.length === 0) {
            detailQuery += ', image = ?';
            detailParams.push('');
        }

        // Update document only if a new one was uploaded
        if (newDocumentUrl) {
            detailQuery += ', document = ?';
            detailParams.push(newDocumentUrl);
        }

        detailQuery += ' WHERE id_product = ?';
        detailParams.push(id);

        await connection.query(detailQuery, detailParams);

        // Update media table: Delete old media not in keptImages, and add new ones
        if (keptImages.length > 0) {
            // Delete media not in the kept list
            const placeholders = keptImages.map(() => '?').join(',');
            await connection.query(`DELETE FROM media WHERE id_product = ? AND image NOT IN (${placeholders})`, [id, ...keptImages]);
        } else {
            // Delete all old media if none were kept
            await connection.query('DELETE FROM media WHERE id_product = ?', [id]);
        }

        // Insert new images
        if (newImagesUrls.length > 0) {
            for (let i = 0; i < newImagesUrls.length; i++) {
                await connection.query('INSERT INTO media (id_product, item, image) VALUES (?, ?, ?)',
                    [id, `new_image_${Date.now()}_${i}`, newImagesUrls[i]]);
            }
        }

        await connection.commit();
        res.json({ success: true, message: 'Publication updated' });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: true, message: 'Error updating publication' });
    } finally {
        connection.release();
    }
};

exports.deletePublication = async (req, res) => {
    const id = req.params.id;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query('UPDATE products SET is_deleted = 1 WHERE id = ?', [id]);

        await connection.commit();
        res.json({ success: true, message: 'Publication deleted' });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: true, message: 'Error deleting publication' });
    } finally {
        connection.release();
    }
};

// ────────────────────────────────────────────────────
// MINERAL PUBLICATIONS
// ────────────────────────────────────────────────────

exports.createMineralPublication = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        console.log("createMineralPublication - Body:", req.body);
        console.log("createMineralPublication - Files:", req.files);

        const {
            name,           // display name, e.g. "Oro 22K"
            mineral_name,   // e.g. "Oro"
            sub_category,   // e.g. "Mineral Precioso"
            purity,         // e.g. "22K" (optional)
            unit,           // e.g. "kilogramo"
            price,
            price_on_request,
            quantity,
            contact,
            country,
            state,
            city,
            manufacturer,
            description
        } = req.body;

        const normalizedPrice = price_on_request === 'true' || price_on_request === true || price === '' ? null : price;

        const imageFiles = (req.files && req.files['images']) ? req.files['images'] : [];
        const documentFile = (req.files && req.files['document']) ? req.files['document'][0] : null;

        const imageUrls = imageFiles.map(file => `/publications_service/uploads/${file.filename}`);
        const mainImage = imageUrls.length > 0 ? imageUrls[0] : '';
        const documentUrl = documentFile ? `/publications_service/uploads/${documentFile.filename}` : null;

        const id_user = req.user ? req.user.id : (req.body.id_user || 0);

        // 1. Insert into products
        const [pRes] = await connection.query(
            'INSERT INTO products (id_user, name, price, quantity) VALUES (?, ?, ?, ?)',
            [id_user, name || mineral_name, normalizedPrice, quantity]
        );
        const id_product = pRes.insertId;

        // 2. Insert manufacturer / contact
        await connection.query(
            'INSERT INTO manufacturers (id_product, manufacturer, contact) VALUES (?, ?, ?)',
            [id_product, manufacturer || 'N/A', contact]
        );

        // 3. Insert location
        await connection.query(
            'INSERT INTO locations (id_product, country, state, city) VALUES (?, ?, ?, ?)',
            [id_product, country, state, city]
        );

        // 4. Insert mineral_details
        await connection.query(
            'INSERT INTO mineral_details (id_product, mineral_name, category, sub_category, purity, unit, description, image, document) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id_product, mineral_name, 'Minerales', sub_category, purity || null, unit, description, mainImage, documentUrl]
        );

        // 5. Insert all images into media table
        if (imageUrls.length > 0) {
            for (let i = 0; i < imageUrls.length; i++) {
                await connection.query(
                    'INSERT INTO media (id_product, item, image) VALUES (?, ?, ?)',
                    [id_product, `image_${i + 1}`, imageUrls[i]]
                );
            }
        }

        await connection.commit();
        res.json({ success: true, message: 'Mineral publication created', id: id_product });

    } catch (error) {
        await connection.rollback();
        console.error("Error creating mineral publication:", error);
        res.status(500).json({ error: true, message: 'Error creating mineral publication' });
    } finally {
        connection.release();
    }
};

exports.updateMineralPublication = async (req, res) => {
    const id = req.params.id;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const {
            name,
            mineral_name,
            sub_category,
            purity,
            unit,
            price,
            price_on_request,
            quantity,
            contact,
            country,
            state,
            city,
            description
        } = req.body;

        const normalizedPrice = price_on_request === 'true' || price_on_request === true || price === '' ? null : price;

        const keptImagesRaw = req.body.keptImages;
        let keptImages = [];
        try {
            if (keptImagesRaw) keptImages = JSON.parse(keptImagesRaw);
        } catch (e) { console.error("Error parsing keptImages:", e); }

        const newImagesFiles = (req.files && req.files['images']) ? req.files['images'] : [];
        const newDocumentFile = (req.files && req.files['document']) ? req.files['document'][0] : null;
        const newImagesUrls = newImagesFiles.map(f => `/publications_service/uploads/${f.filename}`);
        const newDocumentUrl = newDocumentFile ? `/publications_service/uploads/${newDocumentFile.filename}` : null;

        await connection.query(
            'UPDATE products SET name = ?, price = ?, quantity = ? WHERE id = ?',
            [name || mineral_name, normalizedPrice, quantity, id]
        );

        await connection.query(
            'UPDATE manufacturers SET contact = ? WHERE id_product = ?',
            [contact, id]
        );

        await connection.query(
            'UPDATE locations SET country = ?, state = ?, city = ? WHERE id_product = ?',
            [country, state, city, id]
        );

        const finalImageList = [...keptImages, ...newImagesUrls];
        const newMainImage = finalImageList.length > 0 ? finalImageList[0] : null;

        let mineralQuery = 'UPDATE mineral_details SET mineral_name = ?, sub_category = ?, purity = ?, unit = ?, description = ?';
        const mineralParams = [mineral_name, sub_category, purity || null, unit, description];

        if (newMainImage !== null) {
            mineralQuery += ', image = ?';
            mineralParams.push(newMainImage);
        }
        if (newDocumentUrl) {
            mineralQuery += ', document = ?';
            mineralParams.push(newDocumentUrl);
        }

        mineralQuery += ' WHERE id_product = ?';
        mineralParams.push(id);
        await connection.query(mineralQuery, mineralParams);

        // Update media
        if (keptImages.length > 0) {
            const placeholders = keptImages.map(() => '?').join(',');
            await connection.query(`DELETE FROM media WHERE id_product = ? AND image NOT IN (${placeholders})`, [id, ...keptImages]);
        } else {
            await connection.query('DELETE FROM media WHERE id_product = ?', [id]);
        }

        if (newImagesUrls.length > 0) {
            for (let i = 0; i < newImagesUrls.length; i++) {
                await connection.query(
                    'INSERT INTO media (id_product, item, image) VALUES (?, ?, ?)',
                    [id, `new_image_${Date.now()}_${i}`, newImagesUrls[i]]
                );
            }
        }

        await connection.commit();
        res.json({ success: true, message: 'Mineral publication updated' });

    } catch (error) {
        await connection.rollback();
        console.error("Error updating mineral publication:", error);
        res.status(500).json({ error: true, message: 'Error updating mineral publication' });
    } finally {
        connection.release();
    }
};
