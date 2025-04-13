import express from "express";
import {
  forgotPassword,
  loginUser,
  logoutUser,
  profile,
  registerUser,
  resetPassword,
  verifyUser,
} from "../controller/user.controller.js";
import { isLoggedIn } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.get("/verify/:token", verifyUser);
router.post("/login", loginUser);
router.get("/profile", isLoggedIn, profile);
router.get("/logout", isLoggedIn, logoutUser);
router.get("/forgot", forgotPassword);
router.post("/reset/:resetPassToken", resetPassword);

export default router;
