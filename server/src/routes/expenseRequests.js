import express from "express";
import mongoose from "mongoose";
import ExpenseRequest from "../models/ExpenseRequest.js";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import Seller from "../models/Seller.js";
import authJwt from "../middleware/authJwt.js";
import {
  adminOnly,
  employeeOrAdmin,
  expenseManager,
  hasExpenseManagementPermission,
} from "../middleware/roleMiddleware.js";

const router = express.Router();
const INDIA_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const getFinancialYearStart = (date) => {
  const indiaDate = new Date(date.getTime() + INDIA_OFFSET_MS);
  return indiaDate.getUTCMonth() >= 3
    ? indiaDate.getUTCFullYear()
    : indiaDate.getUTCFullYear() - 1;
};

const getOptionalDetail = (value) => {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string") {
    throw new Error("Additional expense details must be text");
  }
  const detail = value.trim();
  if (detail.length > 100) {
    throw new Error("Additional expense details must be 100 characters or fewer");
  }
  return detail;
};

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
    const quantity = item.quantity === undefined ? 1 : Number(item.quantity);
    const amountCents = Math.round(rawAmount * 100);
    const lineTotalCents = Math.round(quantity * amountCents);
    if (
      !item.category ||
      !Number.isFinite(rawAmount) ||
      !Number.isSafeInteger(amountCents) ||
      amountCents <= 0 ||
      !Number.isFinite(quantity) ||
      quantity < 0.01 ||
      !Number.isSafeInteger(lineTotalCents)
    ) {
      throw new Error(
        "Each expense item must have a category, quantity, and amount greater than zero",
      );
    }
    return {
      category: item.category,
      description: item.description || "",
      quantity,
      amount: amountCents / 100,
      lineTotalCents,
    };
  });
  const totalCents = lineItems.reduce(
    (total, item) => total + item.lineTotalCents,
    0,
  );
  if (!Number.isSafeInteger(totalCents)) {
    throw new Error("Expense total is too large");
  }
  const preparedLineItems = lineItems.map(({ lineTotalCents, ...item }) => item);

  return {
    seller: seller._id,
    sellerName: seller.sellerName,
    sellerCompany: selectedCompany,
    receivedFrom: expense.receivedFrom,
    description: expense.description || "",
    transportDetails: {
      rejectedLorryNo: getOptionalDetail(expense.rejectedLorryNo),
      loading: getOptionalDetail(expense.loading),
      unloading: getOptionalDetail(expense.unloading),
      balance: getOptionalDetail(expense.balance),
      netWeight: getOptionalDetail(expense.netWeight),
      newLorryNo: getOptionalDetail(expense.newLorryNo),
      newWeight: getOptionalDetail(expense.newWeight),
      challanWeight: getOptionalDetail(expense.challanWeight),
    },
    lineItems: preparedLineItems,
    category: preparedLineItems[0].category,
    amount: totalCents / 100,
  };
};

router.get("/employees", authJwt, expenseManager, async (req, res) => {
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

router.get("/approvers", authJwt, expenseManager, async (req, res) => {
  try {
    const admins = await User.find({ role: "Admin" }, "name email mobile phone")
      .sort({ name: 1 })
      .lean();
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const getAssignedApprover = async (approverId) => {
  if (!mongoose.isValidObjectId(approverId)) {
    throw new Error("Select an Admin approver for every expense");
  }
  const approver = await User.findOne({ _id: approverId, role: "Admin" }).select("_id");
  if (!approver) {
    throw new Error("Selected approver is not an Admin or was not found");
  }
  return approver._id;
};

router.get("/analytics", authJwt, employeeOrAdmin, async (req, res) => {
  try {
    const now = new Date();
    const year = Number(req.query.year ?? now.getFullYear());
    const month = Number(req.query.month ?? now.getMonth() + 1);
    if (!Number.isInteger(year) || year < 1900 || year > now.getFullYear()) {
      return res.status(400).json({ message: "Invalid expense year" });
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return res.status(400).json({ message: "Invalid expense month" });
    }

    const query = {
      createdAt: {
        $gte: new Date(Date.UTC(year, 0, 1) - INDIA_OFFSET_MS),
        $lt: new Date(Date.UTC(year + 1, 0, 1) - INDIA_OFFSET_MS),
      },
    };
    if (!hasExpenseManagementPermission(req)) {
      query.employee = new mongoose.Types.ObjectId(req.user.sub);
    } else if (req.query.employeeId) {
      if (!mongoose.isValidObjectId(req.query.employeeId)) {
        return res.status(400).json({ message: "Invalid employee filter" });
      }
      query.employee = new mongoose.Types.ObjectId(req.query.employeeId);
    }

    const monthQuery = {
      ...query,
      createdAt: {
        $gte: new Date(Date.UTC(year, month - 1, 1) - INDIA_OFFSET_MS),
        $lt: new Date(Date.UTC(year, month, 1) - INDIA_OFFSET_MS),
      },
    };
    const annualQuery = {
      ...query,
      createdAt: {
        $gte: new Date(Date.UTC(year - 5, 0, 1) - INDIA_OFFSET_MS),
        $lt: new Date(Date.UTC(year + 1, 0, 1) - INDIA_OFFSET_MS),
      },
    };
    const expenseSort = String(req.query.expenseSort || "amount-desc");
    const expenseSortOptions = {
      "amount-desc": { amount: -1, createdAt: -1 },
      "amount-asc": { amount: 1, createdAt: -1 },
      "date-desc": { createdAt: -1 },
      "date-asc": { createdAt: 1 },
    };
    if (!expenseSortOptions[expenseSort]) {
      return res.status(400).json({ message: "Invalid expense sort order" });
    }

    const [monthly, yearly, daily, employees, totals, recentExpenses] =
      await Promise.all([
        ExpenseRequest.aggregate([
          { $match: query },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%m",
                  date: "$createdAt",
                  timezone: "Asia/Kolkata",
                },
              },
              amount: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        ExpenseRequest.aggregate([
          { $match: annualQuery },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y",
                  date: "$createdAt",
                  timezone: "Asia/Kolkata",
                },
              },
              amount: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        ExpenseRequest.aggregate([
          { $match: monthQuery },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$createdAt",
                  timezone: "Asia/Kolkata",
                },
              },
              amount: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        req.user.role === "Admin"
          ? ExpenseRequest.aggregate([
              { $match: query },
              {
                $group: {
                  _id: {
                    employee: "$employee",
                    model: "$employeeModel",
                  },
                  amount: { $sum: "$amount" },
                  count: { $sum: 1 },
                },
              },
              {
                $lookup: {
                  from: "employees",
                  localField: "_id.employee",
                  foreignField: "_id",
                  as: "employeeRecord",
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "_id.employee",
                  foreignField: "_id",
                  as: "userRecord",
                },
              },
              {
                $project: {
                  _id: 0,
                  employeeId: "$_id.employee",
                  name: {
                    $ifNull: [
                      { $arrayElemAt: ["$employeeRecord.name", 0] },
                      {
                        $ifNull: [
                          { $arrayElemAt: ["$userRecord.name", 0] },
                          "Unknown employee",
                        ],
                      },
                    ],
                  },
                  amount: 1,
                  count: 1,
                },
              },
              { $sort: { amount: -1, name: 1 } },
            ])
          : Promise.resolve([]),
        ExpenseRequest.aggregate([
          { $match: query },
          {
            $group: {
              _id: null,
              amount: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
        ]),
        ExpenseRequest.find(monthQuery)
          .populate("category", "name")
          .populate("lineItems.category", "name")
          .populate("employee", "name")
          .populate("seller", "sellerName")
          .sort(expenseSortOptions[expenseSort])
          .limit(50)
          .lean(),
      ]);

    res.json({
      year,
      month,
      totalAmount: totals[0]?.amount || 0,
      totalCount: totals[0]?.count || 0,
      yearly,
      monthly,
      daily,
      employees,
      recentExpenses,
    });
  } catch (error) {
    console.error("Expense analytics error:", error);
    res.status(500).json({ message: "Failed to fetch expense analytics" });
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
      financialYear,
      status,
    } = req.query;
    let query = {};
    if (!hasExpenseManagementPermission(req)) {
      query.employee = new mongoose.Types.ObjectId(req.user.sub);
    } else if (employeeId) {
      if (!mongoose.isValidObjectId(employeeId)) {
        return res.status(400).json({ message: "Invalid employee filter" });
      }
      query.employee = new mongoose.Types.ObjectId(employeeId);
    }

    if (status) query.status = status;
    if (financialYear !== undefined && financialYear !== "") {
      const startYear = Number(financialYear);
      const currentFinancialYear = getFinancialYearStart(new Date());
      if (
        !Number.isInteger(startYear) ||
        startYear < 1900 ||
        startYear > currentFinancialYear
      ) {
        return res.status(400).json({ message: "Invalid financial year filter" });
      }

      query.createdAt = {
        $gte: new Date(Date.UTC(startYear, 3, 1) - INDIA_OFFSET_MS),
        $lt: new Date(Date.UTC(startYear + 1, 3, 1) - INDIA_OFFSET_MS),
      };
    }
    if (startDate || endDate) {
      query.createdAt = { ...query.createdAt };
      if (startDate) {
        const start = new Date(startDate);
        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({ message: "Invalid start date filter" });
        }
        query.createdAt.$gte = query.createdAt.$gte
          ? new Date(Math.max(start.getTime(), query.createdAt.$gte.getTime()))
          : start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({ message: "Invalid end date filter" });
        }
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = query.createdAt.$lte
          ? new Date(Math.min(end.getTime(), query.createdAt.$lte.getTime()))
          : end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const requests = await ExpenseRequest.find(query)
      .populate("category", "name")
      .populate("lineItems.category", "name")
      .populate("employee", "name email mobile phone")
      .populate("createdBy", "name email")
      .populate("assignedApprover", "name email")
      .populate("approvedBy", "name")
      .populate("rejectedBy", "name")
      .populate("seller", "sellerName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const [total, amountResult, earliestRequest] = await Promise.all([
      ExpenseRequest.countDocuments(query),
      ExpenseRequest.aggregate([
        { $match: query },
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
      ]),
      ExpenseRequest.findOne(
        req.user.role === "Admin" && !employeeId
          ? {}
          : { employee: query.employee },
      )
        .sort({ createdAt: 1 })
        .select("createdAt")
        .lean(),
    ]);
    const currentFinancialYear = getFinancialYearStart(new Date());
    const earliestFinancialYear = earliestRequest
      ? getFinancialYearStart(new Date(earliestRequest.createdAt))
      : currentFinancialYear;
    const financialYears = [];
    for (let year = currentFinancialYear; year >= earliestFinancialYear; year -= 1) {
      financialYears.push(year);
    }

    res.json({
      requests,
      total,
      totalAmount: amountResult[0]?.totalAmount || 0,
      financialYears,
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
    const canManageExpenses = hasExpenseManagementPermission(req);
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

          if (canManageExpenses) {
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
            ...(canManageExpenses
              ? { assignedApprover: await getAssignedApprover(expense.assignedApproverId) }
              : {}),
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
        ...(canManageExpenses
          ? {
              assignedApprover: await getAssignedApprover(
                req.body.assignedApproverId,
              ),
            }
          : {}),
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
          ...(canManageExpenses
            ? {
                assignedApprover: await getAssignedApprover(
                  item.assignedApproverId,
                ),
              }
            : {}),
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

    const canManageExpenses = hasExpenseManagementPermission(req);
    if (!canManageExpenses) {
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
    if (canManageExpenses) {
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
      const selectedApprover = await getAssignedApprover(
        expense.assignedApproverId,
      );
      if (
        request.assignedApprover &&
        String(request.assignedApprover) !== String(selectedApprover) &&
        String(request.assignedApprover) !== String(req.user.sub)
      ) {
        return res.status(403).json({
          message: "Only the assigned Admin can reassign this expense",
        });
      }
      request.assignedApprover = selectedApprover;
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
      if (
        request.assignedApprover &&
        String(request.assignedApprover) !== String(req.user.sub)
      ) {
        return res.status(403).json({
          message: "Only the assigned Admin can approve or reject this expense",
        });
      }
      request.status = status;
      if (status === "approved") {
        request.approvedBy = req.user.sub;
        request.rejectedBy = undefined;
        request.rejectionReason = undefined;
      } else {
        request.rejectedBy = req.user.sub;
        request.approvedBy = undefined;
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
