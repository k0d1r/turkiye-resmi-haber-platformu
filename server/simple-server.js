const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: '🇹🇷 Türkiye Resmi Haber API',
    status: 'ÇALIŞIYOR!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
    memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
    node: process.version,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    message: 'API Test Endpoint',
    success: true,
    data: {
      server: 'Express.js',
      environment: process.env.NODE_ENV || 'development',
      features: [
        'RSS Feed Parser',
        'Web Scraping',
        'User Management',
        'Financial Data',
        'AI Summarization'
      ]
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint bulunamadı',
    path: req.originalUrl
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log('\n🚀 =================================');
  console.log('   TÜRKIYE RESMİ HABER SİTESİ');
  console.log('=================================');
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`📋 Health: http://localhost:${PORT}/health`);
  console.log(`🧪 Test API: http://localhost:${PORT}/api/test`);
  console.log('=================================\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM alındı, server kapatılıyor...');
  server.close(() => {
    console.log('Server kapatıldı.');
    process.exit(0);
  });
});

module.exports = app; 