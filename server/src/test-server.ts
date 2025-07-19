import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Test routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Türkiye Resmi Haber API Test', 
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/test', (req, res) => {
  res.json({ 
    message: 'Test endpoint çalışıyor!',
    server: 'Express + TypeScript',
    node: process.version
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test Server çalışıyor: http://localhost:${PORT}`);
  console.log(`📋 Health Check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test Endpoint: http://localhost:${PORT}/test`);
});

export default app; 