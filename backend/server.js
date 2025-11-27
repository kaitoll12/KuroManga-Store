require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const morgan = require('morgan');

const { testConnection, createTables } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// --- FIX Railway proxy ---
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
});
app.use('/api/', limiter);

// ---------------------------
//          CORS FIX
// ---------------------------
const allowedExact = [
  "http://localhost:3000",
  "http://192.168.56.1:3000",
  "https://kuro-manga-store.vercel.app",
  "https://kuromanga-store-production.up.railway.app"
];

function isVercelPreview(origin) {
  if (!origin) return false;
  return origin.includes("kuro-manga-store") && origin.includes(".vercel.app");
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedExact.includes(origin)) {
      return callback(null, true);
    }

    if (isVercelPreview(origin)) {
      console.log("🟡 CORS permitido (Vercel preview):", origin);
      return callback(null, true);
    }

    console.log("❌ CORS bloqueado:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
// ---------------------------

// Webhooks antes del json
const webhookRoutes = require('./routes/webhooks');
app.use('/api/webhooks', webhookRoutes);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/debug', require('./routes/debug'));
app.use('/api/checkout', require('./routes/checkout'));

// Error handler
app.use((err, req, res, next) => {
  console.error("🔥 INTERNAL ERROR:", err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

async function startServer() {
  try {
    console.log('🚀 Starting Manga Store Backend...');

    await testConnection();
    await createTables();

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log("📡 CORS activo:");
      allowedExact.forEach(o => console.log(" → " + o));
      console.log(" → Todos los previews de Vercel (*.vercel.app)");
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
