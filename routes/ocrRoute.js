import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { extractTextFromImage } from "../ocr/ocr.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("image"), async (req, res) => {
  const imagePath = path.resolve(req.file.path);
  try {
    const text = await extractTextFromImage(imagePath);
    fs.unlinkSync(imagePath);
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: "OCR 실패", detail: err.message });
  }
});

export default router;
