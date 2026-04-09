import { Router } from "express";
import Bid from "../models/Bid.js";
import Notification from "../models/Notification.js";
import Seller from "../models/Seller.js";
import ParticipateBid from "../models/ParticipateBid.js";
import BidLocation from "../models/BidLocation.js";
import { invalidate } from "../middleware/cache.js";

const router = Router();

const closeExpiredBids = async () => {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const startOfToday = new Date(todayStr);
    const currentTimeStr =
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");

    // Efficiently find bids that should be closed using a single query
    const bidsToClose = await Bid.find({
      status: "active",
      $or: [
        { bidDate: { $lt: startOfToday } },
        { 
          bidDate: { $gte: startOfToday, $lt: new Date(startOfToday.getTime() + 86400000) }, 
          endTime: { $lt: currentTimeStr } 
        }
      ]
    }).select("_id").lean();

    if (bidsToClose.length > 0) {
      const ids = bidsToClose.map((b) => b._id);
      await Bid.updateMany(
        { _id: { $in: ids } },
        { $set: { status: "closed", closedAt: now } }
      );
    }
  } catch (error) {
    console.error("Error auto-closing bids:", error);
  }
};

router.get("/supplier-today", async (req, res) => {
  try {
    await closeExpiredBids();

    const mobile = String(req.query.mobile || "").trim();
    const dateStr = String(req.query.date || "").trim();

    if (!mobile) {
      return res.status(400).json({ message: "mobile is required" });
    }

    const seller = await Seller.findOne({ "phoneNumbers.value": mobile }).lean();
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const sellerCommodityDetails = Array.isArray(seller.commodities)
      ? seller.commodities
          .map((c) => ({
            name: String(c?.name || "").trim(),
            brokerage: Number(c?.brokerage || 0),
          }))
          .filter((c) => Boolean(c.name))
      : [];

    const sellerCommodities = [
      ...new Set(sellerCommodityDetails.map((c) => c.name)),
    ];

    const baseDate = dateStr ? new Date(dateStr) : new Date();
    const dayStr = baseDate.toISOString().split("T")[0];
    const start = new Date(`${dayStr}T00:00:00.000Z`);
    const end = new Date(`${dayStr}T00:00:00.000Z`);
    end.setUTCDate(end.getUTCDate() + 1);

    const myParticipationsAll = await ParticipateBid.find({ mobile }).lean();
    const myParticipatedBidIds = myParticipationsAll.map(p => p.bidId);

    const bids = await Bid.find({
      $or: [
        { _id: { $in: myParticipatedBidIds } },
        {
          $and: [
            { commodity: { $in: sellerCommodities } },
            {
              $or: [
                { bidDate: { $gte: start, $lt: end } },
                { status: "active" }
              ]
            }
          ]
        }
      ]
    })
      .select(
        "_id type group consignee origin commodity parameters notes quantity rate bidDate startTime endTime paymentTerms delivery company unit status closedAt createdByMobile createdByRole",
      )
      .sort({ createdAt: -1 })
      .lean();

    const bidIds = bids.map((b) => b._id);

    const myParticipations = myParticipationsAll.filter(p => 
      bidIds.some(bidId => String(bidId) === String(p.bidId))
    );

    const participantCountsAgg = bidIds.length
      ? await ParticipateBid.aggregate([
          { $match: { bidId: { $in: bidIds } } },
          { $group: { _id: "$bidId", count: { $sum: 1 } } },
        ])
      : [];

    const participantCounts = participantCountsAgg.reduce((acc, row) => {
      if (!row?._id) return acc;
      acc[String(row._id)] = row.count || 0;
      return acc;
    }, {});

    const bidLocations = await BidLocation.find()
      .select("_id name")
      .sort({ name: 1 })
      .lean();

    res.json({
      bids,
      myParticipations,
      participantCounts,
      bidLocations,
      seller: {
        _id: seller._id,
        sellerName: seller.sellerName || "",
        companies: Array.isArray(seller.companies) ? seller.companies : [],
        commodities: sellerCommodityDetails,
        groups: Array.isArray(seller.groups) ? seller.groups : [],
      },
      serverNow: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    await closeExpiredBids();

    const page = parseInt(req.query.page || "0", 10);
    const limit = parseInt(req.query.limit || "0", 10);
    const status = req.query.status;
    const date = req.query.date;

    const query = {};
    if (status && status !== "all") {
      query.status = status;
    }
    if (date) {
      query.bidDate = date;
    }

    if (page > 0 && limit > 0) {
      const items = await Bid.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
      const total = await Bid.countDocuments(query);
      return res.json({ data: items, total });
    }

    const items = await Bid.find(query)
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
    const { bidDate, endTime, status, ...otherFields } = req.body;
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const currentTimeStr =
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");

    let finalStatus = status || "active";
    let closedAt = null;

    if (finalStatus === "active" && bidDate) {
      const bDate = new Date(bidDate);
      const bidDateStr = bDate.toISOString().split("T")[0];
      if (bidDateStr < todayStr || (bidDateStr === todayStr && endTime && endTime < currentTimeStr)) {
        finalStatus = "closed";
        closedAt = now;
      }
    }

    const item = await Bid.create({
      ...otherFields,
      bidDate,
      endTime,
      status: finalStatus,
      closedAt,
    });

    // Notify relevant sellers
    try {
      const sellers = await Seller.find({
        "commodities.name": item.commodity,
      }).lean();

      if (sellers.length > 0) {
        const notifications = sellers.flatMap((seller) => {
          const phones = Array.isArray(seller.phoneNumbers)
            ? seller.phoneNumbers.map((p) => p.value).filter(Boolean)
            : [];
          return phones.map((phone) => ({
            recipient: phone,
            recipientRole: "Seller",
            title: "New Bid Available",
            message: `New bid for ${item.commodity} (${item.origin} → ${item.consignee}) is now active. Check details and participate!`,
            type: "BidParticipation", // Or a new type if preferred
            relatedId: item._id,
          }));
        });

        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      }
    } catch (notifyError) {
      console.error("Error creating bid notifications:", notifyError);
    }

    invalidate("/api/bids");
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { endTime, quantity, rate, status, bidDate, ...otherFields } = req.body;

    const bid = await Bid.findById(req.params.id);
    if (!bid) {
      return res.status(404).json({ message: "Bid not found" });
    }

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const currentTimeStr =
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");

    const updateData = { ...otherFields };
    if (endTime) updateData.endTime = endTime;
    if (quantity) updateData.quantity = quantity;
    if (rate) updateData.rate = rate;
    if (bidDate) updateData.bidDate = bidDate;

    let finalStatus = status || bid.status;
    let closedAt = bid.closedAt;

    if (finalStatus === "active") {
      const bDate = bidDate ? new Date(bidDate) : bid.bidDate;
      const bEndTime = endTime || bid.endTime;
      const bidDateStr = bDate.toISOString().split("T")[0];
      if (bidDateStr < todayStr || (bidDateStr === todayStr && bEndTime && bEndTime < currentTimeStr)) {
        finalStatus = "closed";
        closedAt = now;
      } else {
        closedAt = null;
      }
    } else if (finalStatus === "closed") {
      closedAt = now;
    }

    updateData.status = finalStatus;
    updateData.closedAt = closedAt;

    const updated = await Bid.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    const rolesToNotify = ["Employee", "Admin"];
    await Promise.all(rolesToNotify.map(role => 
      Notification.create({
        recipient: "all",
        recipientRole: role,
        title: `Bid ${finalStatus === 'active' ? 'Activated' : 'Closed'}`,
        message: `The bid for ${updated.commodity} (${updated.consignee}) has been ${finalStatus === 'active' ? 'activated' : 'closed'}.`,
        type: finalStatus === 'active' ? 'BidParticipation' : 'BidRejection', // Reusing types for simplicity
        relatedId: updated._id
      })
    ));

    invalidate("/api/bids");
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Bid.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Bid not found" });
    }

    invalidate("/api/bids");
    res.json({ message: "Bid deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const bid = await Bid.findById(req.params.id);
    if (!bid) {
      return res.status(404).json({ message: "Bid not found" });
    }

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const currentTimeStr =
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");

    let finalStatus = status;
    let closedAt = bid.closedAt;

    if (status === "active") {
      const bidDateStr = bid.bidDate.toISOString().split("T")[0];
      if (bidDateStr < todayStr || (bidDateStr === todayStr && bid.endTime && bid.endTime < currentTimeStr)) {
        finalStatus = "closed";
        closedAt = now;
      } else {
        closedAt = null;
      }
    } else if (status === "closed") {
      closedAt = now;
    }

    const updated = await Bid.findByIdAndUpdate(
      req.params.id,
      { status: finalStatus, closedAt },
      { new: true }
    );

    invalidate("/api/bids");
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
