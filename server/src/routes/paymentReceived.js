import express from "express";
import PaymentReceived from "../models/PaymentReceived.js";
import LoadingEntry from "../models/LoadingEntry.js";

const router = express.Router();

// Create a new payment record
router.post("/", async (req, res) => {
  try {
    const {
      date,
      ledgerType,
      ledgerId,
      amount,
      paymentType,
      paymentMode,
      mappings,
      remarks,
    } = req.body;

    const newPayment = new PaymentReceived({
      date,
      ledgerType,
      ledgerId,
      amount,
      paymentType,
      paymentMode,
      mappings,
      remarks,
    });

    const savedPayment = await newPayment.save();

    // Update LoadingEntry statuses based on mappings
    if (mappings && mappings.length > 0) {
      const updatePromises = mappings.map(async (mapping) => {
        if (mapping.loadingEntryId) {
          // For now, if an entry is mapped, we can mark it as done.
          // In a more complex system, we would track total paid vs total due.
          // But as per user's "paid or not paid" requirement, we update it.
          return LoadingEntry.findByIdAndUpdate(mapping.loadingEntryId, {
            paymentStatus: "done",
          });
        }
      });
      await Promise.all(updatePromises);
    }

    res.status(201).json(savedPayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all payment records with filters
router.get("/", async (req, res) => {
  try {
    const { ledgerType, ledgerId, startDate, endDate, page = 1, limit = 10 } = req.query;
    const query = {};

    if (ledgerType) query.ledgerType = ledgerType;
    if (ledgerId) query.ledgerId = ledgerId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const [payments, total] = await Promise.all([
      PaymentReceived.find(query)
        .sort({ date: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate("ledgerId"),
      PaymentReceived.countDocuments(query),
    ]);

    res.json({
      data: payments,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
