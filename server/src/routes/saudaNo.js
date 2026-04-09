import { Router } from "express";
import SelfOrder from "../models/SelfOrder.js";

const router = Router();

router.post("/", async (_req, res) => {
  try {
    const lastOrder = await SelfOrder.findOne().sort({ createdAt: -1 }).lean();

    const extractNumber = (value) => {
      if (!value) return 0;
      const digits = String(value).replace(/\D/g, "");
      const n = parseInt(digits, 10);
      return Number.isNaN(n) ? 0 : n;
    };

    const lastNo = extractNumber(lastOrder?.saudaNo);
    const nextNo = lastNo + 1;
    const saudaNo = String(nextNo).padStart(4, "0");

    res.json({ saudaNo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
