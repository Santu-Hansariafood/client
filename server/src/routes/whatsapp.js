import { Router } from "express";
import Bid from "../models/Bid.js";
import Seller from "../models/Seller.js";
import { sendBidMessages } from "../lib/hfConnect.js";

const router = Router();

router.post("/send", async (req, res) => {
  try {
    const bidId = String(req.body.bidId || "").trim();
    if (!bidId) {
      return res.status(400).json({ message: "Bid ID is required." });
    }

    const bid = await Bid.findById(bidId).lean();
    if (!bid) {
      return res.status(404).json({ message: "Bid not found." });
    }

    const isStaff = ["Admin", "Employee"].includes(req.user?.role);
    const isBidCreator =
      String(req.user?.mobile || "") === String(bid.createdByMobile || "");
    if (!isStaff && !isBidCreator) {
      return res.status(403).json({ message: "Access denied." });
    }

    const sellers = await Seller.find({})
      .select("phoneNumbers.value")
      .lean();
    const recipients = sellers.flatMap((seller) =>
      (seller.phoneNumbers || []).map((phone) => phone.value),
    );

    const delivery = await sendBidMessages({
      event: "new_bid",
      bid,
      recipients,
    });

    if (delivery.failed > 0) {
      return res.status(502).json({
        ok: false,
        ...delivery,
        message: "One or more bid messages could not be sent.",
      });
    }

    res.json({
      ok: true,
      ...delivery,
      message:
        delivery.sent > 0
          ? "Bid messages sent."
          : "No registered seller mobile numbers found.",
    });
  } catch (error) {
    console.error("HF Connect new bid messaging failed:", error.message);
    res.status(500).json({ message: "Failed to send bid messages." });
  }
});

export default router;
