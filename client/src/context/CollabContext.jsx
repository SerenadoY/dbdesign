import { createContext, useMemo, useRef, useEffect, useCallback, useContext } from "react";
import { getSocket, connectSocket } from "../api/collab";
import { AuthContext } from "./AuthContext";

export const CollabContext = createContext({
  emitDelta: () => {},
  emitAwareness: () => {},
  isApplyingRemoteRef: { current: false },
  onRemoteDelta: () => {},
  onRemoteFullState: () => {},
  onAwareness: () => {},
});

export default function CollabContextProvider({ children }) {
  const isApplyingRemoteRef = useRef(false);
  const callbacksRef = useRef([]);
  const fullStateCallbacksRef = useRef([]);
  const awarenessCallbacksRef = useRef([]);
  const { token } = useContext(AuthContext);

  const onRemoteDelta = useCallback((fn) => {
    callbacksRef.current.push(fn);
    return () => {
      callbacksRef.current = callbacksRef.current.filter((f) => f !== fn);
    };
  }, []);

  const onRemoteFullState = useCallback((fn) => {
    fullStateCallbacksRef.current.push(fn);
    return () => {
      fullStateCallbacksRef.current = fullStateCallbacksRef.current.filter((f) => f !== fn);
    };
  }, []);

  const onAwareness = useCallback((fn) => {
    awarenessCallbacksRef.current.push(fn);
    return () => {
      awarenessCallbacksRef.current = awarenessCallbacksRef.current.filter((f) => f !== fn);
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    const socket = connectSocket(token);

    socket.on("delta", ({ delta }) => {
      isApplyingRemoteRef.current = true;
      try {
        callbacksRef.current.forEach((fn) => fn(delta));
      } finally {
        isApplyingRemoteRef.current = false;
      }
    });

    socket.on("full-state", ({ diagramData, version, users }) => {
      fullStateCallbacksRef.current.forEach((fn) => fn(diagramData, version, users));
    });

    socket.on("awareness", (data) => {
      awarenessCallbacksRef.current.forEach((fn) => fn(data));
    });

    return () => {
      socket.off("delta");
      socket.off("full-state");
      socket.off("awareness");
    };
  }, [token]);

  const emitDelta = useCallback((delta) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("delta", { delta, version: Date.now() });
    }
  }, []);

  const emitAwareness = useCallback((data) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("awareness", data);
    }
  }, []);

  const value = useMemo(
    () => ({ emitDelta, emitAwareness, isApplyingRemoteRef, onRemoteDelta, onRemoteFullState, onAwareness }),
    [emitDelta, emitAwareness, onRemoteDelta, onRemoteFullState, onAwareness],
  );

  return <CollabContext.Provider value={value}>{children}</CollabContext.Provider>;
}
