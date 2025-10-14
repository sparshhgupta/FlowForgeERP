const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const attendanceRoutes = require('./routes/attendance');
const productRoutes = require('./routes/products');
const workerRoutes = require('./routes/workers');
const machineRoutes = require('./routes/machines');
const paymentRoutes = require('./routes/payments');
const clientRoutes = require('./routes/client');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/products', productRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/client', clientRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Parasnath Build ERP API is running' });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Parasnath Build ERP API',
    version: '3.0.0',
    endpoints: {
      auth: '/api/auth',
      projects: '/api/projects',
      attendance: '/api/attendance',
      products: '/api/products',
      workers: '/api/workers',
      machines: '/api/machines',
      payments: '/api/payments',
      client: '/api/client'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Parasnath Build ERP Server running on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health\n`);
});

module.exports = app;