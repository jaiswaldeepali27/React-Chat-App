import { Server } from "socket.io";
import http from "http";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "../routes/auth.route.js";
import messageRoutes from "../routes/message.route.js";
import { connectDB } from "./db.js";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const app = express();
const server = http.createServer(app);


// CORS + Middleware
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Serve frontend in production
const __dirname = path.resolve();
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));
    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
    });
}

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173"],
    }
});

const userSocketMap = {};

export function getReceiverSocketId(userId) {
    return userSocketMap[userId] || null;
}

io.on("connection", (socket) => {
    console.log("A user Connected", socket.id);
    const userId = socket.handshake.query.userId;
    if (userId) {
        userSocketMap[userId] = socket.id;
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        console.log("A user Disconnected", socket.id);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

connectDB();

export { io, app, server };
