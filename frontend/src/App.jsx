// src/App.jsx
import { useState } from "react";
import axios from "axios";
import Loader from "./components/Loader";
import SimilarResults from "./components/SimilarResults";

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState(50);
  const [adminImage, setAdminImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  // ✅ Backend base URL (auto-uses .env or localhost for local dev)
  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") ||
    "http://localhost:5000";

  // ===============================
  // 📤 Upload + Search
  // ===============================
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!image) return alert("Please select an image first!");

    setLoading(true);
    setResults([]);

    const formData = new FormData();
    formData.append("image", image);

    try {
      const uploadRes = await axios.post(
        `${BACKEND_URL}/api/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const uploadedPath = uploadRes.data.imagePath;
      const searchRes = await axios.get(`${BACKEND_URL}/api/search`, {
        params: { img: uploadedPath },
      });

      setResults(searchRes.data);
    } catch (err) {
      console.error("❌ Error while matching products:", err);
      alert(
        err.response?.data?.error ||
          err.message ||
          "An error occurred while finding similar products."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // 🧑‍💼 Admin: Add Product Image
  // ===============================
  const handleAdminUpload = async (e) => {
    e.preventDefault();
    if (!adminImage) return alert("Please select a product image to upload.");

    setUploading(true);
    const formData = new FormData();
    formData.append("image", adminImage);

    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/admin/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      alert(res.data.message || "✅ Product image uploaded successfully!");
      setAdminImage(null);
    } catch (err) {
      console.error("❌ Admin upload failed:", err);
      alert(
        err.response?.data?.error ||
          "Failed to upload product image. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  // ===============================
  // 🧱 Render UI
  // ===============================
  return (
    <div
      style={{
        fontFamily: "Inter, sans-serif",
        background: "linear-gradient(180deg, #f9fafb 0%, #eef1f6 100%)",
        minHeight: "100vh",
        padding: "3rem 1rem",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          backgroundColor: "#fff",
          borderRadius: "16px",
          padding: "2rem 2.5rem",
          boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "700",
            color: "#1a202c",
            marginBottom: "1rem",
          }}
        >
          🖼️ Visual Product Matcher
        </h1>
        <p style={{ color: "#555", marginBottom: "2rem" }}>
          Upload an image to find visually similar products instantly.
        </p>

        {/* Search Section */}
        <form
          onSubmit={handleUpload}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
            marginBottom: "2rem",
          }}
        >
          <label
            style={{
              background: "#edf2f7",
              border: "2px dashed #cbd5e0",
              padding: "0.8rem 1rem",
              borderRadius: "8px",
              cursor: "pointer",
              color: "#4a5568",
              fontWeight: "500",
            }}
          >
            Choose Image
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                setImage(e.target.files[0]);
                setPreview(URL.createObjectURL(e.target.files[0]));
              }}
            />
          </label>

          <button
            type="submit"
            style={{
              background: "#3182ce",
              color: "white",
              padding: "0.8rem 1.8rem",
              border: "none",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background 0.3s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#2563eb")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#3182ce")}
            disabled={loading}
          >
            {loading ? "Processing..." : "Search"}
          </button>
        </form>

        {/* Uploaded Image Preview */}
        {preview && (
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ marginBottom: "0.5rem", color: "#2d3748" }}>
              Uploaded Image:
            </h3>
            <img
              src={preview}
              alt="Uploaded preview"
              width="220"
              style={{
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                marginBottom: "1rem",
              }}
            />
          </div>
        )}

        {/* 🧑‍💼 Admin Upload Section */}
        <div
          style={{
            marginTop: "2.5rem",
            borderTop: "1px solid #e2e8f0",
            paddingTop: "2rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.3rem",
              color: "#2d3748",
              marginBottom: "1rem",
            }}
          >
            🧑‍💼 Admin: Add New Product Image
          </h2>

          <form
            onSubmit={handleAdminUpload}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAdminImage(e.target.files[0])}
              style={{
                border: "1px solid #cbd5e0",
                borderRadius: "6px",
                padding: "0.5rem",
                cursor: "pointer",
              }}
            />
            <button
              type="submit"
              disabled={uploading}
              style={{
                background: uploading ? "#a0aec0" : "#38a169",
                color: "white",
                padding: "0.7rem 1.8rem",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: uploading ? "not-allowed" : "pointer",
              }}
            >
              {uploading ? "Uploading..." : "Upload Product"}
            </button>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <Loader />
        ) : (
          results.length > 0 && (
            <>
              <div style={{ margin: "2rem auto" }}>
                <label style={{ fontWeight: "600" }}>
                  Filter by Similarity:{" "}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filter}
                  onChange={(e) => setFilter(Number(e.target.value))}
                  style={{ width: "200px", margin: "0 10px" }}
                />
                <span style={{ fontWeight: "600", color: "#2d3748" }}>
                  {filter}%
                </span>
              </div>
              <SimilarResults results={results} filter={filter} />
            </>
          )
        )}
      </div>

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          marginTop: "2rem",
          fontSize: "0.9rem",
          color: "#718096",
        }}
      >
        © {new Date().getFullYear()} Visual Product Matcher · Built with ❤️ by
        Arup Ratan Majhi
      </footer>
    </div>
  );
}

export default App;
