const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { apiLimiter } = require('./middleware/rateLimiter');
const { seedDefaultAdmin } = require('./controllers/authController');
const Settings = require('./models/Settings');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const priceRoutes = require('./routes/priceRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const wholesaleRoutes = require('./routes/wholesaleRoutes');
const couponRoutes = require('./routes/couponRoutes');
const offerRoutes = require('./routes/offerRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const staffRoutes = require('./routes/staffRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Initialize Express App
const app = express();
app.set('trust proxy', 1); // Trust first reverse proxy (Render/Vercel) to read true client IP from X-Forwarded-For
const httpServer = http.createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  }
});

// Make io accessible in controllers
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  socket.on('join_admin_room', () => {
    socket.join('admin_room');
  });

  socket.on('join_order_room', (orderId) => {
    if (orderId) {
      socket.join(`order_${orderId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Connect to Isolated MongoDB Database
connectDB().then(async () => {
  // Run Seeders
  await seedDefaultAdmin();
  
  // Seed dynamic settings if empty
  try {
    const count = await Settings.countDocuments();
    if (count === 0) {
      await Settings.create({}); // Creates default document with defaults
      console.log('[SEED] Dynamic business settings initialized.');
    }
  } catch (err) {
    console.error('[SEED ERROR] Failed to seed default settings:', err.message);
  }
});

// Security & Utility Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false // Allows loading local uploads in frontend from localhost
}));
app.use(cors({
  origin: '*', // Allow all origins for testing/development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply General Rate Limiter
app.use('/api', apiLimiter);

// Serve Static Uploads
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
const uploadsDir = path.join(publicDir, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// API Route Registration
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wholesale', wholesaleRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin', adminRoutes);

// Root Endpoint for verification
app.get('/', (req, res) => {
  res.json({
    message: 'KHAMRAI BROILER CENTER API Service Online',
    version: '1.0.0',
    status: 'Healthy'
  });
});

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

// Start Server
const defaultPort = parseInt(process.env.PORT) || 5050;
// Use portfinder to get a free port, then start server
const portfinder = require('portfinder');
(async () => {
  try {
    const freePort = await portfinder.getPortPromise({ port: defaultPort });
    // Set env variables so frontend can read them via Vite
    process.env.PORT = freePort;
    process.env.BACKEND_PORT = freePort;
    const server = httpServer.listen(freePort, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${freePort}`);
    });
    server.on('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    });
  } catch (err) {
    console.error('Failed to acquire a free port:', err);
    process.exit(1);
  }
})();
