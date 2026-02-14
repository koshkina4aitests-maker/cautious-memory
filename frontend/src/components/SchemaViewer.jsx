import { useEffect, useMemo, useRef, useState } from "react";
import mermaid from "mermaid";

/**
 * Универсальный просмотрщик схем:
 *  - schema (Mermaid text) -> рендер как SVG;
 *  - graph ({ nodes, edges }) -> интерактивный canvas с drag-and-connect.
 * Использование:
 *  <SchemaViewer schema={template.schema} />
 *  <SchemaViewer graph={graphModel} onGraphChange={setGraphModel} />
 */
mermaid.initialize({
  startOnLoad: false,
  securityLevel: "loose",
  theme: "default",
});

const NODE_WIDTH = 160;
const NODE_HEIGHT = 60;

function withDefaults(graph) {
  const safeGraph = graph || { nodes: [], edges: [] };
  return {
    nodes: (safeGraph.nodes || []).map((node, index) => ({
      id: String(node.id),
      label: node.label || `Node ${index + 1}`,
      x: Number(node.x ?? 40 + (index % 4) * 180),
      y: Number(node.y ?? 40 + Math.floor(index / 4) * 110),
      color: node.color || "#eef2ff",
    })),
    edges: (safeGraph.edges || []).map((edge, index) => ({
      id: edge.id || `e-${index + 1}`,
      from: String(edge.from),
      to: String(edge.to),
      label: edge.label || "",
    })),
  };
}

function SchemaViewer({
  title = "Схема",
  schema = "",
  graph = null,
  onGraphChange,
  allowEditing = true,
  height = 420,
}) {
  const mermaidRef = useRef(null);
  const graphRef = useRef(null);
  const [renderError, setRenderError] = useState("");

  const [localGraph, setLocalGraph] = useState(withDefaults(graph));
  const [connectMode, setConnectMode] = useState(false);
  const [connectFromNodeId, setConnectFromNodeId] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [dragState, setDragState] = useState(null);

  const isGraphMode = Boolean(graph && graph.nodes && graph.nodes.length);

  useEffect(() => {
    if (isGraphMode) {
      setLocalGraph(withDefaults(graph));
    }
  }, [graph, isGraphMode]);

  useEffect(() => {
    if (isGraphMode && onGraphChange) {
      onGraphChange(localGraph);
    }
  }, [isGraphMode, localGraph, onGraphChange]);

  useEffect(() => {
    let isCancelled = false;

    async function renderMermaid() {
      if (isGraphMode || !mermaidRef.current) {
        return;
      }

      if (!schema) {
        mermaidRef.current.innerHTML = "<em>Схема отсутствует</em>";
        setRenderError("");
        return;
      }

      try {
        const renderId = `mermaid-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const { svg } = await mermaid.render(renderId, schema);
        if (!isCancelled && mermaidRef.current) {
          mermaidRef.current.innerHTML = svg;
          setRenderError("");
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Mermaid render error:", error);
          setRenderError("Не удалось отрисовать Mermaid-схему.");
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = "";
          }
        }
      }
    }

    renderMermaid();

    return () => {
      isCancelled = true;
    };
  }, [schema, isGraphMode]);

  useEffect(() => {
    const moveHandler = (event) => {
      if (!dragState || !graphRef.current) {
        return;
      }

      const bounds = graphRef.current.getBoundingClientRect();
      const nextX = event.clientX - bounds.left - dragState.offsetX;
      const nextY = event.clientY - bounds.top - dragState.offsetY;
      const clampedX = Math.max(8, Math.min(nextX, bounds.width - NODE_WIDTH - 8));
      const clampedY = Math.max(8, Math.min(nextY, bounds.height - NODE_HEIGHT - 8));

      setLocalGraph((prev) => ({
        ...prev,
        nodes: prev.nodes.map((node) =>
          node.id === dragState.nodeId ? { ...node, x: clampedX, y: clampedY } : node
        ),
      }));
    };

    const upHandler = () => setDragState(null);

    window.addEventListener("pointermove", moveHandler);
    window.addEventListener("pointerup", upHandler);
    return () => {
      window.removeEventListener("pointermove", moveHandler);
      window.removeEventListener("pointerup", upHandler);
    };
  }, [dragState]);

  const nodeMap = useMemo(() => {
    const map = {};
    localGraph.nodes.forEach((node) => {
      map[node.id] = node;
    });
    return map;
  }, [localGraph.nodes]);

  const connectNodes = (fromId, toId) => {
    if (!fromId || !toId || fromId === toId) {
      return;
    }

    setLocalGraph((prev) => {
      const exists = prev.edges.some((edge) => edge.from === fromId && edge.to === toId);
      if (exists) {
        return prev;
      }
      return {
        ...prev,
        edges: [
          ...prev.edges,
          {
            id: `e-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            from: fromId,
            to: toId,
            label: "",
          },
        ],
      };
    });
  };

  const handleNodePointerDown = (event, nodeId) => {
    if (!allowEditing || !graphRef.current) {
      return;
    }
    const nodeRect = event.currentTarget.getBoundingClientRect();
    setDragState({
      nodeId,
      offsetX: event.clientX - nodeRect.left,
      offsetY: event.clientY - nodeRect.top,
    });
  };

  const handleNodeClick = (nodeId) => {
    setSelectedNodeId(nodeId);
    if (!allowEditing || !connectMode) {
      return;
    }
    if (!connectFromNodeId) {
      setConnectFromNodeId(nodeId);
      return;
    }
    connectNodes(connectFromNodeId, nodeId);
    setConnectFromNodeId(null);
  };

  const removeSelectedNode = () => {
    if (!selectedNodeId) {
      return;
    }
    setLocalGraph((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((node) => node.id !== selectedNodeId),
      edges: prev.edges.filter((edge) => edge.from !== selectedNodeId && edge.to !== selectedNodeId),
    }));
    setSelectedNodeId(null);
    setConnectFromNodeId(null);
  };

  return (
    <section style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>{title}</h3>
        {isGraphMode && allowEditing ? (
          <div style={styles.actions}>
            <button
              type="button"
              onClick={() => {
                setConnectMode((prev) => !prev);
                setConnectFromNodeId(null);
              }}
            >
              {connectMode ? "Выключить соединение" : "Режим соединения"}
            </button>
            <button type="button" onClick={removeSelectedNode} disabled={!selectedNodeId}>
              Удалить узел
            </button>
          </div>
        ) : null}
      </div>

      {renderError ? <div style={styles.error}>{renderError}</div> : null}

      {isGraphMode ? (
        <>
          <div ref={graphRef} style={{ ...styles.graphCanvas, height }}>
            <svg width="100%" height="100%" style={styles.svgLayer}>
              <defs>
                <marker
                  id="arrow"
                  markerWidth="10"
                  markerHeight="10"
                  refX="8"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L0,6 L9,3 z" fill="#6372a3" />
                </marker>
              </defs>
              {localGraph.edges.map((edge) => {
                const fromNode = nodeMap[edge.from];
                const toNode = nodeMap[edge.to];
                if (!fromNode || !toNode) {
                  return null;
                }

                const x1 = fromNode.x + NODE_WIDTH / 2;
                const y1 = fromNode.y + NODE_HEIGHT / 2;
                const x2 = toNode.x + NODE_WIDTH / 2;
                const y2 = toNode.y + NODE_HEIGHT / 2;
                const labelX = (x1 + x2) / 2;
                const labelY = (y1 + y2) / 2;

                return (
                  <g key={edge.id}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#6372a3" strokeWidth="2" markerEnd="url(#arrow)" />
                    {edge.label ? (
                      <text x={labelX} y={labelY - 6} fontSize="11" textAnchor="middle" fill="#2f3c63">
                        {edge.label}
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </svg>

            {localGraph.nodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const isConnectStart = connectFromNodeId === node.id;
              return (
                <button
                  key={node.id}
                  type="button"
                  style={{
                    ...styles.node,
                    left: node.x,
                    top: node.y,
                    background: node.color,
                    borderColor: isConnectStart ? "#7d4cff" : isSelected ? "#0f62fe" : "#b5c2ea",
                  }}
                  onPointerDown={(event) => handleNodePointerDown(event, node.id)}
                  onClick={() => handleNodeClick(node.id)}
                >
                  {node.label}
                </button>
              );
            })}
          </div>
          <div style={styles.hint}>
            Перетаскивайте узлы мышью. Для соединения включите режим, выберите первый и второй узел.
          </div>
        </>
      ) : (
        <div ref={mermaidRef} style={styles.mermaidCanvas} />
      )}
    </section>
  );
}

const styles = {
  container: {
    border: "1px solid #dde2f2",
    borderRadius: 12,
    padding: 16,
    background: "#fff",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  title: { margin: 0 },
  actions: { display: "flex", gap: 8, flexWrap: "wrap" },
  mermaidCanvas: {
    width: "100%",
    overflowX: "auto",
    minHeight: 120,
    padding: 8,
    background: "#f7f9ff",
    borderRadius: 8,
  },
  graphCanvas: {
    position: "relative",
    width: "100%",
    borderRadius: 8,
    border: "1px solid #c6cde5",
    background: "#f8faff",
    overflow: "hidden",
  },
  svgLayer: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
  },
  node: {
    position: "absolute",
    width: NODE_WIDTH,
    minHeight: NODE_HEIGHT,
    borderRadius: 10,
    border: "2px solid #b5c2ea",
    padding: 8,
    textAlign: "left",
    cursor: "grab",
    color: "#1d2947",
    fontWeight: 600,
  },
  hint: {
    marginTop: 8,
    color: "#46547d",
    fontSize: 13,
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
