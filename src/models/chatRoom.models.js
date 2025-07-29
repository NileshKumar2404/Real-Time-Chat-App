import mongoose from "mongoose";

const chatRoomSchema = new mongoose.Schema({
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isGroup: {
        type: Boolean,
        default: false
    },
    groupName: {
        type: String,
        required: true
    }
},{timestamps: true})

export const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema)