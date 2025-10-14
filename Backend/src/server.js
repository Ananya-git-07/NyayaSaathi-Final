
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Core imports with error handling
let connectDB, errorMiddleware, authMiddleware;
let routeModules = {};

try {
  // Database and middleware imports
  const dbModule = await import("./config/db.js");
  connectDB = dbModule.connectDB;
  
  const errorModule = await import("./middleware/errorMiddleware.js");
  errorMiddleware = errorModule.errorMiddleware;
  
  const authModule = await import("./middleware/authMiddleware.js");
  authMiddleware = authModule.default;

  // Route imports with individual error handling
  const routeFiles = [
    { name: 'auth', path: './routes/authRoutes.js', public: true },
    { name: 'kiosks', path: './routes/kioskRoutes.js', public: true },
    { name: 'ai', path: './routes/ai.routes.js' },
    { name: 'admins', path: './routes/adminRoutes.js' },
    { name: 'citizens', path: './routes/citizenRoutes.js' },
    { name: 'documents', path: './routes/documentRoutes.js' },
    { name: 'employees', path: './routes/employeeRoutes.js' },
    { name: 'issues', path: './routes/legalIssueRoutes.js' },
    { name: 'paralegals', path: './routes/paralegalRoutes.js' },
    { name: 'subscriptions', path: './routes/subscriptionRoutes.js' },
    { name: 'users', path: './routes/userRoutes.js' },
    { name: 'voicequeries', path: './routes/voiceQueryRoutes.js' }
  ];

  for (const route of routeFiles) {
    try {
      const module = await import(route.path);
      routeModules[route.name] = {
        handler: module.default,
        public: route.public || false
      };
      console.log(`✅ Loaded ${route.name} routes`);
    } catch (error) {
      console.warn(`⚠️ Failed to load ${route.name} routes:`, error.message);
      // Create a placeholder route that returns 503
      routeModules[route.name] = {
        handler: express.Router().get('*', (req, res) => {
          res.status(503).json({
            success: false,
            message: `${route.name} service temporarily unavailable`,
            error: 'Route module failed to load'
          });
        }),
        public: route.public || false
      };
    }
  }

} catch (error) {
  console.error("❌ Critical error loading core modules:", error);
  process.exit(1);
}

// Express app initialization
const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ["http://localhost:5173", "http://localhost:3000"];

// Add development origins automatically
if (process.env.NODE_ENV !== "production") {
  const devOrigins = ["http://localhost:5173", "http://localhost:3000"];
  devOrigins.forEach(origin => {
    if (!allowedOrigins.includes(origin)) {
      allowedOrigins.push(origin);
    }
  });
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🔒 CORS blocked request from origin: ${origin}`);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
};

// Core middleware
app.use(cors(corsOptions));
app.set("trust proxy", 1);
app.use(express.json({ 
  limit: "16mb",
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ success: false, message: 'Invalid JSON' });
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: "16mb" }));
app.use(cookieParser());

// Request logging middleware (development only)
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.path} - ${req.ip}`);
    next();
  });
}

// API Router setup
const apiRouter = express.Router();

// Health check endpoint
apiRouter.get("/", (req, res) => {
  res.json({
    success: true,
    message: "NyayaSaathi API is operational",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || 'development',
    services: Object.keys(routeModules).reduce((acc, key) => {
      acc[key] = routeModules[key] ? 'available' : 'unavailable';
      return acc;
    }, {})
  });
});

// Public routes (no authentication required)
console.log("🌐 Setting up public routes...");
Object.entries(routeModules).forEach(([name, config]) => {
  if (config.public && config.handler) {
    apiRouter.use(`/${name}`, config.handler);
    console.log(`  ✅ Public route: /api/${name}`);
  }
});

// Authentication middleware gate
if (authMiddleware) {
  console.log("🔐 Setting up authentication middleware...");
  apiRouter.use(authMiddleware);
} else {
  console.error("❌ Authentication middleware not available - all routes will be public!");
}

// Protected routes (authentication required)
console.log("🛡️ Setting up protected routes...");
Object.entries(routeModules).forEach(([name, config]) => {
  if (!config.public && config.handler) {
    apiRouter.use(`/${name}`, config.handler);
    console.log(`  ✅ Protected route: /api/${name}`);
  }
});

// Mount the API router
app.use("/api", apiRouter);

// Root endpoint with status page
app.get("/", (req, res) => {
  const uptime = process.uptime();
  const uptimeHours = Math.floor(uptime / 3600);
  const uptimeMinutes = Math.floor((uptime % 3600) / 60);
  
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>NyayaSaathi Backend</title>
        <style>
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                margin: 0; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: #333; min-height: 100vh;
            }
            .container { 
                background: white; padding: 40px; border-radius: 15px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 800px; margin: 0 auto;
            }
            h1 { color: #2c3e50; margin-bottom: 30px; text-align: center; }
            .status { 
                background: linear-gradient(135deg, #4CAF50, #45a049); color: white;
                padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;
            }
            .info { 
                background: #f8f9fa; padding: 15px; border-radius: 8px; 
                margin: 10px 0; border-left: 4px solid #3498db;
            }
            .services {
                display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px; margin: 20px 0;
            }
            .service {
                background: #e8f5e8; padding: 15px; border-radius: 8px;
                border-left: 4px solid #4CAF50; text-align: center;
            }
            .service.unavailable {
                background: #ffebee; border-left-color: #f44336;
            }
            a { color: #3498db; text-decoration: none; font-weight: 600; }
            a:hover { text-decoration: underline; }
            .footer { text-align: center; margin-top: 30px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>⚖️ NyayaSaathi Backend Server</h1>
            
            <div class="status">
                <h2>🚀 Server Status: ONLINE</h2>
                <p>Running on port ${PORT} | Uptime: ${uptimeHours}h ${uptimeMinutes}m</p>
            </div>
            
            <div class="info">
                <strong>📊 API Endpoint:</strong> <a href="/api">/api</a>
            </div>
            <div class="info">
                <strong>🌍 Environment:</strong> ${process.env.NODE_ENV || 'development'}
            </div>
            <div class="info">
                <strong>⏰ Started:</strong> ${new Date().toISOString()}
            </div>
            <div class="info">
                <strong>🔗 CORS Origins:</strong> ${allowedOrigins.join(', ')}
            </div>
            
            <h3>📋 Available Services</h3>
            <div class="services">
                ${Object.entries(routeModules).map(([name, config]) => `
                    <div class="service ${config.handler ? '' : 'unavailable'}">
                        <strong>${name}</strong><br>
                        <small>${config.public ? 'Public' : 'Protected'}</small><br>
                        <span>${config.handler ? '✅ Online' : '❌ Offline'}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="footer">
                <p>NyayaSaathi Legal Services Platform v1.0.0</p>
                <p>Empowering justice through technology</p>
            </div>
        </div>
    </body>
    </html>
  `);
});

// 404 handler for undefined routes
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableEndpoints: {
      api: "/api",
      health: "/api/",
      public: Object.keys(routeModules).filter(k => routeModules[k].public).map(k => `/api/${k}`),
      protected: Object.keys(routeModules).filter(k => !routeModules[k].public).map(k => `/api/${k}`)
    }
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(`❌ Global Error Handler (${req.method} ${req.path}):`, err);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format"
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Duplicate field value entered"
    });
  }

  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: "CORS Error: Origin not allowed"
    });
  }

  // Default error response
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err 
    })
  });
});

// Use custom error middleware if available
if (errorMiddleware) {
  app.use(errorMiddleware);
}

// Server startup function
const startServer = async () => {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🔧 INITIALIZING NYAYASAATHI BACKEND SERVER');
    console.log('='.repeat(60));

    // Connect to database
    if (connectDB) {
      console.log('🔌 Connecting to MongoDB...');
      await connectDB();
      console.log('✅ MongoDB connected successfully');
    } else {
      console.warn('⚠️ Database connection function not available');
    }

    // Start the server
    const server = app.listen(PORT, () => {
      console.log('\n' + '🎉'.repeat(20));
      console.log('🎉 NYAYASAATHI SERVER STARTED SUCCESSFULLY!');
      console.log('🎉'.repeat(20));
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Local URL: http://localhost:${PORT}`);
      console.log(`📊 API URL: http://localhost:${PORT}/api`);
      console.log(`🌐 CORS Origins: ${allowedOrigins.join(', ')}`);
      console.log(`⏰ Started: ${new Date().toLocaleString()}`);
      console.log(`🛡️ Protected Routes: ${Object.keys(routeModules).filter(k => !routeModules[k].public).length}`);
      console.log(`🌐 Public Routes: ${Object.keys(routeModules).filter(k => routeModules[k].public).length}`);
      console.log('='.repeat(60));
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal) => {
      console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('\n' + '❌'.repeat(30));
    console.error('❌ FAILED TO START SERVER');
    console.error('❌'.repeat(30));
    console.error('Error:', error.message);
    if (error.stack) console.error('Stack:', error.stack);
    console.error('❌'.repeat(30));
    process.exit(1);
  }
};

// Handle uncaught exceptions and promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();