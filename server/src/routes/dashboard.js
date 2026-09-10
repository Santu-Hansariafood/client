import { Router } from "express";
import Buyer from "../models/Buyer.js";
import Seller from "../models/Seller.js";
import Consignee from "../models/Consignee.js";
import SelfOrder from "../models/SelfOrder.js";
import Bid from "../models/Bid.js";
import Employee from "../models/Employee.js";
import EmployeeWork from "../models/EmployeeWork.js";
import LoadingEntry from "../models/LoadingEntry.js";
import PaymentReceived from "../models/PaymentReceived.js";
import authJwt from "../middleware/authJwt.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = Router();

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const companyFilter = (field, value) =>
  value ? { [field]: new RegExp(`^${escapeRegex(value.trim())}$`, "i") } : {};

const parseDate = (value, endOfDay = false) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) date.setUTCHours(23, 59, 59, 999);
  return date;
};

router.get("/admin-analysis", authJwt, adminOnly, async (req, res) => {
  try {
    const { sellerCompany = "", buyerCompany = "" } = req.query;
    const startDate = parseDate(req.query.startDate);
    const endDate = parseDate(req.query.endDate, true);
    const dateRange = (field) => ({
      ...(startDate || endDate
        ? { [field]: { ...(startDate ? { $gte: startDate } : {}), ...(endDate ? { $lte: endDate } : {}) } }
        : {}),
    });
    const saudaMatch = { ...companyFilter("supplierCompany", sellerCompany), ...companyFilter("buyerCompany", buyerCompany), ...dateRange("createdAt") };
    const loadingMatch = { ...companyFilter("supplierCompany", sellerCompany), ...companyFilter("buyerCompany", buyerCompany), ...dateRange("loadingDate") };
    const paymentMatch = { ...companyFilter("supplierCompany", sellerCompany), ...companyFilter("buyerCompany", buyerCompany), ...dateRange("date") };
    const monthGroup = (field) => ({
      $dateToString: { format: "%Y-%m", date: `$${field}` },
    });

    const [saudaByMonth, commodityStats, loadingByMonth, paymentByMonth, totals] = await Promise.all([
      SelfOrder.aggregate([
        { $match: saudaMatch },
        { $group: { _id: monthGroup("createdAt"), quantity: { $sum: { $ifNull: ["$quantity", 0] } }, value: { $sum: { $multiply: [{ $ifNull: ["$quantity", 0] }, { $ifNull: ["$rate", 0] }] } } } },
        { $sort: { _id: 1 } },
      ]),
      SelfOrder.aggregate([
        { $match: saudaMatch },
        { $group: { _id: { $ifNull: ["$commodity", "Unknown"] }, quantity: { $sum: { $ifNull: ["$quantity", 0] } }, value: { $sum: { $multiply: [{ $ifNull: ["$quantity", 0] }, { $ifNull: ["$rate", 0] }] } }, saudas: { $sum: 1 } } },
        { $sort: { value: -1 } },
      ]),
      LoadingEntry.aggregate([
        { $match: loadingMatch },
        { $group: { _id: monthGroup("loadingDate"), weight: { $sum: { $ifNull: ["$loadingWeight", 0] } }, entries: { $sum: 1 }, paid: { $sum: { $cond: [{ $eq: ["$paymentStatus", "done"] }, 1, 0] } } } },
        { $sort: { _id: 1 } },
      ]),
      PaymentReceived.aggregate([
        { $match: paymentMatch },
        { $group: { _id: monthGroup("date"), amount: { $sum: { $add: [{ $ifNull: ["$amount", 0] }, { $ifNull: ["$claim", 0] }, { $ifNull: ["$tds", 0] }] } }, vouchers: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      SelfOrder.aggregate([
        { $match: saudaMatch },
        { $group: { _id: null, saudas: { $sum: 1 }, quantity: { $sum: { $ifNull: ["$quantity", 0] } }, value: { $sum: { $multiply: [{ $ifNull: ["$quantity", 0] }, { $ifNull: ["$rate", 0] }] } } } },
      ]),
    ]);

    const summary = totals[0] || { saudas: 0, quantity: 0, value: 0 };
    const topCommodity = commodityStats[0];
    res.json({
      filters: { sellerCompany, buyerCompany, startDate: req.query.startDate || "", endDate: req.query.endDate || "" },
      summary: { ...summary, loadingEntries: loadingByMonth.reduce((sum, item) => sum + item.entries, 0), loadedWeight: loadingByMonth.reduce((sum, item) => sum + item.weight, 0), payments: paymentByMonth.reduce((sum, item) => sum + item.amount, 0) },
      saudaByMonth: saudaByMonth.map((item) => ({ month: item._id, quantity: item.quantity, value: item.value })),
      commodityStats: commodityStats.map((item) => ({ commodity: item._id || "Unknown", quantity: item.quantity, value: item.value, saudas: item.saudas })),
      loadingByMonth: loadingByMonth.map((item) => ({ month: item._id, weight: item.weight, entries: item.entries, paid: item.paid })),
      paymentByMonth: paymentByMonth.map((item) => ({ month: item._id, amount: item.amount, vouchers: item.vouchers })),
      insights: topCommodity ? `Highest sauda value is ${topCommodity._id || "Unknown"} at ${Math.round(topCommodity.value || 0).toLocaleString()} across ${topCommodity.saudas} saudas.` : "No matching sauda data is available for this selection.",
    });
  } catch (error) {
    console.error("Admin analysis error:", error);
    res.status(500).json({ message: "Failed to generate admin analysis" });
  }
});

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
