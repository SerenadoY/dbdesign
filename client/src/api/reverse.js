import api from "./auth";

export async function reverseEngineerDatabase(config) {
  const { data } = await api.post("/diagrams/reverse", config);
  return data;
}
