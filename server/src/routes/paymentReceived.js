import express from "express";
import mongoose from "mongoose";
import PaymentReceived from "../models/PaymentReceived.js";
import LoadingEntry from "../models/LoadingEntry.js";
import SelfOrder from "../models/SelfOrder.js";
import Buyer from "../models/Buyer.js";
import Seller from "../models/Seller.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.patch("/adjust-lorry/:loadingEntryId", adminOnly, async (req, res) => {
  try {
    const { loadingEntryId } = req.params;
    const { paidAmount, paymentStatus } = req.body;

    const entry = await LoadingEntry.findById(loadingEntryId);
    if (!entry) {
      return res.status(404).json({ message: "Loading entry not found" });
    }

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

router.post("/", async (req, res) => {
  try {
    const {
      date,
      ledgerType,
      ledgerId,
      companyId,
      buyerCompany,
      supplierCompany,
      amount,
      paymentType,
      paymentMode,
      mappings,
      remarks,
    } = req.body;

    const totalMapped = (mappings || []).reduce((sum, m) => sum + (m.allocatedAmount || 0), 0);
    
    const unadjustedAmount = amount - totalMapped;

    const newPayment = new PaymentReceived({
      date,
      ledgerType,
      ledgerId,
      companyId,
      buyerCompany: buyerCompany || "",
      supplierCompany: supplierCompany || "",
      amount,
      unadjustedAmount,
      paymentType: paymentType || (unadjustedAmount > 0 && totalMapped === 0 ? "Advance" : "Sauda-wise"),
      paymentMode,
      mappings,
      remarks,
    });

    const savedPayment = await newPayment.save();

    if (mappings && mappings.length > 0) {
      const updatePromises = mappings.map(async (mapping) => {
        if (mapping.loadingEntryId) {
          const entry = await LoadingEntry.findById(mapping.loadingEntryId);
          if (entry) {
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
            
            if (newPaidAmount > netAmount + 1 && netAmount > 0) {
              throw new Error(`Total paid amount for ${entry.lorryNumber} exceeds net amount`);
            }

            const updateData = {
              paidAmount: newPaidAmount
            };

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

router.get("/balance/:ledgerId", async (req, res) => {
  try {
    const { ledgerId } = req.params;
    
    const advanceSummary = await PaymentReceived.aggregate([
      { $match: { ledgerId: new mongoose.Types.ObjectId(ledgerId) } },
      { $group: { _id: null, totalAdvance: { $sum: "$unadjustedAmount" } } }
    ]);

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

router.get("/", async (req, res) => {
  try {
    const {
      ledgerType,
      ledgerId,
      companyId,
      buyerCompany,
      supplierCompany,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;
    const query = {};

    if (ledgerType) query.ledgerType = ledgerType;
    if (ledgerId) query.ledgerId = ledgerId;
    if (companyId && companyId !== "null" && companyId !== "undefined") {
      query.companyId = companyId;
    }
    if (buyerCompany) {
      query.buyerCompany = {
        $regex: new RegExp(
          `^${String(buyerCompany).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i",
        ),
      };
    }
    if (supplierCompany) {
      query.supplierCompany = {
        $regex: new RegExp(
          `^${String(supplierCompany).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i",
        ),
      };
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const [payments, total, totalAmountSum, openingBalanceSum] = await Promise.all([
      PaymentReceived.find(query)
        .sort({ date: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .select(
          "date ledgerType ledgerId companyId buyerCompany supplierCompany amount paymentMode paymentType mappings remarks createdAt",
        )
        .populate("ledgerId", "name sellerName")
        .populate("mappings.loadingEntryId", "saudaNo lorryNumber billNumber loadingDate buyerCompany supplierCompany")
        .lean(),
      PaymentReceived.countDocuments(query),
      PaymentReceived.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      ledgerId && startDate ? PaymentReceived.aggregate([
        { 
          $match: { 
            ledgerId: new mongoose.Types.ObjectId(ledgerId),
            date: { $lt: new Date(startDate) }
          } 
        },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]) : Promise.resolve([])
    ]);

    res.json({
      data: payments,
      total,
      totalAmount: totalAmountSum.length > 0 ? totalAmountSum[0].total : 0,
      openingBalance: openingBalanceSum.length > 0 ? openingBalanceSum[0].total : 0,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/summary", async (req, res) => {
  try {
    const { ledgerId, type = 'month' } = req.query; // type: month, week
    if (!ledgerId) return res.status(400).json({ message: "ledgerId is required" });

    const [buyer, seller] = await Promise.all([
      Buyer.findById(ledgerId).populate('companyIds').lean(),
      Seller.findById(ledgerId).lean()
    ]);
    
    if (!buyer && !seller) return res.status(404).json({ message: "Ledger not found" });
    const isBuyer = !!buyer;

    let groupBy;
    if (type === 'week') {
      groupBy = { $week: "$date" };
    } else {
      groupBy = { $month: "$date" };
    }

    const directSummary = await PaymentReceived.aggregate([
      { $match: { ledgerId: new mongoose.Types.ObjectId(ledgerId) } },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            period: groupBy
          },
          amount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      }
    ]);

    let indirectSummary = [];
    if (isBuyer) {
      const companyNames = (buyer.companyIds || []).map(c => c.companyName);
      if (buyer.name) companyNames.push(buyer.name);
      
      const companyRegexes = companyNames.filter(Boolean).map(n => new RegExp(`^${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, 'i'));

      indirectSummary = await PaymentReceived.aggregate([
        { $match: { ledgerType: 'Seller' } },
        { $unwind: "$mappings" },
        {
          $lookup: {
            from: "loadingentries",
            localField: "mappings.loadingEntryId",
            foreignField: "_id",
            as: "entry"
          }
        },
        { $unwind: "$entry" },
        { $match: { "entry.buyerCompany": { $in: companyRegexes } } },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              period: groupBy
            },
            amount: { $sum: "$mappings.allocatedAmount" },
            count: { $sum: 1 }
          }
        }
      ]);
    } else {
      indirectSummary = await PaymentReceived.aggregate([
        { $match: { ledgerType: 'Buyer' } },
        { $unwind: "$mappings" },
        {
          $lookup: {
            from: "loadingentries",
            localField: "mappings.loadingEntryId",
            foreignField: "_id",
            as: "entry"
          }
        },
        { $unwind: "$entry" },
        { $match: { "entry.supplier": new mongoose.Types.ObjectId(ledgerId) } },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              period: groupBy
            },
            amount: { $sum: "$mappings.allocatedAmount" },
            count: { $sum: 1 }
          }
        }
      ]);
    }

    const result = [];
    const mergeData = (data, field) => {
      data.forEach(item => {
        const key = `${item._id.year}-${item._id.period}`;
        let existing = result.find(r => `${r._id.year}-${r._id.period}` === key);
        if (!existing) {
          existing = { 
            _id: item._id, 
            received: 0, 
            sent: 0, 
            receivedCount: 0, 
            sentCount: 0 
          };
          result.push(existing);
        }
        if (field === 'received') {
          existing.received = item.amount;
          existing.receivedCount = item.count;
        } else {
          existing.sent = item.amount;
          existing.sentCount = item.count;
        }
      });
    };

    if (isBuyer) {
      mergeData(directSummary, 'received');
      mergeData(indirectSummary, 'sent');
    } else {
      mergeData(directSummary, 'sent');
      mergeData(indirectSummary, 'received');
    }

    res.json(result.sort((a, b) => b._id.year - a._id.year || b._id.period - a._id.period));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
