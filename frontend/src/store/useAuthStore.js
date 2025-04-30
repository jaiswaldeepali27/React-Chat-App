import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";
export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    onlineUsers: [],
    socket: null,

    isCheckingAuth: true,

    checkAuth: async () => {
        try {
            const response = await axiosInstance.get("/auth/check");
            // console.log("checkAuth SUCCESS:", response.data); 
            set({ authUser: response.data});
            get().connectSocket(); // Call connectSocket after successful checkAuth
        } catch (error) {
            console.error("Error checking auth:", error);
            // console.error("checkAuth ERROR:", error.response?.data || error.message);
            set({ authUser: null })
        } finally {
            set({ isCheckingAuth: false });
        }

    },

    signup: async (data) => {
        set({ isSigningUp: true });
        try {
            const response = await axiosInstance.post("/auth/signup", data);
            set({ authUser: response.data });
            toast.success("Account created successfully! Please check your email to verify your account.");

            get().connectSocket(); // Call connectSocket after successful signup
        } catch (error) {
            console.error("Error signing up:", error);
            toast.error(error.response?.data?.message || "An error occurred during signup.");
        } finally {
            set({ isSigningUp: false });
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout")
            set({ authUser: null });
            toast.success("Logged out successfully!");
            get().diconnectSocket(); // Call diconnectSocket after successful logout
        } catch (error) {
            console.error("Error logging out:", error);
            toast.error(error.response?.data?.message || "An error occurred during logout.");
        }
    },

    login: async (data) => {
        set({ isLoggingIn: true});
        try {
            const response = await axiosInstance.post("/auth/login", data);
            set({ authUser: response.data});
            toast.success("Logged in successfully!");

            get().connectSocket(); // Call connectSocket after successful login
        } catch (error) {
            console.error("Error logging in:", error);
            toast.error(error.response?.data?.message || "An error occurred during login.");
        } finally {
            set({ isLoggingIn: false });
        }
    },

    updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
            const response = await axiosInstance.put("/auth/update/profile", data);
            set({authUser: response.data});
            toast.success("Profile updated successfully!");

        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error(error.response?.data?.message || "An error occurred during profile update.");
            
        } finally {
            set({ isUpdatingProfile: false });
        }

    },

    connectSocket: () => {
        const { authUser } = get();
        if (!authUser || get().socket?.connected) return; // Don't connect if not authenticated
        const socket = io(BASE_URL, {
            query: { userId: authUser._id },
        });
        socket.connect();
        set({ socket: socket });

        socket.on("getOnlineUsers", (userIds) => {
            set({ onlineUsers: userIds });
        });
    },

    diconnectSocket: () => {
        if(get().socket?.connected){
            get().socket.disconnect();
            set({ socket: null });
        }
    },

}));