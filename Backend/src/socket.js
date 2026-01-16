// --- THIS IS A NEW FILE ---
// FILE: Backend/src/socket.js

import { Server } from "socket.io";
import { EventEmitter } from "events";

const eventEmitter = new EventEmitter();

const initSocket = (httpServer) => {
    // Parse allowed origins from environment variable
    const allowedOrigins = process.env.CORS_ORIGIN 
        ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
        : ["http://localhost:5173", "http://localhost:3000"];

    console.log('🔌 Initializing Socket.IO with allowed origins:', allowedOrigins);

    const io = new Server(httpServer, {
        path: '/socket.io',
        cors: {
            origin: (origin, callback) => {
                // Allow requests with no origin (like mobile apps or curl requests)
                if (!origin) return callback(null, true);
                
                if (allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    console.warn(`🔒 Socket.IO CORS blocked request from origin: ${origin}`);
                    callback(new Error('Not allowed by CORS'));
                }
            },
            methods: ["GET", "POST"],
            credentials: true
        },
        transports: ['websocket', 'polling'],
        allowEIO3: true,
        pingTimeout: 60000,
        pingInterval: 25000
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

        // WebRTC signaling for video calls
        socket.on('join_video_room', ({ roomId, userId }) => {
            socket.join(roomId);
            console.log(`User ${socket.id} joined video room: ${roomId}`);
            // Notify others in the room
            socket.to(roomId).emit('user_joined', { userId, socketId: socket.id });
        });

        socket.on('video_offer', ({ roomId, offer, targetSocketId }) => {
            console.log(`Video offer sent to room: ${roomId}`);
            if (targetSocketId) {
                io.to(targetSocketId).emit('video_offer', { offer, senderSocketId: socket.id });
            } else {
                socket.to(roomId).emit('video_offer', { offer, senderSocketId: socket.id });
            }
        });

        socket.on('video_answer', ({ roomId, answer, targetSocketId }) => {
            console.log(`Video answer sent to room: ${roomId}`);
            if (targetSocketId) {
                io.to(targetSocketId).emit('video_answer', { answer, senderSocketId: socket.id });
            } else {
                socket.to(roomId).emit('video_answer', { answer, senderSocketId: socket.id });
            }
        });

        socket.on('ice_candidate', ({ roomId, candidate, targetSocketId }) => {
            if (targetSocketId) {
                io.to(targetSocketId).emit('ice_candidate', { candidate, senderSocketId: socket.id });
            } else {
                socket.to(roomId).emit('ice_candidate', { candidate, senderSocketId: socket.id });
            }
        });

        socket.on('raise_hand', ({ roomId, userId, raised }) => {
            console.log(`✋ Hand ${raised ? 'raised' : 'lowered'} by ${userId} in room: ${roomId}`);
            socket.to(roomId).emit('hand_raised', { userId, raised });
        });

        socket.on('send_chat_message', ({ roomId, message, sender, timestamp }) => {
            console.log(`💬 Chat message in room ${roomId}:`, message);
            socket.to(roomId).emit('chat_message', { message, sender, timestamp });
        });

        socket.on('change_consent', ({ roomId, consent }) => {
            console.log(`📝 Recording consent changed in room ${roomId}:`, consent);
            socket.to(roomId).emit('consent_changed', { consent });
        });

        socket.on('leave_video_room', ({ roomId, userId }) => {
            socket.leave(roomId);
            socket.to(roomId).emit('user_left', { userId, socketId: socket.id });
            console.log(`User ${socket.id} left video room: ${roomId}`);
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