// --- THIS IS A NEW FILE ---
// FILE: Backend/src/socket.js

import { Server } from "socket.io";
import { EventEmitter } from "events";

const eventEmitter = new EventEmitter();

const initSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || "http://localhost:5173",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log("🔌 New client connected:", socket.id);

        socket.on('join_user_room', (userId) => {
            socket.join(userId);
            console.log(`User ${socket.id} joined room: ${userId}`);
        });

        socket.on('join_conversation', (conversationId) => {
            socket.join(conversationId);
            console.log(`User ${socket.id} joined conversation: ${conversationId}`);
        });

        socket.on("disconnect", () => {
            console.log("🔌 Client disconnected:", socket.id);
        });
    });

    // Listener for sending notifications
    eventEmitter.on('send_notification', ({ recipientId, notification }) => {
        io.to(recipientId).emit('new_notification', notification);
    });

    // Listener for sending new messages
    eventEmitter.on('send_message', ({ conversationId, message }) => {
        io.to(conversationId).emit('new_message', message);
    });
};

export { initSocket, eventEmitter };