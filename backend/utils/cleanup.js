// backend/utils/cleanup.js
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.js";

dotenv.config();

const folder = path.resolve("./uploads");
const cutoff = Date.now() - 24 * 60 * 60 * 1000; // older than 1 day

async function main() {
  console.log("🧹 Starting cleanup job...");

  // Check if uploads folder exists
  if (!fs.existsSync(folder)) {
    console.log("⚠️ Upload folder not found — skipping cleanup.");
    return;
  }

  // Connect to MongoDB
  const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/visual_matcher";
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log("✅ Connected to MongoDB for cleanup.");

  const files = fs.readdirSync(folder);
  const products = await Product.find({}, { image: 1 });
  const protectedPaths = new Set(products.map((p) => path.basename(p.image)));

  let deletedCount = 0;
  let skippedCount = 0;

  for (const file of files) {
    try {
      const filePath = path.join(folder, file);
      const stats = fs.statSync(filePath);

      // Skip if file is still referenced by MongoDB
      if (protectedPaths.has(file)) {
        skippedCount++;
        continue;
      }

      // Delete if older than cutoff
      if (stats.mtimeMs < cutoff) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted old file: ${file}`);
        deletedCount++;
      }
    } catch (err) {
      console.error(`❌ Error processing ${file}:`, err.message);
    }
  }

  console.log(`\n📊 Cleanup Summary:
   ✅ Checked: ${files.length} files
   🗑️ Deleted: ${deletedCount}
   ⏭️ Skipped (still in DB): ${skippedCount}`);

  await mongoose.disconnect();
  console.log("🔌 MongoDB disconnected. Cleanup complete.\n");
}

main().catch((err) => {
  console.error("🚨 Fatal error in cleanup:", err);
  process.exit(1);
});
