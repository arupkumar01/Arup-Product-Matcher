// src/components/SimilarResults.jsx
import ProductCard from "./ProductCard";

function SimilarResults({ results, filter }) {
  // Filter results based on similarity threshold
  const filtered = results.filter((p) => (p.similarity || 0) * 100 >= filter);

  if (filtered.length === 0) {
    return (
      <p
        style={{
          textAlign: "center",
          marginTop: "2rem",
          fontSize: "1rem",
          color: "#555",
        }}
      >
        ⚠️ No products found above this similarity threshold.
      </p>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "1.5rem",
        justifyContent: "center",
        alignItems: "stretch",
        margin: "2rem auto",
        maxWidth: "1100px",
        width: "100%",
        padding: "0 1rem",
      }}
    >
      {filtered.map((p, index) => (
        <ProductCard key={p.id || index} product={p} />
      ))}
    </div>
  );
}

export default SimilarResults;
