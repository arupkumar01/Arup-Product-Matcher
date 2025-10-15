// src/components/ProductCard.jsx
function ProductCard({ product }) {
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  const imgSrc = product.image.startsWith("http")
    ? product.image
    : `${backendURL}/db/${product.image}`;

  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        cursor: "pointer",
        minHeight: "350px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-5px)";
        e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
      }}
    >
      {/* Image Container */}
      <div
        style={{
          width: "100%",
          height: "220px",
          backgroundColor: "#f9f9f9",
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <img
          src={imgSrc}
          alt={product.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain", // ✅ fixed scaling issue
            borderRadius: "10px",
            transition: "transform 0.3s ease",
          }}
          onError={(e) => (e.target.src = `${backendURL}/db/products/default.jpg`)}
        />
      </div>

      {/* Product Info */}
      <div style={{ padding: "1rem" }}>
        <h3
          style={{
            margin: "0.5rem 0",
            color: "#2c3e50",
            fontSize: "1.05rem",
            textTransform: "capitalize",
          }}
        >
          {product.name}
        </h3>
        <p style={{ color: "#777", margin: "0 0 0.5rem" }}>
          {product.category || "Uncategorized"}
        </p>
        <p
          style={{
            fontWeight: "bold",
            color: "#16a085",
            fontSize: "0.95rem",
          }}
        >
          {(product.similarity * 100).toFixed(1)}%
        </p>
      </div>
    </div>
  );
}

export default ProductCard;
