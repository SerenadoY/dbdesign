import { useState, useEffect, useRef, useCallback } from "react";
import { searchUsers } from "../../../api/users";
import {
  getCollaborators,
  addCollaborator,
  removeCollaborator,
} from "../../../api/diagrams";
import { useParams } from "react-router-dom";

const COLORS = [
  "#00d4aa", "#3b82f6", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16",
];

function hashColor(str) {
  let hash = 0;
  for (let i = 0; i < (str || "").length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function CollabInvite({ setModal }) {
  const { id: diagramId } = useParams();
  const [collaborators, setCollaborators] = useState([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const loadCollaborators = useCallback(async () => {
    try {
      const list = await getCollaborators(diagramId);
      setCollaborators(list);
    } catch (err) {
      console.error("Failed to load collaborators:", err);
    }
  }, [diagramId]);

  useEffect(() => {
    loadCollaborators();
    if (inputRef.current) inputRef.current.focus();
  }, [loadCollaborators]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const users = await searchUsers(query.trim());
        setResults(users);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleAdd = async (user) => {
    try {
      await addCollaborator(diagramId, user.id);
      await loadCollaborators();
      setQuery("");
      setResults([]);
      setShowResults(false);
    } catch (err) {
      console.error("Failed to add collaborator:", err);
    }
  };

  const handleRemove = async (user) => {
    try {
      await removeCollaborator(diagramId, user.id);
      await loadCollaborators();
    } catch (err) {
      console.error("Failed to remove collaborator:", err);
    }
  };

  const alreadyAdded = (userId) => collaborators.some((c) => c.id === userId);

  return (
    <div style={{ minWidth: 400, maxWidth: 480 }}>
      <h3 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
        邀请协作者
      </h3>

      <div className="relative mb-4">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入用户名搜索..."
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors"
          style={{
            backgroundColor: "var(--bg-primary)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
          onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
          onBlur={(e) => {
            e.target.style.borderColor = "var(--border)";
            setTimeout(() => setShowResults(false), 200);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results.length > 0 && !alreadyAdded(results[0].id)) {
              handleAdd(results[0]);
            }
          }}
        />
        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
            style={{ color: "var(--text-muted)" }}>搜索中...</span>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div
          className="mb-4 rounded-lg border max-h-40 overflow-y-auto"
          style={{
            backgroundColor: "var(--bg-elevated)",
            borderColor: "var(--border)",
          }}
        >
          {results.map((u) => {
            const added = alreadyAdded(u.id);
            return (
              <div
                key={u.id}
                className="flex items-center justify-between px-3 py-2 cursor-pointer transition-colors"
                style={{ borderBottom: "1px solid var(--border)" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--bg-surface)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                onClick={() => !added && handleAdd(u)}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold"
                    style={{ backgroundColor: hashColor(u.username), color: "#fff" }}
                  >
                    {(u.display_name || u.username).charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                    {u.display_name || u.username}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    @{u.username}
                  </span>
                </div>
                {added ? (
                  <span className="text-xs" style={{ color: "var(--accent)" }}>已加入</span>
                ) : (
                  <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>邀请</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showResults && results.length === 0 && query.trim() && !searching && (
        <p className="mb-4 text-xs" style={{ color: "var(--text-muted)" }}>未找到匹配的用户</p>
      )}

      <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
        当前协作者 ({collaborators.length})
      </p>
      <div className="space-y-1 max-h-60 overflow-y-auto">
        {collaborators.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-lg px-3 py-2"
            style={{ backgroundColor: "var(--bg-surface)" }}
          >
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold"
                style={{ backgroundColor: c.avatar_color || hashColor(c.username), color: "#fff" }}
              >
                {(c.display_name || c.username).charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                  {c.display_name || c.username}
                </span>
                {c.role === "owner" && (
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: "rgba(0,212,170,0.1)", color: "var(--accent)" }}
                  >创建者</span>
                )}
                {c.role === "editor" && (
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: "rgba(59,130,246,0.1)", color: "#3b82f6" }}
                  >编辑者</span>
                )}
              </div>
            </div>
            {c.role !== "owner" && (
              <button
                onClick={() => handleRemove(c)}
                className="text-xs transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => { e.target.style.color = "var(--danger)"; }}
                onMouseLeave={(e) => { e.target.style.color = "var(--text-muted)"; }}
              >
                移除
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
