import api from "./auth";

export async function listVersions(diagramId) {
  const { data } = await api.get(`/diagrams/${diagramId}/versions`);
  return data.versions;
}

export async function recordVersion(diagramId, message) {
  const { data } = await api.post(`/diagrams/${diagramId}/versions`, { message: message || "" });
  return data.version;
}

export async function getVersion(diagramId, version) {
  const { data } = await api.get(`/diagrams/${diagramId}/versions/${version}`);
  return data.version;
}

export async function restoreVersion(diagramId, version) {
  const { data } = await api.post(`/diagrams/${diagramId}/versions/${version}/restore`);
  return data.diagramData;
}
