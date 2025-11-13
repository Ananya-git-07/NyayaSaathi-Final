// PASTE THIS ENTIRE FILE INTO Backend/src/server.js

import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log("✅ [DEBUG] Loaded ACCESS_TOKEN_SECRET:", process.env.ACCESS_TOKEN_SECRET);
if (!process.env.ACCESS_TOKEN_SECRET) {
  console.error("❌ FATAL ERROR: ACCESS_TOKEN_SECRET is not defined! Check your .env file in the /Backend directory.");
  process.exit(1);
}

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from 'http'; // <-- IMPORT HTTP
import { initSocket } from './socket.js'; // <-- IMPORT SOCKET INITIALIZER

let connectDB, errorMiddleware, authMiddleware;
let routeModules = {};

// ... (keep the existing try-catch block for module imports)
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
    { name: 'voicequeries', path: './routes/voiceQueryRoutes.js' },
    // --- ADD NEW ROUTES ---
    { name: 'notifications', path: './routes/notificationRoutes.js'},
    { name: 'messages', path: './routes/messageRoutes.js' }
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
// ... (end of existing try-catch block)


const app = express();
const httpServer = http.createServer(app); // <-- CREATE HTTP SERVER
initSocket(httpServer); // <-- INITIALIZE SOCKET.IO

const PORT = process.env.PORT || 5001;

// ... (keep the existing CORS configuration, middleware, and router setup)
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ["http://localhost:5173", "http://localhost:3000"];

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

app.use(cors(corsOptions));
app.set("trust proxy", 1);
app.use(express.json({ limit: "16mb" }));
app.use(express.urlencoded({ extended: true, limit: "16mb" }));
app.use(cookieParser());

if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.path} - ${req.ip}`);
    next();
  });
}

const apiRouter = express.Router();

apiRouter.get("/", (req, res) => {
  res.json({
    success: true,
    message: "NyayaSaathi API is operational",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || 'development',
  });
});

console.log("🌐 Setting up public routes...");
Object.entries(routeModules).forEach(([name, config]) => {
  if (config.public && config.handler) {
    apiRouter.use(`/${name}`, config.handler);
    console.log(`  ✅ Public route: /api/${name}`);
  }
});

if (authMiddleware) {
  console.log("🔐 Setting up authentication middleware...");
  apiRouter.use(authMiddleware);
} else {
  console.error("❌ Authentication middleware not available - all routes will be public!");
}

console.log("🛡️ Setting up protected routes...");
Object.entries(routeModules).forEach(([name, config]) => {
  if (!config.public && config.handler) {
    apiRouter.use(`/${name}`, config.handler);
    console.log(`  ✅ Protected route: /api/${name}`);
  }
});

app.use("/api", apiRouter);
// ... (keep the rest of the file: root endpoint, 404 handler, error middleware)
app.get("/", (req, res) => {
    res.send(`<h1>NyayaSaathi Backend is Running</h1>`);
});
app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "Endpoint not found" });
});
if (errorMiddleware) {
  app.use(errorMiddleware);
}
// ...


const startServer = async () => {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🔧 INITIALIZING NYAYASAATHI BACKEND SERVER');
    console.log('='.repeat(60));

    if (connectDB) {
      console.log('🔌 Connecting to MongoDB...');
      await connectDB();
      console.log('✅ MongoDB connected successfully');
    } else {
      console.warn('⚠️ Database connection function not available');
    }

    // --- CHANGE: Use httpServer.listen instead of app.listen ---
    const server = httpServer.listen(PORT, () => {
      console.log('\n' + '🎉'.repeat(20));
      console.log('🎉 NYAYASAATHI SERVER STARTED SUCCESSFULLY!');
      console.log('🎉'.repeat(20));
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Local URL: http://localhost:${PORT}`);
      console.log(`📊 API URL: http://localhost:${PORT}/api`);
      console.log('='.repeat(60));
    });

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
    console.error('❌ FAILED TO START SERVER:', error.message);
    process.exit(1);
  }
};

startServer();