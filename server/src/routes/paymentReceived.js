import express from "express";
import mongoose from "mongoose";
import PaymentReceived from "../models/PaymentReceived.js";
import Counter from "../models/Counter.js";
import LoadingEntry from "../models/LoadingEntry.js";
import SelfOrder from "../models/SelfOrder.js";
import Buyer from "../models/Buyer.js";
import Seller from "../models/Seller.js";
import Company from "../models/Company.js";
import { adminOnly } from "../middleware/roleMiddleware.js";
import authJwt from "../middleware/authJwt.js";
import { trackEmployeeWork } from "../utils/workTracker.js";

const router = express.Router();

// Get next voucher number (just preview, don't increment yet - the pre-save hook does that)
router.get("/next-voucher", async (req, res) => {
  try {
    let counter = await Counter.findOne({ id: "paymentVoucherNumber" });
    let nextVoucher = 1;
    if (counter) {
      nextVoucher = counter.seq + 1;
    }
    res.json({ voucherNumber: nextVoucher });
  } catch (error) {
    console.error("Error fetching next voucher number:", error);
    res.status(500).json({ message: "Failed to fetch next voucher number" });
  }
});

// Get payment by voucher number
router.get("/voucher/:voucherNumber", async (req, res) => {
  try {
    const { voucherNumber } = req.params;
    const payment = await PaymentReceived.findOne({
      voucherNumber: Number(voucherNumber),
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json(payment);
  } catch (error) {
    console.error("Error fetching payment by voucher:", error);
    res.status(500).json({ message: "Failed to fetch payment" });
  }
});

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const companyRegex = (name) =>
  new RegExp(`^${escapeRegex(String(name).trim())}$`, "i");

const buildCompanyPairMatch = (ledgerId, buyerCompany, supplierCompany) => {
  const match = {};
  if (ledgerId && mongoose.Types.ObjectId.isValid(ledgerId)) {
    match.ledgerId = new mongoose.Types.ObjectId(ledgerId);
  }
  if (buyerCompany) {
    match.buyerCompany = companyRegex(buyerCompany);
  }
  if (supplierCompany) {
    match.supplierCompany = companyRegex(supplierCompany);
  }
  return match;
};

const buildAdvanceMatch = (ledgerId, buyerCompany, supplierCompany) => ({
  ...buildCompanyPairMatch(ledgerId, buyerCompany, supplierCompany),
  unadjustedAmount: { $gt: 0 },
});

/** Total advance (Dr.) recorded from buyer for scope — before lorry Cr. */
const sumAdvanceTotalDr = async (pairMatch) => {
  const rows = await PaymentReceived.aggregate([
    { $match: { ...pairMatch, paymentType: "Advance" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return rows.length > 0 ? rows[0].total : 0;
};

/** Cr. already posted to seller lorries (Adjustment + Sauda-wise) for scope */
const sumCreditToSeller = async (pairMatch) => {
  const rows = await PaymentReceived.aggregate([
    {
      $match: {
        ...pairMatch,
        paymentType: { $in: ["Adjustment", "Sauda-wise"] },
        mappings: { $exists: true, $ne: [] },
      },
    },
    { $unwind: "$mappings" },
    {
      $group: {
        _id: null,
        total: { $sum: { $ifNull: ["$mappings.allocatedAmount", 0] } },
      },
    },
  ]);
  return rows.length > 0 ? rows[0].total : 0;
};

/** Reduce unadjusted advance pool (FIFO) when allocating credit to lorries. */
const consumeAdvanceCredit = async (
  ledgerId,
  buyerCompany,
  supplierCompany,
  amountToConsume,
) => {
  let remaining = Number(amountToConsume) || 0;
  if (remaining <= 0.01) return;

  const match = buildAdvanceMatch(ledgerId, buyerCompany, supplierCompany);
  const pool = await PaymentReceived.find(match)
    .sort({ date: 1, createdAt: 1 })
    .select("_id unadjustedAmount");

  for (const doc of pool) {
    if (remaining <= 0.01) break;
    const available = Number(doc.unadjustedAmount) || 0;
    if (available <= 0) continue;
    const take = Math.min(available, remaining);
    await PaymentReceived.findByIdAndUpdate(doc._id, {
      $inc: { unadjustedAmount: -take },
    });
    remaining -= take;
  }

  if (remaining > 0.01) {
    throw new Error(
      `Insufficient advance credit (${buyerCompany || "buyer"} → ${supplierCompany || "seller"}). Short by Rs. ${remaining.toFixed(2)}`,
    );
  }
};

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

const resolveLedgerIdForPayment = async (
  ledgerId,
  ledgerType,
  buyerCompany,
  supplierCompany,
) => {
  if (ledgerId && mongoose.Types.ObjectId.isValid(String(ledgerId))) {
    return new mongoose.Types.ObjectId(String(ledgerId));
  }

  if (ledgerType === "Buyer" && buyerCompany) {
    const company = await Company.findOne({
      companyName: companyRegex(buyerCompany),
    })
      .select("_id")
      .lean();
    if (company?._id) {
      const buyer = await Buyer.findOne({ companyIds: company._id })
        .select("_id")
        .lean();
      if (buyer?._id) return buyer._id;
    }
  }

  if (ledgerType === "Seller" && supplierCompany) {
    const seller = await Seller.findOne({
      sellerName: companyRegex(supplierCompany),
    })
      .select("_id")
      .lean();
    if (seller?._id) return seller._id;
  }

  return null;
};

router.post("/", authJwt, async (req, res) => {
  try {
    const {
      date,
      ledgerType,
      ledgerId,
      companyId,
      buyerCompany,
      supplierCompany,
      amount,
      claim,
      tds,
      paymentType,
      paymentMode,
      mappings,
      remarks,
      sellerBillNo,
      entries,
    } = req.body;

    const resolvedLedgerId = await resolveLedgerIdForPayment(
      ledgerId,
      ledgerType,
      buyerCompany,
      supplierCompany,
    );
    if (!resolvedLedgerId) {
      return res.status(400).json({
        message:
          "Could not resolve ledger. Link buyer company to a Buyer account or select a valid ledger.",
      });
    }

    const totalMapped = (mappings || []).reduce(
      (sum, m) => sum + (Number(m.allocatedAmount) || 0),
      0,
    );

    let resolvedType =
      paymentType ||
      (totalMapped > 0 ? "Sauda-wise" : "Advance");
    let paymentAmount = Number(amount) || 0;
    
    // If entries are provided, calculate total from entries instead
    if (entries && entries.length > 0) {
      paymentAmount = entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    }

    if (resolvedType === "Adjustment" && totalMapped > 0) {
      if (!String(supplierCompany || "").trim()) {
        return res.status(400).json({
          message: "Seller company is required to adjust advance credit",
        });
      }
      await consumeAdvanceCredit(
        resolvedLedgerId,
        buyerCompany,
        supplierCompany,
        totalMapped,
      );
      paymentAmount = totalMapped;
    } else if (resolvedType === "Adjustment" && totalMapped <= 0) {
      return res.status(400).json({
        message: "Enter allocation against a lorry to use advance credit",
      });
    }

    const unadjustedAmount =
      resolvedType === "Adjustment"
        ? 0
        : Math.max(0, paymentAmount - totalMapped);

    if (!paymentType) {
      resolvedType =
        unadjustedAmount > 0 && totalMapped === 0 ? "Advance" : "Sauda-wise";
    }

    let paymentDate = date ? new Date(date) : new Date();
    paymentDate.setUTCHours(0, 0, 0, 0);

    const newPayment = new PaymentReceived({
      date: paymentDate,
      ledgerType,
      ledgerId: resolvedLedgerId,
      companyId,
      buyerCompany: buyerCompany || "",
      supplierCompany: supplierCompany || "",
      amount: paymentAmount,
      claim: Number(claim) || 0,
      tds: Number(tds) || 0,
      unadjustedAmount,
      paymentType: resolvedType,
      paymentMode,
      mappings,
      remarks,
      sellerBillNo: sellerBillNo || "",
      entries: entries || [],
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
              const weight = (entry.unloadingWeight && entry.unloadingWeight > 0) ? entry.unloadingWeight : entry.loadingWeight || 0;
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

    await trackEmployeeWork({
      req,
      workType: "Payment Entry",
      title: `Created Payment Voucher #${savedPayment.voucherNumber}`,
      description: `Created payment voucher of ₹${savedPayment.amount} for ${savedPayment.buyerCompany || "ledger"}, type: ${savedPayment.paymentType}`,
      relatedId: savedPayment._id.toString(),
      status: "Completed"
    });

    res.status(201).json(savedPayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const sumAdvance = async (match) => {
  const rows = await PaymentReceived.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: "$unadjustedAmount" } } },
  ]);
  return rows.length > 0 ? rows[0].total : 0;
};

const getCreditByPair = async (baseMatch) => {
  const rows = await PaymentReceived.aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: {
          buyerCompany: { $ifNull: ["$buyerCompany", ""] },
          supplierCompany: { $ifNull: ["$supplierCompany", ""] },
        },
        amount: { $sum: "$unadjustedAmount" },
      },
    },
    { $match: { amount: { $gt: 0 } } },
    { $sort: { amount: -1 } },
  ]);

  return rows.map((row) => ({
    buyerCompany: row._id.buyerCompany || "—",
    supplierCompany: row._id.supplierCompany || "—",
    amount: row.amount,
  }));
};

const getBalancePayload = async (ledgerId, buyerCompany, supplierCompany) => {
  const scopedPoolMatch = buildAdvanceMatch(
    ledgerId,
    buyerCompany,
    supplierCompany,
  );
  const buyerPoolMatch = buildAdvanceMatch(ledgerId, buyerCompany, "");
  const ledgerPoolMatch = buildAdvanceMatch(ledgerId, "", "");

  const scopedPairMatch = buildCompanyPairMatch(
    ledgerId,
    buyerCompany,
    supplierCompany,
  );
  const buyerPairMatch = buildCompanyPairMatch(ledgerId, buyerCompany, "");
  const ledgerPairMatch = buildCompanyPairMatch(ledgerId, "", "");

  const poolMatch = buyerCompany ? buyerPoolMatch : ledgerPoolMatch;
  const pairMatch = buyerCompany ? buyerPairMatch : ledgerPairMatch;

  const [
    advanceBalance,
    totalAdvanceBalance,
    creditByPair,
    advanceTotalDr,
    totalAdvanceTotalDr,
    creditToSeller,
    totalCreditToSeller,
  ] = await Promise.all([
    sumAdvance(scopedPoolMatch),
    sumAdvance(poolMatch),
    getCreditByPair(poolMatch),
    sumAdvanceTotalDr(scopedPairMatch),
    sumAdvanceTotalDr(pairMatch),
    sumCreditToSeller(scopedPairMatch),
    sumCreditToSeller(pairMatch),
  ]);

  const entryQuery = {
    paymentStatus: "pending",
    isRejected: { $ne: true },
  };

  if (buyerCompany || supplierCompany) {
    if (buyerCompany) {
      entryQuery.buyerCompany = companyRegex(buyerCompany);
    }
    if (supplierCompany) {
      entryQuery.supplierCompany = companyRegex(supplierCompany);
    }
  } else if (ledgerId) {
    entryQuery.$or = [{ buyerId: ledgerId }, { supplier: ledgerId }];
  } else {
    return {
      advanceBalance,
      totalAdvanceBalance,
      creditByPair,
      advanceTotalDr,
      totalAdvanceTotalDr,
      creditToSeller,
      totalCreditToSeller,
      outstandingBalance: 0,
    };
  }

  const pendingEntries = await LoadingEntry.find(entryQuery).lean();
  const saudaNos = [...new Set(pendingEntries.map((e) => e.saudaNo))];
  const selfOrders = await SelfOrder.find({ saudaNo: { $in: saudaNos } }).lean();
  const saudaMap = selfOrders.reduce((acc, so) => {
    acc[so.saudaNo] = so;
    return acc;
  }, {});

  let totalOutstanding = 0;
  pendingEntries.forEach((entry) => {
    const order = saudaMap[entry.saudaNo];
    if (order) {
      const weight = (entry.unloadingWeight && entry.unloadingWeight > 0) ? entry.unloadingWeight : entry.loadingWeight || 0;
      const rate = order.rate || 0;
      const cdPercent = order.cd || 0;
      const gstPercent = order.gst || 0;
      const grossAmount = weight * rate;
      const taxableAmount = grossAmount - grossAmount * (cdPercent / 100);
      const netAmount = taxableAmount + taxableAmount * (gstPercent / 100);
      totalOutstanding += netAmount - (entry.paidAmount || 0);
    }
  });

  return {
    advanceBalance,
    totalAdvanceBalance,
    creditByPair,
    advanceTotalDr,
    totalAdvanceTotalDr,
    creditToSeller,
    totalCreditToSeller,
    outstandingBalance: Math.max(0, totalOutstanding),
  };
};

const handleBalanceRequest = async (req, res) => {
  try {
    const ledgerId = req.params.ledgerId || req.query.ledgerId || "";
    const buyerCompany = String(req.query.buyerCompany || "").trim();
    const supplierCompany = String(req.query.supplierCompany || "").trim();

    if (!ledgerId && !buyerCompany) {
      return res.json({
        advanceBalance: 0,
        totalAdvanceBalance: 0,
        creditByPair: [],
        advanceTotalDr: 0,
        totalAdvanceTotalDr: 0,
        creditToSeller: 0,
        totalCreditToSeller: 0,
        outstandingBalance: 0,
      });
    }

    const payload = await getBalancePayload(
      ledgerId,
      buyerCompany,
      supplierCompany,
    );
    res.json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

router.get("/balance", handleBalanceRequest);
router.get("/balance/:ledgerId", handleBalanceRequest);

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
      search,
      page = 1,
      limit = 10,
    } = req.query;
    const query = {};

    if (search) {
      const searchNum = Number(search);
      query.$or = [
        { sellerBillNo: { $regex: new RegExp(escapeRegex(search), "i") } },
        ...(!isNaN(searchNum) ? [{ voucherNumber: searchNum }] : []),
      ];
    }

    if (ledgerType) query.ledgerType = ledgerType;
    if (ledgerId) {
      try {
        query.ledgerId = new mongoose.Types.ObjectId(ledgerId);
      } catch (e) {
        query.ledgerId = ledgerId;
      }
    }
    if (companyId && companyId !== "null" && companyId !== "undefined") {
      query.companyId = companyId;
    }
    if (buyerCompany) {
      query.buyerCompany = {
        $regex: new RegExp(
          `^${String(buyerCompany).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i",
        ),
      };
    }
    if (supplierCompany) {
      query.supplierCompany = {
        $regex: new RegExp(
          `^${String(supplierCompany).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i",
        ),
      };
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    let [payments, total, totalAmountSum, openingBalanceSum] = await Promise.all([
      PaymentReceived.find(query)
        .sort({ date: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .select(
          "date ledgerType ledgerId companyId buyerCompany supplierCompany amount claim tds unadjustedAmount paymentMode paymentType mappings remarks createdAt",
        )
        .populate("ledgerId", "name sellerName")
        .populate("mappings.loadingEntryId", "saudaNo lorryNumber billNumber loadingDate buyerCompany supplierCompany unloadingWeight loadingWeight bankCharges")
        .lean(),
      PaymentReceived.countDocuments(query),
      PaymentReceived.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $add: [
                  { $ifNull: ["$amount", 0] },
                  { $ifNull: ["$claim", 0] },
                  { $ifNull: ["$tds", 0] },
                ],
              },
            },
          },
        },
      ]),
      ledgerId && startDate
        ? PaymentReceived.aggregate([
            {
              $match: {
                ledgerId: new mongoose.Types.ObjectId(ledgerId),
                date: { $lt: new Date(startDate) },
              },
            },
            {
              $group: {
                _id: null,
                total: {
                  $sum: {
                    $add: [
                      { $ifNull: ["$amount", 0] },
                      { $ifNull: ["$claim", 0] },
                      { $ifNull: ["$tds", 0] },
                    ],
                  },
                },
              },
            },
          ])
        : Promise.resolve([]),
    ]);

    // Fetch SelfOrder data for each loading entry's saudaNo to get cd, gst, rate
    const allSaudaNos = new Set();
    payments.forEach(payment => {
      (payment.mappings || []).forEach(mapping => {
        if (mapping.loadingEntryId && mapping.loadingEntryId.saudaNo) {
          allSaudaNos.add(mapping.loadingEntryId.saudaNo);
        }
      });
    });

    if (allSaudaNos.size > 0) {
      const selfOrders = await SelfOrder.find({ saudaNo: { $in: Array.from(allSaudaNos) } })
        .select("saudaNo rate cd gst")
        .lean();
      
      const selfOrderMap = {};
      selfOrders.forEach(order => {
        selfOrderMap[order.saudaNo] = order;
      });

      // Attach SelfOrder data to each loading entry
      payments = payments.map(payment => ({
        ...payment,
        mappings: (payment.mappings || []).map(mapping => ({
          ...mapping,
          loadingEntryId: mapping.loadingEntryId ? {
            ...mapping.loadingEntryId,
            actualRate: selfOrderMap[mapping.loadingEntryId.saudaNo]?.rate || 0,
            cd: selfOrderMap[mapping.loadingEntryId.saudaNo]?.cd || 0,
            gst: selfOrderMap[mapping.loadingEntryId.saudaNo]?.gst || 0,
          } : null
        }))
      }));
    }

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

// Update payment by ID
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { sellerBillNo, date, entries, mappings, amount, claim, tds, paymentType, ...otherFields } = req.body;

    // Find the existing payment first
    const existingPayment = await PaymentReceived.findById(id);
    if (!existingPayment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const updateData = {
      ...otherFields,
    };

    if (sellerBillNo !== undefined) updateData.sellerBillNo = sellerBillNo;
    if (date !== undefined) updateData.date = date;
    if (entries !== undefined) updateData.entries = entries;
    if (mappings !== undefined) updateData.mappings = mappings;
    if (amount !== undefined) updateData.amount = amount;
    if (claim !== undefined) updateData.claim = claim;
    if (tds !== undefined) updateData.tds = tds;
    if (paymentType !== undefined) updateData.paymentType = paymentType;

    // Calculate total amount from entries
    let paymentAmount = existingPayment.amount;
    if (entries) {
      paymentAmount = entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
      updateData.amount = paymentAmount;
    } else if (amount !== undefined) {
      paymentAmount = Number(amount);
    }

    // Calculate total mapped amount
    const totalMapped = (mappings || existingPayment.mappings || []).reduce(
      (sum, m) => sum + (Number(m.allocatedAmount) || 0),
      0
    );

    // Recalculate unadjustedAmount
    const resolvedType = paymentType || existingPayment.paymentType;
    const unadjustedAmount =
      resolvedType === "Adjustment"
        ? 0
        : Math.max(0, paymentAmount - totalMapped);
    updateData.unadjustedAmount = unadjustedAmount;

    const updatedPayment = await PaymentReceived.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    res.json(updatedPayment);
  } catch (error) {
    console.error("Error updating payment:", error);
    res.status(500).json({ message: "Failed to update payment" });
  }
});

// Delete payment by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPayment = await PaymentReceived.findByIdAndDelete(id);

    if (!deletedPayment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json({ message: "Payment deleted successfully" });
  } catch (error) {
    console.error("Error deleting payment:", error);
    res.status(500).json({ message: "Failed to delete payment" });
  }
});

export default router;
