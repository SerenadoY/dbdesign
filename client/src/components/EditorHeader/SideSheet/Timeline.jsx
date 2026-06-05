import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Spin, List } from "@douyinfe/semi-ui";
import { useUndoRedo } from "../../../hooks";
import { getOperations } from "../../../api/versions";
import { DateTime } from "luxon";

const OP_LABELS = {
  create: "创建",
  delete: "删除",
  update: "更新",
};

function getOpLabel(op) {
  try {
    const parsed = typeof op === "string" ? JSON.parse(op) : op;
    const target = parsed?.target || "";
    const action = parsed?.action || "";
    const entity = parsed?.entityId || "";
    const label = OP_LABELS[action] || action;
    const name = typeof entity === "string" ? entity.substring(0, 8) : "";
    return `${label} ${target} ${name}`.trim();
  } catch {
    return "操作";
  }
}

export default function Timeline() {
  const { id: diagramId } = useParams();
  const { undoStack } = useUndoRedo();
  const { t, i18n } = useTranslation();
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!diagramId) return;
    setLoading(true);
    getOperations(diagramId, 100)
      .then(setOperations)
      .catch(() => setOperations([]))
      .finally(() => setLoading(false));
  }, [diagramId]);

  if (loading) {
    return (
      <div className="m-5 text-center" style={{ color: "var(--text-muted)" }}>
        <Spin size="small" />
      </div>
    );
  }

  if (operations.length > 0) {
    return (
      <List>
        {operations.map((op, i) => (
          <List.Item
            key={op.id || i}
            style={{ padding: "4px 18px 4px 18px" }}
            className="hover-1"
          >
            <div className="flex items-center py-1 w-full">
              <i className="block fa-regular fa-circle fa-xs" style={{ color: "var(--text-muted)" }} />
              <div className="ms-2 flex-1 min-w-0">
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                  {getOpLabel(op.operation)}
                </span>
                <span className="ms-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  {op.user_name || ""}
                </span>
              </div>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {DateTime.fromISO(op.created_at)
                  .setLocale(i18n.language)
                  .toRelative()}
              </span>
            </div>
          </List.Item>
        ))}
      </List>
    );
  }

  if (undoStack.length > 0) {
    return (
      <List>
        {[...undoStack].reverse().map((e, i) => (
          <List.Item
            key={i}
            style={{ padding: "4px 18px 4px 18px" }}
            className="hover-1"
          >
            <div className="flex items-center py-1 w-full">
              <i className="block fa-regular fa-circle fa-xs" />
              <div className="ms-2">{e.message}</div>
            </div>
          </List.Item>
        ))}
      </List>
    );
  }

  return <div className="m-5" style={{ color: "var(--text-muted)" }}>{t("no_activity")}</div>;
}
