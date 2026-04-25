import { Router } from "express";
import ConfirmBid from "../models/ConfirmBid.js";
import Notification from "../models/Notification.js";
import Bid from "../models/Bid.js";

const router = Router();

router.get("/", async (req, res) => {
  const { mobile, bidId, status } = req.query;
  const page = parseInt(req.query.page || "0", 10);
  const limit = parseInt(req.query.limit || "0", 10);

  const query = {};
  if (mobile) query.phone = mobile;
  if (bidId) query.bidId = bidId;
  if (status) query.status = status;

  try {
    if (page > 0 && limit > 0) {
      const items = await ConfirmBid.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
      const total = await ConfirmBid.countDocuments(query);
      return res.json({ data: items, total });
    }
    const items = await ConfirmBid.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      bidId,
      phone,
      status,
      participationId,
      acceptanceRate,
      acceptanceQuantity,
      acceptedAt,
      acceptedByMobile,
      acceptedByRole,
    } = req.body;

    const normalizedAcceptedAt =
      status === "Confirmed"
        ? acceptedAt
          ? new Date(acceptedAt)
          : new Date()
        : acceptedAt
          ? new Date(acceptedAt)
          : null;

    const normalizedAcceptanceRate =
      typeof acceptanceRate === "number" ? acceptanceRate : null;
    const normalizedAcceptanceQuantity =
      typeof acceptanceQuantity === "number" ? acceptanceQuantity : null;
    const normalizedAcceptanceAmount =
      typeof normalizedAcceptanceRate === "number" &&
      typeof normalizedAcceptanceQuantity === "number"
        ? normalizedAcceptanceRate * normalizedAcceptanceQuantity
        : null;

    const item = await ConfirmBid.create({
      bidId,
      phone,
      status,
      participationId: participationId || null,
      acceptanceRate: normalizedAcceptanceRate,
      acceptanceQuantity: normalizedAcceptanceQuantity,
      acceptanceAmount: normalizedAcceptanceAmount,
      acceptedAt: normalizedAcceptedAt,
      acceptedByMobile: acceptedByMobile || "",
      acceptedByRole: acceptedByRole || "",
    });

    const bid = await Bid.findById(bidId);

    if (phone || participationId) {
      const ParticipateBid = (await import("../models/ParticipateBid.js"))
        .default;
      const pQuery = participationId
        ? { _id: participationId }
        : { bidId, mobile: phone };
      const participation = await ParticipateBid.findOne(pQuery);
      if (participation) {
        if (status === "Confirmed") {
          participation.status = "accepted";
          participation.acceptedRate =
            typeof acceptanceRate === "number"
              ? acceptanceRate
              : participation.rate;
          participation.acceptedQuantity =
            typeof acceptanceQuantity === "number"
              ? acceptanceQuantity
              : participation.quantity;
          participation.acceptedAt = acceptedAt
            ? new Date(acceptedAt)
            : new Date();
          participation.acceptedByMobile = acceptedByMobile || "";
          participation.acceptedByRole = acceptedByRole || "";
        } else if (status === "Rejected") {
          participation.status = "rejected";
        }
        await participation.save();
      }
    }

    if (bid && status === "Confirmed") {
      const sellerMsg = `Bid accepted for ${bid.commodity} at rate ₹${item.acceptanceRate ?? "N/A"}, qty ${item.acceptanceQuantity ?? "N/A"}. ${item.acceptedAt ? new Date(item.acceptedAt).toLocaleString() : ""}`;
      await Notification.create({
        recipient: phone,
        recipientRole: "Seller",
        title: "Bid Accepted",
        message: sellerMsg,
        type: "BidConfirmation",
        relatedId: item._id,
      });

      const buyerMsg = `Seller ${phone} accepted for ${bid.commodity} at rate ₹${item.acceptanceRate ?? "N/A"}, qty ${item.acceptanceQuantity ?? "N/A"}.`;
      await Notification.create({
        recipient: bid.createdByMobile || "all",
        recipientRole: "Buyer",
        title: "Bid Accepted",
        message: buyerMsg,
        type: "BidConfirmation",
        relatedId: item._id,
      });
    }

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
