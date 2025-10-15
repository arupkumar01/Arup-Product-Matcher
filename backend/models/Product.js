// backend/models/Product.js
import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: String,
  image: { type: String, required: true },
  embedding: { type: [Number], default: [] },
});

export default mongoose.model("Product", ProductSchema);
