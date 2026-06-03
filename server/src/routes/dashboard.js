import { Router } from "express";
import Buyer from "../models/Buyer.js";
import Seller from "../models/Seller.js";
import Consignee from "../models/Consignee.js";
import SelfOrder from "../models/SelfOrder.js";
import Bid from "../models/Bid.js";
import LoadingEntry from "../models/LoadingEntry.js";
import PaymentReceived from "../models/PaymentReceived.js";
import authJwt from "../middleware/authJwt.js";

const router = Router();

router.get("/stats", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [
      buyerCount,
      sellerCount,
      consigneeCount,
      orderCount,
      todayBidCount,
      agentStats
    ] = await Promise.all([
      Buyer.countDocuments(),
      Seller.countDocuments(),
      Consignee.countDocuments(),
      SelfOrder.countDocuments(),
      Bid.countDocuments({
        bidDate: {
          $gte: today,
          $lt: tomorrow
        }
      }),
      SelfOrder.aggregate([
        {
          $group: {
            _id: { $ifNull: ["$agentName", "Direct / Unknown"] },
            tons: { $sum: "$quantity" }
          }
        },
        {
          $project: {
            name: "$_id",
            tons: 1,
            _id: 0
          }
        },
        { $sort: { tons: -1 } }
      ])
    ]);

    const agentSaudaList = agentStats.map(item => ({
      name: item.name || "Direct / Unknown",
      tons: item.tons || 0
    }));

    const totalSaudaTons = agentSaudaList.reduce((sum, item) => sum + item.tons, 0);

    res.json({
      buyers: buyerCount,
      sellers: sellerCount,
      consignees: consigneeCount,
      orders: orderCount,
      bids: todayBidCount,
      agentSaudas: agentSaudaList,
      totalSaudaTons
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Dedicated Chart APIs
router.get("/charts/payments", async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = {};
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }
    const data = await PaymentReceived.find(query).select("date amount").lean();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/charts/loading", async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = {};
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      query.loadingDate = { $gte: start, $lte: end };
    }
    const data = await LoadingEntry.find(query).select("loadingDate unloadingWeight commodity").lean();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/charts/sauda", async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = {};
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }
    const data = await SelfOrder.find(query).select("createdAt quantity commodity agentName").lean();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/charts/bids", async (req, res) => {
  try {
    const { month, year } = req.query;
    let query = {};
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      query.bidDate = { $gte: start, $lte: end };
    }
    const data = await Bid.find(query).select("bidDate createdAt commodity").lean();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/charts/agent-distribution", async (req, res) => {
  try {
    const { month, year } = req.query;
    let matchQuery = {};
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      matchQuery.createdAt = { $gte: start, $lte: end };
    }
    const stats = await SelfOrder.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            agent: { $ifNull: ["$agentName", "Direct / Unknown"] },
            location: { $ifNull: ["$state", "Unknown"] }
          },
          count: { $sum: 1 },
          tons: { $sum: "$quantity" }
        }
      },
      {
        $project: {
          agent: "$_id.agent",
          location: "$_id.location",
          count: 1,
          tons: 1,
          _id: 0
        }
      },
      { $sort: { tons: -1 } }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

