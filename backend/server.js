// backend/server.js
import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import imageRoutes from "./routes/imageRoutes.js";

dotenv.config();
const app = express();

// =========================================
// 🌐 Configure CORS (Local + Deployed Frontends)
// =========================================
const allowedOrigins = (process.env.FRONTEND_URLS || "")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

console.log("🔗 Allowed Origins:", allowedOrigins.join(", "));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Allow non-browser requests
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn(`🚫 CORS blocked request from: ${origin}`);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  })
);



// =========================================
// 🧠 Connect to MongoDB
// =========================================
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/visual_matcher";

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// Close connection gracefully on shutdown
process.on("SIGINT", async () => {
  await mongoose.disconnect();
  console.log("🧩 MongoDB disconnected gracefully.");
  process.exit(0);
});

// =========================================
// ⚙️ Middleware
// =========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================================
// 🖼️ Serve Static Files
// =========================================
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"), {
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "public, max-age=86400"); // 1-day cache
    },
  })
);

app.use(
  "/db",
  express.static(path.join(process.cwd(), "db"), {
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "public, max-age=86400");
    },
  })
);

// =========================================
// 🧠 API Routes (Search + Refresh)
// =========================================
app.use("/api", imageRoutes);

// =========================================
// 📤 Multer Setup (File Uploads)
// =========================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safeName =
      Date.now() + "-" + file.originalname.replace(/\s+/g, "_").toLowerCase();
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error("Only JPG/PNG images are allowed"));
  },
});

// =========================================
// 🧾 Upload Route (Frontend Uploads)
// =========================================
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded" });

  const imagePath = `/uploads/${req.file.filename}`;
  console.log(`📤 Uploaded: ${req.file.filename}`);
  res.json({ imagePath });
});

// =========================================
// 💓 Health Check Endpoint
// =========================================
app.get("/", (req, res) => {
  res.send({
    status: "✅ OK",
    message: "Visual Product Matcher backend is running!",
    version: "1.0.0",
    mongo: mongoose.connection.readyState === 1 ? "🟢 Connected" : "🔴 Disconnected",
  });
});

// =========================================
// 🧱 Global Error Handling
// =========================================
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);

  if (err.message.includes("CORS")) {
    return res.status(403).json({ error: "CORS policy violation" });
  }

  if (err.message.includes("Only JPG/PNG")) {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: "Internal server error" });
});

// =========================================
// 🚀 Start Server
// =========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Allowed Origins: ${allowedOrigins.join(", ")}`);
  console.log(`🧠 MongoDB: ${MONGO_URI}`);
});
