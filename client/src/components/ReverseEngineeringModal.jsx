import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { reverseEngineerDatabase, testConnection } from "../api/reverse";

const DB_TYPES = [
  { value: "postgresql", label: "PostgreSQL", defaultPort: "5432", defaultUser: "postgres", hasSchema: true, defaultSchema: "public" },
  { value: "mysql", label: "MySQL", defaultPort: "3306", defaultUser: "root", hasSchema: false },
];

export default function ReverseEngineeringModal({ onClose }) {
  const [dbType, setDbType] = useState(DB_TYPES[0]);
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState(dbType.defaultPort);
  const [database, setDatabase] = useState("");
  const [user, setUser] = useState(dbType.defaultUser);
  const [password, setPassword] = useState("");
  const [schema, setSchema] = useState(dbType.defaultSchema || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const navigate = useNavigate();

  const switchDbType = (type) => {
    setDbType(type);
    setPort(type.defaultPort);
    setUser(type.defaultUser);
    if (type.hasSchema) setSchema(type.defaultSchema);
  };

  const handleTest = async () => {
    if (!database.trim()) { setTestResult({ success: false, error: "请先输入数据库名" }); return; }
    setTesting(true);
    setTestResult(null);
    setError("");
    try {
      const res = await testConnection({
        dbType: dbType.value,
        host: host.trim(), port: port.trim(), database: database.trim(),
        user: user.trim(), password,
      });
      setTestResult(res);
    } catch (err) {
      setTestResult({ success: false, error: err.response?.data?.error || err.message || "连接测试失败" });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!database.trim()) {
      setError("请输入数据库名称");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        dbType: dbType.value,
        host: host.trim(),
        port: port.trim(),
        database: database.trim(),
        user: user.trim(),
        password,
      };
      if (dbType.hasSchema) payload.schema = schema.trim();
      const result = await reverseEngineerDatabase(payload);
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
          连接已有数据库，自动生成 ER 图
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
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>数据库类型</label>
            <div className="flex gap-2">
              {DB_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => switchDbType(t)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    dbType.value === t.value ? "ring-2" : "opacity-60 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: "var(--bg-primary)",
                    borderColor: dbType.value === t.value ? "var(--accent)" : "var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

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

          {dbType.hasSchema && (
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Schema（可选，默认 {dbType.defaultSchema}）</label>
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
          )}

          {testResult && (
            <div
              className="rounded-xl px-4 py-2 text-sm flex items-center gap-2"
              style={{
                backgroundColor: testResult.success ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                color: testResult.success ? "var(--success, #10b981)" : "var(--danger)",
                border: `1px solid ${testResult.success ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
              }}
            >
              <i className={`fa-solid fa-${testResult.success ? "check" : "xmark"} fa-xs`} />
              {testResult.success ? "连接成功" : testResult.error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={loading || testing}
              className="rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:opacity-80 disabled:opacity-50"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              {testing ? "测试中..." : "测试连接"}
            </button>
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
