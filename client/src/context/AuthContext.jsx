import { createContext, useState, useEffect, useMemo, useCallback } from "react";
import { login as apiLogin, register as apiRegister, setAuthToken, getMe } from "../api/auth";
import { connectSocket, disconnectSocket } from "../api/collab";

export const AuthContext = createContext(null);

export default function AuthContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("dbdesign_token") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      setAuthToken(token);
      getMe()
        .then((res) => setUser(res.user))
        .catch(() => {
          localStorage.removeItem("dbdesign_token");
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = useCallback(async (username, password) => {
    const res = await apiLogin(username, password);
    localStorage.setItem("dbdesign_token", res.token);
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
    connectSocket(res.token);
    return res.user;
  }, []);

  const register = useCallback(async (username, password, displayName) => {
    const res = await apiRegister(username, password, displayName);
    localStorage.setItem("dbdesign_token", res.token);
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
    connectSocket(res.token);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("dbdesign_token");
    setAuthToken(null);
    setToken(null);
    setUser(null);
    disconnectSocket();
  }, []);

  const value = useMemo(
    () => ({ user, token, login, register, logout, loading }),
    [user, token, login, register, logout, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
