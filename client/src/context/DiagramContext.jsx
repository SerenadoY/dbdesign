import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { Action, DB, ObjectType, defaultBlue } from "../data/constants";
import { useTransform, useUndoRedo, useSelect, useCollab } from "../hooks";
import { Toast } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { nanoid } from "nanoid";

export const DiagramContext = createContext(null);

export default function DiagramContextProvider({ children }) {
  const { t } = useTranslation();
  const [database, setDatabaseRaw] = useState(DB.GENERIC);
  const [tables, setTables] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const { transform } = useTransform();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { selectedElement, setSelectedElement } = useSelect();
  const { emitDelta, isApplyingRemoteRef, onRemoteDelta } = useCollab();

  const recentLocalEditsRef = useRef(new Map());

  const shouldEmit = () => !isApplyingRemoteRef?.current;

  const setDatabase = useCallback(
    (next) => {
      setDatabaseRaw(next);
      if (!isApplyingRemoteRef?.current) {
        recentLocalEditsRef.current.set("database", Date.now());
        emitDelta({
          target: "database",
          action: "update",
          entityId: "database",
          data: [next],
        });
      }
    },
    [emitDelta, isApplyingRemoteRef],
  );

  useEffect(() => {
    const unsub = onRemoteDelta((delta) => {
      if (delta.target === "table") {
        if (delta.action === "create") {
          setTables((prev) => [...prev, delta.data[0]]);
        } else if (delta.action === "delete") {
          setTables((prev) => prev.filter((t) => t.id !== delta.entityId));
          setRelationships((prev) =>
            prev.filter(
              (r) => r.startTableId !== delta.entityId && r.endTableId !== delta.entityId,
            ),
          );
        } else if (delta.action === "update") {
          if (delta.data && delta.data.length === 3) {
            setTables((prev) =>
              prev.map((t) => {
                if (t.id !== delta.entityId) return t;
                return {
                  ...t,
                  fields: t.fields.map((f) =>
                    f.id === delta.data[1] ? { ...f, ...delta.data[2] } : f,
                  ),
                };
              }),
            );
          } else {
            setTables((prev) =>
              prev.map((t) => (t.id === delta.entityId ? { ...t, ...delta.data[1] } : t)),
            );
          }
        }
      } else if (delta.target === "relationship") {
        if (delta.action === "create") {
          setRelationships((prev) => [...prev, delta.data[0]]);
        } else if (delta.action === "delete") {
          setRelationships((prev) => prev.filter((r) => r.id !== delta.entityId));
        } else if (delta.action === "update") {
          setRelationships((prev) =>
            prev.map((r) => (r.id === delta.entityId ? { ...r, ...delta.data[1] } : r)),
          );
        }
      } else if (delta.target === "database") {
        setDatabase(delta.data[0]);
      }
      // Conflict detection
      const localTime = recentLocalEditsRef.current.get(delta.entityId);
      if (localTime && Date.now() - localTime < 500) {
        Toast.warning({
          content: `冲突提示：其他用户也修改了同一对象，请确认变更`,
          duration: 4,
        });
      }
    });
    return unsub;
  }, [onRemoteDelta, setDatabase]);

  const addTable = (data, addToHistory = true) => {
    const id = nanoid();
    const newTable = {
      id,
      name: `table_${id}`,
      x: transform.pan.x,
      y: transform.pan.y,
      locked: false,
      fields: [
        {
          name: "id",
          type: database === DB.GENERIC ? "INT" : "INTEGER",
          default: "",
          check: "",
          primary: true,
          unique: false,
          unsigned: true,
          notNull: true,
          increment: true,
          comment: "",
          id: nanoid(),
        },
      ],
      comment: "",
      indices: [],
      color: defaultBlue,
      collapsed: false,
    };
    if (data) {
      setTables((prev) => {
        const temp = prev.slice();
        temp.splice(data.index || tables.length, 0, data.table);
        return temp;
      });
    } else {
      setTables((prev) => [...prev, newTable]);
    }
    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          data: data || { table: newTable, index: tables.length - 1 },
          action: Action.ADD,
          element: ObjectType.TABLE,
          message: t("add_table"),
        },
      ]);
      setRedoStack([]);
    }
    if (shouldEmit()) {
      const created = data?.table ?? newTable;
      recentLocalEditsRef.current.set(created.id, Date.now());
      emitDelta({
        target: "table",
        action: "create",
        entityId: created.id,
        data: [created],
      });
    }
  };

  const deleteTable = (id, addToHistory = true) => {
    if (addToHistory) {
      const rels = relationships.reduce((acc, r) => {
        if (r.startTableId === id || r.endTableId === id) {
          acc.push(r);
        }
        return acc;
      }, []);
      const deletedTable = tables.find((t) => t.id === id);
      const deletedTableIndex = tables.findIndex((t) => t.id === id);
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.DELETE,
          element: ObjectType.TABLE,
          data: {
            table: deletedTable,
            relationship: rels,
            index: deletedTableIndex,
          },
          message: t("delete_table", { tableName: deletedTable.name }),
        },
      ]);
      setRedoStack([]);
      Toast.success(t("table_deleted"));
    }
    setRelationships((prevR) =>
      prevR.filter((e) => !(e.startTableId === id || e.endTableId === id)),
    );
    setTables((prev) => prev.filter((e) => e.id !== id));
    if (id === selectedElement.id) {
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.NONE,
        id: null,
        open: false,
      }));
    }
    if (shouldEmit()) {
      recentLocalEditsRef.current.set(id, Date.now());
      emitDelta({
        target: "table",
        action: "delete",
        entityId: id,
        data: [id],
      });
    }
  };

  const updateTable = (id, updatedValues) => {
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updatedValues } : t)),
    );
    if (shouldEmit()) {
      recentLocalEditsRef.current.set(id, Date.now());
      emitDelta({
        target: "table",
        action: "update",
        entityId: id,
        data: [id, updatedValues],
      });
    }
  };

  const updateField = (tid, fid, updatedValues) => {
    setTables((prev) =>
      prev.map((table) => {
        if (tid === table.id) {
          return {
            ...table,
            fields: table.fields.map((field) =>
              fid === field.id ? { ...field, ...updatedValues } : field,
            ),
          };
        }
        return table;
      }),
    );
    if (shouldEmit()) {
      recentLocalEditsRef.current.set(tid, Date.now());
      emitDelta({
        target: "table",
        action: "update",
        entityId: tid,
        data: [tid, fid, updatedValues],
      });
    }
  };

  const deleteField = (field, tid, addToHistory = true) => {
    const { fields, name } = tables.find((t) => t.id === tid);
    if (addToHistory) {
      const rels = relationships.reduce((acc, r) => {
        if (
          (r.startTableId === tid && r.startFieldId === field.id) ||
          (r.endTableId === tid && r.endFieldId === field.id)
        ) {
          acc.push(r);
        }
        return acc;
      }, []);
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.EDIT,
          element: ObjectType.TABLE,
          component: "field_delete",
          tid: tid,
          data: {
            field: field,
            index: fields.findIndex((f) => f.id === field.id),
            relationship: rels,
          },
          message: t("edit_table", {
            tableName: name,
            extra: "[delete field]",
          }),
        },
      ]);
      setRedoStack([]);
    }
    setRelationships((prev) =>
      prev.filter(
        (e) =>
          !(
            (e.startTableId === tid && e.startFieldId === field.id) ||
            (e.endTableId === tid && e.endFieldId === field.id)
          ),
      ),
    );
    updateTable(tid, {
      fields: fields.filter((e) => e.id !== field.id),
    });
  };

  const addRelationship = (data, addToHistory = true) => {
    if (addToHistory) {
      setRelationships((prev) => {
        setUndoStack((prevUndo) => [
          ...prevUndo,
          {
            action: Action.ADD,
            element: ObjectType.RELATIONSHIP,
            data: {
              relationship: data,
              index: prevUndo.length,
            },
            message: t("add_relationship"),
          },
        ]);
        setRedoStack([]);
        return [...prev, data];
      });
    } else {
      setRelationships((prev) => {
        const temp = prev.slice();
        temp.splice(data.index, 0, data.relationship || data);
        return temp;
      });
    }
    if (shouldEmit()) {
      const created = data?.relationship ?? data;
      recentLocalEditsRef.current.set(created.id, Date.now());
      emitDelta({
        target: "relationship",
        action: "create",
        entityId: created.id,
        data: [created],
      });
    }
  };

  const deleteRelationship = (id, addToHistory = true) => {
    if (addToHistory) {
      const relationshipIndex = relationships.findIndex((r) => r.id === id);
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.DELETE,
          element: ObjectType.RELATIONSHIP,
          data: {
            relationship: relationships[relationshipIndex],
            index: relationshipIndex,
          },
          message: t("delete_relationship", {
            refName: relationships[relationshipIndex].name,
          }),
        },
      ]);
      setRedoStack([]);
    }
    setRelationships((prev) => prev.filter((e) => e.id !== id));
    if (shouldEmit()) {
      recentLocalEditsRef.current.set(id, Date.now());
      emitDelta({
        target: "relationship",
        action: "delete",
        entityId: id,
        data: [id],
      });
    }
    if (
      selectedElement.element === ObjectType.RELATIONSHIP &&
      selectedElement.id === id
    ) {
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.NONE,
        id: -1,
        open: false,
      }));
    }
  };

  const updateRelationship = (id, updatedValues) => {
    setRelationships((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updatedValues } : t)),
    );
    if (shouldEmit()) {
      recentLocalEditsRef.current.set(id, Date.now());
      emitDelta({
        target: "relationship",
        action: "update",
        entityId: id,
        data: [id, updatedValues],
      });
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      recentLocalEditsRef.current.forEach((time, id) => {
        if (now - time > 2000) recentLocalEditsRef.current.delete(id);
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DiagramContext.Provider
      value={{
        tables,
        setTables,
        addTable,
        updateTable,
        updateField,
        deleteField,
        deleteTable,
        relationships,
        setRelationships,
        addRelationship,
        deleteRelationship,
        updateRelationship,
        database,
        setDatabase,
        tablesCount: tables.length,
        relationshipsCount: relationships.length,
      }}
    >
      {children}
    </DiagramContext.Provider>
  );
}
