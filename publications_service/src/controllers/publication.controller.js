// src/controllers/publication.controller.js
const db = require('../db');

exports.getAllPublications = async (req, res) => {
    console.log("GET /getAllPublications called. Query:", req.query);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;

    const { search, categories, sub_categories, locations, minPrice, maxPrice } = req.query;

    try {
        let whereClauses = [];
        let params = [];

        if (search) {
            whereClauses.push('(p.name LIKE ? OR pd.description LIKE ? OR pd.model LIKE ?)');
            const term = `%${search}%`;
            params.push(term, term, term);
        }

        if (categories) {
            const catList = categories.split(',');
            if (!catList.includes('todas')) {
                whereClauses.push('pd.category IN (?)');
                params.push(catList);
            }
        }

        if (sub_categories) {
            const subCatList = sub_categories.split(',');
            whereClauses.push('pd.sub_category IN (?)');
            params.push(subCatList);
        }

        if (locations) {
            const locList = locations.split(',');
            whereClauses.push('l.state IN (?)'); // Assuming strict match filter for now
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
            LEFT JOIN locations l ON p.id = l.id_product
            ${whereSQL}
        `;

        const [countResult] = await db.query(countQuery, params);
        const totalCount = countResult[0].total;

        // Main Query
        const query = `
            SELECT p.*, pd.description, pd.image, pd.document, pd.category, pd.sub_category, pd.model, pd.type_product,
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
            LEFT JOIN locations l ON p.id = l.id_product
            LEFT JOIN manufacturers m ON p.id = m.id_product
            ${whereSQL}
            ORDER BY p.id DESC
            LIMIT ? OFFSET ?
        `;

        const mainParams = [...params, limit, offset];
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
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
        const [countResult] = await db.query('SELECT COUNT(DISTINCT p.id) as total FROM products p WHERE p.id_user = ?', [userId]);
        const totalCount = countResult[0].total;

        const query = `
            SELECT p.*, pd.description, pd.image, pd.document, pd.category, pd.sub_category, pd.model, pd.type_product,
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
            LEFT JOIN locations l ON p.id = l.id_product
            LEFT JOIN manufacturers m ON p.id = m.id_product
            WHERE p.id_user = ?
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
            SELECT p.id, p.id_user as seller_id, p.name, p.price,
                   pd.description, pd.image, pd.document, pd.category, pd.sub_category, pd.model, pd.type_product,
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
            quantity,
            manufacturer,
            contact,
            country,
            state,
            city,
            description
        } = req.body;

        const imageFiles = (req.files && req.files['images']) ? req.files['images'] : [];
        const documentFile = (req.files && req.files['document']) ? req.files['document'][0] : null;

        const imageUrls = imageFiles.map(file => `/publications_service/uploads/${file.filename}`);
        const mainImage = imageUrls.length > 0 ? imageUrls[0] : '';
        const documentUrl = documentFile ? `/publications_service/uploads/${documentFile.filename}` : null;

        // 1. Insert Product
        const id_user = req.user ? req.user.id : (req.body.id_user || 0);
        const [pRes] = await connection.query('INSERT INTO products (id_user, name, price, quantity) VALUES (?, ?, ?, ?)',
            [id_user, name, price, quantity]);
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
            quantity,
            country,
            state,
            city,
            manufacturer,
            contact,
            description
        } = req.body;

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
            [name, price, quantity, id]);

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

        await connection.query('DELETE FROM product_details WHERE id_product = ?', [id]);
        await connection.query('DELETE FROM products WHERE id = ?', [id]);

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
