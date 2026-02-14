import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "loose",
  theme: "default",
});

function SchemaViewer({ schema }) {
  const containerRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function renderSchema() {
      if (!containerRef.current) {
        return;
      }

      if (!schema) {
        containerRef.current.innerHTML = "<em>Схема отсутствует</em>";
        setError("");
        return;
      }

      try {
        const renderId = `mermaid-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const { svg } = await mermaid.render(renderId, schema);
        if (!isCancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError("");
        }
      } catch (renderError) {
        if (!isCancelled) {
          console.error("Mermaid render error:", renderError);
          setError("Не удалось отрисовать схему. Проверьте синтаксис Mermaid.");
          if (containerRef.current) {
            containerRef.current.innerHTML = "";
          }
        }
      }
    }

    renderSchema();

    return () => {
      isCancelled = true;
    };
  }, [schema]);

  return (
    <section style={styles.container}>
      <h3>Просмотр схемы</h3>
      {error ? <div style={styles.error}>{error}</div> : null}
      <div ref={containerRef} style={styles.canvas} />
    </section>
  );
}

const styles = {
  container: {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: 16,
    background: "#fff",
  },
  canvas: {
    width: "100%",
    overflowX: "auto",
    minHeight: 120,
    padding: 8,
    background: "#fafafa",
    borderRadius: 6,
  },
  error: {
    marginBottom: 10,
    padding: 8,
    background: "#fff3f3",
    color: "#b30000",
    borderRadius: 6,
  },
};

export default SchemaViewer;
