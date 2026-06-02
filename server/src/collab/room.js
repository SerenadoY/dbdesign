class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  getOrCreateRoom(diagramId) {
    if (!this.rooms.has(diagramId)) {
      this.rooms.set(diagramId, {
        users: new Map(),
        version: 0,
      });
    }
    return this.rooms.get(diagramId);
  }

  addUser(diagramId, socketId, userInfo) {
    const room = this.getOrCreateRoom(diagramId);
    room.users.set(socketId, userInfo);
    return room;
  }

  removeUser(diagramId, socketId) {
    const room = this.rooms.get(diagramId);
    if (!room) return null;
    room.users.delete(socketId);
    if (room.users.size === 0) {
      this.rooms.delete(diagramId);
      return null;
    }
    return room;
  }

  getUserCount(diagramId) {
    const room = this.rooms.get(diagramId);
    return room ? room.users.size : 0;
  }

  getUsers(diagramId) {
    const room = this.rooms.get(diagramId);
    if (!room) return [];
    return Array.from(room.users.values());
  }

  incrementVersion(diagramId) {
    const room = this.rooms.get(diagramId);
    if (room) room.version++;
    return room?.version || 0;
  }

  getVersion(diagramId) {
    return this.rooms.get(diagramId)?.version || 0;
  }
}

export const roomManager = new RoomManager();
