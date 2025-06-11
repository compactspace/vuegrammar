import express from "express";

const router = express.Router();
router.get("/status", (req, res) => {
  if (req.authStatus !== "valid") {
    return res.status(401).json({ error: "세션 없음" });
  }
  return res.json({ ok: true, user: req.session?.user });
});
export default router;
