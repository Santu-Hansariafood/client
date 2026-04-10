import { Router } from "express";
import Notification from "../models/Notification.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { mobile, role, unreadOnly, todayOnly } = req.query;
    const query = {};

    if (unreadOnly === "true") {
      query.isRead = false;
    }

    if (mobile) {
      query.$or = [{ recipient: mobile }, { recipient: "all" }];
    }

    if (role) {
      query.recipientRole = role;
    }

    if (todayOnly !== "false") {
      const now = new Date();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      query.createdAt = { $gte: startOfToday };
    }

    const items = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/toggle-read", async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification)
      return res.status(404).json({ message: "Notification not found" });

    notification.isRead = !notification.isRead;
    await notification.save();

    res.json(notification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Notification.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Notification not found" });
    res.json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/read", async (req, res) => {
  try {
    const updated = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true },
    );
    if (!updated)
      return res.status(404).json({ message: "Notification not found" });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch("/read-all", async (req, res) => {
  try {
    const { mobile, role } = req.body;
    const query = { isRead: false };
    if (mobile) query.recipient = mobile;
    if (role) query.recipientRole = role;

    await Notification.updateMany(query, { isRead: true });
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/admin/clear-all", async (req, res) => {
  try {
    const result = await Notification.deleteMany({});
    res.json({ message: `Cleared ${result.deletedCount} notifications` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
