import express from "express";
import ExpenseRequest from "../models/ExpenseRequest.js";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import Seller from "../models/Seller.js";
import authJwt from "../middleware/authJwt.js";
import { adminOnly, employeeOrAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/employees", authJwt, adminOnly, async (req, res) => {
  try {
    const employeeIds = await ExpenseRequest.distinct("employee", {
      employeeModel: "Employee",
    });
    const adminIds = await ExpenseRequest.distinct("employee", {
      employeeModel: "User",
    });

    const [employees, admins] = await Promise.all([
      Employee.find({ _id: { $in: employeeIds } }, "name email"),
      User.find({ _id: { $in: adminIds } }, "name email"),
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
      .populate("lineItems.category", "name")
      .populate("employee", "name email")
      .populate("seller", "sellerName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ExpenseRequest.countDocuments(query);

    res.json({
      requests,
      total,
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
            const amount = Number(item.amount);
            if (!item.category || !Number.isFinite(amount) || amount <= 0) {
              throw new Error(
                "Each expense item must have a category and an amount greater than zero",
              );
            }
            return {
              category: item.category,
              description: item.description || "",
              amount,
            };
          });

          return {
            seller: seller._id,
            sellerName: seller.sellerName,
            sellerCompany: selectedCompany,
            receivedFrom: expense.receivedFrom,
            description: expense.description || "",
            lineItems,
            category: lineItems[0].category,
            amount:
              Math.round(
                lineItems.reduce((total, item) => total + item.amount, 0) * 100,
              ) / 100,
            employee: userId,
            employeeModel,
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
        });
      }),
    );

    res.status(201).json(createdRequests);
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
