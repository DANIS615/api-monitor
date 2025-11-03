const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Endpoint de autenticación
app.post('/api/auth/login', (req, res) => {
  console.log('Login request:', req.body);
  
  const { username, password } = req.body;
  
  // Validación simple
  if (username === 'test' && password === 'test123') {
    res.json({
      success: true,
      token: `mock-token-${Date.now()}`,
      expiresIn: 3600
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Credenciales inválidas'
    });
  }
});

// Endpoint protegido que requiere token
app.get('/api/data', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'No autorizado',
      message: 'Se requiere token de autenticación'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  res.json({
    message: 'Datos obtenidos exitosamente',
    timestamp: new Date().toISOString(),
    data: {
      users: ['Juan', 'María', 'Pedro'],
      count: 3
    }
  });
});

// Endpoint de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

const PORT = 3001;
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor de prueba corriendo en http://localhost:${PORT}`);
  console.log(`📋 Endpoints disponibles:`);
  console.log(`   POST /api/auth/login - Autenticación`);
  console.log(`   GET  /api/data - Datos protegidos`);
  console.log(`   GET  /api/health - Health check`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`⚠️  Puerto ${PORT} ya está en uso. El servidor de prueba no se iniciará.`);
    console.log(`   Puedes saltarte este error si ya tienes otro servidor corriendo en el puerto ${PORT}`);
  } else {
    console.error('❌ Error del servidor:', err);
  }
});

