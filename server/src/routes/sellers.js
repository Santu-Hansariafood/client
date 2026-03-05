import { Router } from "express";
import Seller from "../models/Seller.js";

const router = Router();

router.get("/", async (req, res) => {
  const page = parseInt(req.query.page || "0", 10);
  const limit = parseInt(req.query.limit || "0", 10);
  if (page > 0 && limit > 0) {
    const items = await Seller.find()
      .sort({ sellerName: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    const total = await Seller.countDocuments();
    return res.json({ data: items, total });
  }
  const items = await Seller.find().sort({ sellerName: 1 }).lean();
  res.json(items);
});

router.get("/:id", async (req, res) => {
  const item = await Seller.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ message: "Not found" });
  res.json(item);
});

router.post("/", async (req, res) => {
  const item = await Seller.create(req.body);
  res.status(201).json(item);
});

export default router;
