import express from "express";
import ExpenseRequest from "../models/ExpenseRequest.js";
import authJwt from "../middleware/authJwt.js";
import { adminOnly, employeeOrAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

// @desc    Get all expense requests (Admin sees all, Employee sees own)
// @route   GET /api/expense-requests
// @access  Private
router.get("/", authJwt, employeeOrAdmin, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== "Admin") {
      query.employee = req.user.id || req.user._id;
    }

    const requests = await ExpenseRequest.find(query)
      .populate("category", "name")
      .populate("employee", "name email")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a new expense request
// @route   POST /api/expense-requests
// @access  Private/Employee
router.post("/", authJwt, employeeOrAdmin, async (req, res) => {
  const { category, amount, description } = req.body;

  if (!category || !amount) {
    return res.status(400).json({ message: "Category and amount are required" });
  }

  try {
    const request = await ExpenseRequest.create({
      category,
      amount,
      description,
      employee: req.user.id || req.user._id,
    });

    res.status(201).json(request);
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
      request.approvedBy = req.user.id || req.user._id;
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
