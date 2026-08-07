const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0
});

pool.getConnection()
    .then(conn => {
        console.log('[Backup Service] Connected to MySQL Database');
        conn.release();
    })
    .catch(err => {
        console.error('[Backup Service] Error connecting to MySQL:', err);
    });

module.exports = pool;
