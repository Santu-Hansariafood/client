import { Router } from "express";
import LoadingEntry from "../models/LoadingEntry.js";
import SelfOrder from "../models/SelfOrder.js";

const router = Router();

// Get all loading entries
router.get("/", async (req, res) => {
  try {
    const items = await LoadingEntry.find()
      .sort({ loadingDate: -1, createdAt: -1 })
      .lean();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get loading entries for a specific sauda
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

// Create multiple loading entries (Bulk)
router.post("/bulk", async (req, res) => {
  try {
    const { entries, saudaNo } = req.body;
    
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ message: "No entries provided" });
    }

    // Save all entries
    const savedEntries = await LoadingEntry.insertMany(entries);

    // Automatically update the pending quantity in the SelfOrder
    const selfOrder = await SelfOrder.findOne({ saudaNo });
    if (selfOrder) {
      // Recalculate based on all entries for this sauda
      const allEntries = await LoadingEntry.find({ saudaNo });
      const totalLoaded = allEntries.reduce((sum, e) => sum + (e.loadingWeight || 0), 0);
      selfOrder.pendingQuantity = Math.max(0, (selfOrder.quantity || 0) - totalLoaded);

      await selfOrder.save();
    }

    res.status(201).json({ message: "Bulk entries saved successfully", count: savedEntries.length });
  } catch (error) {
    console.error("Bulk save error:", error);
    res.status(400).json({ message: error.message });
  }
});

// Create a new loading entry
router.post("/", async (req, res) => {
  try {
    const entry = await LoadingEntry.create(req.body);

    // Automatically update the pending quantity in the SelfOrder
    const selfOrder = await SelfOrder.findOne({ saudaNo: entry.saudaNo });
    if (selfOrder) {
      const newPending = (selfOrder.pendingQuantity || 0) - (entry.loadingWeight || 0);
      selfOrder.pendingQuantity = Math.max(0, newPending); // Avoid negative quantity

      await selfOrder.save();
    }

    res.status(201).json(entry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a loading entry
router.put("/:id", async (req, res) => {
  try {
    const oldEntry = await LoadingEntry.findById(req.params.id);
    if (!oldEntry) return res.status(404).json({ message: "Entry not found" });

    const updatedEntry = await LoadingEntry.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    // Update the pending quantity in the SelfOrder if weight changed
    if (oldEntry.loadingWeight !== updatedEntry.loadingWeight || oldEntry.saudaNo !== updatedEntry.saudaNo) {
      const selfOrder = await SelfOrder.findOne({ saudaNo: updatedEntry.saudaNo });
      if (selfOrder) {
        // Recalculate pending quantity based on all entries for this sauda
        const allEntries = await LoadingEntry.find({ saudaNo: updatedEntry.saudaNo });
        const totalLoaded = allEntries.reduce((sum, e) => sum + (e.loadingWeight || 0), 0);
        selfOrder.pendingQuantity = Math.max(0, (selfOrder.quantity || 0) - totalLoaded);

        await selfOrder.save();
      }
    }

    res.json(updatedEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a loading entry
router.delete("/:id", async (req, res) => {
  try {
    const entry = await LoadingEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: "Entry not found" });

    const saudaNo = entry.saudaNo;
    await LoadingEntry.findByIdAndDelete(req.params.id);

    // Update the pending quantity in the SelfOrder
    const selfOrder = await SelfOrder.findOne({ saudaNo });
    if (selfOrder) {
      const allEntries = await LoadingEntry.find({ saudaNo });
      const totalLoaded = allEntries.reduce((sum, e) => sum + (e.loadingWeight || 0), 0);
      selfOrder.pendingQuantity = Math.max(0, (selfOrder.quantity || 0) - totalLoaded);

      await selfOrder.save();
    }

    res.json({ message: "Entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
