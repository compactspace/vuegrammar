import express from "express";
import { addLocation } from "../models/locationModel.js";

const router = express.Router();

// 위치 저장 API
router.post("/api/location", async (req, res) => {
  const { user_id, lat, lon, address } = req.body;

  try {
    // 위치 저장
    await addLocation(user_id, lat, lon, address);

    // 저장 후 성공 응답
    res
      .status(200)
      .json({ success: true, message: "Location saved successfully!" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to save location" });
  }
});

export default router;
