import api from "./auth";

export async function searchUsers(query) {
  const { data } = await api.get("/users/search", { params: { q: query } });
  return data.users;
}
