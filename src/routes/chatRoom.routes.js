import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { accessChat, getUserChats } from "../controllers/chatRoom.controller";

const router = Router()

router.route("/access-chat").post(verifyJWT, accessChat)
router.route("/get-chats").get(verifyJWT, getUserChats)

export default router