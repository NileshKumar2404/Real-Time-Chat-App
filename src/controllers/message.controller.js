import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {Message} from "../models/message.models.js"
import {User} from "../models/user.models.js"
import {ChatRoom} from "../models/chatRoom.models.js"
import mongoose from "mongoose"

const sendMessage = asyncHandler(async (req, res) => {
    try {
        const {receiverId, content, chatRoomId} = req.body
        const senderId = req.user._id
    
        const sender = await User.findById(senderId)
        console.log(sender);
        
        const chatRoom = await ChatRoom.findById(chatRoomId)
        if(!chatRoom) throw new ApiError(401, "Chat room not found");
    
        const message = await Message.create({
            sender: senderId,
            receiver: receiverId,
            content: content,
            chatRoom: chatRoomId
        })
    
        await ChatRoom.findByIdAndUpdate(
            chatRoomId,
            {
                updatedAt: new Date()
            },
            {new: true}
        )
    
        return res
        .status(201)
        .json(new ApiResponse(
            201,
            {message},
            "Message send successfully."
        ))
    } catch (error) {
        console.error("Failed to send message: ", error);
        throw new ApiError(401, error.message)
    }
})

const getAllMessagesForChat = asyncHandler(async (req, res) => {
    const {chatRoomId} = req.params

    const chats = await Message.aggregate([
        {
            $match: {
                chatRoom: new mongoose.Types.ObjectId(chatRoomId)
            }
        },
        {
            $sort: {
                createdAt: 1
            }
        }, 
        {
            $lookup: {
                from: 'users',
                localField: 'sender',
                foreignField: '_id',
                as: 'senderDetails'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'receiver',
                foreignField: '_id',
                as: 'receiverDetails'
            }
        },
        { $unwind: '$senderDetails' },
        { $unwind: '$receiverDetails'},
        {
            $project: {
                _id: 1,
                content: 1,
                createdAt: 1,
                isRead: 1,
                chatRoom: 1,
                sender: {
                    _id: '$senderDetails._id',
                    name: '$senderDetails.name',
                    profilePic: '$senderDetails.profilePic'
                },
                reciever: {
                    _id: '$receiverDetails._id',
                    name: '$receiverDetails.name',
                    profilePic: '$receiverDetails.profilePic'
                }
            }
        }
    ])

    if(!chats) throw new ApiError(401, "Unable to find chats");

    return res
    .status(201)
    .json(new ApiResponse(
        201,
        chats,
        "Chats fetched successfully."
    ))
})

const markMessageIsRead = asyncHandler(async (req, res) => {
    const {messageID} = req.params

    const message = await Message.findByIdAndUpdate(
        messageID,
        {
            isRead: true
        },
        {new: true}
    )

    return res
    .status(201)
    .json(new ApiResponse(
        201,
        message,
        "Message marked as read"
    ))
})

const deleteMessage = asyncHandler(async (req, res) => {
    const {messageID} = req.params

    await Message.findByIdAndDelete(messageID)

    return res
    .status(201)
    .json(new ApiResponse(
        201,
        {},
        "Message deleted successfully."
    ))
})

export {
    sendMessage,
    getAllMessagesForChat,
    markMessageIsRead,
    deleteMessage
}