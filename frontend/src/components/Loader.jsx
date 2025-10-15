// src/components/Loader.jsx
function Loader() {
  return (
    <div style={{ textAlign: "center", margin: "2rem" }}>
      <div className="spinner"></div>
      <style>{`
        .spinner {
          width: 50px;
          height: 50px;
          border: 6px solid #eee;
          border-top-color: #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: auto;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <p>Finding similar products...</p>
    </div>
  );
}

export default Loader;
