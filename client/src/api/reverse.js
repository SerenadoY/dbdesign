import api from "./auth";

export async function reverseEngineerPostgres(config) {
  const { data } = await api.post("/diagrams/reverse", config);
  return data;
}
