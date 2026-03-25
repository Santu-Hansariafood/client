import { Router } from "express";
import Bid from "../models/Bid.js";
import Notification from "../models/Notification.js";

const router = Router();

const closeExpiredBids = async () => {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const currentTimeStr =
      now.getHours().toString().padStart(2, "0") +
      ":" +
      now.getMinutes().toString().padStart(2, "0");

    const activeBids = await Bid.find({ status: "active" });
    const bidsToClose = activeBids.filter((bid) => {
      if (!bid.bidDate) return false;
      const bidDateStr = bid.bidDate.toISOString().split("T")[0];

      // Close if the date is in the past
      if (bidDateStr < todayStr) return true;
      // Close if it's today and the end time has passed
      if (bidDateStr === todayStr && bid.endTime && bid.endTime < currentTimeStr)
        return true;

      return false;
    });

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

router.get("/", async (req, res) => {
  try {
    await closeExpiredBids(); // Auto-close expired bids before fetching

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

    const items = await Bid.find(query).sort({ createdAt: -1 }).lean();
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

    // Build the update object carefully
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

    // Notify relevant roles about status change
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
      // Check if it's already expired
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

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
