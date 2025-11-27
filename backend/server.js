require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const morgan = require('morgan');

const { testConnection, createTables } = require('./config/database');

// Routes
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

/* ------------------------------ SECURITY ------------------------------ */
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

/* -------------------------- TRUST PROXY FIX --------------------------- */
app.set("trust proxy", 1);

/* -------------------------- RATE LIMIT FIX --------------------------- */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

/* ------------------------------ CORS ---------------------------------- */
const allowedOrigins = [
  "http://localhost:3000",
  "http://192.168.56.1:3000",
  "https://kuro-manga-store.vercel.app",
  "https://kuro-manga-store-git-kait-11864e-cristopher-bocanegras-projects.vercel.app",
  "^https:\\/\\/kuro-manga-store.*\\.vercel\\.app$"
];

app.use(cors({
  origin: (origin, callback) => {

    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some((pattern) => {
      if (pattern.startsWith("^")) {
        // Es regex
        return new RegExp(pattern).test(origin);
      }
      // Comparación normal
      return pattern === origin;
    });

    if (isAllowed) {
      console.log("✔️ CORS permitido:", origin);
      return callback(null, true);
    }

    console.log("❌ CORS bloqueado:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));


/* ---------------------------- WEBHOOKS ------------------------------- */
app.use('/api/webhooks', webhookRoutes);

/* ----------------------------- PARSERS -------------------------------- */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ---------------------------- STATIC FILES ---------------------------- */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ----------------------------- HEALTH -------------------------------- */
app.get('/health', (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

/* ------------------------------ ROUTES -------------------------------- */
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/checkout', checkoutRoutes);

/* ---------------------------- ERROR HANDLER --------------------------- */
app.use((err, req, res, next) => {
  console.error("🔥 INTERNAL ERROR:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : ""
  });
});

/* ------------------------------ 404 ----------------------------------- */
app.use('*', (req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

/* ----------------------------- START SERVER ---------------------------- */
async function startServer() {
  try {
    console.log("🚀 Starting Manga Store Backend...");

    await testConnection();
    await createTables();

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);

      console.log("📡 CORS habilitado para:");
      allowedOrigins.forEach(o => console.log(" → " + o));
    });

  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
