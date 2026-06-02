import { Toast } from "@douyinfe/semi-ui";
import { createContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Action, ObjectType, defaultBlue } from "../data/constants";
import { useSelect, useTransform, useUndoRedo, useCollab } from "../hooks";

export const AreasContext = createContext(null);

export default function AreasContextProvider({ children }) {
  const { t } = useTranslation();
  const [areas, setAreas] = useState([]);
  const { transform } = useTransform();
  const { selectedElement, setSelectedElement } = useSelect();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { emitDelta, isApplyingRemoteRef, onRemoteDelta } = useCollab();
  const shouldEmit = () => !isApplyingRemoteRef?.current;

  useEffect(() => {
    const unsub = onRemoteDelta((delta) => {
      if (delta.target !== "area") return;
      if (delta.action === "create") {
        setAreas((prev) => [...prev, delta.data[0]]);
      } else if (delta.action === "delete") {
        setAreas((prev) =>
          prev.filter((e) => e.id !== delta.entityId).map((e, i) => ({ ...e, id: i })),
        );
      } else if (delta.action === "update") {
        setAreas((prev) =>
          prev.map((a) => (a.id === delta.entityId ? { ...a, ...delta.data[1] } : a)),
        );
      }
    });
    return unsub;
  }, [onRemoteDelta]);

  const addArea = (data, addToHistory = true) => {
    let created = data;
    if (data) {
      setAreas((prev) => {
        const temp = prev.slice();
        temp.splice(data.id, 0, data);
        return temp.map((t, i) => ({ ...t, id: i }));
      });
    } else {
      const width = 200;
      const height = 200;
      created = {
        id: areas.length,
        name: `area_${areas.length}`,
        x: transform.pan.x - width / 2,
        y: transform.pan.y - height / 2,
        width,
        height,
        color: defaultBlue,
        locked: false,
      };
      setAreas((prev) => [...prev, { ...created, id: prev.length }]);
    }
    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.ADD,
          element: ObjectType.AREA,
          message: t("add_area"),
        },
      ]);
      setRedoStack([]);
    }
    if (shouldEmit() && created) {
      emitDelta({
        target: "area",
        action: "create",
        entityId: created.id,
        data: [created],
      });
    }
  };

  const deleteArea = (id, addToHistory = true) => {
    if (addToHistory) {
      Toast.success(t("area_deleted"));
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.DELETE,
          element: ObjectType.AREA,
          data: areas[id],
          message: t("delete_area", { areaName: areas[id].name }),
        },
      ]);
      setRedoStack([]);
    }
    setAreas((prev) =>
      prev.filter((e) => e.id !== id).map((e, i) => ({ ...e, id: i })),
    );
    if (id === selectedElement.id) {
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.NONE,
        id: -1,
        open: false,
      }));
    }
    if (shouldEmit()) {
      emitDelta({
        target: "area",
        action: "delete",
        entityId: id,
        data: [id],
      });
    }
  };

  const updateArea = (id, values) => {
    setAreas((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            ...values,
          };
        }
        return t;
      }),
    );
    if (shouldEmit()) {
      emitDelta({
        target: "area",
        action: "update",
        entityId: id,
        data: [id, values],
      });
    }
  };

  return (
    <AreasContext.Provider
      value={{
        areas,
        setAreas,
        updateArea,
        addArea,
        deleteArea,
        areasCount: areas.length,
      }}
    >
      {children}
    </AreasContext.Provider>
  );
}
