const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');
const pubRoutes = require('./routes/publication.routes');
const noticesRoutes = require('./routes/notices.routes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json({ limit: '20mb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve Uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/notices', noticesRoutes);
app.use('/', pubRoutes);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Publications Service running on port ${PORT}`);
});
