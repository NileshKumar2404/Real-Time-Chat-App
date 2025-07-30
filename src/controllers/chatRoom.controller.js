import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {ChatRoom} from "../models/chatRoom.models.js"
import {User} from "../models/user.models.js"

const accessChat = asyncHandler(async (req, res) => {
try {
        const {userId} = req.body
        const myId = req.user._id
    
        const user = await User.findById(userId)
        if(!user) throw new ApiError(401, "User not found");
    
        const existingChat = await ChatRoom.aggregate([
            {
                $match: {
                    isGroup: false,
                    members: {$all: [myId, userId], $size: 2}
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'members',
                    foreignField: '_id',
                    as: 'membersDetails'
                }
            },
            {
                $project: {
                    "membersDetails.password": 0,
                    "membersDetails.refreshToken": 0
                }
            },
            {$limit: 1}
        ])
    
        if(existingChat.length > 0) {
            return res
            .status(201)
            .json(new ApiResponse(
                201,
                existingChat,
                "Chat found"
            ))
        }
    
        const newChat = await ChatRoom.create({
            members: [myId, userId],
            isGroup: false,
        })
    
        const fullChat = await newChat.populate({
            path: 'members',
            select: "-password refreshToken"
        })
        
        return res
        .status(201)
        .json(new ApiResponse(
            201,
            fullChat,
            "Chat created successfully."
        ))
} catch (error) {
    console.error("Failed to access chats: ", error);
    throw new ApiError(401, error.message)
}
})

const getUserChats = asyncHandler(async (req, res) => {
    const getChats = await ChatRoom.aggregate([
        {
            $match: {
                members: {$in: [req.user._id]}
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'members',
                foreignField: '_id',
                as: 'memberDetails'
            }
        }, 
        {
            $project: {
                'memberDetails.password': 0,
                'memberDetails.refreshToken': 0,
                'members.__v': 0
            }
        },
        {
            $sort: {
                updatedAt: -1
            }
        }
    ])

    return res
    .status(201)
    .json(new ApiResponse(
        201,
        getChats,
        "All chats fetched successfully."
    ))
})

export {
    accessChat,
    getUserChats
}