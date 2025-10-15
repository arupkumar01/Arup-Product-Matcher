// backend/utils/similarity.js
import fs from "fs";
import path from "path";

let tf;
let mobilenetModel;
let usingNodeBinding = false;

/**
 * Attempts to load TensorFlow backend.
 * Prioritizes tfjs-node for speed; falls back to tfjs (pure JS).
 */
async function attemptLoadTF() {
  try {
    tf = await import("@tensorflow/tfjs-node");
    usingNodeBinding = true;
    mobilenetModel = await import("@tensorflow-models/mobilenet");
    console.log("✅ Using @tensorflow/tfjs-node backend");
  } catch (err1) {
    console.warn(
      "⚠️  Couldn't load @tensorflow/tfjs-node. Falling back to pure JS @tensorflow/tfjs..."
    );
    try {
      tf = await import("@tensorflow/tfjs");
      usingNodeBinding = false;
      mobilenetModel = await import("@tensorflow-models/mobilenet");
      console.log("⚙️  Using @tensorflow/tfjs (pure JS) backend");
    } catch (err2) {
      console.error("❌ TensorFlow load failed:", err2);
      throw new Error("TensorFlow.js backend failed to initialize");
    }
  }
}

/**
 * Loads MobileNet model (cached singleton).
 */
// backend/utils/similarity.js
export async function loadModel() {
  if (!mobilenetModel || !tf) {
    await attemptLoadTF();
  }
  if (!global.__mobilenet_instance) {
    console.log("🔍 Loading MobileNet model...");
    // ✅ Use smaller valid alpha = 0.50 (less memory, still good accuracy)
    global.__mobilenet_instance = await mobilenetModel.load({
      version: 2,
      alpha: 1.0,
    });
    console.log("✅ MobileNet model loaded (alpha=1.0).");
  }
  return global.__mobilenet_instance;
}

/**
 * Generates image embedding vector (1024-D float array).
 */
export async function getImageEmbedding(imagePath) {
  if (!tf) await attemptLoadTF();

  const resolvedPath = path.resolve(imagePath);
  if (!fs.existsSync(resolvedPath))
    throw new Error(`Image not found: ${resolvedPath}`);

  const imageBuffer = fs.readFileSync(resolvedPath);
  let decoded;

  if (usingNodeBinding && tf.node?.decodeImage) {
    // Native backend (fast)
    decoded = tf.node.decodeImage(imageBuffer, 3);
  } else {
    // Fallback: pure JS decoding via jpeg-js
    const jpeg = await import("jpeg-js").catch(() => null);
    if (!jpeg) {
      throw new Error(
        "Missing dependency: jpeg-js. Run `npm install jpeg-js`."
      );
    }

    const raw = jpeg.decode(imageBuffer, { useTArray: true });
    const { width, height, data } = raw;

    // Convert RGBA → RGB
    const rgbData = new Uint8Array(width * height * 3);
    for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
      rgbData[j] = data[i]; // R
      rgbData[j + 1] = data[i + 1]; // G
      rgbData[j + 2] = data[i + 2]; // B
    }

    decoded = tf.tensor3d(rgbData, [height, width, 3], "int32");
  }

  // Extract embeddings
  const model = await loadModel();
  const activation = model.infer(decoded, true);
  const flattened = activation.flatten();
  const embedding = await flattened.array();

  // Cleanup
  flattened.dispose();
  activation.dispose();
  decoded.dispose?.();

  return embedding;
}

/**
 * Normalizes embedding vector to unit length (L2 normalization).
 */
export function normalizeEmbedding(embedding) {
  if (!embedding || embedding.length === 0) return [];
  const mag = Math.sqrt(embedding.reduce((sum, x) => sum + x * x, 0));
  return mag ? embedding.map((x) => Number((x / mag).toFixed(6))) : [];
}

/**
 * Computes cosine similarity between two vectors.
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dot = 0,
    magA = 0,
    magB = 0;
  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i],
      b = vecB[i];
    dot += a * b;
    magA += a * a;
    magB += b * b;
  }

  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
