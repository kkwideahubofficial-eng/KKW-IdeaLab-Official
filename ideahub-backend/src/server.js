import dns from 'node:dns';

// Ensure SRV records and external services can resolve without timing out on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore fallback error
}

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { connectToDatabase } from './config/db.js';
import { startEnterpriseEmailWorker } from './utils/enterpriseEmailWorker.js';

import healthRouter from './routes/health.route.js';
import authRouter from './routes/auth.routes.js';
import bookingRouter from './routes/booking.routes.js';
import orderRouter from './routes/order.routes.js';
import roomRouter from './routes/room.routes.js';
import timeSlotRouter from './routes/timeSlot.routes.js';
import eventRouter from './routes/event.routes.js';
import achievementRouter from './routes/achievement.routes.js';
import machineryRoutes from './routes/machinery.routes.js';
import materialRouter from './routes/material.routes.js';
import machineRouter from './routes/machine.routes.js';
import productRouter from './routes/product.routes.js';
import heroRouter from './routes/heroRoutes.js';
import cartRouter from './routes/cart.routes.js';
import deliveryRouter from './routes/delivery.routes.js';
import roomPermissionRouter from './routes/roomPermission.routes.js';
import scheduler from './scheduler.js';
import { seedSpecialRooms } from './utils/seedSpecialRooms.js';


import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';

dotenv.config();

const app = express();

// Trust reverse proxy (e.g. Render, Heroku, Cloudflare) so Express can correctly determine client IP
// and express-rate-limit functions properly without throwing ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
app.set('trust proxy', 1);

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Rate Limiter configuration
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { message: 'Too many authentication attempts, please try again later.' },
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

// NoSQL Injection Protection (Express 5 compatible)
const sanitizeValue = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key in Object.keys(obj)) {
    const k = Object.keys(obj)[key];
    if (k.startsWith('$') || k.includes('.')) {
      delete obj[k];
    } else if (typeof obj[k] === 'object') {
      sanitizeValue(obj[k]);
    }
  }
  return obj;
};

app.use((req, _res, next) => {
  if (req.body) sanitizeValue(req.body);
  if (req.params) sanitizeValue(req.params);
  next();
});

// CORS configuration - allow dynamic localhost ports and env allowlist
const allowlist = (process.env.FRONTEND_ORIGIN || '').split(',').map((v) => v.trim()).filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isLocalhost = /^http:\/\/localhost:\d+$/.test(origin);
      if (isLocalhost || allowlist.includes(origin) || allowlist.length === 0) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Basic middlewares
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Minimal request logger to verify requests hit the backend
app.use((req, _res, next) => {
  // eslint-disable-next-line no-console
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
console.log('Mounting routes...');
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/bookings', bookingRouter);
if (roomRouter) console.log('Room router loaded');
else console.log('Room router NOT loaded');
app.use('/api/rooms', roomRouter);
app.use('/api/time-slots', timeSlotRouter);
app.use('/api/events', eventRouter);
app.use('/api/achievements', achievementRouter);
app.use('/api/machinery', machineryRoutes);
app.use('/api/materials', materialRouter);
app.use('/api/machines', machineRouter);
app.use('/api/products', productRouter);
app.use('/api/hero', heroRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRouter);
app.use('/api/delivery', deliveryRouter);
app.use('/api/room-permissions', roomPermissionRouter);
import notificationRouter from './routes/notification.routes.js';
import statsRouter from './routes/stats.routes.js';
import studentClubRouter from './routes/studentClub.routes.js';
import teamMemberRouter from './routes/teamMember.routes.js';
app.use('/api/notifications', notificationRouter);
app.use('/api/stats', statsRouter);
app.use('/api/student-clubs', studentClubRouter);
app.use('/api/team-members', teamMemberRouter);
// Static uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check endpoint for Render monitoring
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'ideahub-backend', timestamp: new Date().toISOString() });
});

// Root route for sanity check
// Serve static files from the React frontend app
app.use(express.static(path.join(process.cwd(), 'public')));

// SPA Fallback: ANYTHING that isn't matched by an API route or static asset should return the React app
app.get(/.*/, (_req, res) => {
  if (fs.existsSync(path.join(process.cwd(), 'public', 'index.html'))) {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
  } else {
    res.status(200).json({ message: 'AICTE IdeaLab Backend Service Running' });
  }
});

// Global Error Handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error('Global Error Handler:', err);
  res.status(500).json({
    message: 'Internal Server Error',
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/ideahub';

// Socket.io Integration
import { createServer } from 'http';
import { Server } from 'socket.io';

async function start() {
  if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
    console.warn('⚠️ WARNING: Neither MONGO_URI nor MONGODB_URI is set in process.env!');
    console.warn('If running on Render, you MUST configure MONGO_URI under Environment Variables in the Render dashboard.');
  }
  const maskedUri = MONGO_URI.includes('@') ? MONGO_URI.replace(/:([^:@]+)@/, ':****@') : MONGO_URI;
  console.log(`[Init] Connecting to MongoDB: ${maskedUri}`);
  await connectToDatabase(MONGO_URI);
  startEnterpriseEmailWorker();
  await seedSpecialRooms();

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const isLocalhost = /^http:\/\/localhost:\d+$/.test(origin);
        const isVercel = /\.vercel\.app$/.test(origin);
        if (isLocalhost || isVercel || allowlist.includes(origin) || allowlist.length === 0) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Make io available in routes
  app.set('io', io);

  // Socket Logic
  // eslint-disable-next-line no-undef
  scheduler();

  const onlineDrivers = new Map(); // userId -> socketId

  io.on('connection', (socket) => {
      console.log('Socket Connected:', socket.id);

      socket.on('identity', (userId) => {
          if (userId) {
              onlineDrivers.set(userId, socket.id);
              socket.join(userId); // Join personal room
              console.log(`Driver ${userId} mapped to ${socket.id}`);
          }
      });

      socket.on('update-location', (data) => {
          if(data.userId) {
              io.to(`driver-${data.userId}`).emit('driver-location-updated', {
                  lat: data.latitude,
                  lng: data.longitude
              });
          }
      });
      
      socket.on('join-tracking', (driverId) => {
           socket.join(`driver-${driverId}`);
           console.log(`Socket ${socket.id} started tracking driver ${driverId}`);
      });

      socket.on('disconnect', () => {
           for (const [uid, sid] of onlineDrivers.entries()) {
               if (sid === socket.id) {
                   onlineDrivers.delete(uid);
                   break;
               }
           }
           console.log('Socket Disconnected:', socket.id);
      });
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server (HTTP+Socket) listening on 0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Failed to start server:', err);
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

export default app;

// Trigger restart 3
