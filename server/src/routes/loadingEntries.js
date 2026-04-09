import { Router } from "express";
import LoadingEntry from "../models/LoadingEntry.js";
import SelfOrder from "../models/SelfOrder.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const items = await LoadingEntry.find()
      .sort({ loadingDate: -1, createdAt: -1 })
      .limit(100)
      .lean();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/sauda/:saudaNo", async (req, res) => {
  try {
    const items = await LoadingEntry.find({ saudaNo: req.params.saudaNo })
      .sort({ loadingDate: -1 })
      .lean();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/bulk", async (req, res) => {
  try {
    const { entries, saudaNo } = req.body;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ message: "No entries provided" });
    }

    const savedEntries = await LoadingEntry.insertMany(entries);

    const selfOrder = await SelfOrder.findOne({ saudaNo });
    if (selfOrder) {
      const allEntries = await LoadingEntry.find({ saudaNo });
      const totalLoaded = allEntries.reduce(
        (sum, e) => sum + (e.loadingWeight || 0),
        0,
      );
      selfOrder.pendingQuantity = Math.max(
        0,
        (selfOrder.quantity || 0) - totalLoaded,
      );

      const tolerance = (selfOrder.quantity || 0) * 0.05;
      if (Math.abs(selfOrder.pendingQuantity) <= tolerance) {
        selfOrder.status = "closed";
      } else {
        selfOrder.status = "active";
      }

      await selfOrder.save();
    }

    res
      .status(201)
      .json({
        message: "Bulk entries saved successfully",
        count: savedEntries.length,
      });
  } catch (error) {
    console.error("Bulk save error:", error);
    res.status(400).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const entry = await LoadingEntry.create(req.body);

    const selfOrder = await SelfOrder.findOne({ saudaNo: entry.saudaNo });
    if (selfOrder) {
      const allEntries = await LoadingEntry.find({ saudaNo: entry.saudaNo });
      const totalLoaded = allEntries.reduce(
        (sum, e) => sum + (e.loadingWeight || 0),
        0,
      );
      selfOrder.pendingQuantity = Math.max(
        0,
        (selfOrder.quantity || 0) - totalLoaded,
      );

      const tolerance = (selfOrder.quantity || 0) * 0.05;
      if (Math.abs(selfOrder.pendingQuantity) <= tolerance) {
        selfOrder.status = "closed";
      } else {
        selfOrder.status = "active";
      }

      await selfOrder.save();
    }

    res.status(201).json(entry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const oldEntry = await LoadingEntry.findById(req.params.id);
    if (!oldEntry) return res.status(404).json({ message: "Entry not found" });

    const updatedEntry = await LoadingEntry.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      },
    );

    if (
      oldEntry.loadingWeight !== updatedEntry.loadingWeight ||
      oldEntry.saudaNo !== updatedEntry.saudaNo
    ) {
      const selfOrder = await SelfOrder.findOne({
        saudaNo: updatedEntry.saudaNo,
      });
      if (selfOrder) {
        const allEntries = await LoadingEntry.find({
          saudaNo: updatedEntry.saudaNo,
        });
        const totalLoaded = allEntries.reduce(
          (sum, e) => sum + (e.loadingWeight || 0),
          0,
        );
        selfOrder.pendingQuantity = Math.max(
          0,
          (selfOrder.quantity || 0) - totalLoaded,
        );

        const tolerance = (selfOrder.quantity || 0) * 0.05;
        if (Math.abs(selfOrder.pendingQuantity) <= tolerance) {
          selfOrder.status = "closed";
        } else {
          selfOrder.status = "active";
        }

        await selfOrder.save();
      }
    }

    res.json(updatedEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const entry = await LoadingEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: "Entry not found" });

    const saudaNo = entry.saudaNo;
    await LoadingEntry.findByIdAndDelete(req.params.id);

    const selfOrder = await SelfOrder.findOne({ saudaNo });
    if (selfOrder) {
      const allEntries = await LoadingEntry.find({ saudaNo });
      const totalLoaded = allEntries.reduce(
        (sum, e) => sum + (e.loadingWeight || 0),
        0,
      );
      selfOrder.pendingQuantity = Math.max(
        0,
        (selfOrder.quantity || 0) - totalLoaded,
      );

      const tolerance = (selfOrder.quantity || 0) * 0.05;
      if (Math.abs(selfOrder.pendingQuantity) <= tolerance) {
        selfOrder.status = "closed";
      } else {
        selfOrder.status = "active";
      }

      await selfOrder.save();
    }

    res.json({ message: "Entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
