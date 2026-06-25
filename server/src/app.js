import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

import authRouter from './routes/authRoutes.js';
import employeeRouter from './routes/employeeRoutes.js';
import attendanceRouter from './routes/attendanceRoutes.js';
import leaveRouter from './routes/leaveRoutes.js';
import payrollRouter from './routes/payrollRoutes.js';
import recruitmentRouter from './routes/recruitmentRoutes.js';
import performanceRouter from './routes/performanceRoutes.js';
import portalRouter from './routes/portalRoutes.js';
import globalErrorHandler from './middleware/error.js';
import AppError from './utils/AppError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: false, // allow images to load on client
}));

// CORS Configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'development' 
    ? (origin, callback) => callback(null, true)
    : [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
        process.env.CLIENT_URL
      ].filter(Boolean),
  credentials: true,
}));

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Gzip response compression
app.use(compression());

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Custom lightweight cookie parser middleware
app.use((req, res, next) => {
  const rawCookies = req.headers.cookie;
  req.cookies = {};
  if (rawCookies) {
    rawCookies.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      const key = parts.shift().trim();
      const val = parts.join('=');
      req.cookies[key] = decodeURIComponent(val);
    });
  }
  next();
});

// Serve static upload files
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/hr', employeeRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/leaves', leaveRouter);
app.use('/api/payroll', payrollRouter);
app.use('/api/recruitment', recruitmentRouter);
app.use('/api/performance', performanceRouter);
app.use('/api/portal', portalRouter);

// Unhandled route fallback
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;
