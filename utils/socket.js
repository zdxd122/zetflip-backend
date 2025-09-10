const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

let io;
let authenticatedUsers = new Set(); // Track authenticated users
/*
socket.send('40{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2Mjg1NTlmNDIzZmIzMDUxOGM3MWFjNiIsImlhdCI6MTcxMzkxOTUzMn0.o-OZBhhF2ZcQzrJvthkqD-aslKC3ixLIbTmCH4O8U5A"}')
console.log('Connected to WebSocket server.');
socket.emit('42["ONLINE_UPDATE",105]');
socket.emit('42["minesClick", 'row]');
*/
function initSocket(server) {
  io = socketIo(server);
  console.log('Socket.io server initialized - attempt1');

  io.on("connection", async (socket) => {
    console.log("New socket connection established");

    // Authenticate socket connection
    const token = socket.handshake.auth.token;
    let isAuthenticated = false;

    if (token) {
      jwt.verify(token, JWT_SECRET, (err, user) => {
        if (!err && user) {
          socket.userId = user.id;
          socket.join(user.id); // Join user-specific room
          authenticatedUsers.add(user.id); // Track authenticated user
          isAuthenticated = true;
          console.log(`User ${user.id} authenticated and connected to socket`);
        } else {
          console.log("Socket authentication failed:", err?.message || "Invalid token");
        }
      });
    } else {
      console.log("No token provided for socket authentication");
    }

    console.log(`Current authenticated online count: ${authenticatedUsers.size}`);
    io.emit("ONLINE_UPDATE", authenticatedUsers.size);

    socket.on("message", (data) => {
      console.log("Message from client:", data);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      if (isAuthenticated && socket.userId) {
        authenticatedUsers.delete(socket.userId); // Remove from authenticated users
      }
      io.emit("ONLINE_UPDATE", authenticatedUsers.size);
    });
  });

  return io;
}

const getIO = () => {
  if (!io) {
    console.log("Socket.io not initialized!");
  }
  return io;
};

function getAuthenticatedUsersCount() {
  return authenticatedUsers.size;
}

function joinRoom(socket) {
  const token = socket.handshake.auth.token;
  console.log(token);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (user) {
      const roomId = user.id; // Assuming user ID is the room ID
      socket.join(roomId);
    }
  });
}

module.exports = {
  initSocket,
  getIO,
  getAuthenticatedUsersCount,
};
