import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import mysql_icon from "../assets/mysql.png";
import postgres_icon from "../assets/postgres.png";
import sqlite_icon from "../assets/sqlite.png";
import mariadb_icon from "../assets/mariadb.png";
import oraclesql_icon from "../assets/oraclesql.png";
import sql_server_icon from "../assets/sql-server.png";

const dbs = [
  { icon: mysql_icon, name: "MySQL", height: 64, width: 64 },
  { icon: postgres_icon, name: "PostgreSQL", height: 40, width: 160 },
  { icon: sqlite_icon, name: "SQLite", height: 52, width: 52 },
  { icon: mariadb_icon, name: "MariaDB", height: 52, width: 156 },
  { icon: sql_server_icon, name: "SQL Server", height: 52, width: 52 },
  { icon: oraclesql_icon, name: "Oracle", height: 100, width: 100 },
];

const tables = [
  { name: "users", left: "6%", top: "6%", fields: [["id","PK","accent"],["username",null,null],["email",null,null],["password_hash",null,null],["created_at",null,null]] },
  { name: "roles", left: "6%", top: "46%", fields: [["id","PK","accent"],["name",null,null],["permissions",null,null]] },
  { name: "orders", left: "37%", top: "28%", fields: [["id","PK","accent"],["user_id","FK","amber"],["total",null,null],["status",null,null],["created_at",null,null]] },
  { name: "products", left: "68%", top: "6%", fields: [["id","PK","accent"],["name",null,null],["price",null,null],["category_id","FK","amber"],["stock",null,null]] },
  { name: "categories", left: "68%", top: "52%", fields: [["id","PK","accent"],["name",null,null],["slug",null,null]] },
  { name: "order_items", left: "37%", top: "60%", fields: [["id","PK","accent"],["order_id","FK","amber"],["product_id","FK","amber"],["quantity",null,null],["price",null,null]] },
];

const lines = [
  { x1:"18%", y1:"20%", x2:"37%", y2:"34%" },
  { x1:"18%", y1:"60%", x2:"18%", y2:"46%" },
  { x1:"52%", y1:"42%", x2:"52%", y2:"60%" },
  { x1:"68%", y1:"20%", x2:"52%", y2:"42%" },
  { x1:"80%", y1:"20%", x2:"80%", y2:"52%" },
  { x1:"37%", y1:"42%", x2:"68%", y2:"20%" },
];

const features = [
  {
    icon: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
    title: "可视化 ERD",
    desc: "拖拽式操作，直观设计数据库表结构与关系，支持主题定制。所有操作实时所见即所得。",
  },
  {
    icon: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
    title: "实时协同",
    desc: "多人同时编辑同一图表，光标位置实时同步，变更即时可见。团队协作如同面对面。",
  },
  {
    icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z",
    title: "SQL 生成",
    desc: "一键导出 DDL 脚本，支持 MySQL、PostgreSQL、SQLite 等多种方言。从设计到代码一步到位。",
  },
  {
    icon: "M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z",
    title: "文稿管理",
    desc: "多文档管理，历史版本追溯，随时回滚到任意版本。数据安全有保障。",
  },
  {
    icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
    title: "团队协作",
    desc: "邀请成员加入项目，灵活的角色权限管理。适合开发团队和 DBA 协同工作。",
  },
  {
    icon: "M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125",
    title: "多数据库",
    desc: "兼容 MySQL、PostgreSQL、SQLite、MariaDB、SQL Server 和 Oracle。轻松切换数据库类型。",
  },
];

function ErdCanvas() {
  function tagStyle(t) {
    if (t === "accent") return { bg: "rgba(0,212,170,0.12)", c: "var(--accent)" };
    if (t === "amber") return { bg: "rgba(245,158,11,0.12)", c: "#f59e0b" };
    return null;
  }

  return (
    <div className="relative w-full" style={{ height: 520 }} role="img" aria-label="数据库关系图展示：users、roles、orders、products、categories、order_items 六张表及其关联关系">
      <div className="absolute rounded-full pointer-events-none"
        style={{
          width: 500, height: 500,
          top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          background: "radial-gradient(circle, rgba(0,212,170,0.06) 0%, transparent 70%)",
        }}
      />
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }} aria-hidden="true">
        {lines.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke="rgba(0,212,170,0.2)" strokeWidth="1.5"
            strokeDasharray="6 4"
            className="erd-line"
          />
        ))}
        {lines.map((l, i) => (
          <circle key={"a"+i} cx={l.x1} cy={l.y1} r="3"
            fill="rgba(0,212,170,0.2)" className="erd-pulse" />
        ))}
      </svg>

      {tables.map((t, i) => (
        <div key={i}
          className="absolute rounded-lg border overflow-hidden backdrop-blur-sm transition-all duration-300 hover:z-10 erd-table"
          style={{
            width: 155,
            left: t.left, top: t.top,
            backgroundColor: "rgba(22,22,26,0.88)",
            borderColor: "rgba(39,39,42,0.5)",
            zIndex: 2,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(0,212,170,0.3)";
            e.currentTarget.style.boxShadow = "0 0 24px rgba(0,212,170,0.08)";
            e.currentTarget.style.backgroundColor = "rgba(28,28,28,0.95)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(39,39,42,0.5)";
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.backgroundColor = "rgba(22,22,26,0.88)";
          }}
        >
          <div className="px-2.5 py-1.5 text-[10px] font-bold tracking-wider uppercase"
            style={{
              backgroundColor: "rgba(0,212,170,0.06)",
              color: "var(--accent)",
              borderBottom: "1px solid rgba(39,39,42,0.25)",
            }}
          >{t.name}</div>
          {t.fields.map(([name, tag, type], j) => {
            const ts = tagStyle(type);
            return (
              <div key={j} className="flex items-center gap-1.5 px-2.5 py-1"
                style={{ borderBottom: j < t.fields.length - 1 ? "1px solid rgba(39,39,42,0.1)" : "none" }}
              >
                <span className="w-[3px] h-[3px] rounded-full flex-shrink-0"
                  style={{ backgroundColor: ts ? ts.c : "rgba(113,113,122,0.3)" }}
                />
                <span className="text-[10px] font-medium" style={{ color: tag ? "var(--text-secondary)" : "var(--text-muted)" }}>
                  {name}
                </span>
                {tag && (
                  <span className="ml-auto text-[6px] font-bold px-1 rounded leading-none py-[2px] uppercase tracking-wider"
                    style={{ backgroundColor: ts.bg, color: ts.c }}
                  >{tag}</span>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <style>{`
        @keyframes erd-drift {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-5px); }
        }
        .erd-table {
          animation: erd-drift 4s ease-in-out infinite alternate;
          animation-delay: 0s;
        }
        .erd-table:nth-child(3) { animation-delay: 0.3s; }
        .erd-table:nth-child(4) { animation-delay: 0.6s; }
        .erd-table:nth-child(5) { animation-delay: 0.9s; }
        .erd-table:nth-child(6) { animation-delay: 1.2s; }
        .erd-table:nth-child(7) { animation-delay: 1.5s; }
        .erd-table:nth-child(8) { animation-delay: 1.8s; }
        .erd-line {
          animation: erd-flow 1.2s linear infinite;
        }
        @keyframes erd-flow {
          to { stroke-dashoffset: -20; }
        }
        .erd-pulse {
          animation: erd-pulse 2s ease-in-out infinite;
        }
        @keyframes erd-pulse {
          0%, 100% { r: 2.5; opacity: 0.2; }
          50% { r: 4; opacity: 0.4; }
        }
        @media (prefers-reduced-motion: reduce) {
          .erd-table, .erd-line, .erd-pulse {
            animation: none !important;
          }
          .erd-table {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function FeatureIcon({ path }) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

function CtaButton({ onClick, loading, label }) {
  const [busy, setBusy] = useState(false);
  const isBusy = loading || busy;
  return (
    <button
      onClick={async () => {
        if (isBusy) return;
        setBusy(true);
        await onClick();
        setBusy(false);
      }}
      disabled={isBusy}
      aria-busy={isBusy}
      className="cursor-pointer rounded-full px-7 py-3 text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 inline-flex items-center gap-2"
      style={{
        color: "#09090b",
        backgroundColor: "var(--accent)",
        boxShadow: "0 0 30px rgba(0,212,170,0.25)",
      }}
    >
      {isBusy ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          加载中...
        </>
      ) : label}
    </button>
  );
}

export default function LandingPage() {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  function goStart() { navigate(user ? "/dashboard" : "/login"); }

  useEffect(() => {
    document.title = "DBDesign - 协同数据库设计工具";
  }, []);

  return (
    <div style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }} className="overflow-x-hidden">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden" style={{ minHeight: "100dvh" }} aria-label="首页横幅">
        <div className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: "radial-gradient(rgba(0,212,170,0.12) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="pointer-events-none absolute -top-64 left-1/2 -translate-x-1/2 w-[800px] h-[800px] opacity-[0.05]"
          style={{ background: "radial-gradient(ellipse, rgba(0,212,170,0.3) 0%, transparent 70%)" }}
        />

        <div className="relative h-full flex flex-col" style={{ minHeight: "100dvh" }}>
          <div className="flex-1 flex items-center justify-center px-4 pt-4">
            <div className="w-full max-w-5xl mx-auto">
              <ErdCanvas />
            </div>
          </div>

          <div className="relative pb-10 pt-6 px-6">
            <div className="mx-auto max-w-5xl flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h1 className="text-[clamp(2.2rem,4.5vw,3.8rem)] font-extrabold leading-[1.08] tracking-tight">
                  数据库设计，
                </h1>
                <h1 className="text-[clamp(2.8rem,6vw,5rem)] font-extrabold leading-[1] tracking-tight"
                  style={{
                    background: "var(--accent-gradient)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  从未如此简单
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <CtaButton onClick={goStart} loading={loading} label={user ? "进入工作台" : "开始免费使用"} />
                <button
                  onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                  className="cursor-pointer rounded-full px-7 py-3 text-sm font-medium transition-all duration-200 hover:opacity-80 active:scale-[0.97] whitespace-nowrap"
                  style={{ color: "var(--text-muted)" }}
                  aria-label="了解更多功能"
                >
                  了解更多 →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section id="features" className="py-12 px-6" aria-label="功能特性">
        <div className="mx-auto max-w-5xl mb-8">
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{color:"var(--accent)"}}>
            功能特性
          </span>
          <h2 className="text-2xl font-bold tracking-tight mt-1" style={{color:"var(--text-primary)"}}>
            强大而直观的设计体验
          </h2>
        </div>

        <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {features.map((f, i) => (
            <div key={i}
              className="rounded-xl border p-5 transition-all duration-200"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(0,212,170,0.2)";
                e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.backgroundColor = "var(--bg-surface)";
              }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg mb-3"
                style={{ backgroundColor: "rgba(0,212,170,0.07)", color: "var(--accent)" }}
              >
                <FeatureIcon path={f.icon} />
              </div>
              <h3 className="text-sm font-semibold mb-1.5" style={{color:"var(--text-primary)"}}>{f.title}</h3>
              <p className="text-xs leading-relaxed" style={{color:"var(--text-muted)"}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Databases ===== */}
      <section className="py-10 px-6" aria-label="支持的数据库">
        <div className="mx-auto max-w-4xl text-center">
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{color:"var(--accent)"}}>支持的数据库</span>
          <h2 className="text-2xl font-bold tracking-tight mt-1 mb-5" style={{color:"var(--text-primary)"}}>
            兼容主流关系型数据库
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-5" style={{opacity: 0.5}}>
            {dbs.map((db, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 transition-all duration-200 hover:scale-110"
                style={{opacity: 0.7}}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.7"; }}
              >
                <img src={db.icon} alt={db.name} height={db.height} width={db.width} loading="lazy" />
                <span className="text-[10px] font-medium" style={{color:"var(--text-muted)"}}>{db.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="px-6 pb-14" aria-label="立即开始">
        <div className="mx-auto max-w-lg text-center">
          <div className="rounded-2xl border p-8 backdrop-blur-sm"
            style={{ backgroundColor: "rgba(22,22,26,0.4)", borderColor: "rgba(0,212,170,0.1)" }}
          >
            <h2 className="text-xl font-bold tracking-tight mb-2">准备好开始了吗？</h2>
            <p className="text-sm mb-5" style={{color:"var(--text-muted)"}}>
              免费使用，无需信用卡。几分钟内完成你的第一个 ERD。
            </p>
            <CtaButton onClick={goStart} loading={loading} label={user ? "进入工作台" : "开始免费使用"} />
          </div>
        </div>
      </section>
    </div>
  );
}
