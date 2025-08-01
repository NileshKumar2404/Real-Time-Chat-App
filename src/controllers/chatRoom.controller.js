import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {ChatRoom} from "../models/chatRoom.models.js"
import {User} from "../models/user.models.js"

const accessChat = asyncHandler(async (req, res) => {
try {
        const {userId, members= [], isGroup, groupName} = req.body
        const myId = req.user._id
    
        //For Group Chat
        if (isGroup) {
            if (!groupName || members.length < 2) {
                throw new ApiError(400, "Group name and at least 2 members required");
            }

            const allMembers = [...members.map(id => id.toString()), myId.toString()];
            const uniqueMembers = Array.from(new Set(allMembers));

            const groupChat = await ChatRoom.create({
                members: uniqueMembers,
                isGroup: true,
                groupName,
            });

            const fullChat = await groupChat.populate({
                path: 'members',
                select: "-password -refreshToken"
            });

            return res.status(201).json(new ApiResponse(201, fullChat, "Group chat created"));
        }

        //For 1 on 1 chat
        if(!userId) throw new ApiError(401, "User id is required");

        const user = await User.findById(userId)
        if(!user) throw new ApiError(401, "User not found");

        const existingChat = await ChatRoom.aggregate([
            {
                $match: {
                    isGroup: false,
                    members: {
                        $all: [myId, userId],
                        $size: 2
                    }
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
                    'membersDetails.password': 0,
                    'membersDetails.refreshToken': 0
                }
            },
            {$limit: 1}
        ])

        if(existingChat.length > 0) {
            return res
            .status(200)
            .json(new ApiResponse(
                200,
                existingChat[0],
                "Chat found"
            ))
        }

        const newChat = await ChatRoom.create({
            members: [myId, userId],
            isGroup: false
        })

        const fullChat = await newChat.populate({
            path: 'members',
            select: '-password -refreshToken'
        })

        return res
        .status(200)
        .json(new ApiResponse(
            200, 
            fullChat,
            "1 - on - 1 Chat created."
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
                'members': 0,
                'memberDetails.password': 0,
                'memberDetails.refreshToken': 0,
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