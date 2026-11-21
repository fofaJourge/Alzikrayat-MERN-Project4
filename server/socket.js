// socket.js: sets up Socket.io on top of the Express HTTP server.
// Every photo detail page gets its own "room" so comments are only
// broadcast to people who are viewing that specific photo.

const { Server } = require("socket.io");
const mongoose = require("mongoose");

let io;

const roomName = (photoId) => `photo:${photoId}`;

const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Client opens a photo page -> join that photo's room
        socket.on("photo:join", (photoId) => {
            if (typeof photoId !== "string" || !mongoose.isValidObjectId(photoId)) {
                return; // ignore invalid ids (input validation)
            }
            socket.join(roomName(photoId));
        });

        // Client leaves the photo page -> leave the room
        socket.on("photo:leave", (photoId) => {
            if (typeof photoId === "string") {
                socket.leave(roomName(photoId));
            }
        });

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

// Lets controllers emit events without creating circular imports
const getIO = () => {
    if (!io) {
        throw new Error("Socket.io has not been initialized");
    }
    return io;
};

module.exports = { initSocket, getIO, roomName };
