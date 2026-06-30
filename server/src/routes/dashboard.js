import { Router } from "express";
import Buyer from "../models/Buyer.js";
import Seller from "../models/Seller.js";
import Consignee from "../models/Consignee.js";
import SelfOrder from "../models/SelfOrder.js";
import Bid from "../models/Bid.js";
import Employee from "../models/Employee.js";
import EmployeeWork from "../models/EmployeeWork.js";
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
      agentStats,
      employeeCount,
      totalWorks,
      pendingWorks,
      inProgressWorks,
      completedWorks,
      cancelledWorks
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
      ]),
      Employee.countDocuments(),
      EmployeeWork.countDocuments(),
      EmployeeWork.countDocuments({ status: "Pending" }),
      EmployeeWork.countDocuments({ status: "In Progress" }),
      EmployeeWork.countDocuments({ status: "Completed" }),
      EmployeeWork.countDocuments({ status: "Cancelled" })
    ]);

    const agentSaudaList = agentStats.map(item => ({
      name: item.name || "Direct / Unknown",
      tons: item.tons || 0
    }));

    const totalSaudaTons = agentSaudaList.reduce((sum, item) => sum + item.tons, 0);

    // Fetch date-wise work stats for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateWiseWorks = await EmployeeWork.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fetch employee-wise work stats
    const employeeWiseWorks = await EmployeeWork.aggregate([
      {
        $lookup: {
          from: "employees",
          localField: "employeeId",
          foreignField: "_id",
          as: "employee"
        }
      },
      { $unwind: "$employee" },
      {
        $group: {
          _id: "$employee._id",
          name: { $first: "$employee.name" },
          employeeId: { $first: "$employee.employeeId" },
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] }
          }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json({
      buyers: buyerCount,
      sellers: sellerCount,
      consignees: consigneeCount,
      orders: orderCount,
      bids: todayBidCount,
      agentSaudas: agentSaudaList,
      totalSaudaTons,
      employees: employeeCount,
      totalWorks,
      pendingWorks,
      inProgressWorks,
      completedWorks,
      cancelledWorks,
      dateWiseWorks: dateWiseWorks.map(item => ({
        date: item._id,
        total: item.total,
        completed: item.completed,
        pending: item.pending,
        inProgress: item.inProgress
      })),
      employeeWiseWorks
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
