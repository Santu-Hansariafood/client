import express from "express";
import mongoose from "mongoose";
import ExpenseRequest from "../models/ExpenseRequest.js";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import Seller from "../models/Seller.js";
import authJwt from "../middleware/authJwt.js";
import { adminOnly, employeeOrAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

const prepareExpenseData = async (expense) => {
  if (
    !expense.seller ||
    !expense.sellerCompany ||
    !["Seller", "Office"].includes(expense.receivedFrom) ||
    !Array.isArray(expense.items) ||
    expense.items.length === 0
  ) {
    throw new Error(
      "Seller, seller company, received-from source, and at least one item are required",
    );
  }

  const seller = await Seller.findById(expense.seller).select(
    "sellerName companies",
  );
  if (!seller) {
    throw new Error("Selected seller was not found");
  }
  const selectedCompany = seller.companies.find(
    (company) =>
      company.trim().toLowerCase() ===
      String(expense.sellerCompany).trim().toLowerCase(),
  );
  if (!selectedCompany) {
    throw new Error("Selected company does not belong to this seller");
  }

  const lineItems = expense.items.map((item) => {
    const rawAmount = Number(item.amount);
    const amountCents = Math.round(rawAmount * 100);
    if (
      !item.category ||
      !Number.isFinite(rawAmount) ||
      !Number.isSafeInteger(amountCents) ||
      amountCents <= 0
    ) {
      throw new Error(
        "Each expense item must have a category and an amount greater than zero",
      );
    }
    return {
      category: item.category,
      description: item.description || "",
      amount: amountCents / 100,
    };
  });
  const totalCents = lineItems.reduce(
    (total, item) => total + Math.round(item.amount * 100),
    0,
  );
  if (!Number.isSafeInteger(totalCents)) {
    throw new Error("Expense total is too large");
  }

  return {
    seller: seller._id,
    sellerName: seller.sellerName,
    sellerCompany: selectedCompany,
    receivedFrom: expense.receivedFrom,
    description: expense.description || "",
    lineItems,
    category: lineItems[0].category,
    amount: totalCents / 100,
  };
};

router.get("/employees", authJwt, adminOnly, async (req, res) => {
  try {
    const adminIds = await ExpenseRequest.distinct("employee", {
      employeeModel: "User",
    });

    const [employees, admins] = await Promise.all([
      Employee.find({}, "name employeeId email mobile status").sort({ name: 1 }),
      User.find({ _id: { $in: adminIds } }, "name email mobile phone"),
    ]);

    const combined = [...employees, ...admins];
    res.json(combined);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", authJwt, employeeOrAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      employeeId,
      startDate,
      endDate,
      status,
    } = req.query;
    let query = {};
    if (req.user.role !== "Admin") {
      query.employee = new mongoose.Types.ObjectId(req.user.sub);
    } else if (employeeId) {
      if (!mongoose.isValidObjectId(employeeId)) {
        return res.status(400).json({ message: "Invalid employee filter" });
      }
      query.employee = new mongoose.Types.ObjectId(employeeId);
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
      .populate("lineItems.category", "name")
      .populate("employee", "name email mobile phone")
      .populate("createdBy", "name email")
      .populate("seller", "sellerName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const [total, amountResult] = await Promise.all([
      ExpenseRequest.countDocuments(query),
      ExpenseRequest.aggregate([
        { $match: query },
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
      ]),
    ]);

    res.json({
      requests,
      total,
      totalAmount: amountResult[0]?.totalAmount || 0,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", authJwt, employeeOrAdmin, async (req, res) => {
  try {
    const userId = req.user.sub;
    const userRole = req.user.role;
    const employeeModel = userRole === "Admin" ? "User" : "Employee";

    if (Array.isArray(req.body.expenses)) {
      if (req.body.expenses.length === 0) {
        return res.status(400).json({ message: "Add at least one expense" });
      }

      const preparedExpenses = await Promise.all(
        req.body.expenses.map(async (expense) => {
          const expenseData = await prepareExpenseData(expense);
          let assignedEmployeeId = userId;
          let assignedEmployeeModel = employeeModel;

          if (userRole === "Admin") {
            if (!expense.employeeId) {
              throw new Error("Select an employee for every expense");
            }
            const assignedEmployee = await Employee.findOne({
              _id: expense.employeeId,
              status: "Active",
            }).select("_id");
            if (!assignedEmployee) {
              throw new Error("Selected employee is not active or was not found");
            }
            assignedEmployeeId = assignedEmployee._id;
            assignedEmployeeModel = "Employee";
          }
          return {
            ...expenseData,
            employee: assignedEmployeeId,
            employeeModel: assignedEmployeeModel,
            createdBy: userId,
            createdByModel: userRole === "Admin" ? "User" : "Employee",
          };
        }),
      );

      const createdRequests = await ExpenseRequest.create(preparedExpenses);
      return res.status(201).json(createdRequests);
    }

    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      const { category, amount, description } = req.body;
      if (!category || !amount) {
        return res
          .status(400)
          .json({ message: "Category and amount are required" });
      }
      const request = await ExpenseRequest.create({
        category,
        amount,
        description,
        employee: userId,
        employeeModel,
        createdBy: userId,
        createdByModel: userRole === "Admin" ? "User" : "Employee",
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
          employeeModel,
          createdBy: userId,
          createdByModel: userRole === "Admin" ? "User" : "Employee",
        });
      }),
    );

    res.status(201).json(createdRequests);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", authJwt, employeeOrAdmin, async (req, res) => {
  try {
    const request = await ExpenseRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const isAdmin = req.user.role === "Admin";
    if (!isAdmin) {
      const isAssignedEmployee =
        request.employeeModel === "Employee" &&
        String(request.employee) === String(req.user.sub);
      if (!isAssignedEmployee) {
        return res.status(403).json({ message: "You cannot edit this expense" });
      }
      if (request.status !== "pending") {
        return res
          .status(403)
          .json({ message: "Only pending expenses can be edited by employees" });
      }
    }

    const expense = req.body.expense;
    if (!expense) {
      return res.status(400).json({ message: "Expense details are required" });
    }

    const expenseData = await prepareExpenseData(expense);
    if (isAdmin) {
      if (!expense.employeeId) {
        return res.status(400).json({ message: "Select an employee" });
      }
      const assignedEmployee = await Employee.findOne({
        _id: expense.employeeId,
        status: "Active",
      }).select("_id");
      if (!assignedEmployee) {
        return res
          .status(400)
          .json({ message: "Selected employee is not active or was not found" });
      }
      request.employee = assignedEmployee._id;
      request.employeeModel = "Employee";
    }

    request.set(expenseData);
    const updatedRequest = await request.save();
    res.json(updatedRequest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

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
