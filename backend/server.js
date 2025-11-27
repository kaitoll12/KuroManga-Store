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

/* ---------------------------------------------------
   🔐 SECURITY (Helmet + Morgan)
---------------------------------------------------- */
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

/* ---------------------------------------------------
   🌐 TRUST PROXY (OBLIGATORIO para Railway/Vercel)
---------------------------------------------------- */
app.set("trust proxy", 1);

/* ---------------------------------------------------
   🚦 RATE LIMIT (arreglado)
   Ya NO se bloqueará por "Too many requests"
---------------------------------------------------- */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,                // antes 100 → ahora más alto
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

/* ---------------------------------------------------
   🌍 CORS CONFIG
---------------------------------------------------- */
const allowedOrigins = [
  "http://localhost:3000",
  "http://192.168.56.1:3000",
  "https://kuro-manga-store.vercel.app",
  "https://kuro-manga-store-git-kait-11864e-cristopher-bocanegras-projects.vercel.app",
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      console.log(`✔️ CORS permitido: ${origin}`);
      return callback(null, true);
    }
    console.log(`❌ CORS bloqueado: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

/* ---------------------------------------------------
   💳 WEBHOOKS → deben ir ANTES del JSON parser
---------------------------------------------------- */
app.use('/api/webhooks', webhookRoutes);

/* ---------------------------------------------------
   📦 BODY PARSER
---------------------------------------------------- */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ---------------------------------------------------
   📁 STATIC FILES
---------------------------------------------------- */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ---------------------------------------------------
   ❤️ HEALTH CHECK
---------------------------------------------------- */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/* ---------------------------------------------------
   📚 API ROUTES
---------------------------------------------------- */
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/checkout', checkoutRoutes);

/* ---------------------------------------------------
   ❌ ERROR HANDLER
---------------------------------------------------- */
app.use((err, req, res, next) => {
  console.error("🔥 INTERNAL ERROR:", err);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

/* ---------------------------------------------------
   ❓ 404 HANDLER
---------------------------------------------------- */
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

/* ---------------------------------------------------
   🚀 START SERVER
---------------------------------------------------- */
async function startServer() {
  try {
    console.log('🚀 Starting Manga Store Backend...');

    await testConnection();
    await createTables();

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);

      console.log("📡 CORS habilitado para:");
      allowedOrigins.forEach(o => console.log("   → " + o));
    });

  } catch (e
