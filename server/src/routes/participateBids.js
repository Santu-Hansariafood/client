import { Router } from "express";
import ParticipateBid from "../models/ParticipateBid.js";
import Bid from "../models/Bid.js";
import Notification from "../models/Notification.js";
import Seller from "../models/Seller.js";
import { invalidate } from "../middleware/cache.js";

const router = Router();

router.get("/", async (req, res) => {
  const { mobile, bidId } = req.query;
  const page = parseInt(req.query.page || "0", 10);
  const limit = parseInt(req.query.limit || "0", 10);

  const query = {};
  if (mobile) query.mobile = mobile;
  if (bidId) query.bidId = bidId;

  try {
    let items;
    if (page > 0 && limit > 0) {
      items = await ParticipateBid.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    } else {
      items = await ParticipateBid.find(query).sort({ createdAt: -1 }).lean();
    }

    const mobileNumbers = [...new Set(items.map(item => item.mobile))];
    const sellers = await Seller.find({ "phoneNumbers.value": { $in: mobileNumbers } }).lean();
    
    const itemsWithSellerNames = items.map(item => {
      const seller = sellers.find(s => s.phoneNumbers.some(p => p.value === item.mobile));
      return {
        ...item,
        sellerName: seller ? seller.sellerName : "Unknown"
      };
    });

    if (page > 0 && limit > 0) {
      const total = await ParticipateBid.countDocuments(query);
      return res.json({ data: itemsWithSellerNames, total });
    }
    
    res.json(itemsWithSellerNames);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { bidId, mobile, rate, quantity, loadingFrom, remarks, sellerCompany } =
      req.body;

    if (!bidId || !mobile) {
      return res.status(400).json({ message: "Bid ID and Mobile are required." });
    }

    if (typeof rate !== "number" || typeof quantity !== "number") {
      return res.status(400).json({ message: "Rate and quantity are required." });
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

    const seller = await Seller.findOne({ "phoneNumbers.value": mobile }).lean();
    const sellerName = seller?.sellerName || "Unknown";
    const sellerCompanies = Array.isArray(seller?.companies)
      ? seller.companies.filter(Boolean)
      : [];

    const providedCompany = String(sellerCompany || "").trim();
    let resolvedCompany = "";
    if (sellerCompanies.length === 1) {
      resolvedCompany = String(sellerCompanies[0] || "").trim();
    } else if (sellerCompanies.length > 1) {
      if (!providedCompany) {
        return res
          .status(400)
          .json({ message: "Please select your company before participating." });
      }
      const match = sellerCompanies.find(
        (c) => String(c || "").trim().toLowerCase() === providedCompany.toLowerCase(),
      );
      if (!match) {
        return res.status(400).json({ message: "Invalid company selected." });
      }
      resolvedCompany = String(match || "").trim();
    }

    const item = await ParticipateBid.findOneAndUpdate(
      { bidId, mobile },
      { rate, quantity, loadingFrom, remarks, sellerCompany: resolvedCompany },
      { upsert: true, new: true, runValidators: true }
    );

    const bidGroup = bid?.group || "N/A";
    const bidConsignee = bid?.consignee || "N/A";
    const bidOrigin = bid?.origin || "N/A";
    const bidCommodity = bid?.commodity || "N/A";
    const companyLabel = resolvedCompany || "N/A";

    const message = `Bid: ${bidCommodity} (${bidOrigin} → ${bidConsignee}) • Group: ${bidGroup} • Seller: ${sellerName} (${mobile}) • Company: ${companyLabel} • Rate: ${rate} • Qty: ${quantity} • Participation: ${item._id}`;

    await Promise.all([
      Notification.create({
        recipient: "all",
        recipientRole: "Admin",
        title: "New Bid Participation",
        message,
        type: "BidParticipation",
        relatedId: bid._id
      }),
      Notification.create({
        recipient: "all",
        recipientRole: "Employee",
        title: "New Bid Participation",
        message,
        type: "BidParticipation",
        relatedId: bid._id
      })
    ]);

    invalidate("/api/bids");
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message || "An unexpected error occurred." });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const {
      status,
      adminNotes,
      acceptanceRate,
      acceptanceQuantity,
      acceptedAt,
      acceptedByMobile,
      acceptedByRole,
    } = req.body;
    const { id } = req.params;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const participation = await ParticipateBid.findById(id);
    if (!participation) {
      return res.status(404).json({ message: "Participation not found." });
    }

    participation.status = status;
    participation.adminNotes = adminNotes || "";

    if (status === "accepted") {
      participation.acceptedRate = typeof acceptanceRate === "number" ? acceptanceRate : participation.rate;
      participation.acceptedQuantity = typeof acceptanceQuantity === "number" ? acceptanceQuantity : participation.quantity;
      participation.acceptedAt = acceptedAt ? new Date(acceptedAt) : new Date();
      participation.acceptedByMobile = acceptedByMobile || "";
      participation.acceptedByRole = acceptedByRole || "";
    } else {
      participation.acceptedRate = null;
      participation.acceptedQuantity = null;
      participation.acceptedAt = null;
      participation.acceptedByMobile = "";
      participation.acceptedByRole = "";
    }

    await participation.save();

    const bid = await Bid.findById(participation.bidId);
    const bidGroup = bid?.group || "N/A";
    const bidConsignee = bid?.consignee || "N/A";
    const bidOrigin = bid?.origin || "N/A";
    const bidCommodity = bid?.commodity || "N/A";
    const companyLabel = participation?.sellerCompany || "N/A";

    if (status === "accepted") {
      const ConfirmBid = (await import("../models/ConfirmBid.js")).default;
      const confirmDoc = await ConfirmBid.create({
        bidId: participation.bidId,
        phone: participation.mobile,
        status: "Confirmed",
        participationId: participation._id,
        acceptanceRate: participation.acceptedRate,
        acceptanceQuantity: participation.acceptedQuantity,
        acceptedAt: participation.acceptedAt,
        acceptedByMobile: participation.acceptedByMobile,
        acceptedByRole: participation.acceptedByRole,
      });

      const acceptedAtText = participation.acceptedAt
        ? new Date(participation.acceptedAt).toLocaleString()
        : new Date().toLocaleString();

      const sellerMsg = `Bid accepted • ${bidCommodity} (${bidOrigin} → ${bidConsignee}) • Group: ${bidGroup} • Company: ${companyLabel} • Accepted Rate: ₹${participation.acceptedRate} • Accepted Qty: ${participation.acceptedQuantity} • On: ${acceptedAtText} • Participation: ${participation._id}`;

      const buyerMsg = `Seller accepted • ${bidCommodity} (${bidOrigin} → ${bidConsignee}) • Group: ${bidGroup} • Seller: ${participation.mobile} • Company: ${companyLabel} • Accepted Rate: ₹${participation.acceptedRate} • Accepted Qty: ${participation.acceptedQuantity} • On: ${acceptedAtText} • Participation: ${participation._id}`;

      const notifyBuyerMobile = bid?.createdByMobile || null;

      const notifications = [
        Notification.create({
          recipient: participation.mobile,
          recipientRole: "Seller",
          title: "Bid Accepted",
          message: sellerMsg,
          type: "BidConfirmation",
          relatedId: confirmDoc._id,
        }),
        Notification.create({
          recipient: notifyBuyerMobile || "all",
          recipientRole: "Buyer",
          title: "Bid Accepted",
          message: buyerMsg,
          type: "BidConfirmation",
          relatedId: confirmDoc._id,
        }),
      ];

      // Broadcast to Admin and Employee for visibility
      notifications.push(
        Notification.create({
          recipient: "all",
          recipientRole: "Admin",
          title: "Bid Accepted",
          message: `Accepted • ${bidCommodity} (${bidOrigin} → ${bidConsignee}) • Group: ${bidGroup} • Seller: ${participation.mobile} • Company: ${companyLabel} • ₹${participation.acceptedRate} / ${participation.acceptedQuantity} • Participation: ${participation._id}`,
          type: "BidConfirmation",
          relatedId: confirmDoc._id,
        }),
        Notification.create({
          recipient: "all",
          recipientRole: "Employee",
          title: "Bid Accepted",
          message: `Accepted • ${bidCommodity} (${bidOrigin} → ${bidConsignee}) • Group: ${bidGroup} • Seller: ${participation.mobile} • Company: ${companyLabel} • ₹${participation.acceptedRate} / ${participation.acceptedQuantity} • Participation: ${participation._id}`,
          type: "BidConfirmation",
          relatedId: confirmDoc._id,
        }),
      );

      await Promise.all(notifications);
    } else if (status === "rejected") {
      const sellerMsg = `Bid rejected • ${bidCommodity} (${bidOrigin} → ${bidConsignee}) • Group: ${bidGroup} • Company: ${companyLabel} • Participation: ${participation._id}${adminNotes ? ` • Notes: ${adminNotes}` : ""}`;
      await Notification.create({
        recipient: participation.mobile,
        recipientRole: "Seller",
        title: "Bid Rejected",
        message: sellerMsg,
        type: "BidRejection",
        relatedId: participation._id,
      });
    }

    res.json(participation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
