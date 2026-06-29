import { Router } from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import User from "../models/User.js";
import Buyer from "../models/Buyer.js";
import Seller from "../models/Seller.js";
import Employee from "../models/Employee.js";
import Transporter from "../models/Transporter.js";

const router = Router();

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const getModelByRole = (role) => {
  switch (role) {
    case "Admin":
      return User;
    case "Buyer":
      return Buyer;
    case "Seller":
      return Seller;
    case "Employee":
      return Employee;
    case "Transporter":
      return Transporter;
    default:
      return null;
  }
};

const getEmailByRole = (user, role) => {
  switch (role) {
    case "Admin":
    case "Employee":
    case "Transporter":
      return user.email;
    case "Buyer":
      return Array.isArray(user.email) ? user.email[0] : user.email;
    case "Seller":
      return Array.isArray(user.emails) ? user.emails[0]?.value : null;
    default:
      return null;
  }
};

router.post("/forgot-password", async (req, res) => {
  try {
    const { mobile, role } = req.body;
    let normalizedMobile = String(mobile || "").trim();
    const phoneRegex = /^(?:\+91|0)?([6-9]\d{9})$/;
    const phoneMatch = normalizedMobile.match(phoneRegex);
    if (phoneMatch) {
      normalizedMobile = phoneMatch[1];
    }

    const Model = getModelByRole(role);
    if (!Model) return res.status(400).json({ message: "Invalid role" });

    const query =
      role === "Seller"
        ? { "phoneNumbers.value": normalizedMobile }
        : { mobile: normalizedMobile };

    const user = await Model.findOne(query);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const email = getEmailByRole(user, role);

    if (!email) {
      return res.status(400).json({
        message:
          "No email address found for this account. Please contact support.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    const templatePath = path.join(__dirname, "../templates/otp-email.html");
    let emailTemplate;
    try {
      emailTemplate = await fs.readFile(templatePath, "utf8");
    } catch (readError) {
      return res
        .status(500)
        .json({ message: "Failed to load email template." });
    }

    emailTemplate = emailTemplate.replace("{{otp}}", otp);
    emailTemplate = emailTemplate.replace("{{year}}", new Date().getFullYear());

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP - Hansaria Food Private Limited",
      html: emailTemplate,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (mailError) {
      return res.status(500).json({
        message: "Failed to send OTP email.",
        details: mailError.message,
      });
    }
    res.json({ message: "OTP sent to your registered email address" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", details: error.message });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { mobile, role, otp } = req.body;
    let normalizedMobile = String(mobile || "").trim();
    const phoneRegex = /^(?:\+91|0)?([6-9]\d{9})$/;
    const phoneMatch = normalizedMobile.match(phoneRegex);
    if (phoneMatch) {
      normalizedMobile = phoneMatch[1];
    }

    const Model = getModelByRole(role);
    if (!Model) return res.status(400).json({ message: "Invalid role" });

    const query =
      role === "Seller"
        ? { "phoneNumbers.value": normalizedMobile }
        : { mobile: normalizedMobile };

    const user = await Model.findOne(query);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.otp || user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    res.json({ message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/change-password-otp", async (req, res) => {
  try {
    const { mobile, role } = req.body;
    let normalizedMobile = String(mobile || "").trim();
    const phoneRegex = /^(?:\+91|0)?([6-9]\d{9})$/;
    const phoneMatch = normalizedMobile.match(phoneRegex);
    if (phoneMatch) {
      normalizedMobile = phoneMatch[1];
    }

    const Model = getModelByRole(role);
    if (!Model) return res.status(400).json({ message: "Invalid role" });

    const query =
      role === "Seller"
        ? { "phoneNumbers.value": normalizedMobile }
        : { mobile: normalizedMobile };

    const user = await Model.findOne(query);
    if (!user) return res.status(404).json({ message: "User not found" });

    const email = getEmailByRole(user, role);
    if (!email) {
      return res.status(400).json({
        message: "No email address found for your account.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    const templatePath = path.join(__dirname, "../templates/otp-email.html");
    let emailTemplate;
    try {
      emailTemplate = await fs.readFile(templatePath, "utf8");
    } catch (readError) {
      return res
        .status(500)
        .json({ message: "Failed to load email template." });
    }

    emailTemplate = emailTemplate.replace("{{otp}}", otp);
    emailTemplate = emailTemplate.replace("{{year}}", new Date().getFullYear());

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Change Password OTP - Hansaria Food Private Limited",
      html: emailTemplate,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "OTP sent to your registered email address" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { mobile, role, otp, newPassword } = req.body;
    let normalizedMobile = String(mobile || "").trim();
    const phoneRegex = /^(?:\+91|0)?([6-9]\d{9})$/;
    const phoneMatch = normalizedMobile.match(phoneRegex);
    if (phoneMatch) {
      normalizedMobile = phoneMatch[1];
    }

    const Model = getModelByRole(role);
    if (!Model) return res.status(400).json({ message: "Invalid role" });

    const query =
      role === "Seller"
        ? { "phoneNumbers.value": normalizedMobile }
        : { mobile: normalizedMobile };

    const user = await Model.findOne(query);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.otp || user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/admin/login", async (req, res) => {
  try {
    const { mobile, password } = req.body;
    let normalizedMobile = String(mobile || "").trim();
    const phoneRegex = /^(?:\+91|0)?([6-9]\d{9})$/;
    const phoneMatch = normalizedMobile.match(phoneRegex);
    if (phoneMatch) {
      normalizedMobile = phoneMatch[1];
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }
    const user = await User.findOne({
      role: "Admin",
      mobile: normalizedMobile,
    });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    let isPasswordValid = false;
    if (user.password.startsWith("$2")) {
      isPasswordValid = await user.comparePassword(password);
    } else {
      if (user.password === password) {
        isPasswordValid = true;
        user.password = password;
        await user.save();
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        role: "Admin",
        mobile: normalizedMobile,
        name: user.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      role: "Admin",
      mobile: normalizedMobile,
      name: user.name,
      user: {
        id: user._id,
        name: user.name,
        role: "Admin",
        mobile: normalizedMobile,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/employees/login", async (req, res) => {
  try {
    const { mobile, password } = req.body;
    let normalizedMobile = String(mobile || "").trim();
    const phoneRegex = /^(?:\+91|0)?([6-9]\d{9})$/;
    const phoneMatch = normalizedMobile.match(phoneRegex);
    if (phoneMatch) {
      normalizedMobile = phoneMatch[1];
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }
    const employee = await Employee.findOne({
      mobile: normalizedMobile,
    });
    if (!employee) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (employee.status === "Inactive") {
      return res.status(403).json({ message: "Your account is inactive." });
    }

    let isPasswordValid = false;
    if (employee.password.startsWith("$2")) {
      isPasswordValid = await employee.comparePassword(password);
    } else {
      if (employee.password === password) {
        isPasswordValid = true;
        employee.password = password;
        await employee.save();
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        sub: employee._id.toString(),
        role: "Employee",
        mobile: normalizedMobile,
        name: employee.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      role: "Employee",
      mobile: normalizedMobile,
      name: employee.name,
      user: {
        id: employee._id,
        name: employee.name,
        role: "Employee",
        mobile: normalizedMobile,
        email: employee.email || "",
        employeeId: employee.employeeId || "",
        sex: employee.sex || "",
        status: employee.status || "Active",
        allowedPermissions: employee.allowedPermissions || [],
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/transporters/login", async (req, res) => {
  try {
    const { mobile, password } = req.body;
    let normalizedMobile = String(mobile || "").trim();
    const phoneRegex = /^(?:\+91|0)?([6-9]\d{9})$/;
    const phoneMatch = normalizedMobile.match(phoneRegex);
    if (phoneMatch) {
      normalizedMobile = phoneMatch[1];
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }
    const transporter = await Transporter.findOne({
      mobile: normalizedMobile,
    });
    if (!transporter) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (transporter.status === "Inactive") {
      return res.status(403).json({ message: "Your account is inactive." });
    }

    let isPasswordValid = false;
    if (transporter.password.startsWith("$2")) {
      isPasswordValid = await transporter.comparePassword(password);
    } else {
      if (transporter.password === password) {
        isPasswordValid = true;
        transporter.password = password;
        await transporter.save();
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        sub: transporter._id.toString(),
        role: "Transporter",
        mobile: normalizedMobile,
        name: transporter.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      role: "Transporter",
      mobile: normalizedMobile,
      name: transporter.name,
      user: {
        id: transporter._id,
        name: transporter.name,
        role: "Transporter",
        mobile: normalizedMobile,
        email: transporter.email || "",
        vehicleDetails: transporter.vehicleDetails || {},
        status: transporter.status || "Active",
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/buyers/login", async (req, res) => {
  try {
    const { mobile, password } = req.body;
    let normalizedMobile = String(mobile || "").trim();
    const phoneRegex = /^(?:\+91|0)?([6-9]\d{9})$/;
    const phoneMatch = normalizedMobile.match(phoneRegex);
    if (phoneMatch) {
      normalizedMobile = phoneMatch[1];
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Server configuration error" });
    }

    if (!normalizedMobile || !password) {
      return res
        .status(400)
        .json({ message: "Mobile and password are required" });
    }

    const buyer = await Buyer.findOne({
      mobile: normalizedMobile,
    }).populate("companyIds", "companyName");

    if (!buyer) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    let isPasswordValid = false;
    if (buyer.password.startsWith("$2")) {
      isPasswordValid = await buyer.comparePassword(password);
    } else {
      if (buyer.password === password) {
        isPasswordValid = true;
        buyer.password = password;
        await buyer.save();
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (buyer.status === "Inactive") {
      return res
        .status(403)
        .json({ message: "Your account is inactive. Please contact support." });
    }

    const token = jwt.sign(
      {
        sub: buyer._id.toString(),
        role: "Buyer",
        mobile: normalizedMobile,
        name: buyer.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      role: "Buyer",
      mobile: normalizedMobile,
      name: buyer.name,
      user: {
        id: buyer._id,
        name: buyer.name,
        role: "Buyer",
        mobile: normalizedMobile,
        email: buyer.email || [],
        status: buyer.status || "Active",
        companyIds: (buyer.companyIds || []).map((c) => c._id || c),
        companyNames: (buyer.companyIds || []).map((c) => c.companyName || ""),
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/sellers/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    let normalizedPhone = String(phone || "").trim();
    const phoneRegex = /^(?:\+91|0)?([6-9]\d{9})$/;
    const phoneMatch = normalizedPhone.match(phoneRegex);
    if (phoneMatch) {
      normalizedPhone = phoneMatch[1];
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Server configuration error" });
    }

    if (!normalizedPhone || !password) {
      return res
        .status(400)
        .json({ message: "Phone and password are required" });
    }

    const seller = await Seller.findOne({
      "phoneNumbers.value": normalizedPhone,
    });

    if (!seller) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    let isPasswordValid = false;
    if (seller.password.startsWith("$2")) {
      isPasswordValid = await seller.comparePassword(password);
    } else {
      if (seller.password === password) {
        isPasswordValid = true;
        seller.password = password;
        await seller.save();
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (seller.status === "inactive") {
      return res.status(403).json({ message: "Your account is inactive." });
    }

    const token = jwt.sign(
      {
        sub: seller._id.toString(),
        role: "Seller",
        mobile: normalizedPhone,
        name: seller.sellerName,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      role: "Seller",
      mobile: normalizedPhone,
      name: seller.sellerName,
      user: {
        id: seller._id,
        name: seller.sellerName,
        role: "Seller",
        mobile: normalizedPhone,
        emails: seller.emails || [],
        status: seller.status || "active",
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
