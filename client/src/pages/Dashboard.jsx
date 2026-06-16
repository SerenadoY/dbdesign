import { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { listDiagrams, createDiagram, deleteDiagram, copyDiagram, getTrashedDiagrams, restoreDiagram, forceDeleteDiagram } from "../api/diagrams";
import UserMenu from "../components/UserMenu";
import ReverseEngineeringModal from "../components/ReverseEngineeringModal";
import SQLImportModal from "../components/SQLImportModal";
import { Toast } from "@douyinfe/semi-ui";

function Spinner({ className = "h-4 w-4" }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function SkeletonCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border p-5" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <div className="flex items-start justify-between mb-3">
            <div className="skeleton h-5 w-28" style={{ backgroundColor: "var(--bg-elevated)" }} />
            <div className="skeleton h-4 w-10" style={{ backgroundColor: "var(--bg-elevated)" }} />
          </div>
          <div className="space-y-2">
            <div className="skeleton h-3 w-36" style={{ backgroundColor: "var(--bg-elevated)" }} />
            <div className="skeleton h-3 w-44" style={{ backgroundColor: "var(--bg-elevated)" }} />
            <div className="skeleton h-3 w-24" style={{ backgroundColor: "var(--bg-elevated)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DialogBox({ open, title, message, confirmLabel, onConfirm, onCancel }) {
  const [busy, setBusy] = useState(false);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={onCancel} />
      <div className="relative rounded-xl border p-6 max-w-sm w-full shadow-2xl" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{title}</h3>
        <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} disabled={busy}
            className="rounded-xl border px-4 py-2 text-sm font-medium transition-all hover:opacity-80 disabled:opacity-40"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >取消</button>
          <button onClick={async () => { setBusy(true); await onConfirm(); setBusy(false); }} disabled={busy}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-2"
            style={{ backgroundColor: "var(--danger)" }}
          >{busy && <Spinner />}{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [diagrams, setDiagrams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [trashed, setTrashed] = useState([]);
  const [showTrash, setShowTrash] = useState(false);
  const [showReverse, setShowReverse] = useState(false);
  const [showSQLImport, setShowSQLImport] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [search, setSearch] = useState("");
  const [filterDb, setFilterDb] = useState("");
  const [sortBy, setSortBy] = useState("updated_desc");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busyIds, setBusyIds] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    listDiagrams()
      .then(setDiagrams)
      .catch(console.error)
      .finally(() => setLoading(false));
    loadTrash();
  }, []);

  const handleCreate = async () => {
    const diagram = await createDiagram(newTitle || "未命名设计", "mysql", {
      tables: [], relationships: [], notes: [],
      subjectAreas: [], types: [], enums: [],
      title: newTitle || "未命名设计", database: "mysql",
    });
    setShowCreate(false);
    setNewTitle("");
    Toast.success("已创建");
    navigate(`/editor/diagrams/${diagram.id}`);
  };

  const dbTypes = [...new Set(diagrams.map((d) => d.database_type || "mysql"))];

  const filtered = useMemo(() => {
    let list = diagrams.filter((d) => {
      const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase());
      const matchDb = !filterDb || (d.database_type || "mysql") === filterDb;
      return matchSearch && matchDb;
    });
    switch (sortBy) {
      case "title_asc": list.sort((a, b) => a.title.localeCompare(b.title)); break;
      case "title_desc": list.sort((a, b) => b.title.localeCompare(a.title)); break;
      case "created_asc": list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); break;
      case "created_desc": list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break;
      case "updated_asc": list.sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at)); break;
      default: list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)); break;
    }
    return list;
  }, [diagrams, search, filterDb, sortBy]);

  const loadTrash = async () => {
    try { setTrashed(await getTrashedDiagrams()); } catch {}
  };

  const handleRestore = async (id, e) => {
    e.stopPropagation();
    markBusy(id);
    await restoreDiagram(id);
    setTrashed((prev) => prev.filter((d) => d.id !== id));
    listDiagrams().then(setDiagrams).catch(console.error);
    Toast.success("已恢复");
    clearBusy(id);
  };

  const handleForceDelete = async (id, e) => {
    e.stopPropagation();
    markBusy(id);
    await forceDeleteDiagram(id);
    setTrashed((prev) => prev.filter((d) => d.id !== id));
    Toast.success("已永久删除");
    clearBusy(id);
  };

  const handleCopy = async (id, e) => {
    e.stopPropagation();
    markBusy(id);
    const diagram = await copyDiagram(id);
    setDiagrams((prev) => [diagram, ...prev]);
    Toast.success("已复制");
    clearBusy(id);
  };

  const getTableCount = (d) => {
    try { return JSON.parse(d.diagram_data || "{}").tables?.length || 0; } catch { return 0; }
  };

  const handleDeleteRequest = (id, e) => {
    e.stopPropagation();
    setConfirmDelete(id);
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    await deleteDiagram(confirmDelete);
    setDiagrams((prev) => prev.filter((d) => d.id !== confirmDelete));
    await loadTrash();
    setConfirmDelete(null);
    Toast.success("已移至回收站");
  };

  const markBusy = (id) => setBusyIds((prev) => new Set(prev).add(id));
  const clearBusy = (id) => setBusyIds((prev) => { const n = new Set(prev); n.delete(id); return n; });

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)" }}>
        <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="skeleton h-9 w-9 rounded-lg" style={{ backgroundColor: "var(--bg-elevated)" }} />
            <div className="skeleton h-5 w-28" style={{ backgroundColor: "var(--bg-elevated)" }} />
          </div>
          <div className="skeleton h-8 w-24 rounded-lg" style={{ backgroundColor: "var(--bg-elevated)" }} />
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">
          <SkeletonCards />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)" }}>
      <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--accent-dim)", color: "var(--accent)" }}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
          </div>
          <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>DBDesign</h1>
        </div>
        <UserMenu />
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>我的设计文稿</h2>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: "var(--accent-dim)", color: "var(--accent)" }}>
              {search || filterDb ? `显示 ${filtered.length} / ${diagrams.length} 个` : `共 ${filtered.length} 个`}
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowSQLImport(true)}
              className="rounded-xl border px-5 py-2 text-sm font-medium transition-all duration-200 hover:opacity-80 active:scale-[0.97]"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              aria-label="导入 SQL 文件"
            >
              <svg className="h-4 w-4 inline mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              导入 SQL
            </button>
            <button onClick={() => setShowReverse(true)}
              className="rounded-xl border px-5 py-2 text-sm font-medium transition-all duration-200 hover:opacity-80 active:scale-[0.97]"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              aria-label="从已有数据库逆向导入"
            >
              <svg className="h-4 w-4 inline mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
              逆向数据库
            </button>
            <button onClick={() => setShowCreate(true)}
              className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
              style={{ backgroundColor: "var(--accent)" }}
            >
              <svg className="h-4 w-4 inline mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              新建文稿
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--text-muted)" }} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input type="text" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索文稿名称..."
              className="w-full rounded-xl border py-2.5 text-sm outline-none transition-all duration-200"
              style={{
                backgroundColor: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)",
                paddingLeft: "2.5rem", paddingRight: search ? "2.25rem" : "1rem",
              }}
              onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
              aria-label="搜索文稿"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 transition-colors hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
                aria-label="清除搜索"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <select value={filterDb}
            onChange={(e) => setFilterDb(e.target.value)}
            className="rounded-xl border px-4 py-2.5 text-sm outline-none"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            aria-label="按数据库类型筛选"
          >
            <option value="">全部数据库</option>
            {dbTypes.map((t) => (<option key={t} value={t}>{t}</option>))}
          </select>
          <select value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border px-3 py-2.5 text-sm outline-none"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            aria-label="排序方式"
          >
            <option value="updated_desc">最新更新</option>
            <option value="updated_asc">最早更新</option>
            <option value="created_desc">最近创建</option>
            <option value="created_asc">最早创建</option>
            <option value="title_asc">名称 A-Z</option>
            <option value="title_desc">名称 Z-A</option>
          </select>
        </div>

        {showCreate && (
          <div className="mb-6 rounded-2xl border p-5"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            <h3 className="mb-3 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>新建设计文稿</h3>
            <input type="text" value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="输入文稿名称"
              className="mb-4 w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-sm"
              style={{
                backgroundColor: "var(--bg-primary)", borderColor: "var(--border)", color: "var(--text-primary)",
              }}
              onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              aria-label="新文稿名称"
            />
            <div className="flex gap-2">
              <button onClick={handleCreate}
                className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
                style={{ backgroundColor: "var(--accent)" }}
              >创建</button>
              <button onClick={() => setShowCreate(false)}
                className="rounded-xl border px-5 py-2 text-sm font-medium transition-all duration-200 hover:opacity-80"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >取消</button>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-2xl border p-16 text-center"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            {diagrams.length === 0 ? (
              <div className="flex flex-col items-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--accent-dim)" }}>
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} style={{ color: "var(--accent)" }} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>还没有设计文稿</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>新建文稿或从已有数据库逆向导入</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setShowCreate(true)}
                    className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
                    style={{ backgroundColor: "var(--accent)" }}
                  >
                    <svg className="h-4 w-4 inline mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    新建文稿
                  </button>
                  <button onClick={() => setShowReverse(true)}
                    className="rounded-xl border px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:opacity-80"
                    style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                  >逆向数据库</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: "var(--text-muted)" }} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
                <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  没有匹配「{search}」的文稿
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  试试其他关键词，或清除筛选条件
                </p>
                <button onClick={() => { setSearch(""); setFilterDb(""); }}
                  className="rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 hover:opacity-80"
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                >清除筛选</button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((d) => {
              const isBusy = busyIds.has(d.id);
              return (
                <div key={d.id} role="button" tabIndex={0}
                  onClick={() => navigate(`/editor/diagrams/${d.id}`)}
                  onKeyDown={(e) => e.key === "Enter" && navigate(`/editor/diagrams/${d.id}`)}
                  className="group cursor-pointer rounded-2xl border p-5 transition-all duration-200"
                  style={{
                    backgroundColor: "var(--bg-surface)", borderColor: "var(--border)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,212,170,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <h3 className="font-semibold truncate pr-2" style={{ color: "var(--text-primary)" }} title={d.title}>{d.title}</h3>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={(e) => handleCopy(d.id, e)}
                        disabled={isBusy}
                        className="rounded px-1.5 py-1 text-xs font-medium transition-colors hover:opacity-80 disabled:opacity-40"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={(e) => { if (!isBusy) e.target.style.color = "var(--accent)"; }}
                        onMouseLeave={(e) => { e.target.style.color = "var(--text-muted)"; }}
                        aria-label={`复制 ${d.title}`}
                      >
                        {isBusy ? <Spinner className="h-3 w-3" /> : "复制"}
                      </button>
                      <button
                        onClick={(e) => handleDeleteRequest(d.id, e)}
                        className="rounded p-1 transition-colors hover:opacity-80"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={(e) => { e.target.style.color = "var(--danger)"; }}
                        onMouseLeave={(e) => { e.target.style.color = "var(--text-muted)"; }}
                        aria-label={`删除 ${d.title}`}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      数据库: {d.database_type || "mysql"} · {getTableCount(d)} 张表
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      更新于 {new Date(d.updated_at).toLocaleString("zh-CN")}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      创建者: {d.owner_id === user?.id ? "我" : d.owner_display_name || "协作者"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {trashed.length > 0 && (
          <div className="mt-10">
            <button onClick={() => setShowTrash(!showTrash)}
              className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
              aria-expanded={showTrash}
              aria-controls="trash-panel"
            >
              <svg className={`h-3 w-3 transition-transform ${showTrash ? "rotate-0" : "-rotate-90"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
              回收站（{trashed.length}）
            </button>
            {showTrash && (
              <div id="trash-panel" className="mt-3 space-y-2">
                {trashed.map((d) => {
                  const isBusy = busyIds.has(d.id);
                  return (
                    <div key={d.id}
                      className="flex items-center justify-between rounded-xl border px-4 py-3"
                      style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
                    >
                      <div className="min-w-0">
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{d.title}</span>
                        <span className="ml-3 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                          删除于 {new Date(d.deleted_at).toLocaleString("zh-CN")}
                        </span>
                      </div>
                      <div className="flex gap-2 flex-shrink-0 ml-3">
                        <button onClick={(e) => handleRestore(d.id, e)}
                          disabled={isBusy}
                          className="rounded-lg border px-3 py-1 text-xs font-medium transition-all hover:opacity-80 disabled:opacity-40 inline-flex items-center gap-1"
                          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                          aria-label={`恢复 ${d.title}`}
                        >{isBusy ? <Spinner className="h-3 w-3" /> : null}恢复</button>
                        <button onClick={(e) => handleForceDelete(d.id, e)}
                          disabled={isBusy}
                          className="rounded-lg border px-3 py-1 text-xs font-medium transition-all hover:opacity-80 disabled:opacity-40"
                          style={{ borderColor: "rgba(239,68,68,0.3)", color: "var(--danger)" }}
                          aria-label={`永久删除 ${d.title}`}
                        >永久删除</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {showReverse && <ReverseEngineeringModal onClose={() => setShowReverse(false)} />}
        <SQLImportModal open={showSQLImport} onClose={() => setShowSQLImport(false)} />
      </main>

      <DialogBox
        open={!!confirmDelete}
        title="删除设计文稿"
        message="确定删除此设计文稿？删除后可在回收站中恢复。"
        confirmLabel="删除"
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
