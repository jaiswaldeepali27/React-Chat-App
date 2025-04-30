import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io , getReceiverSocketId } from "../lib/socket.js";


export const getUserForSidebar = async (req, res) => {
    try {
        console.log(req.user._id);
         const loggedInUserId = req.user._id;
         const filterUser = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
    
         res.status(200).json(filterUser);
    } catch (error) {
        console.log("Error in getUserForSidebar controller", error.message);
        return res.status(500).json({ message: "Internal server error"});
        
    }
}

export const getMessages = async (req, res) => {
    try {
        const { id: userToChat} = req.params;
        const myId = req.user._id;
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChat },
                { senderId: userToChat, receiverId: myId },
            ],
        })

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getMessages controller", error.message);
        return res.status(500).json({ message: "Internal server error"});
        
    }
}

export const sendMessage = async (req, res) => {
    try {
        const { text, image} = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        })

        await newMessage.save();

        const receiverSocketId = getReceiverSocketId(receiverId);
        if(receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }
        res.status(200).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage controller", error.message);
        return res.status(500).json({ message: "Internal server error"});
        
    }
}
