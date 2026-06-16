import { useCallback, useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Spin, Steps, Tag, Toast } from "@douyinfe/semi-ui";
import { IconPlus } from "@douyinfe/semi-icons";
import {
  listVersions,
  recordVersion,
  getVersion,
  restoreVersion,
  deleteVersion,
} from "../../../api/versions";
import _ from "lodash";
import { DateTime } from "luxon";
import {
  useAreas,
  useDiagram,
  useEnums,
  useLayout,
  useNotes,
  useTypes,
  useTransform,
} from "../../../hooks";
import { databases } from "../../../data/databases";
import { getDiagram, getDiagramOperations } from "../../../api/diagrams";

const LIMIT = 10;

const TARGET_LABELS = {
  table: "表",
  field: "字段",
  relationship: "关系",
  note: "备注",
  area: "区域",
  database: "数据库",
};

const OP_LABELS = {
  create: "创建",
  delete: "删除",
  update: "更新",
};

function getOpLabel(op, entityName) {
  try {
    const parsed = typeof op === "string" ? JSON.parse(op) : op;
    const target = TARGET_LABELS[parsed?.target] || parsed?.target || "";
    const action = OP_LABELS[parsed?.action] || parsed?.action || "";
    const name = entityName || "";
    return `${action}${target} ${name}`.trim();
  } catch {
    return "操作";
  }
}

export default function Versions({ open, title, setTitle }) {
  const { id: diagramId } = useParams();
  const { areas, setAreas } = useAreas();
  const { layout, setLayout } = useLayout();
  const { database, tables, relationships, setTables, setRelationships, setDatabase } =
    useDiagram();
  const { notes, setNotes } = useNotes();
  const { types, setTypes } = useTypes();
  const { enums, setEnums } = useEnums();
  const { transform } = useTransform();
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [versions, setVersions] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [loadingVersion, setLoadingVersion] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [versionToCompareTo, setVersionToCompareTo] = useState(null);
  const [viewedVersion, setViewedVersion] = useState(null);
  const [activeTab, setActiveTab] = useState("versions");
  const [operations, setOperations] = useState([]);
  const [opsLoading, setOpsLoading] = useState(false);

  const loadVersion = useCallback(
    async (versionNum) => {
      try {
        setLoadingVersion(versionNum);
        setViewedVersion(versionNum);
        const v = await getVersion(diagramId, versionNum);
        setLayout((prev) => ({ ...prev, readOnly: true }));

        const d = v.diagramData;

        setTables(d.tables || []);
        setRelationships(d.relationships || []);
        setAreas(d.subjectAreas || []);
        setNotes(d.notes || []);
        if (d.title) setTitle(d.title);

        if (databases[database]?.hasTypes) {
          setTypes(d.types || []);
        }
        if (databases[database]?.hasEnums) {
          setEnums(d.enums || []);
        }
      } catch (e) {
        Toast.error(t("failed_to_load_diagram"));
      } finally {
        setLoadingVersion(null);
      }
    },
    [diagramId, setTables, setRelationships, setAreas, setNotes, setTypes, setEnums, setTitle, setLayout, database, t],
  );

  const restoreCurrent = useCallback(async () => {
    try {
      setViewedVersion(null);
      const diagram = await getDiagram(diagramId);
      setLayout((prev) => ({ ...prev, readOnly: false }));
      const d = diagram;
      setTables(d.tables || []);
      setRelationships(d.references || []);
      setAreas(d.areas || []);
      setNotes(d.notes || []);
      setTitle(d.name);
      if (d.database) setDatabase(d.database);
      if (databases[d.database]?.hasTypes) setTypes(d.types || []);
      if (databases[d.database]?.hasEnums) setEnums(d.enums || []);
    } catch (e) {
      Toast.error(t("failed_to_load_diagram"));
    }
  }, [diagramId, setTables, setRelationships, setAreas, setNotes, setTypes, setEnums, setTitle, setLayout]);

  const getRevisions = useCallback(
    async () => {
      try {
        if (!diagramId) return;
        setIsLoading(true);
        const list = await listVersions(diagramId);
        setVersions(list);
        setHasMore(list.length >= LIMIT);
      } catch (e) {
        Toast.error(t("oops_smth_went_wrong"));
      } finally {
        setIsLoading(false);
      }
    },
    [diagramId, t],
  );

  const diagramToString = useCallback(() => {
    return JSON.stringify({
      title,
      tables,
      relationships,
      notes,
      subjectAreas: areas,
      database,
      ...(databases[database]?.hasTypes && { types }),
      ...(databases[database]?.hasEnums && { enums }),
      transform,
    });
  }, [areas, notes, tables, relationships, database, title, enums, types, transform]);

  const currentDiagram = useMemo(() => {
    try { return JSON.parse(diagramToString()); } catch { return {}; }
  }, [diagramToString]);

  const hasDiagramChanged = useCallback(async () => {
    if (!versions.length) return true;
    const latest = await getVersion(diagramId, versions[0].version);
    return !_.isEqual(latest.diagramData, currentDiagram);
  }, [diagramId, versions, currentDiagram]);

  const recordVersionFn = async () => {
    try {
      setIsRecording(true);
      const hasChanges = await hasDiagramChanged();
      if (!hasChanges) {
        Toast.info(t("no_changes_to_record"));
        return;
      }
      await recordVersion(diagramId);
      await getRevisions();
    } catch (e) {
      Toast.error(t("failed_to_record_version"));
    } finally {
      setIsRecording(false);
    }
  };

  const handleDeleteVersion = async (versionNum, e) => {
    e.stopPropagation();
    if (!confirm("确定删除此版本快照？")) return;
    try {
      await deleteVersion(diagramId, versionNum);
      setVersions((prev) => prev.filter((v) => v.version !== versionNum));
      if (viewedVersion === versionNum) setViewedVersion(null);
      Toast.success("已删除");
    } catch (e) {
      Toast.error("删除失败");
    }
  };

  const currentStep = useMemo(() => {
    return versions.findIndex((v) => v.version === selectedVersion);
  }, [selectedVersion, versions]);

  const loadOperations = useCallback(async () => {
    if (!diagramId) return;
    setOpsLoading(true);
    try {
      const list = await getDiagramOperations(diagramId, 100);
      setOperations(list);
    } catch {
      setOperations([]);
    } finally {
      setOpsLoading(false);
    }
  }, [diagramId]);

  useEffect(() => {
    if (diagramId && open) {
      getRevisions();
      if (activeTab === "operations") {
        loadOperations();
      }
    }
  }, [diagramId, open, getRevisions, activeTab, loadOperations]);

  return (
    <div className="mx-5 relative h-full">
      <div className="sticky top-0 z-10 sidesheet-theme pb-2">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setActiveTab("versions")}
            className="flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors"
            style={{
              backgroundColor: activeTab === "versions" ? "var(--accent)" : "var(--bg-surface)",
              color: activeTab === "versions" ? "#fff" : "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            版本快照
          </button>
          <button
            onClick={() => { setActiveTab("operations"); loadOperations(); }}
            className="flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors"
            style={{
              backgroundColor: activeTab === "operations" ? "var(--accent)" : "var(--bg-surface)",
              color: activeTab === "operations" ? "#fff" : "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            操作记录
          </button>
        </div>
        {activeTab === "versions" && (
          <Button
            block
            icon={isRecording ? <Spin /> : <IconPlus />}
            disabled={isLoading || isRecording}
            onClick={recordVersionFn}
          >
            {t("record_version")}
          </Button>
        )}
      </div>

      {viewedVersion && (
        <div
          className="mb-3 rounded-lg p-3 flex items-center justify-between"
          style={{ backgroundColor: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.2)" }}
        >
          <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>
            正在查看历史版本
          </span>
          <Button size="small" theme="solid" onClick={restoreCurrent}>
            回到当前
          </Button>
        </div>
      )}

      {activeTab === "versions" && (
        <>
          {(!diagramId || !versions.length) && !isLoading && (
            <div className="my-3">{t("no_saved_versions")}</div>
          )}
          {diagramId && (
            <div className="my-2 overflow-y-auto">
              <Steps direction="vertical" type="basic" current={currentStep}>
                {versions.map((r) => (
                  <Steps.Step
                    key={r.version}
                    onClick={() => loadVersion(r.version)}
                    className="group hover-1 first:!pt-2"
                    title={
                      <div className="flex justify-between items-center w-full">
                        <Tag>{r.user_name || t("version") + " #" + r.version}</Tag>
                        <button
                          onClick={(e) => handleDeleteVersion(r.version, e)}
                          className="text-xs opacity-0 group-hover:opacity-100 transition-opacity rounded px-1.5 py-0.5"
                          style={{ color: "var(--text-muted)" }}
                          onMouseEnter={(e) => { e.target.style.color = "var(--danger)"; }}
                          onMouseLeave={(e) => { e.target.style.color = "var(--text-muted)"; }}
                          title="删除"
                        >
                          删除
                        </button>
                      </div>
                    }
                    description={`${t("committed_at")} ${DateTime.fromISO(r.created_at)
                      .setLocale(i18n.language)
                      .toLocaleString(DateTime.DATETIME_MED)}`}
                    icon={
                      r.version === loadingVersion ? (
                        <Spin size="small" />
                      ) : (
                        <i className="text-sm fa-solid fa-asterisk ms-1" />
                      )
                    }
                  />
                ))}
              </Steps>
            </div>
          )}
          {isLoading && !isRecording && (
            <div className="text-blue-500 text-center my-3">
              <Spin size="middle" />
              <div>{t("loading")}</div>
            </div>
          )}
        </>
      )}
      {activeTab === "operations" && (
        <div className="my-2 overflow-y-auto">
          {opsLoading && (
            <div className="text-center my-3">
              <Spin size="small" />
            </div>
          )}
          {!opsLoading && operations.length === 0 && (
            <div className="my-3 text-sm" style={{ color: "var(--text-muted)" }}>
              暂无操作记录
            </div>
          )}
          {!opsLoading && operations.map((op) => (
            <div
              key={op.id}
              className="flex items-center py-2 px-2 rounded-lg mb-1 transition-colors hover-1"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <i className="block fa-regular fa-circle fa-xs" style={{ color: "var(--text-muted)" }} />
              <div className="ms-2 flex-1 min-w-0">
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                  {getOpLabel(op.operation, op.entity_name)}
                </span>
                <span className="ms-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  {op.user_name || ""}
                </span>
              </div>
              <span className="text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                {DateTime.fromISO(op.created_at)
                  .setLocale(i18n.language)
                  .toRelative()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
