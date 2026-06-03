import { Router } from "express";
import Buyer from "../models/Buyer.js";
import Seller from "../models/Seller.js";
import Consignee from "../models/Consignee.js";
import SelfOrder from "../models/SelfOrder.js";
import Bid from "../models/Bid.js";
import authJwt from "../middleware/authJwt.js";

const router = Router();

router.get("/stats", authJwt, async (req, res) => {
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

export default router;
