import express from "express";

import { getChatLog } from "../controllers/userController.js";
const router = express.Router();
router.get("/employment/:employmentId/chat", getChatLog);

router.post("/sessionTest", (req,res) => {

    res.json({})
});

export default router;
