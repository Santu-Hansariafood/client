import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Buyer from "../models/Buyer.js";
import Seller from "../models/Seller.js";
import Employee from "../models/Employee.js";
import Transporter from "../models/Transporter.js";

const router = Router();

router.post("/admin/login", async (req, res) => {
  try {
    const { mobile, password } = req.body;
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }
    const user = await User.findOne({ role: "Admin", mobile, password });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign(
      { sub: user._id.toString(), role: "Admin", mobile: user.mobile || "" },
      process.env.JWT_SECRET,
      { expiresIn: "365d" },
    );
    res.json({
      role: "Admin",
      mobile: user.mobile || "",
      name: user.name,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/employees/login", async (req, res) => {
  try {
    const { mobile, password } = req.body;
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }
    const employee = await Employee.findOne({ mobile, password });
    if (!employee)
      return res.status(401).json({ message: "Invalid credentials" });
    if (employee.status === "Inactive") {
      return res.status(403).json({ message: "Your account is inactive." });
    }
    const token = jwt.sign(
      {
        sub: employee._id.toString(),
        role: "Employee",
        mobile: employee.mobile || "",
      },
      process.env.JWT_SECRET,
      { expiresIn: "365d" },
    );
    res.json({
      role: "Employee",
      mobile: employee.mobile || "",
      name: employee.name,
      email: employee.email || "",
      employeeId: employee.employeeId || "",
      sex: employee.sex || "",
      status: employee.status || "Active",
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/transporters/login", async (req, res) => {
  try {
    const { mobile, password } = req.body;
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }
    const transporter = await Transporter.findOne({ mobile, password });
    if (!transporter)
      return res.status(401).json({ message: "Invalid credentials" });
    if (transporter.status === "Inactive") {
      return res.status(403).json({ message: "Your account is inactive." });
    }
    const token = jwt.sign(
      {
        sub: transporter._id.toString(),
        role: "Transporter",
        mobile: transporter.mobile || "",
      },
      process.env.JWT_SECRET,
      { expiresIn: "365d" },
    );
    res.json({
      role: "Transporter",
      mobile: transporter.mobile || "",
      name: transporter.name,
      email: transporter.email || "",
      vehicleDetails: transporter.vehicleDetails || {},
      status: transporter.status || "Active",
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/buyers/login", async (req, res) => {
  try {
    const { mobile, password } = req.body;
    console.log(`Buyer login attempt: mobile=${mobile}`);

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing");
      return res.status(500).json({ message: "Server configuration error" });
    }

    if (!mobile || !password) {
      return res
        .status(400)
        .json({ message: "Mobile and password are required" });
    }

    const buyer = await Buyer.findOne({
      mobile: mobile,
      password: password,
    }).populate("companyIds", "companyName");

    if (!buyer) {
      console.warn(`Invalid buyer credentials for mobile: ${mobile}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (buyer.status === "Inactive") {
      return res
        .status(403)
        .json({ message: "Your account is inactive. Please contact support." });
    }

    const token = jwt.sign(
      { sub: buyer._id.toString(), role: "Buyer", mobile: mobile },
      process.env.JWT_SECRET,
      { expiresIn: "365d" },
    );

    console.log(`Buyer login successful: ${buyer.name}`);
    res.json({
      role: "Buyer",
      mobile: mobile,
      name: buyer.name,
      email: buyer.email || [],
      status: buyer.status || "Active",
      companyIds: (buyer.companyIds || []).map((c) => c._id || c),
      companyNames: (buyer.companyIds || []).map((c) => c.companyName || ""),
      token,
    });
  } catch (error) {
    console.error("Buyer login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/sellers/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    console.log(`Seller login attempt: phone=${phone}`);

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing");
      return res.status(500).json({ message: "Server configuration error" });
    }

    if (!phone || !password) {
      return res
        .status(400)
        .json({ message: "Phone and password are required" });
    }

    const seller = await Seller.findOne({
      "phoneNumbers.value": phone,
      password: password,
    });

    if (!seller) {
      console.warn(`Invalid seller credentials for phone: ${phone}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { sub: seller._id.toString(), role: "Seller", mobile: phone },
      process.env.JWT_SECRET,
      { expiresIn: "365d" },
    );

    console.log(`Seller login successful: ${seller.sellerName}`);
    res.json({
      role: "Seller",
      mobile: phone,
      name: seller.sellerName,
      emails: seller.emails || [],
      status: seller.status || "active",
      token,
    });
  } catch (error) {
    console.error("Seller login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
