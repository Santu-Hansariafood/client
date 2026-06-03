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
    const data = await PaymentReceived.find().select("date amount").lean();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/charts/loading", async (req, res) => {
  try {
    const data = await LoadingEntry.find().select("loadingDate unloadingWeight commodity").lean();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/charts/sauda", async (req, res) => {
  try {
    const data = await SelfOrder.find().select("createdAt quantity commodity agentName").lean();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/charts/bids", async (req, res) => {
  try {
    const data = await Bid.find().select("bidDate createdAt commodity").lean();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/charts/agent-distribution", async (req, res) => {
  try {
    const stats = await SelfOrder.aggregate([
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

