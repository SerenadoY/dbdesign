import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      <div className="text-center max-w-md">
        <h1 className="text-[clamp(5rem,15vw,10rem)] font-black leading-[1] tracking-tight mb-2"
          style={{
            background: "var(--accent-gradient)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </h1>
        <p className="text-lg font-semibold mb-1">
          页面未找到
        </p>
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
          你可能输错了地址，或者这个页面已经被移除了。
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
            style={{ backgroundColor: "var(--accent)" }}
          >
            返回首页
          </button>
          <button
            onClick={() => navigate(-1)}
            className="rounded-full border px-6 py-2.5 text-sm font-medium transition-all duration-200 hover:opacity-80 active:scale-[0.97]"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            后退
          </button>
        </div>
      </div>
    </main>
  );
}
