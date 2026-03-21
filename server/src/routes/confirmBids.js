import { Router } from "express";
import ConfirmBid from "../models/ConfirmBid.js";
import Notification from "../models/Notification.js";
import Bid from "../models/Bid.js";

const router = Router();

router.get("/", async (req, res) => {
  const page = parseInt(req.query.page || "0", 10);
  const limit = parseInt(req.query.limit || "0", 10);
  if (page > 0 && limit > 0) {
    const items = await ConfirmBid.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    const total = await ConfirmBid.countDocuments();
    return res.json({ data: items, total });
  }
  const items = await ConfirmBid.find().sort({ createdAt: -1 }).lean();
  res.json(items);
});

router.post("/", async (req, res) => {
  try {
    const { bidId, phone, status } = req.body;
    const item = await ConfirmBid.create(req.body);
    
    const bid = await Bid.findById(bidId);
    if (bid && status === "Confirmed") {
      // Notify Seller (Seller is the one who participates, and they are notified if their participation is confirmed)
      // Actually, in this system, 'phone' in ConfirmBid is the mobile of the person whose bid was confirmed.
      await Notification.create({
        recipient: phone,
        recipientRole: "Seller",
        title: "Bid Accepted",
        message: `Congratulations! Your bid for ${bid.commodity} has been accepted.`,
        type: "BidConfirmation",
        relatedId: bidId
      });
    }

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
