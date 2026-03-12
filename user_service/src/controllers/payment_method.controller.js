const db = require('../db');

// Obtener métodos de pago por user_id
const getPaymentMethodsByUser = async (req, res) => {
    try {
        const userId = req.user.id; // Obtenido del token de sesión / middleware auth
        const [rows] = await db.query('SELECT * FROM payment_methods WHERE user_id = ?', [userId]);

        res.status(200).json(rows);
    } catch (error) {
        console.error("Error al obtener métodos de pago:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener métodos de pago publicos de un usuario (vendedor)
const getPaymentMethodsByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!userId) {
            return res.status(400).json({ error: 'ID de usuario requerido' });
        }
        
        // No enviamos todo, solo lo necesario para que el comprador pague. 
        // En este caso, la plataforma, titular y email_or_id
        const [rows] = await db.query('SELECT id, platform, account_holder, email_or_id FROM payment_methods WHERE user_id = ?', [userId]);

        res.status(200).json(rows);
    } catch (error) {
        console.error("Error al obtener métodos de pago públicos:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Crear método de pago
const createPaymentMethod = async (req, res) => {
    try {
        const userId = req.user.id;
        const { platform, account_holder, email_or_id } = req.body;

        if (!platform || !account_holder || !email_or_id) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        const validPlatforms = ['Zelle', 'Zinli', 'Binance', 'Otros'];
        if (!validPlatforms.includes(platform)) {
            return res.status(400).json({ error: 'Plataforma no válida' });
        }

        const query = 'INSERT INTO payment_methods (user_id, platform, account_holder, email_or_id) VALUES (?, ?, ?, ?)';
        const [result] = await db.query(query, [userId, platform, account_holder, email_or_id]);

        res.status(201).json({ id: result.insertId, message: 'Método de pago agregado exitosamente' });

    } catch (error) {
        console.error("Error al crear método de pago:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Actualizar método de pago
const updatePaymentMethod = async (req, res) => {
    try {
        const userId = req.user.id;
        const methodId = req.params.id;
        const { platform, account_holder, email_or_id } = req.body;

        // Verificar que el método pertenece al usuario
        const [existing] = await db.query('SELECT id FROM payment_methods WHERE id = ? AND user_id = ?', [methodId, userId]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Método de pago no encontrado o sin acceso' });
        }

        const query = 'UPDATE payment_methods SET platform = COALESCE(?, platform), account_holder = COALESCE(?, account_holder), email_or_id = COALESCE(?, email_or_id) WHERE id = ? AND user_id = ?';
        await db.query(query, [platform, account_holder, email_or_id, methodId, userId]);

        res.status(200).json({ message: 'Método de pago actualizado' });

    } catch (error) {
        console.error("Error al actualizar método de pago:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Eliminar método de pago
const deletePaymentMethod = async (req, res) => {
    try {
        const userId = req.user.id;
        const methodId = req.params.id;

        const [result] = await db.query('DELETE FROM payment_methods WHERE id = ? AND user_id = ?', [methodId, userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Método de pago no encontrado o sin acceso' });
        }

        res.status(200).json({ message: 'Método de pago eliminado' });

    } catch (error) {
        console.error("Error al eliminar método de pago:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

module.exports = {
    getPaymentMethodsByUser,
    getPaymentMethodsByUserId,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod
};
