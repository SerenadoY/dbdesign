export function mergeDelta(existingData, delta) {
  const data = structuredClone(existingData);
  const { target, action, entityId, data: payload } = delta;

  switch (target) {
    case "table": {
      if (action === "create") {
        data.tables = data.tables || [];
        data.tables.push(payload[0]);
      } else if (action === "delete") {
        data.tables = (data.tables || []).filter((t) => t.id !== entityId);
        data.relationships = (data.relationships || []).filter(
          (r) => r.startTableId !== entityId && r.endTableId !== entityId,
        );
      } else if (action === "update") {
        data.tables = (data.tables || []).map((t) =>
          t.id === entityId ? { ...t, ...payload[1] } : t,
        );
      }
      break;
    }
    case "relationship": {
      if (action === "create") {
        data.relationships = data.relationships || [];
        data.relationships.push(payload[0]);
      } else if (action === "delete") {
        data.relationships = (data.relationships || []).filter((r) => r.id !== entityId);
      } else if (action === "update") {
        data.relationships = (data.relationships || []).map((r) =>
          r.id === entityId ? { ...r, ...payload[1] } : r,
        );
      }
      break;
    }
    case "area": {
      if (action === "create") {
        data.subjectAreas = data.subjectAreas || [];
        data.subjectAreas.push(payload[0]);
      } else if (action === "delete") {
        data.subjectAreas = (data.subjectAreas || []).filter((a) => a.id !== entityId);
      } else if (action === "update") {
        data.subjectAreas = (data.subjectAreas || []).map((a) =>
          a.id === entityId ? { ...a, ...payload[1] } : a,
        );
      }
      break;
    }
    case "note": {
      if (action === "create") {
        data.notes = data.notes || [];
        data.notes.push(payload[0]);
      } else if (action === "delete") {
        data.notes = (data.notes || []).filter((n) => n.id !== entityId);
      } else if (action === "update") {
        data.notes = (data.notes || []).map((n) =>
          n.id === entityId ? { ...n, ...payload[1] } : n,
        );
      }
      break;
    }
    case "types": {
      data.types = payload;
      break;
    }
    case "enums": {
      data.enums = payload;
      break;
    }
    case "database": {
      data.database = payload[0];
      break;
    }
    default:
      break;
  }
  return data;
}
