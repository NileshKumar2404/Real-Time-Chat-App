import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"
import { changePassword, loginUser, logoutUser, registerUser, updateLastSeen, updateOnlineStatus } from "../controllers/user.controller.js";

const router = Router()

router.route("/register-user").post(
    upload.fields([
        {
            name: 'profilePic',
            maxCount: 1
        }
    ]),
    registerUser
)
router.route("/login-user").post(loginUser)
router.route("/log-out").post(verifyJWT, logoutUser)
router.route("/change-pass").post(verifyJWT, changePassword)
router.route("/online-status/:userId").post(verifyJWT, updateOnlineStatus)
router.route("/update-lastSeen").post(verifyJWT, updateLastSeen)

export default router