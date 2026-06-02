import { useState, useEffect, useContext } from "react";
import { getSocket } from "../api/collab";
import { CollabContext } from "../context/CollabContext";

export default function Collaborators({ tables = [] }) {
  const [users, setUsers] = useState([]);
  const [awarenessMap, setAwarenessMap] = useState({});
  const { onAwareness } = useContext(CollabContext);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("full-state", ({ users: userList }) => {
      setUsers(userList || []);
    });

    socket.on("user-joined", ({ users: userList }) => {
      setUsers(userList || []);
    });

    socket.on("user-left", ({ users: userList }) => {
      setUsers(userList || []);
    });

    return () => {
      socket.off("full-state");
      socket.off("user-joined");
      socket.off("user-left");
    };
  }, []);

  useEffect(() => {
    const unsub = onAwareness((data) => {
      setAwarenessMap((prev) => ({ ...prev, [data.socketId]: data }));
    });
    return unsub;
  }, [onAwareness]);

  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {users.map((u) => {
        const awareness = awarenessMap[u.socketId];
        return (
          <div
            key={u.socketId}
            className="group relative flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: getColor(u.username) }}
          >
            {u.username[0].toUpperCase()}
            <span
              className="absolute -bottom-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-xs group-hover:block"
              style={{ backgroundColor: "#1c2538", color: "#e8edf5" }}
            >
              {u.username}
              {(() => {
                const tableName = awareness?.selectedTableId
                  ? tables.find((t) => t.id === awareness.selectedTableId)?.name
                  : null;
                return tableName ? ` · ${tableName}` : "";
              })()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const COLORS = [
  "#00d4aa", "#3b82f6", "#ef4444", "#f59e0b",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

function getColor(username) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}
