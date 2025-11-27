require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const morgan = require('morgan');

const { testConnection, createTables } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const categoryRoutes = require('./routes/categories');
const debugRoutes = require('./routes/debug');
const webhookRoutes = require('./routes/webhooks');
const checkoutRoutes = require('./routes/checkout');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// ---------------------------
//      🔥 CORS FIX 🔥
// ---------------------------
const allowedOrigins = [
  "http://localhost:3000",
  "http://192.168.56.1:3000",

  // Frontend en Vercel (producción + previews)
  "https://kuro-manga-store.vercel.app",
  "https://kuro-manga-store-git-kait-11864e-cristopher-bocanegras-projects.vercel.app",

  // Dominio del backend en Railway
  "https://kuromanga-store-production.up.railway.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // para Postman, backend interno
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.log("❌ CORS bloqueado:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
// ---------------------------


// Webhooks deben ir sin JSON antes
app.use('/api/webhooks', webhookRoutes);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/checkout', checkoutRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error("🔥 INTERNAL ERROR:", err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Start server
async function startServer() {
  try {
    console.log('🚀 Starting Manga Store Backend...');

    await testConnection();
    await createTables();

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log("📡 CORS totalmente habilitado para:");
      allowedOrigins.forEach(o => console.log("   → " + o));
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
