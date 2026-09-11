import { Router } from "express";
import mongoose from "mongoose";
import Buyer from "../models/Buyer.js";
import Seller from "../models/Seller.js";
import User from "../models/User.js";
import authJwt from "../middleware/authJwt.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = Router();

const toDateValue = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildSearchQuery = (search) => {
  const value = String(search || "").trim();
  if (!value) return {};

  return {
    $or: [
      { name: { $regex: value, $options: "i" } },
      { sellerName: { $regex: value, $options: "i" } },
      { mobile: { $regex: value, $options: "i" } },
      { companyName: { $regex: value, $options: "i" } },
      { "phoneNumbers.value": { $regex: value, $options: "i" } },
    ],
  };
};

router.get("/buyer-seller-activity", authJwt, adminOnly, async (req, res) => {
  try {
    const { search = "", page = 1, limit = 20, status = "all" } = req.query;
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNumber - 1) * pageSize;

    const searchQuery = buildSearchQuery(search);
    const statusFilter = status && status !== "all" ? { status } : {};

    const [buyers, sellers, totalBuyers, totalSellers] = await Promise.all([
      Buyer.find({
        ...searchQuery,
        ...statusFilter,
      })
        .select("name mobile email companyIds status loginCount lastLoginAt lastActiveAt isLoggedIn createdAt")
        .sort({ lastActiveAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Seller.find({
        ...searchQuery,
        ...statusFilter,
      })
        .select("sellerName phoneNumbers emails companies status loginCount lastLoginAt lastActiveAt isLoggedIn createdAt")
        .sort({ lastActiveAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Buyer.countDocuments({ ...searchQuery, ...statusFilter }),
      Seller.countDocuments({ ...searchQuery, ...statusFilter }),
    ]);

    const mappedBuyers = buyers.map((buyer) => ({
      _id: buyer._id,
      type: "Buyer",
      name: buyer.name,
      contact: Array.isArray(buyer.mobile) && buyer.mobile.length ? buyer.mobile.join(", ") : "N/A",
      email: Array.isArray(buyer.email) && buyer.email.length ? buyer.email.join(", ") : "N/A",
      status: buyer.status || "Active",
      loginCount: buyer.loginCount || 0,
      lastLoginAt: buyer.lastLoginAt || null,
      lastActiveAt: buyer.lastActiveAt || null,
      isLoggedIn: !!buyer.isLoggedIn,
      createdAt: buyer.createdAt || null,
    }));

    const mappedSellers = sellers.map((seller) => ({
      _id: seller._id,
      type: "Seller",
      name: seller.sellerName,
      contact: Array.isArray(seller.phoneNumbers) && seller.phoneNumbers.length
        ? seller.phoneNumbers.map((item) => item?.value || "").join(", ")
        : "N/A",
      email: Array.isArray(seller.emails) && seller.emails.length
        ? seller.emails.map((item) => item?.value || "").join(", ")
        : "N/A",
      status: seller.status || "active",
      loginCount: seller.loginCount || 0,
      lastLoginAt: seller.lastLoginAt || null,
      lastActiveAt: seller.lastActiveAt || null,
      isLoggedIn: !!seller.isLoggedIn,
      createdAt: seller.createdAt || null,
    }));

    const allRecords = [...mappedBuyers, ...mappedSellers].sort((a, b) => {
      const aTime = toDateValue(a.lastActiveAt)?.getTime?.() || 0;
      const bTime = toDateValue(b.lastActiveAt)?.getTime?.() || 0;
      return bTime - aTime;
    });

    const total = totalBuyers + totalSellers;

    res.json({
      data: allRecords.slice(skip, skip + pageSize),
      total,
      page: pageNumber,
      limit: pageSize,
      totalBuyers,
      totalSellers,
      onlineNow: allRecords.filter((item) => item.isLoggedIn).length,
      summary: {
        buyersActive: mappedBuyers.filter((item) => item.isLoggedIn).length,
        sellersActive: mappedSellers.filter((item) => item.isLoggedIn).length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch audit report", details: error.message });
  }
});

router.get("/login-summary", authJwt, adminOnly, async (req, res) => {
  try {
    const [buyerStats, sellerStats, adminStats] = await Promise.all([
      Buyer.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            totalLogins: { $sum: { $ifNull: ["$loginCount", 0] } },
            onlineNow: { $sum: { $cond: [{ $eq: ["$isLoggedIn", true] }, 1, 0] } },
            lastLoginAt: { $max: "$lastLoginAt" },
          },
        },
      ]),
      Seller.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            totalLogins: { $sum: { $ifNull: ["$loginCount", 0] } },
            onlineNow: { $sum: { $cond: [{ $eq: ["$isLoggedIn", true] }, 1, 0] } },
            lastLoginAt: { $max: "$lastLoginAt" },
          },
        },
      ]),
      User.aggregate([
        {
          $match: { role: "Admin" },
        },
        {
          $group: {
            _id: null,
            totalAdmins: { $sum: 1 },
            onlineNow: { $sum: { $cond: [{ $eq: ["$isLoggedIn", true] }, 1, 0] } },
            lastLoginAt: { $max: "$lastLoginAt" },
          },
        },
      ]),
    ]);

    res.json({
      buyers: buyerStats[0] || { totalUsers: 0, totalLogins: 0, onlineNow: 0 },
      sellers: sellerStats[0] || { totalUsers: 0, totalLogins: 0, onlineNow: 0 },
      admins: adminStats[0] || { totalAdmins: 0, onlineNow: 0 },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to generate login summary", details: error.message });
  }
});

export default router;
