import express from "express";
import { isAuthenticated, login, logout, register, resetPassword, sendResetOtp, sendVerifyOtp, verifyEmail } from "../controllers/authController.js";
import { userAuth } from "../middleware/userAuth.js";


const authRouter = express.Router();


authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.post("/send_verify_otp", userAuth, sendVerifyOtp);
authRouter.post("/verify_account", userAuth, verifyEmail);
authRouter.post("/is_auth", userAuth, isAuthenticated);
authRouter.post("/send_reset_otp", sendResetOtp);
authRouter.post("/reset_password", resetPassword);


export default authRouter;