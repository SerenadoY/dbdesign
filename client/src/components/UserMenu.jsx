import { useContext, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function Spinner() {
  return (
    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function UserMenu() {
  const { user, logout } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleLogout = async () => {
    setBusy(true);
    await logout();
    setBusy(false);
    navigate("/login");
  };

  const initial = (user?.display_name || user?.username || "?")[0].toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 cursor-pointer transition-all duration-200 hover:opacity-80"
        aria-label="用户菜单"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="text-sm hidden sm:inline" style={{ color: "var(--text-secondary)" }}>
          {user?.display_name || user?.username}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium text-white transition-all duration-200"
          style={{ backgroundColor: user?.avatar_color || "var(--accent)" }}
        >
          {initial}
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-lg overflow-hidden z-50"
          style={{
            backgroundColor: "var(--bg-elevated)",
            borderColor: "var(--border)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
          }}
          role="menu"
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
            <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
              {user?.display_name || user?.username}
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
              {user?.email || user?.username}
            </p>
          </div>
          <button
            onClick={() => { setOpen(false); navigate("/dashboard"); }}
            className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:opacity-80 flex items-center gap-2"
            style={{ color: "var(--text-secondary)" }}
            role="menuitem"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            工作台
          </button>
          <div className="border-t" style={{ borderColor: "var(--border)" }} />
          <button
            onClick={handleLogout}
            disabled={busy}
            className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:opacity-80 disabled:opacity-40 flex items-center gap-2"
            style={{ color: "var(--danger)" }}
            role="menuitem"
          >
            {busy ? <Spinner /> : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            )}
            {busy ? "退出中..." : "退出登录"}
          </button>
        </div>
      )}
    </div>
  );
}
