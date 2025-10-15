import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { spawn } from "child_process";
import Product from "../models/Product.js";
import {
  loadModel,
  getImageEmbedding,
  cosineSimilarity,
} from "../utils/similarity.js";

const router = express.Router();

// ===================================
// ⚙️ Multer Setup for Uploads
// ===================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "db/products");
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error("Only JPG or PNG images are allowed."));
  },
});

// ===================================
// 🔍 GET /api/search?img=<uploaded-path>
// ===================================
router.get("/search", async (req, res) => {
  try {
    const imagePath = req.query.img;
    if (!imagePath)
      return res
        .status(400)
        .json({ error: "No image provided in query parameter ?img=" });

    const absolutePath = path.resolve(`.${imagePath}`);
    if (!fs.existsSync(absolutePath))
      return res
        .status(404)
        .json({ error: "Uploaded image not found on server" });

    console.log(`🔎 Performing similarity search for: ${imagePath}`);

    await loadModel();
    const queryEmbedding = await getImageEmbedding(absolutePath);

    const products = await Product.find({
      embedding: { $exists: true, $ne: [] },
    });

    if (!products.length) {
      return res
        .status(404)
        .json({ message: "No product embeddings found in the database." });
    }

    const results = [];

    for (const product of products) {
      const norm = Math.sqrt(
        product.embedding.reduce((sum, v) => sum + v * v, 0)
      );
      const normalizedEmbedding = norm
        ? product.embedding.map((v) => v / norm)
        : product.embedding;

      const similarity = cosineSimilarity(queryEmbedding, normalizedEmbedding);

      const imageURL = `${req.protocol}://${req.get("host")}/db/${product.image}`;

      results.push({
        id: product._id,
        name: product.name,
        category: product.category,
        image: imageURL,
        similarity: Number(similarity.toFixed(4)),
      });
    }

    results.sort((a, b) => b.similarity - a.similarity);

    console.log(`✅ Found ${results.length} matches.`);
    res.json(results);
  } catch (err) {
    console.error("❌ Error in /api/search:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===================================
// 🔁 POST /api/refresh
// Regenerates embeddings (Admin only)
// ===================================
const REFRESH_TOKEN = process.env.REFRESH_TOKEN || "secret123";

router.post("/refresh", async (req, res) => {
  try {
    const token = req.headers["x-refresh-token"];
    if (token !== REFRESH_TOKEN) {
      return res.status(403).json({ error: "Unauthorized refresh attempt." });
    }

    const scriptPath = path.resolve("./utils/generateEmbeddings.js");
    console.log("♻️  Received refresh request — running embedding generator...");

    const child = spawn("node", [scriptPath]);
    let output = "";

    child.stdout.on("data", (data) => (output += data.toString()));
    child.stderr.on("data", (data) => (output += data.toString()));

    child.on("close", (code) => {
      console.log(`✅ Embedding refresh process exited with code ${code}`);
      res.json({
        success: true,
        message: "Embeddings regenerated successfully!",
        log: output,
      });
    });
  } catch (err) {
    console.error("❌ Error in /api/refresh:", err);
    res.status(500).json({ error: "Failed to refresh embeddings." });
  }
});

// ===================================
// 🧑‍💼 POST /api/admin/upload
// Upload new product images (no auto-embedding)
// ===================================
router.post("/admin/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "No image uploaded." });

    const fileName = req.file.filename;
    const relativePath = `products/${fileName}`;

    console.log(`📤 Admin uploaded new product image: ${relativePath}`);

    // Save product metadata only — embeddings will be generated manually
    const newProduct = new Product({
      name: path.basename(fileName, path.extname(fileName)).replace(/[-_]/g, " "),
      category: "Uncategorized",
      image: relativePath,
      embedding: [], // empty until /api/refresh runs
    });

    await newProduct.save();

    res.json({
      success: true,
      message:
        "✅ Product uploaded successfully! Run /api/refresh to generate embeddings later.",
      product: newProduct,
    });
  } catch (err) {
    console.error("❌ Admin upload failed:", err);
    res.status(500).json({
      error: "Failed to upload product image.",
    });
  }
});

export default router;
