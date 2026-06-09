import { useState, useContext, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const usernameRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError("");
    if (username.length < 3) {
      setError("用户名至少需要 3 个字符");
      usernameRef.current?.focus();
      return;
    }
    if (password.length < 6) {
      setError("密码至少需要 6 个字符");
      return;
    }
    setBusy(true);
    try {
      await register(username, password, displayName || username);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "注册失败，请重试");
      usernameRef.current?.focus();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div
        className="pointer-events-none fixed inset-0 opacity-30"
        style={{
          backgroundImage: "radial-gradient(rgba(0,212,170,0.15) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div
        className="relative w-full max-w-md rounded-2xl border p-8 shadow-2xl"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: "var(--accent-dim)", color: "var(--accent)" }}
          >
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>DBDesign</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>创建新账号</p>
        </div>

        {error && (
          <div
            className="mb-4 rounded-lg px-4 py-3 text-sm flex items-start gap-2"
            role="alert"
            aria-live="polite"
            style={{
              backgroundColor: "rgba(239,68,68,0.1)",
              color: "var(--danger)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <svg className="h-4 w-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-5">
            <div>
              <label htmlFor="reg-username" className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                用户名 <span aria-label="必填" style={{color:"var(--danger)"}}>*</span>
              </label>
              <input
                id="reg-username"
                ref={usernameRef}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-sm"
                style={{
                  backgroundColor: "var(--bg-primary)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
                placeholder="至少 3 个字符"
                autoComplete="username"
                required
                minLength={3}
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="reg-display" className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                显示名称
              </label>
              <input
                id="reg-display"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-sm"
                style={{
                  backgroundColor: "var(--bg-primary)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
                placeholder="选填，默认使用用户名"
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="reg-password" className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                密码 <span aria-label="必填" style={{color:"var(--danger)"}}>*</span>
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border px-4 py-2.5 pr-10 text-sm outline-none transition-all duration-200 placeholder:text-sm"
                  style={{
                    backgroundColor: "var(--bg-primary)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
                  placeholder="至少 6 个字符"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ color: "var(--text-muted)" }}
                  aria-label={showPw ? "隐藏密码" : "显示密码"}
                  tabIndex={-1}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    {showPw ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={busy}
              aria-busy={busy}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 inline-flex items-center justify-center gap-2"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {busy ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  注册中...
                </>
              ) : "注册"}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          已有账号？
          <Link
            to="/login"
            className="ml-1 font-medium transition-colors hover:opacity-80"
            style={{ color: "var(--accent)" }}
          >
            登录
          </Link>
        </p>
      </div>
    </div>
  );
}
