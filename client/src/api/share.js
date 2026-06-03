import api from "./auth";
import axios from "axios";

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

export async function getShareToken(diagramId) {
  const { data } = await api.post(`/diagrams/${diagramId}/share`);
  return data.shareToken;
}

export async function revokeShareToken(diagramId) {
  await api.delete(`/diagrams/${diagramId}/share`);
}

export async function getSharedDiagram(token) {
  const res = await publicApi.get(`/shared/${token}`);
  return res.data.diagram;
}
