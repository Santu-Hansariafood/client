import { Router } from "express";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import ExcelJS from "exceljs";
import SelfOrder from "../models/SelfOrder.js";
import Seller from "../models/Seller.js";
import Consignee from "../models/Consignee.js";
import LoadingEntry from "../models/LoadingEntry.js";
import Bid from "../models/Bid.js";
import ParticipateBid from "../models/ParticipateBid.js";
import Company from "../models/Company.js";
import Group from "../models/Group.js";
import Buyer from "../models/Buyer.js";
import PaymentReceived from "../models/PaymentReceived.js";

const router = Router();

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getSellerBrokerage = async (supplierId, commodityName) => {
  if (!supplierId || !commodityName) return 0;
  try {
    const seller = await Seller.findById(supplierId);
    if (!seller || !seller.commodities) return 0;
    const commodity = seller.commodities.find(
      (c) => c.name.toLowerCase() === commodityName.toLowerCase(),
    );
    return commodity ? commodity.brokerage : 0;
  } catch (error) {
    console.error("Error fetching seller brokerage:", error);
    return 0;
  }
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post("/send-email", async (req, res) => {
  try {
    const { email, pdfBase64, saudaNo, poNumber } = req.body;

    if (!email || !pdfBase64) {
      return res.status(400).json({ message: "Email and PDF are required" });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Purchase Order - Sauda No: ${saudaNo || "N/A"}`,
      text: `Please find attached the Purchase Order for Sauda No: ${saudaNo || "N/A"}, PO Number: ${poNumber || "N/A"}.`,
      attachments: [
        {
          filename: `HANS-2025-${saudaNo || "Order"}.pdf`,
          content: pdfBase64,
          encoding: "base64",
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Email Error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page || "0", 10);
    const limit = parseInt(req.query.limit || "0", 10);
    const search = (req.query.search || "").trim();
    const mobile =
      req.query.mobile || req.query.sellerMobile || req.query.buyerMobile;
    const userRole = req.query.userRole;
    const supplier = req.query.supplier;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const exportAll = String(req.query.export || "").toLowerCase() === "true";

    // New filters from SaudaMISSection
    const { buyerCompany, supplierCompany, saudaNo } = req.query;

    let query = {};

    // Specific filters for Sauda MIS
    if (buyerCompany) {
      query.buyerCompany = { $regex: new RegExp(escapeRegex(buyerCompany), "i") };
    }
    if (supplierCompany) {
      query.supplierCompany = { $regex: new RegExp(escapeRegex(supplierCompany), "i") };
    }
    if (saudaNo) {
      query.saudaNo = { $regex: new RegExp(escapeRegex(saudaNo), "i") };
    }

    // Role-based filtering
    if (userRole === "Seller" && mobile) {
      const phoneRegex = /^(?:\+91|0)?([6-9]\d{9})$/;
      const phoneMatch = String(mobile).match(phoneRegex);
      const normalizedMobile = phoneMatch ? phoneMatch[1] : mobile;

      const seller = await Seller.findOne({
        "phoneNumbers.value": { $regex: new RegExp(normalizedMobile + "$") },
      });

      const mobileConditions = [
        { sellerMobile: normalizedMobile },
        { sellerMobile: { $regex: new RegExp(normalizedMobile + "$") } },
      ];

      if (seller) {
        mobileConditions.push({ supplier: seller._id });
      }
      query.$or = mobileConditions;
    } else if (userRole === "Buyer" && mobile) {
      const phoneRegex = /^(?:\+91|0)?([6-9]\d{9})$/;
      const phoneMatch = String(mobile).match(phoneRegex);
      const normalizedMobile = phoneMatch ? phoneMatch[1] : mobile;

      const buyer = await Buyer.findOne({
        mobile: { $regex: new RegExp(normalizedMobile + "$") },
      });

      const buyerConditions = [
        { buyerMobile: normalizedMobile },
        { buyerMobile: { $regex: new RegExp(normalizedMobile + "$") } },
      ];

      if (buyer && buyer.companyIds && buyer.companyIds.length > 0) {
        buyerConditions.push({ companyId: { $in: buyer.companyIds } });
      }
      query.$or = buyerConditions;
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");
      const searchConditions = [
        { saudaNo: { $regex: searchRegex } },
        { poNumber: { $regex: searchRegex } },
        { buyer: { $regex: searchRegex } },
        { buyerCompany: { $regex: searchRegex } },
        { supplierCompany: { $regex: searchRegex } },
        { commodity: { $regex: searchRegex } },
        { state: { $regex: searchRegex } },
      ];

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    if (supplier) {
      query.supplier = supplier;
    }

    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) {
        dateFilter.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }

      const dateQuery = {
        $or: [{ poDate: dateFilter }, { createdAt: dateFilter }],
      };

      if (query.$or || query.$and) {
        query.$and = query.$and || [];
        if (query.$or) {
          query.$and.push({ $or: query.$or });
          delete query.$or;
        }
        query.$and.push(dateQuery);
      } else {
        Object.assign(query, dateQuery);
      }
    }

    if (exportAll) {
      const items = await SelfOrder.find(query)
        .sort({ saudaNo: -1 })
        .populate("supplier", "sellerName")
        .select("saudaNo poNumber poDate buyer buyerCompany supplierCompany commodity quantity rate gst cd deliveryDate paymentTerms createdAt status consignee")
        .lean();
      return res.json(items);
    }

    if (page > 0 && limit > 0) {
      const items = await SelfOrder.find(query)
        .sort({ saudaNo: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("supplier", "sellerName")
        .select("saudaNo poNumber poDate buyer buyerCompany supplierCompany commodity quantity rate gst cd deliveryDate paymentTerms createdAt status consignee")
        .lean();
      const total = await SelfOrder.countDocuments(query);
      return res.json({ data: items, total });
    }

    const items = await SelfOrder.find(query)
      .sort({ saudaNo: -1 })
      .limit(limit)
      .populate("supplier", "sellerName")
      .select("saudaNo poNumber poDate buyer buyerCompany supplierCompany commodity quantity rate gst cd deliveryDate paymentTerms createdAt status consignee")
      .lean();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get detailed MIS report for a specific Sauda (Loading Entries + Payments)
router.get("/details/:saudaNo", async (req, res) => {
  try {
    const { saudaNo } = req.params;

    const order = await SelfOrder.findOne({ saudaNo }).populate("supplier", "sellerName").lean();
    if (!order) {
      return res.status(404).json({ message: "Sauda not found" });
    }

    // 1. Get all Loading Entries for this Sauda
    const entries = await LoadingEntry.find({ saudaNo }).sort({ loadingDate: 1 }).lean();

    // 2. Get all Payments for this Sauda
    // A payment is linked to a sauda through its mappings
    const payments = await PaymentReceived.find({
      "mappings.saudaNo": saudaNo
    }).sort({ date: 1, createdAt: 1 }).lean();

    // 3. Consolidate data for the Tally-style report
    // We need to show the flow: Loading Entry -> Payment -> Balance
    const reportData = [];
    let runningBalance = 0;

    // We'll merge entries and payments into a chronological list
    // Each loading entry increases the balance (Debit)
    // Each payment decreases the balance (Credit)
    
    // For simplicity in the MIS, we can show:
    // Loading Entry 1 -> Amt -> Bal
    // Payment for Entry 1 -> Amt -> Bal
    // Loading Entry 2 -> Amt -> Bal
    
    res.json({
      order,
      entries,
      payments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/seller/stats", async (req, res) => {
  try {
    const { mobile } = req.query;
    if (!mobile) return res.status(400).json({ message: "Mobile is required" });

    const phoneRegex = /^(?:\+91|0)?([6-9]\d{9})$/;
    const phoneMatch = String(mobile).match(phoneRegex);
    const normalizedMobile = phoneMatch ? phoneMatch[1] : mobile;

    const seller = await Seller.findOne({
      "phoneNumbers.value": { $regex: new RegExp(normalizedMobile + "$") },
    });

    const mobileConditions = [
      { sellerMobile: normalizedMobile },
      { sellerMobile: { $regex: new RegExp(normalizedMobile + "$") } },
    ];

    if (seller) {
      mobileConditions.push({ supplier: seller._id });
    }

    const stats = await SelfOrder.aggregate([
      { $match: { $or: mobileConditions } },
      {
        $lookup: {
          from: "loadingentries",
          localField: "saudaNo",
          foreignField: "saudaNo",
          as: "loadingEntries",
        },
      },
      {
        $lookup: {
          from: "sellers",
          localField: "supplier",
          foreignField: "_id",
          as: "sellerInfo",
        },
      },
      { $unwind: { path: "$sellerInfo", preserveNullAndEmptyArrays: true } },
      {
        $unwind: { path: "$loadingEntries", preserveNullAndEmptyArrays: false },
      },
      {
        $addFields: {
          sellerRate: {
            $let: {
              vars: {
                saudaRate: {
                  $ifNull: ["$buyerBrokerage.brokerageSupplier", 0],
                },
                sellerCommodity: {
                  $filter: {
                    input: { $ifNull: ["$sellerInfo.commodities", []] },
                    as: "c",
                    cond: {
                      $eq: [
                        { $toLower: "$$c.name" },
                        { $toLower: "$commodity" },
                      ],
                    },
                  },
                },
              },
              in: {
                $cond: {
                  if: { $gt: ["$$saudaRate", 0] },
                  then: "$$saudaRate",
                  else: {
                    $ifNull: [
                      { $arrayElemAt: ["$$sellerCommodity.brokerage", 0] },
                      0,
                    ],
                  },
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          calculatedBrokerage: {
            $cond: {
              if: { $gt: ["$sellerRate", 0] },
              then: {
                $multiply: [
                  { $ifNull: ["$loadingEntries.unloadingWeight", 0] },
                  "$sellerRate",
                ],
              },
              else: { $ifNull: ["$loadingEntries.sellerBrokerage", 0] },
            },
          },
        },
      },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalBrokerage: { $sum: "$calculatedBrokerage" },
                totalUnloadingWeight: {
                  $sum: "$loadingEntries.unloadingWeight",
                },
                totalSaudas: { $addToSet: "$_id" },
              },
            },
            {
              $project: {
                totalBrokerage: 1,
                totalUnloadingWeight: 1,
                totalSaudas: { $size: "$totalSaudas" },
              },
            },
          ],
          commodityBreakdown: [
            {
              $group: {
                _id: "$commodity",
                quantity: { $sum: "$loadingEntries.unloadingWeight" },
                brokerage: { $sum: "$calculatedBrokerage" },
                trips: { $sum: 1 },
              },
            },
            { $sort: { quantity: -1 } },
          ],
          companyBreakdown: [
            {
              $group: {
                _id: "$supplierCompany",
                quantity: { $sum: "$loadingEntries.unloadingWeight" },
                brokerage: { $sum: "$calculatedBrokerage" },
                trips: { $sum: 1 },
              },
            },
            { $sort: { quantity: -1 } },
          ],
        },
      },
    ]);

    const result = {
      totalBrokerage: stats[0]?.totals[0]?.totalBrokerage || 0,
      totalUnloadingWeight: stats[0]?.totals[0]?.totalUnloadingWeight || 0,
      totalSaudas: stats[0]?.totals[0]?.totalSaudas || 0,
      commodityBreakdown: stats[0]?.commodityBreakdown || [],
      companyBreakdown: stats[0]?.companyBreakdown || [],
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/buyer/stats", async (req, res) => {
  try {
    const { mobile } = req.query;
    if (!mobile) return res.status(400).json({ message: "Mobile is required" });

    const phoneRegex = /^(?:\+91|0)?([6-9]\d{9})$/;
    const phoneMatch = String(mobile).match(phoneRegex);
    const normalizedMobile = phoneMatch ? phoneMatch[1] : mobile;

    const buyer = await Buyer.findOne({
      mobile: { $regex: new RegExp(normalizedMobile + "$") },
    });

    const buyerConditions = [
      { buyerMobile: normalizedMobile },
      { buyerMobile: { $regex: new RegExp(normalizedMobile + "$") } },
    ];

    if (buyer && buyer.companyIds && buyer.companyIds.length > 0) {
      buyerConditions.push({ companyId: { $in: buyer.companyIds } });
    }

    const stats = await SelfOrder.aggregate([
      { $match: { $or: buyerConditions } },
      {
        $lookup: {
          from: "loadingentries",
          localField: "saudaNo",
          foreignField: "saudaNo",
          as: "loadingEntries",
        },
      },
      {
        $unwind: { path: "$loadingEntries", preserveNullAndEmptyArrays: true },
      },
      {
        $addFields: {
          buyerRate: { $ifNull: ["$buyerBrokerage.brokerageBuyer", 0] },
        },
      },
      {
        $addFields: {
          calculatedBrokerage: {
            $multiply: [
              { $ifNull: ["$loadingEntries.unloadingWeight", 0] },
              "$buyerRate",
            ],
          },
        },
      },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalBrokerage: { $sum: "$calculatedBrokerage" },
                totalUnloadingWeight: {
                  $sum: "$loadingEntries.unloadingWeight",
                },
                totalSaudas: { $addToSet: "$_id" },
                pendingSaudas: {
                  $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
                },
              },
            },
            {
              $project: {
                totalBrokerage: 1,
                totalUnloadingWeight: 1,
                totalSaudas: { $size: "$totalSaudas" },
                pendingSaudas: 1,
              },
            },
          ],
          commodityBreakdown: [
            {
              $group: {
                _id: "$commodity",
                quantity: { $sum: "$loadingEntries.unloadingWeight" },
                brokerage: { $sum: "$calculatedBrokerage" },
                trips: {
                  $sum: {
                    $cond: [{ $ifNull: ["$loadingEntries._id", false] }, 1, 0],
                  },
                },
              },
            },
            { $sort: { quantity: -1 } },
          ],
          companyBreakdown: [
            {
              $group: {
                _id: "$buyerCompany",
                quantity: { $sum: "$loadingEntries.unloadingWeight" },
                brokerage: { $sum: "$calculatedBrokerage" },
                trips: {
                  $sum: {
                    $cond: [{ $ifNull: ["$loadingEntries._id", false] }, 1, 0],
                  },
                },
              },
            },
            { $sort: { brokerage: -1 } },
          ],
        },
      },
    ]);

    const result = {
      totalBrokerage: stats[0]?.totals[0]?.totalBrokerage || 0,
      totalUnloadingWeight: stats[0]?.totals[0]?.totalUnloadingWeight || 0,
      totalSaudas: stats[0]?.totals[0]?.totalSaudas || 0,
      pendingSaudas: stats[0]?.totals[0]?.pendingSaudas || 0,
      commodityBreakdown: stats[0]?.commodityBreakdown || [],
      companyBreakdown: stats[0]?.companyBreakdown || [],
    };

    // Add pending bid acceptances count
    try {
      const groups = (buyer?.groups || []).map(g => String(g).trim().toLowerCase());
      const buyerCompanies = await Company.find({ _id: { $in: buyer?.companyIds || [] } });
      const companyNames = buyerCompanies.map(c => String(c.companyName || "").trim().toLowerCase());

      const bidQuery = {
        $or: [
          { createdByMobile: normalizedMobile },
          { group: { $in: groups.map(g => new RegExp(`^${escapeRegex(g)}$`, 'i')) } },
          { company: { $in: companyNames.map(c => new RegExp(`^${escapeRegex(c)}$`, 'i')) } }
        ]
      };

      const buyerBids = await Bid.find(bidQuery).select("_id");
      const buyerBidIds = buyerBids.map(b => b._id);

      result.pendingBidAcceptances = await ParticipateBid.countDocuments({
        bidId: { $in: buyerBidIds },
        status: "pending"
      });
    } catch (bidErr) {
      console.error("Error fetching pending bid counts:", bidErr);
      result.pendingBidAcceptances = 0;
    }

    res.json(result);
  } catch (error) {
    console.error("Buyer stats error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/pending/summary", async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "10", 10);
    const search = (req.query.search || "").trim();
    const skip = (page - 1) * limit;
    const mobile = req.query.mobile;
    const userRole = req.query.userRole;

    const matchQuery = {
      status: "active",
      $or: [
        { pendingQuantity: { $gt: 0 } },
        {
          $and: [
            { pendingQuantity: { $exists: false } },
            { quantity: { $gt: 0 } },
          ],
        },
      ],
    };

    if (userRole === "Seller" && mobile) {
      const phoneRegex = /^(?:\+91|0)?([6-9]\d{9})$/;
      const phoneMatch = String(mobile).match(phoneRegex);
      const normalizedMobile = phoneMatch ? phoneMatch[1] : mobile;

      const seller = await Seller.findOne({
        "phoneNumbers.value": { $regex: new RegExp(normalizedMobile + "$") },
      });

      const mobileConditions = [
        { sellerMobile: normalizedMobile },
        { sellerMobile: { $regex: new RegExp(normalizedMobile + "$") } },
      ];

      if (seller) {
        mobileConditions.push({ supplier: seller._id });
      }
      matchQuery.$and = [{ $or: mobileConditions }];
    }

    const pipeline = [
      {
        $match: matchQuery,
      },
      {
        $lookup: {
          from: "loadingentries",
          localField: "saudaNo",
          foreignField: "saudaNo",
          as: "loadingEntries",
        },
      },
      {
        $lookup: {
          from: "sellers",
          localField: "supplier",
          foreignField: "_id",
          as: "sellerDetails",
        },
      },
      {
        $unwind: {
          path: "$sellerDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          unloadingWeight: { $sum: "$loadingEntries.unloadingWeight" },
          sellerRate: {
            $let: {
              vars: {
                saudaRate: {
                  $ifNull: ["$buyerBrokerage.brokerageSupplier", 0],
                },
                sellerCommodity: {
                  $filter: {
                    input: { $ifNull: ["$sellerDetails.commodities", []] },
                    as: "c",
                    cond: {
                      $eq: [
                        { $toLower: "$$c.name" },
                        { $toLower: "$commodity" },
                      ],
                    },
                  },
                },
              },
              in: {
                $cond: {
                  if: { $gt: ["$$saudaRate", 0] },
                  then: "$$saudaRate",
                  else: {
                    $ifNull: [
                      { $arrayElemAt: ["$$sellerCommodity.brokerage", 0] },
                      0,
                    ],
                  },
                },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: {
            sellerId: "$supplier",
            sellerName: {
              $ifNull: ["$sellerDetails.sellerName", "$supplierCompany"],
            },
            consignee: "$consignee",
          },
          totalPendingQuantity: {
            $sum: { $ifNull: ["$pendingQuantity", "$quantity"] },
          },
          totalUnloadingWeight: { $sum: "$unloadingWeight" },
          totalPendingBrokerage: {
            $sum: {
              $multiply: [
                { $ifNull: ["$pendingQuantity", "$quantity"] },
                "$sellerRate",
              ],
            },
          },
          totalLoadedBrokerage: {
            $sum: {
              $multiply: ["$unloadingWeight", "$sellerRate"],
            },
          },
          saudaCount: { $sum: 1 },
          saudas: {
            $push: {
              saudaNo: "$saudaNo",
              pendingQuantity: { $ifNull: ["$pendingQuantity", "$quantity"] },
              commodity: "$commodity",
              poDate: "$poDate",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          sellerId: "$_id.sellerId",
          sellerName: "$_id.sellerName",
          consignee: "$_id.consignee",
          totalPendingQuantity: 1,
          totalUnloadingWeight: 1,
          totalPendingBrokerage: 1,
          totalLoadedBrokerage: 1,
          saudaCount: 1,
          saudas: 1,
        },
      },
    ];

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");
      pipeline.push({
        $match: {
          $or: [
            { sellerName: { $regex: searchRegex } },
            { consignee: { $regex: searchRegex } },
          ],
        },
      });
    }

    pipeline.push({ $sort: { sellerName: 1, consignee: 1 } });

    const totalResult = await SelfOrder.aggregate([
      ...pipeline,
      { $count: "total" },
    ]);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const summary = await SelfOrder.aggregate(pipeline);

    const statsPipeline = [
      {
        $match: matchQuery,
      },
      {
        $lookup: {
          from: "loadingentries",
          localField: "saudaNo",
          foreignField: "saudaNo",
          as: "loadingEntries",
        },
      },
      {
        $addFields: {
          unloadingWeight: { $sum: "$loadingEntries.unloadingWeight" },
        },
      },
      {
        $lookup: {
          from: "sellers",
          localField: "supplier",
          foreignField: "_id",
          as: "sellerDetails",
        },
      },
      {
        $unwind: {
          path: "$sellerDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: null,
          totalPendingWeight: {
            $sum: { $ifNull: ["$pendingQuantity", "$quantity"] },
          },
          totalUnloadingWeight: { $sum: "$unloadingWeight" },
          totalPendingBrokerage: {
            $sum: {
              $multiply: [
                { $ifNull: ["$pendingQuantity", "$quantity"] },
                { $ifNull: ["$buyerBrokerage.brokerageSupplier", 0] },
              ],
            },
          },
          totalLoadedBrokerage: {
            $sum: {
              $multiply: [
                "$unloadingWeight",
                { $ifNull: ["$buyerBrokerage.brokerageSupplier", 0] },
              ],
            },
          },
          activeSellers: { $addToSet: "$supplier" },
          totalConsignees: { $addToSet: "$consignee" },
        },
      },
      {
        $project: {
          _id: 0,
          totalPendingWeight: 1,
          totalUnloadingWeight: 1,
          totalPendingBrokerage: 1,
          totalLoadedBrokerage: 1,
          activeSellers: { $size: "$activeSellers" },
          totalConsignees: { $size: "$totalConsignees" },
        },
      },
    ];

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");
      statsPipeline.push({
        $match: {
          $or: [
            { sellerName: { $regex: searchRegex } },
            { consignee: { $regex: searchRegex } },
          ],
        },
      });
    }

    const statsResult = await SelfOrder.aggregate(statsPipeline);
    const summaryStats =
      statsResult.length > 0
        ? statsResult[0]
        : {
            totalPendingWeight: 0,
            totalUnloadingWeight: 0,
            totalPendingBrokerage: 0,
            totalLoadedBrokerage: 0,
            activeSellers: 0,
            totalConsignees: 0,
          };

    res.json({
      data: summary,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      summaryStats,
    });
  } catch (error) {
    console.error("Pending Summary Error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/pending/list", async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "10", 10);
    const search = (req.query.search || "").trim();
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const buyerCompany = req.query.buyerCompany;
    const sellerCompany = req.query.sellerCompany;
    const mobile = req.query.mobile;
    const userRole = req.query.userRole;
    const all = req.query.all === "true";

    let query = {};
    if (!all) {
      query.status = "active";
      query.$or = [
        { pendingQuantity: { $gt: 0 } },
        { pendingQuantity: { $exists: false } },
        { pendingQuantity: 0 },
      ];
    }

    if (userRole === "Seller" && mobile) {
      const phoneRegex = /^(?:\+91|0)?([6-9]\d{9})$/;
      const phoneMatch = String(mobile).match(phoneRegex);
      const normalizedMobile = phoneMatch ? phoneMatch[1] : mobile;

      const seller = await Seller.findOne({
        "phoneNumbers.value": { $regex: new RegExp(normalizedMobile + "$") },
      });

      const mobileConditions = [
        { sellerMobile: normalizedMobile },
        { sellerMobile: { $regex: new RegExp(normalizedMobile + "$") } },
      ];

      if (seller) {
        mobileConditions.push({ supplier: seller._id });
      }
      query.$and = [{ $or: mobileConditions }];
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");
      const searchOr = {
        $or: [
          { supplierCompany: { $regex: searchRegex } },
          { saudaNo: { $regex: searchRegex } },
          { buyerCompany: { $regex: searchRegex } },
          { commodity: { $regex: searchRegex } },
        ],
      };
      if (!query.$and) {
        query.$and = [searchOr];
      } else {
        query.$and.push(searchOr);
      }
    }

    if (buyerCompany) {
      if (!query.$and) {
        query.$and = [];
      }
      query.$and.push({ buyerCompany: buyerCompany });
    }

    if (sellerCompany) {
      if (!query.$and) {
        query.$and = [];
      }
      query.$and.push({ supplierCompany: sellerCompany });
    }

    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) {
        dateFilter.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }

      const dateQuery = {
        $or: [{ poDate: dateFilter }, { createdAt: dateFilter }],
      };

      if (query.$or || query.$and) {
        query.$and = query.$and || [];
        if (query.$or) {
          query.$and.push({ $or: query.$or });
          delete query.$or;
        }
        query.$and.push(dateQuery);
      } else {
        Object.assign(query, dateQuery);
      }
    }

    const pipeline = [
      { $match: query },
      { $sort: { poDate: -1, createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: "sellers",
          localField: "supplier",
          foreignField: "_id",
          as: "supplierDetails",
        },
      },
      {
        $unwind: {
          path: "$supplierDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "loadingentries",
          localField: "saudaNo",
          foreignField: "saudaNo",
          as: "loadingEntries",
        },
      },
      {
        $addFields: {
          totalUnloadingWeight: { $sum: "$loadingEntries.unloadingWeight" },
          supplier: "$supplierDetails",
        },
      },
      {
        $project: {
          loadingEntries: 0,
          supplierDetails: 0,
        },
      },
    ];

    const items = await SelfOrder.aggregate(pipeline);
    const total = await SelfOrder.countDocuments(query);

    res.json({
      data: items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const item = await SelfOrder.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: "Order not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const item = await SelfOrder.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Order not found" });

    const oldSupplier = item.supplier;
    const oldCommodity = item.commodity;

    // Check if status or remarks are being manually updated
    const isManualUpdate = req.body.status !== undefined || req.body.closeRemarks !== undefined;

    Object.assign(item, req.body);

    if (
      (String(item.supplier) !== String(oldSupplier) ||
        item.commodity !== oldCommodity) &&
      item.supplier &&
      item.commodity
    ) {
      const brokerage = await getSellerBrokerage(item.supplier, item.commodity);
      if (brokerage) {
        item.buyerBrokerage = item.buyerBrokerage || {
          brokerageBuyer: 0,
          brokerageSupplier: 0,
        };
        item.buyerBrokerage.brokerageSupplier = brokerage;
      }
    }

    const allEntries = await LoadingEntry.find({ saudaNo: item.saudaNo });
    const totalLoaded = allEntries.reduce(
      (sum, e) => sum + (e.loadingWeight || 0),
      0,
    );
    item.pendingQuantity = (item.quantity || 0) - totalLoaded;

    // Only auto-calculate status if it's NOT a manual status update
    if (!isManualUpdate) {
      if (totalLoaded >= (item.quantity || 0) * 0.95) {
        item.status = "closed";
      } else {
        item.status = "active";
      }
    }

    await item.save();
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = req.body;

    if (
      data.supplier &&
      data.commodity &&
      (!data.buyerBrokerage || !data.buyerBrokerage.brokerageSupplier)
    ) {
      const brokerage = await getSellerBrokerage(data.supplier, data.commodity);
      if (brokerage) {
        data.buyerBrokerage = data.buyerBrokerage || {
          brokerageBuyer: 0,
          brokerageSupplier: 0,
        };
        data.buyerBrokerage.brokerageSupplier = brokerage;
      }
    }

    if (
      data.pendingQuantity === undefined ||
      data.pendingQuantity === null ||
      data.pendingQuantity === ""
    ) {
      data.pendingQuantity = data.quantity || 0;
    }
    if (!data.status) {
      data.status = "active";
    }
    const item = await SelfOrder.create(data);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch("/:id/whatsapp-sent", async (req, res) => {
  try {
    const item = await SelfOrder.findByIdAndUpdate(
      req.params.id,
      { whatsappSent: true },
      { new: true },
    );
    if (!item) return res.status(404).json({ message: "Order not found" });
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/export/excel", async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    const mobile =
      req.query.mobile || req.query.sellerMobile || req.query.buyerMobile;
    const userRole = req.query.userRole;
    const supplier = req.query.supplier;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    let query = {};

    if (userRole === "Seller" && mobile) {
      const phoneRegex = /^(?:\+91|0)?([6-9]\d{9})$/;
      const phoneMatch = String(mobile).match(phoneRegex);
      const normalizedMobile = phoneMatch ? phoneMatch[1] : mobile;

      const seller = await Seller.findOne({
        "phoneNumbers.value": { $regex: new RegExp(normalizedMobile + "$") },
      });

      const mobileConditions = [
        { sellerMobile: normalizedMobile },
        { sellerMobile: { $regex: new RegExp(normalizedMobile + "$") } },
      ];

      if (seller) {
        mobileConditions.push({ supplier: seller._id });
      }
      query.$or = mobileConditions;
    } else if (userRole === "Buyer" && mobile) {
      const phoneRegex = /^(?:\+91|0)?([6-9]\d{9})$/;
      const phoneMatch = String(mobile).match(phoneRegex);
      const normalizedMobile = phoneMatch ? phoneMatch[1] : mobile;

      const buyer = await Buyer.findOne({
        mobile: { $regex: new RegExp(normalizedMobile + "$") },
      });

      const buyerConditions = [
        { buyerMobile: normalizedMobile },
        { buyerMobile: { $regex: new RegExp(normalizedMobile + "$") } },
      ];

      if (buyer && buyer.companyIds && buyer.companyIds.length > 0) {
        buyerConditions.push({ companyId: { $in: buyer.companyIds } });
      }
      query.$or = buyerConditions;
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");
      const searchConditions = [
        { saudaNo: { $regex: searchRegex } },
        { poNumber: { $regex: searchRegex } },
        { buyer: { $regex: searchRegex } },
        { buyerCompany: { $regex: searchRegex } },
        { supplierCompany: { $regex: searchRegex } },
        { commodity: { $regex: searchRegex } },
      ];

      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    if (supplier) query.supplier = supplier;

    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      const dateQuery = {
        $or: [{ poDate: dateFilter }, { createdAt: dateFilter }],
      };
      if (query.$or || query.$and) {
        query.$and = query.$and || [];
        if (query.$or) {
          query.$and.push({ $or: query.$or });
          delete query.$or;
        }
        query.$and.push(dateQuery);
      } else {
        Object.assign(query, dateQuery);
      }
    }

    let items = await SelfOrder.find(query)
      .sort({ saudaNo: -1 })
      .populate("supplier", "sellerName")
      .select("saudaNo poNumber poDate buyer buyerCompany supplierCompany commodity quantity rate gst cd deliveryDate paymentTerms createdAt status consignee")
      .lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Self Orders");

    const consignees = await Consignee.find({}).lean();
    const consigneeMap = new Map();
    consignees.forEach((c) => {
      if (c?._id) consigneeMap.set(String(c._id), c.name || c.label || "-");
    });

    const getConsigneeDisplay = (item) => {
      try {
        const c = item.consignee;
        if (!c) return "N/A";
        if (typeof c === "object") {
          return c.name || c.label || "N/A";
        }
        if (typeof c === "string") {
          // If it's an ID, look it up in the map
          return consigneeMap.get(c) || consigneeMap.get(c.trim()) || c;
        }
        return "N/A";
      } catch (err) {
        return "N/A";
      }
    };

    const columns = [
      { header: "Date", key: "Date", width: 15 },
      { header: "Sauda No", key: "Sauda No", width: 15 },
      { header: "PO Number", key: "PO Number", width: 20 },
      { header: "Buyer", key: "Buyer", width: 20 },
      { header: "Buyer Company", key: "Buyer Company", width: 30 },
      { header: "Seller Company", key: "Seller Company", width: 30 },
      { header: "Seller Name", key: "Seller Name", width: 30 },
      { header: "Consignee", key: "Consignee", width: 30 },
      { header: "Commodity", key: "Commodity", width: 20 },
      { header: "Quantity", key: "Quantity", width: 15 },
      { header: "Rate", key: "Rate", width: 15 },
      { header: "Tax", key: "Tax", width: 10 },
      { header: "CD", key: "CD", width: 10 },
      { header: "Delivery Date", key: "Delivery Date", width: 15 },
      { header: "Payment Time", key: "Payment Time", width: 20 },
    ];

    worksheet.columns = columns;

    const formatDate = (date) => {
      if (!date) return "";
      const d = new Date(date);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString("en-GB");
    };

    items.forEach((item) => {
      const rowData = {
        Date: item.poDate
          ? formatDate(item.poDate)
          : formatDate(item.createdAt),
        "Sauda No": item.saudaNo || "",
        "PO Number": item.poNumber || "",
        Buyer: item.buyer || "",
        "Buyer Company": item.buyerCompany || "",
        "Seller Company": item.supplierCompany || "",
        "Seller Name": item.supplier?.sellerName || "",
        Consignee: getConsigneeDisplay(item) || "",
        Commodity: item.commodity || "",
        Quantity: item.quantity || "",
        Rate: item.rate || "",
        Tax: item.tax || item.gst || "",
        CD: item.cd || "",
        "Delivery Date": formatDate(item.deliveryDate),
        "Payment Time": item.paymentTerms || "",
      };

      worksheet.addRow(rowData);
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "SelfOrders.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export Excel Error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
