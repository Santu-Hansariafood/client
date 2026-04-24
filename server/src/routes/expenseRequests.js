import express from "express";
import ExpenseRequest from "../models/ExpenseRequest.js";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import authJwt from "../middleware/authJwt.js";
import { adminOnly, employeeOrAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

// @desc    Get all unique employees who have submitted expense requests
// @route   GET /api/expense-requests/employees
// @access  Private/Admin
router.get("/employees", authJwt, adminOnly, async (req, res) => {
  try {
    // Get unique employees from both User and Employee collections who have submitted requests
    const employeeIds = await ExpenseRequest.distinct("employee", { employeeModel: "Employee" });
    const adminIds = await ExpenseRequest.distinct("employee", { employeeModel: "User" });

    const [employees, admins] = await Promise.all([
      Employee.find({ _id: { $in: employeeIds } }, "name email"),
      User.find({ _id: { $in: adminIds } }, "name email")
    ]);

    const combined = [...employees, ...admins];
    res.json(combined);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all expense requests (Admin sees all with filters, Employee sees own)
// @route   GET /api/expense-requests
// @access  Private
router.get("/", authJwt, employeeOrAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, employeeId, startDate, endDate, status } = req.query;
    let query = {};
    if (req.user.role !== "Admin") {
      query.employee = req.user.sub;
    } else if (employeeId) {
      query.employee = employeeId;
    }

    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const requests = await ExpenseRequest.find(query)
      .populate("category", "name")
      .populate("employee", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ExpenseRequest.countDocuments(query);

    res.json({
      requests,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create new expense request(s)
// @route   POST /api/expense-requests
// @access  Private/Employee
router.post("/", authJwt, employeeOrAdmin, async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.user.sub;
    const userRole = req.user.role;
    const employeeModel = userRole === "Admin" ? "User" : "Employee";

    if (!items || !Array.isArray(items) || items.length === 0) {
      const { category, amount, description } = req.body;
      if (!category || !amount) {
        return res.status(400).json({ message: "Category and amount are required" });
      }
      const request = await ExpenseRequest.create({
        category,
        amount,
        description,
        employee: userId,
        employeeModel
      });
      return res.status(201).json(request);
    }

    const createdRequests = await Promise.all(
      items.map(async (item) => {
        if (!item.category || !item.amount) {
          throw new Error("Category and amount are required for all items");
        }
        return await ExpenseRequest.create({
          ...item,
          employee: userId,
          employeeModel
        });
      })
    );

    res.status(201).json(createdRequests);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Update expense request status (Approve/Reject)
// @route   PUT /api/expense-requests/:id/status
// @access  Private/Admin
router.put("/:id/status", authJwt, adminOnly, async (req, res) => {
  const { status, rejectionReason } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const request = await ExpenseRequest.findById(req.params.id);

    if (request) {
      request.status = status;
      request.approvedBy = req.user.sub;
      if (status === "rejected") {
        request.rejectionReason = rejectionReason;
      }
      const updatedRequest = await request.save();
      res.json(updatedRequest);
    } else {
      res.status(404).json({ message: "Request not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
