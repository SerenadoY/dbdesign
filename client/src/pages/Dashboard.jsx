import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { listDiagrams, createDiagram, deleteDiagram, copyDiagram } from "../api/diagrams";
import UserMenu from "../components/UserMenu";
import ReverseEngineeringModal from "../components/ReverseEngineeringModal";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [diagrams, setDiagrams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showReverse, setShowReverse] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [search, setSearch] = useState("");
  const [filterDb, setFilterDb] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    listDiagrams()
      .then(setDiagrams)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    const diagram = await createDiagram(newTitle || "未命名设计", "mysql", {
      tables: [], relationships: [], notes: [],
      subjectAreas: [], types: [], enums: [],
      title: newTitle || "未命名设计", database: "mysql",
    });
    setShowCreate(false);
    setNewTitle("");
    navigate(`/editor/diagrams/${diagram.id}`);
  };

  const dbTypes = [...new Set(diagrams.map((d) => d.database_type || "mysql"))];

  const filtered = diagrams.filter((d) => {
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase());
    const matchDb = !filterDb || (d.database_type || "mysql") === filterDb;
    return matchSearch && matchDb;
  });

  const handleCopy = async (id, e) => {
    e.stopPropagation();
    const diagram = await copyDiagram(id);
    setDiagrams((prev) => [diagram, ...prev]);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("确定删除此设计文稿？")) return;
    await deleteDiagram(id);
    setDiagrams((prev) => prev.filter((d) => d.id !== id));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "var(--bg-primary)" }}>
        <p style={{ color: "var(--text-muted)" }}>加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)" }}>
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ backgroundColor: "var(--accent-dim)", color: "var(--accent)" }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
          </div>
          <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>DBDesign</h1>
        </div>
        <UserMenu />
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>我的设计文稿</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setShowReverse(true)}
              className="rounded-xl border px-5 py-2 text-sm font-medium transition-all duration-200 hover:opacity-80 active:scale-[0.97]"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              逆向数据库
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
              style={{ backgroundColor: "var(--accent)" }}
            >
              + 新建文稿
            </button>
          </div>
        </div>

        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              style={{ color: "var(--text-muted)" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="text" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索文稿名称..."
              className="w-full rounded-xl border px-10 py-2.5 text-sm outline-none transition-all duration-200"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
            />
          </div>
          <select
            value={filterDb}
            onChange={(e) => setFilterDb(e.target.value)}
            className="rounded-xl border px-4 py-2.5 text-sm outline-none"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">全部数据库</option>
            {dbTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {showCreate && (
          <div
            className="mb-6 rounded-2xl border p-5"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border)",
            }}
          >
            <h3 className="mb-3 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>新建设计文稿</h3>
            <input
              type="text" value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="输入文稿名称"
              className="mb-4 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-sm"
              style={{
                backgroundColor: "var(--bg-primary)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
              onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
                style={{ backgroundColor: "var(--accent)" }}
              >
                创建
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-xl border px-5 py-2 text-sm font-medium transition-all duration-200 hover:opacity-80"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text-secondary)",
                }}
              >
                取消
              </button>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div
            className="rounded-2xl border p-16 text-center"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border)",
              color: "var(--text-muted)",
            }}
          >
            {diagrams.length === 0 ? "还没有设计文稿，点击「新建文稿」开始创建" : "没有匹配的文稿"}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((d) => (
              <div
                key={d.id}
                onClick={() => navigate(`/editor/diagrams/${d.id}`)}
                className="group cursor-pointer rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-1"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
              >
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>{d.title}</h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleCopy(d.id, e)}
                      className="text-xs leading-none transition-colors rounded px-1.5 py-1"
                      style={{ color: "var(--text-muted)" }}
                      onMouseEnter={(e) => { e.target.style.color = "var(--accent)"; }}
                      onMouseLeave={(e) => { e.target.style.color = "var(--text-muted)"; }}
                      title="复制"
                    >
                      复制
                    </button>
                    <button
                      onClick={(e) => handleDelete(d.id, e)}
                      className="text-lg leading-none transition-colors"
                      style={{ color: "var(--text-muted)" }}
                      onMouseEnter={(e) => { e.target.style.color = "var(--danger)"; }}
                      onMouseLeave={(e) => { e.target.style.color = "var(--text-muted)"; }}
                      title="删除"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    数据库: {d.database_type || "mysql"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    更新于 {new Date(d.updated_at).toLocaleString("zh-CN")}
                  </p>
                   <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                     创建者: {d.owner_id === user?.id ? "我" : d.owner_display_name || "协作者"}
                   </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {showReverse && (
          <ReverseEngineeringModal onClose={() => setShowReverse(false)} />
        )}
      </main>
    </div>
  );
}
