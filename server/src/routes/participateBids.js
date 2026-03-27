import { Router } from "express";
import ParticipateBid from "../models/ParticipateBid.js";
import Bid from "../models/Bid.js";
import Notification from "../models/Notification.js";
import Seller from "../models/Seller.js";

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
    const { bidId, mobile, rate, quantity, loadingFrom, remarks } = req.body;

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

    const item = await ParticipateBid.findOneAndUpdate(
      { bidId, mobile },
      { rate, quantity, loadingFrom, remarks },
      { upsert: true, new: true, runValidators: true }
    );

    await Promise.all([
      Notification.create({
        recipient: "all",
        recipientRole: "Admin",
        title: "New Bid Participation",
        message: `A new bid participation has been received for bid ${bid.commodity} from mobile ${mobile}. Rate: ${rate}, Qty: ${quantity}`,
        type: "BidParticipation",
        relatedId: bid._id
      }),
      Notification.create({
        recipient: "all",
        recipientRole: "Employee",
        title: "New Bid Participation",
        message: `A new bid participation has been received for bid ${bid.commodity} from mobile ${mobile}. Rate: ${rate}, Qty: ${quantity}`,
        type: "BidParticipation",
        relatedId: bid._id
      })
    ]);

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message || "An unexpected error occurred." });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
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
    await participation.save();

    res.json(participation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
