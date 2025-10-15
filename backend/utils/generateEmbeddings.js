// backend/utils/generateEmbeddings.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import Product from "../models/Product.js";
import { loadModel, getImageEmbedding } from "./similarity.js";

dotenv.config();

async function main() {
  console.log("🚀 Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("✅ MongoDB connected.");

  const dbDir = path.resolve("./db");
  const productsDir = path.join(dbDir, "products");

  // Ensure image folder exists
  if (!fs.existsSync(productsDir)) {
    console.error("❌ Folder 'db/products' not found. Please add product images first.");
    process.exit(1);
  }

  const imageFiles = fs.readdirSync(productsDir).filter((f) => /\.(jpg|jpeg|png)$/i.test(f));
  const imageSet = new Set(imageFiles.map((f) => `products/${f}`));

  console.log("🧠 Loading MobileNet model...");
  await loadModel();

  const existingProducts = await Product.find();
  const updatedProducts = [];
  const addedProducts = [];
  const deletedProducts = [];

  for (const [i, file] of imageFiles.entries()) {
    const relPath = `products/${file}`;
    const fullPath = path.join(productsDir, file);

    const existing = existingProducts.find((p) => p.image === relPath);

    // Skip if embedding already exists
    if (existing && existing.embedding && existing.embedding.length > 0) {
      console.log(`⏭️  Skipping existing: ${file}`);
      updatedProducts.push(existing);
      continue;
    }

    console.log(`📸 (${i + 1}/${imageFiles.length}) Processing: ${file}`);

    try {
      let embedding = await getImageEmbedding(fullPath);
      const magnitude = Math.sqrt(embedding.reduce((a, b) => a + b * b, 0));
      embedding = magnitude ? embedding.map((x) => Number((x / magnitude).toFixed(6))) : [];

      if (!embedding.length) {
        console.warn(`⚠️  Invalid embedding for "${file}". Skipping.`);
        continue;
      }

      if (existing) {
        existing.embedding = embedding;
        await existing.save();
      } else {
        const newProduct = new Product({
          name: path.basename(file, path.extname(file)).replace(/[-_]/g, " "),
          category: "Unknown",
          image: relPath,
          embedding,
        });
        await newProduct.save();
        addedProducts.push(file);
      }

      console.log(`✅ Processed: ${file}`);
    } catch (err) {
      console.error(`❌ Failed to process "${file}":`, err.message || err);
    }
  }

  // 🗑️ Remove products whose images no longer exist
  for (const product of existingProducts) {
    if (!imageSet.has(product.image)) {
      console.log(`🗑️  Removing missing product: ${product.name}`);
      await Product.deleteOne({ _id: product._id });
      deletedProducts.push(product.image);
    }
  }

  const total = await Product.countDocuments();
  console.log("\n📊 Summary:");
  console.log(`   ➕ Added: ${addedProducts.length}`);
  console.log(`   🗑️  Removed: ${deletedProducts.length}`);
  console.log(`   ✅ Total in DB: ${total}`);
  console.log("💾 Database synchronized successfully!\n");

  await mongoose.disconnect();
  console.log("🔌 MongoDB connection closed.");
}

main().catch((err) => {
  console.error("🚨 Fatal error:", err);
  process.exit(1);
});
