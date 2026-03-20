import { Router } from "express";
import ParticipateBid from "../models/ParticipateBid.js";

const router = Router();

router.get("/", async (req, res) => {
  const page = parseInt(req.query.page || "0", 10);
  const limit = parseInt(req.query.limit || "0", 10);
  if (page > 0 && limit > 0) {
    const items = await ParticipateBid.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    const total = await ParticipateBid.countDocuments();
    return res.json({ data: items, total });
  }
  const items = await ParticipateBid.find().sort({ createdAt: -1 }).lean();
  res.json(items);
});

router.post("/", async (req, res) => {
  try {
    const { bidId } = req.body;

    if (!bidId) {
      return res.status(400).json({ message: "Bid ID is required." });
    }

    const bid = await Bid.findById(bidId);

    if (!bid) {
      return res.status(404).json({ message: "Bid not found." });
    }

    if (bid.status === "closed") {
      return res
        .status(403)
        .json({ message: "This bid is closed and no longer accepting participations." });
    }

    const item = await ParticipateBid.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: "An unexpected error occurred." });
  }
});

export default router;
