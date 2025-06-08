const express = require('express');
const connectdb = require('./src/db/db');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const https = require('https');
const authRoutes = require('./src/routes/authRoutes');
const profileRoutes = require('./src/routes/profileRoutes');

const app = express();
require('dotenv').config();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://localhost:5173',
  credentials: true
}));

// Set secure cookies in production
app.use((req, res, next) => {
  res.cookie = (name, value, options) => {
    const secureOptions = {
      ...options,
      secure: process.env.NODE_ENV === 'production' || req.secure,
      httpOnly: true,
      sameSite: 'strict'
    };
    return res.cookie(name, value, secureOptions);
  };
  next();
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Syncly API is running');
});

const port = process.env.PORT || 3000;
const httpsPort = process.env.HTTPS_PORT || 3443;

// For development, we'll still keep HTTP server
app.listen(port, async () => {
  console.log(`HTTP server running on port ${port} (Development only)`);
  try {
    await connectdb(process.env.MONGO_URI);
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection error:", error);
  }
});

// Set up HTTPS server with SSL certificates
// In production, you should use real SSL certificates
try {
  // Check if SSL certificates exist
  if (
    fs.existsSync(process.env.SSL_KEY_PATH || './ssl/key.pem') && 
    fs.existsSync(process.env.SSL_CERT_PATH || './ssl/cert.pem')
  ) {
    // SSL certificate options
    const options = {
      key: fs.readFileSync(process.env.SSL_KEY_PATH || './ssl/key.pem'),
      cert: fs.readFileSync(process.env.SSL_CERT_PATH || './ssl/cert.pem')
    };

    // Create HTTPS server
    https.createServer(options, app).listen(httpsPort, () => {
      console.log(`HTTPS server running on port ${httpsPort}`);
    });
  } else {
    console.log('SSL certificates not found. HTTPS server not started.');
    console.log('Run "npm run ssl:gen" to generate development certificates');
    console.log('For production, obtain proper SSL certificates');
  }
} catch (error) {
  console.error('Failed to start HTTPS server:', error.message);
  console.log('⚠️ Running in HTTP mode only. For production, configure SSL certificates.');
}