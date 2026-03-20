import { Router } from "express";
import ParticipateBid from "../models/ParticipateBid.js";
import Bid from "../models/Bid.js";

const router = Router();

router.get("/", async (req, res) => {
  const { mobile } = req.query;
  const page = parseInt(req.query.page || "0", 10);
  const limit = parseInt(req.query.limit || "0", 10);

  const query = {};
  if (mobile) query.mobile = mobile;

  if (page > 0 && limit > 0) {
    const items = await ParticipateBid.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    const total = await ParticipateBid.countDocuments(query);
    return res.json({ data: items, total });
  }
  const items = await ParticipateBid.find(query).sort({ createdAt: -1 }).lean();
  res.json(items);
});

router.post("/", async (req, res) => {
  try {
    const { bidId, mobile, rate, quantity } = req.body;

    if (!bidId || !mobile) {
      return res.status(400).json({ message: "Bid ID and Mobile are required." });
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

    // Upsert participation based on bidId and mobile
    const item = await ParticipateBid.findOneAndUpdate(
      { bidId, mobile },
      { rate, quantity },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message || "An unexpected error occurred." });
  }
});

export default router;
