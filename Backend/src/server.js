// ======================= ENV SETUP =======================
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

if (!process.env.ACCESS_TOKEN_SECRET) {
  console.error("❌ ACCESS_TOKEN_SECRET missing in env");
  process.exit(1);
}

// ======================= IMPORTS =========================
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";

// ======================= DYNAMIC IMPORTS =================
let connectDB, errorMiddleware, authMiddleware;
let routeModules = {};

try {
  const dbModule = await import("./config/db.js");
  connectDB = dbModule.connectDB;

  const errorModule = await import("./middleware/errorMiddleware.js");
  errorMiddleware = errorModule.errorMiddleware;

  const authModule = await import("./middleware/authMiddleware.js");
  authMiddleware = authModule.default;

  const routeFiles = [
    { name: "auth", path: "./routes/authRoutes.js", public: true },
    { name: "users", path: "./routes/userRoutes.js" },
    { name: "admins", path: "./routes/adminRoutes.js" },
    { name: "citizens", path: "./routes/citizenRoutes.js" },
    { name: "documents", path: "./routes/documentRoutes.js" },
    { name: "issues", path: "./routes/legalIssueRoutes.js" },
    { name: "subscriptions", path: "./routes/subscriptionRoutes.js" },
    { name: "messages", path: "./routes/messageRoutes.js" },
    { name: "notifications", path: "./routes/notificationRoutes.js" },
    { name: "videosessions", path: "./routes/videoSessionRoutes.js" }
  ];

  for (const route of routeFiles) {
    const module = await import(route.path);
    routeModules[route.name] = {
      handler: module.default,
      public: route.public || false
    };
    console.log(`✅ Loaded route: ${route.name}`);
  }
} catch (err) {
  console.error("❌ Failed to load modules:", err);
  process.exit(1);
}

// ======================= APP SETUP =======================
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

// ======================= CORS ============================
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
  : ["http://localhost:5173"];

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error("CORS blocked"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.set("trust proxy", 1);
app.use(express.json({ limit: "16mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ======================= ROUTER ==========================
const apiRouter = express.Router();

// Health check
apiRouter.get("/", (req, res) => {
  res.json({
    success: true,
    message: "NyayaSaathi API running",
    env: process.env.NODE_ENV || "development"
  });
});

// Debug
apiRouter.get("/debug", (req, res) => {
  res.json({
    origin: req.headers.origin,
    allowedOrigins,
    nodeEnv: process.env.NODE_ENV
  });
});

// ======================= PUBLIC ROUTES ===================
Object.entries(routeModules).forEach(([name, config]) => {
  if (config.public) {
    apiRouter.use(`/${name}`, config.handler);
    console.log(`🌐 Public: /api/v1/${name}`);
  }
});

// ======================= PROTECTED ROUTES =================
Object.entries(routeModules).forEach(([name, config]) => {
  if (!config.public) {
    apiRouter.use(`/${name}`, authMiddleware, config.handler);
    console.log(`🔒 Protected: /api/v1/${name}`);
  }
});

// ======================= MOUNT ===========================
app.use("/api/v1", apiRouter);

// Root
app.get("/", (req, res) => {
  res.send("<h1>NyayaSaathi Backend Running</h1>");
});

// 404
app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Error middleware
if (errorMiddleware) {
  app.use(errorMiddleware);
}

// ======================= START SERVER ====================
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log("🚀 Server started");
      console.log(`🌍 PORT: ${PORT}`);
      console.log(`🔗 API: /api/v1`);
    });
  } catch (err) {
    console.error("❌ Server failed:", err);
    process.exit(1);
  }
};

startServer();
