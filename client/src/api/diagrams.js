import api from "./auth";

export async function listDiagrams() {
  const { data } = await api.get("/diagrams");
  return data.diagrams;
}

export async function getDiagram(id) {
  const { data } = await api.get(`/diagrams/${id}`);
  return data.diagram;
}

export async function createDiagram(title, databaseType, diagramData) {
  const { data } = await api.post("/diagrams", { title, databaseType, diagramData });
  return data.diagram;
}

export async function deleteDiagram(id) {
  await api.delete(`/diagrams/${id}`);
}

export async function getTrashedDiagrams() {
  const { data } = await api.get("/diagrams/trash");
  return data.diagrams;
}

export async function restoreDiagram(id) {
  const { data } = await api.post(`/diagrams/${id}/restore`);
  return data;
}

export async function forceDeleteDiagram(id) {
  await api.delete(`/diagrams/${id}/force`);
}

export async function saveDiagramData(id, diagramData) {
  const { data } = await api.put(`/diagrams/${id}/data`, { diagramData });
  return data;
}

export async function updateDiagramMeta(id, meta) {
  const { data } = await api.put(`/diagrams/${id}`, meta);
  return data.diagram;
}

export async function getCollaborators(diagramId) {
  const { data } = await api.get(`/diagrams/${diagramId}/collaborators`);
  return data.collaborators;
}

export async function addCollaborator(diagramId, userId, role = "editor") {
  const { data } = await api.post(`/diagrams/${diagramId}/collaborators`, { userId, role });
  return data;
}

export async function copyDiagram(id) {
  const { data } = await api.post(`/diagrams/${id}/copy`);
  return data.diagram;
}

export async function removeCollaborator(diagramId, userId) {
  await api.delete(`/diagrams/${diagramId}/collaborators/${userId}`);
}

export async function updateCollaboratorRole(diagramId, userId, role) {
  const { data } = await api.put(`/diagrams/${diagramId}/collaborators/${userId}`, { role });
  return data;
}

export async function getDiagramVersions(diagramId) {
  const { data } = await api.get(`/diagrams/${diagramId}/versions`);
  return data.versions;
}

export async function getDiagramOperations(diagramId, limit = 50) {
  const { data } = await api.get(`/diagrams/${diagramId}/operations`, { params: { limit } });
  return data.operations;
}
