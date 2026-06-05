import api from "./auth";

export async function testConnection(config) {
  const { data } = await api.post("/diagrams/reverse/test", config);
  return data;
}

export async function reverseEngineerDatabase(config) {
  const { data } = await api.post("/diagrams/reverse", config);
  return data;
}
