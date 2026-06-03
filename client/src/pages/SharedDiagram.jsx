import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { getSharedDiagram } from "../api/share";

export default function SharedDiagram() {
  const { token } = useParams();
  const [diagramId, setDiagramId] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getSharedDiagram(token)
      .then((d) => setDiagramId(d.diagramId))
      .catch(() => setError(true));
  }, [token]);

  if (error) return <div className="flex min-h-screen items-center justify-center" style={{ color: "var(--text-muted)" }}>分享链接无效或已过期</div>;
  if (!diagramId) return <div className="flex min-h-screen items-center justify-center" style={{ color: "var(--text-muted)" }}>加载中...</div>;

  return <Navigate to={`/editor/diagrams/${diagramId}?view=shared&token=${token}`} replace />;
}
