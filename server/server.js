require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const passport = require('passport');

const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const { initSocket } = require('./config/socket');
const { startNotificationWorker } = require('./queues/notification.worker');
const errorHandler = require('./middleware/error.middleware');

const app = express();
const httpServer = http.createServer(app);
const isProd = process.env.NODE_ENV === 'production';

connectDB();
connectRedis();
initSocket(httpServer);
startNotificationWorker();

app.use(helmet({
  contentSecurityPolicy: isProd
    ? {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", process.env.CLIENT_URL || ''],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      }
    : false,
  crossOriginEmbedderPolicy: false,
}));

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean);

const isAllowedVercelPreview = (origin) => {
  try {
    const { hostname, protocol } = new URL(origin);
    return protocol === 'https:' && hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
};

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin) || isAllowedVercelPreview(origin)) {
      return cb(null, true);
    }
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts.' },
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(morgan(isProd ? 'combined' : 'dev'));
app.set('trust proxy', 1);

// Prevents browsers from returning stale API responses.
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Avenor API 🚀', env: process.env.NODE_ENV, ts: new Date().toISOString() });
});

// Render and other probes may hit root with HEAD/GET.
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Avenor API root', health: '/api/health' });
});

app.head('/', (req, res) => {
  res.sendStatus(200);
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/companies', require('./routes/company.routes'));
app.use('/api/applications', require('./routes/application.routes'));
app.use('/api/experiences', require('./routes/experience.routes'));
const { salaryRouter, offerRouter } = require('./routes/salary.routes');
app.use('/api/salary', salaryRouter);
app.use('/api/offers', offerRouter);
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/referrals', require('./routes/referral.routes'));
app.use('/api/mentorship', require('./routes/mentorship.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/ai', require('./routes/ai.routes'));
app.use('/api/coordinator', require('./routes/coordinator.routes'));
app.use('/api/search', require('./routes/search.routes'));

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL) {
  app.use('/api/auth', require('./routes/oauth.routes'));
}

app.use((req, res) => res.status(404).json({ success: false, message: `${req.originalUrl} not found` }));
app.use(errorHandler);

const PORT = process.env.PORT || 8000;
httpServer.listen(PORT, () => {
  console.log(`\n  ╔══════════════════════════════════╗`);
  console.log(`  ║  🎯 Avenor API                   ║`);
  console.log(`  ║  Port : ${PORT}                     ║`);
  console.log(`  ║  Env  : ${(process.env.NODE_ENV || 'development').padEnd(24)}║`);
  console.log(`  ╚══════════════════════════════════╝\n`);
});

process.on('SIGTERM', () => {
  httpServer.close(() => process.exit(0));
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled:', reason);
  if (isProd) process.exit(1);
});

module.exports = app;