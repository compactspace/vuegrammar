import express from "express";
import {
  registerUser,
  loginUser,
  logout,
  authcheck,
  getMussemLocations,
  getTermList,
  checkEmailExistsController,
  mussemSignup,
  getChatLog,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logout);
router.get("/authcheck", authcheck);
router.get("/getTermList", getTermList);
router.post("/check-email", checkEmailExistsController);
router.post("/mussemSignup", mussemSignup);
router.get("/mussem-locations", getMussemLocations);
router.get("/employment/:employmentId/chat", getChatLog);
export default router;
