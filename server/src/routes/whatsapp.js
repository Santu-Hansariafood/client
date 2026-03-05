import { Router } from "express";

const router = Router();

router.post("/send", async (req, res) => {
  res.json({ ok: true });
});

export default router;
