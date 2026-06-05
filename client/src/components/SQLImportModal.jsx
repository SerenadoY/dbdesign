import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Parser } from "node-sql-parser";
import { Parser as OracleParser } from "oracle-sql-parser";
import { Modal, Toast } from "@douyinfe/semi-ui";
import { importSQL } from "../utils/importSQL";
import { createDiagram } from "../api/diagrams";

const DB_OPTIONS = [
  { value: "mysql", label: "MySQL" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "sqlite", label: "SQLite" },
  { value: "mariadb", label: "MariaDB" },
  { value: "transactsql", label: "SQL Server" },
  { value: "oraclesql", label: "Oracle" },
];

export default function SQLImportModal({ open, onClose }) {
  const [sql, setSql] = useState("");
  const [dbType, setDbType] = useState("mysql");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleImport = async () => {
    if (!sql.trim()) { setError("请输入 SQL"); return; }
    setError("");
    setImporting(true);
    try {
      let ast;
      if (dbType === "oraclesql") {
        ast = new OracleParser().parse(sql);
      } else {
        const parser = new Parser();
        ast = parser.astify(sql, { database: dbType });
      }
      const diagramData = importSQL(ast, dbType, "generic");
      const diagram = await createDiagram("SQL 导入", dbType, {
        database: dbType,
        title: "SQL 导入",
        tables: diagramData.tables || [],
        references: diagramData.relationships || [],
        subjectAreas: diagramData.subjectAreas || [],
        notes: diagramData.notes || [],
        types: diagramData.types || [],
        enums: diagramData.enums || [],
      });
      Toast.success("已创建");
      onClose();
      navigate(`/editor/diagrams/${diagram.id}`);
    } catch (err) {
      setError(err.location
        ? `${err.name} [Ln ${err.location.start.line}, Col ${err.location.start.column}]: ${err.message}`
        : err.message || "导入失败");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      title="导入 SQL"
      visible={open}
      onCancel={onClose}
      okText={importing ? "导入中..." : "导入"}
      onOk={handleImport}
      okButtonProps={{ disabled: importing }}
      centered
      closeOnEsc
      style={{ width: "600px" }}
    >
      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>数据库类型</label>
        <div className="flex flex-wrap gap-2">
          {DB_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDbType(opt.value)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                dbType === opt.value ? "ring-2" : "opacity-60 hover:opacity-100"
              }`}
              style={{
                backgroundColor: "var(--bg-primary)",
                borderColor: dbType === opt.value ? "var(--accent)" : "var(--border)",
                color: "var(--text-primary)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-2">
        <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>SQL DDL</label>
        <textarea
          value={sql}
          onChange={(e) => { setSql(e.target.value); setError(""); }}
          placeholder="CREATE TABLE users (id INT, name VARCHAR(255));&#10;CREATE TABLE posts (id INT, user_id INT, title TEXT);"
          className="w-full rounded-xl border p-3 text-sm font-mono outline-none transition-all"
          style={{
            backgroundColor: "var(--bg-primary)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
            minHeight: "200px",
            resize: "vertical",
          }}
        />
      </div>
      {error && (
        <div
          className="rounded-xl px-4 py-2.5 text-sm"
          style={{
            backgroundColor: "rgba(239,68,68,0.1)",
            color: "var(--danger)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          {error}
        </div>
      )}
    </Modal>
  );
}
