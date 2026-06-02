import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { reverseEngineerPostgres } from "../api/reverse";

export default function ReverseEngineeringModal({ onClose }) {
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState("5432");
  const [database, setDatabase] = useState("");
  const [user, setUser] = useState("postgres");
  const [password, setPassword] = useState("");
  const [schema, setSchema] = useState("public");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!database.trim()) {
      setError("请输入数据库名称");
      return;
    }

    setLoading(true);
    try {
      const result = await reverseEngineerPostgres({
        host: host.trim(),
        port: port.trim(),
        database: database.trim(),
        user: user.trim(),
        password,
        schema: schema.trim(),
      });
      navigate(`/editor/diagrams/${result.diagram.id}`);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "连接失败，请检查配置");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-6 shadow-2xl"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          逆向工程
        </h2>
        <p className="mb-5 text-xs" style={{ color: "var(--text-muted)" }}>
          输入 PostgreSQL 连接信息，自动生成 ER 图
        </p>

        {error && (
          <div
            className="mb-4 rounded-xl px-4 py-2.5 text-sm"
            style={{
              backgroundColor: "rgba(239,68,68,0.1)",
              color: "var(--danger)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>主机</label>
              <input
                type="text" value={host}
                onChange={(e) => setHost(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--bg-primary)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
                required
              />
            </div>
            <div className="w-24">
              <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>端口</label>
              <input
                type="text" value={port}
                onChange={(e) => setPort(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--bg-primary)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>数据库名</label>
            <input
              type="text" value={database}
              onChange={(e) => setDatabase(e.target.value)}
              placeholder="mydb"
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
              style={{
                backgroundColor: "var(--bg-primary)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>用户名</label>
            <input
              type="text" value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
              style={{
                backgroundColor: "var(--bg-primary)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>密码</label>
            <input
              type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
              style={{
                backgroundColor: "var(--bg-primary)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Schema（可选，默认 public）</label>
            <input
              type="text" value={schema}
              onChange={(e) => setSchema(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
              style={{
                backgroundColor: "var(--bg-primary)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {loading ? "连接中..." : "开始导入"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:opacity-80"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
