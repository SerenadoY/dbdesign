import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function UserMenu() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {user?.display_name || user?.username}
      </span>
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium text-white"
        style={{ backgroundColor: user?.avatar_color || "var(--accent)" }}
      >
        {(user?.display_name || user?.username || "?")[0].toUpperCase()}
      </div>
      <button
        onClick={handleLogout}
        className="text-sm transition-colors hover:opacity-80"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={(e) => { e.target.style.color = "var(--accent)"; }}
        onMouseLeave={(e) => { e.target.style.color = "var(--text-muted)"; }}
      >
        退出
      </button>
    </div>
  );
}
