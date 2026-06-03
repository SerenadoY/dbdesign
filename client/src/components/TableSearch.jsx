import { useState, useRef, useEffect, useCallback } from "react";
import { useDiagram, useTransform } from "../hooks";

export default function TableSearch() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const { tables } = useDiagram();
  const { setTransform } = useTransform();

  const results = query.trim()
    ? tables.filter((t) =>
        t.name.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : [];

  const visible = focused && results.length > 0;

  const navigateTo = useCallback(
    (tableId) => {
      const table = tables.find((t) => t.id === tableId);
      if (!table) return;
      setTransform({ pan: { x: -table.x + window.innerWidth / 2 - 150, y: -table.y + 100 }, zoom: 1 });
      setQuery("");
      setFocused(false);
      inputRef.current?.blur();
    },
    [tables, setTransform],
  );

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIdx]) navigateTo(results[selectedIdx].id);
    } else if (e.key === "Escape") {
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  return (
    <div className="relative" style={{ width: 200 }}>
      <div className="relative">
        <svg
          className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          style={{ color: "var(--text-muted)" }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setFocused(true); }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder="搜索表格..."
          className="w-full rounded-lg border py-1.5 pl-8 pr-3 text-xs outline-none transition-all duration-200"
          style={{
            backgroundColor: "var(--bg-primary)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
        />
      </div>
      {visible && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full z-50 mt-1 w-64 rounded-xl border py-1 shadow-lg"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border)",
          }}
        >
          {results.map((t, i) => (
            <button
              key={t.id}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors"
              style={{
                backgroundColor: i === selectedIdx ? "var(--accent-dim)" : "transparent",
                color: "var(--text-primary)",
              }}
              onMouseDown={(e) => { e.preventDefault(); navigateTo(t.id); }}
              onMouseEnter={() => setSelectedIdx(i)}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: t.color }}
              />
              <span className="truncate">{t.name}</span>
              <span className="shrink-0 text-xs" style={{ color: "var(--text-muted)" }}>
                {t.fields.length} 字段
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
