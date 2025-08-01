import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { deleteMessage, getAllMessagesForChat, markMessageIsRead, sendMessage } from "../controllers/message.controller.js";

const router = Router()

router.route("/send-message").post(verifyJWT, sendMessage)
router.route("/get-messages/:chatRoomId").get(verifyJWT, getAllMessagesForChat)
router.route("/mark-message/:messageID").post(verifyJWT, markMessageIsRead)
router.route("/delete-message/:messageID").delete(verifyJWT, deleteMessage)

export default router