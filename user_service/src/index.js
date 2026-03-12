// src/index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser'); // Added
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const paymentMethodRoutes = require('./routes/payment_method.routes');

dotenv.config();

const app = express();
const port = 3000; // Changed from PORT = process.env.PORT || 3000;

app.use(cors({
    origin: 'http://localhost:8888', // Update to match your Gateway/Frontend URL EXACTLY for credentials
    credentials: true
}));

// Request Logger
app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
});

app.use(express.json());
app.use(cookieParser()); // Added
app.use(express.urlencoded({ extended: true })); // Added

// Routes
app.use('/auth', authRoutes);
app.use('/payment-methods', paymentMethodRoutes); // Register payment methods endpoints
app.use('/', userRoutes);

// Debug 404
app.use((req, res, next) => {
    console.log(`[404 DEBUG] Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Not Found', path: req.url });
});

// Compatibility Routes (alias OLD paths to NEW handlers if strictly needed, but I plan to update frontend)
// Example: app.post('/src/delete-user.php', userRoutes) -> But this expects params in body vs url
// I'll stick to updating frontend.

app.listen(port, () => {
    console.log(`User service listening at http://localhost:${port}`);
});
