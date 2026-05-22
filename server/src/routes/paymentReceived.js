import express from "express";
import mongoose from "mongoose";
import PaymentReceived from "../models/PaymentReceived.js";
import LoadingEntry from "../models/LoadingEntry.js";
import SelfOrder from "../models/SelfOrder.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Admin only: Adjust a specific lorry's payment details directly
router.patch("/adjust-lorry/:loadingEntryId", adminOnly, async (req, res) => {
  try {
    const { loadingEntryId } = req.params;
    const { paidAmount, paymentStatus } = req.body;

    const entry = await LoadingEntry.findById(loadingEntryId);
    if (!entry) {
      return res.status(404).json({ message: "Loading entry not found" });
    }

    // Update the entry directly
    const updatedEntry = await LoadingEntry.findByIdAndUpdate(
      loadingEntryId,
      { 
        paidAmount: parseFloat(paidAmount),
        paymentStatus: paymentStatus || (parseFloat(paidAmount) > 0 ? entry.paymentStatus : "pending")
      },
      { new: true }
    );

    res.json({
      message: "Lorry payment adjusted by admin",
      data: updatedEntry
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

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

    const totalMapped = (mappings || []).reduce((sum, m) => sum + (m.allocatedAmount || 0), 0);
    
    // Calculate unadjusted amount (Advance)
    // If it's a fresh payment (amount > 0), excess becomes unadjusted
    // If it's an adjustment from existing advance (amount = 0), unadjusted becomes negative totalMapped
    const unadjustedAmount = amount - totalMapped;

    const newPayment = new PaymentReceived({
      date,
      ledgerType,
      ledgerId,
      amount,
      unadjustedAmount,
      paymentType: paymentType || (unadjustedAmount > 0 && totalMapped === 0 ? "Advance" : "Sauda-wise"),
      paymentMode,
      mappings,
      remarks,
    });

    const savedPayment = await newPayment.save();

    // Update LoadingEntry statuses and paidAmount based on mappings
    if (mappings && mappings.length > 0) {
      const updatePromises = mappings.map(async (mapping) => {
        if (mapping.loadingEntryId) {
          const entry = await LoadingEntry.findById(mapping.loadingEntryId);
          if (entry) {
            // Calculate Net Amount to check if it's fully paid
            const selfOrder = await SelfOrder.findOne({ saudaNo: entry.saudaNo });
            let netAmount = 0;
            if (selfOrder) {
              const weight = entry.unloadingWeight || 0;
              const rate = selfOrder.rate || 0;
              const cdPercent = selfOrder.cd || 0;
              const gstPercent = selfOrder.gst || 0;

              const grossAmount = weight * rate;
              const cdAmount = grossAmount * (cdPercent / 100);
              const taxableAmount = grossAmount - cdAmount;
              const gstAmount = taxableAmount * (gstPercent / 100);
              netAmount = taxableAmount + gstAmount;
            }

            const newPaidAmount = (entry.paidAmount || 0) + mapping.allocatedAmount;
            
            // Validation: Prevent overpayment in backend
            if (newPaidAmount > netAmount + 1 && netAmount > 0) {
              throw new Error(`Total paid amount for ${entry.lorryNumber} exceeds net amount`);
            }

            const updateData = {
              paidAmount: newPaidAmount
            };

            // If fully paid, mark as done
            if (newPaidAmount >= netAmount - 1 && netAmount > 0) {
              updateData.paymentStatus = "done";
            }

            return LoadingEntry.findByIdAndUpdate(mapping.loadingEntryId, updateData);
          }
        }
      });
      await Promise.all(updatePromises);
    }

    res.status(201).json(savedPayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get ledger balance (Advance vs Outstanding)
router.get("/balance/:ledgerId", async (req, res) => {
  try {
    const { ledgerId } = req.params;
    
    // Sum of all unadjusted amounts (Advance balance)
    const advanceSummary = await PaymentReceived.aggregate([
      { $match: { ledgerId: new mongoose.Types.ObjectId(ledgerId) } },
      { $group: { _id: null, totalAdvance: { $sum: "$unadjustedAmount" } } }
    ]);

    // Sum of all outstanding from LoadingEntries
    // We need to fetch all pending entries and calculate their net - paid
    const pendingEntries = await LoadingEntry.find({ 
      $or: [
        { buyerId: ledgerId },
        { supplier: ledgerId }
      ],
      paymentStatus: "pending"
    }).lean();

    const saudaNos = [...new Set(pendingEntries.map(e => e.saudaNo))];
    const selfOrders = await SelfOrder.find({ saudaNo: { $in: saudaNos } }).lean();
    const saudaMap = selfOrders.reduce((acc, so) => { acc[so.saudaNo] = so; return acc; }, {});

    let totalOutstanding = 0;
    pendingEntries.forEach(entry => {
      const order = saudaMap[entry.saudaNo];
      if (order) {
        const weight = entry.unloadingWeight || 0;
        const rate = order.rate || 0;
        const cdPercent = order.cd || 0;
        const gstPercent = order.gst || 0;

        const grossAmount = weight * rate;
        const taxableAmount = grossAmount - (grossAmount * (cdPercent / 100));
        const netAmount = taxableAmount + (taxableAmount * (gstPercent / 100));
        
        totalOutstanding += (netAmount - (entry.paidAmount || 0));
      }
    });

    res.json({
      advanceBalance: advanceSummary.length > 0 ? advanceSummary[0].totalAdvance : 0,
      outstandingBalance: totalOutstanding
    });
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
        .select("date ledgerType ledgerId amount paymentMode paymentType mappings remarks")
        .populate("ledgerId", "name sellerName")
        .lean(),
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

// Get Payment Summaries (Month-wise / Week-wise)
router.get("/summary", async (req, res) => {
  try {
    const { ledgerId, type = 'month' } = req.query; // type: month, week
    const query = {};
    if (ledgerId) query.ledgerId = ledgerId;

    let groupBy;
    if (type === 'week') {
      groupBy = { $week: "$date" };
    } else {
      groupBy = { $month: "$date" };
    }

    const summary = await PaymentReceived.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            period: groupBy
          },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.period": -1 } }
    ]);

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
