import { Router } from "express";
import mongoose from "mongoose";
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import LoadingEntry from "../models/LoadingEntry.js";
import Counter from "../models/Counter.js";
import Buyer from "../models/Buyer.js";
import Group from "../models/Group.js";
import Seller from "../models/Seller.js";
import SelfOrder from "../models/SelfOrder.js";
import Transporter from "../models/Transporter.js";
import SellerCompany from "../models/SellerCompany.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : null;

const numberToWords = (num) => {
  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const n = ("0000000" + Math.floor(num))
    .substr(-7)
    .match(/^(\d{2})(\d{2})(\d{2})(\d{1})$/);
  if (!n) return "";
  let str = "";
  str +=
    n[1] != 0
      ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + "Lakh "
      : "";
  str +=
    n[2] != 0
      ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + "Thousand "
      : "";
  str +=
    n[3] != 0
      ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + "Hundred "
      : "";
  str +=
    n[4] != 0
      ? (str != "" ? "and " : "") +
        (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]])
      : "";

  const fractional = Math.round((num % 1) * 100);
  if (fractional > 0) {
    str +=
      "and " +
      (a[fractional] ||
        b[Math.floor(fractional / 10)] + " " + a[fractional % 10]) +
      "Paise ";
  }
  return str + "Only";
};

const getNextLoadingNo = async (loadingDate) => {
  const date = new Date(loadingDate);
  const year = date.getFullYear();
  const month = date.getMonth();

  let fiscalYear = month >= 3 ? year : year - 1;

  const isLegacy = fiscalYear < 2027;
  const sequenceId = isLegacy
    ? "loadingNo_Legacy"
    : `loadingNo_FY${fiscalYear}`;

  const startVal = isLegacy ? 2690 : 1;

  let counter = await Counter.findOneAndUpdate(
    { id: sequenceId },
    { $inc: { seq: 1 } },
    { new: true },
  );

  if (!counter) {
    try {
      counter = await Counter.create({ id: sequenceId, seq: startVal });
    } catch (err) {
      counter = await Counter.findOneAndUpdate(
        { id: sequenceId },
        { $inc: { seq: 1 } },
        { new: true },
      );
    }
  }

  return counter.seq;
};

const getSellerBrokerage = async (supplierId, commodityName) => {
  if (!supplierId || !commodityName) return 0;
  try {
    const seller = await Seller.findById(supplierId);
    if (!seller || !seller.commodities) return 0;
    const commodity = seller.commodities.find(
      (c) => c.name.toLowerCase() === commodityName.toLowerCase(),
    );
    return commodity ? commodity.brokerage : 0;
  } catch (error) {
    console.error("Error fetching seller brokerage:", error);
    return 0;
  }
};

const computePendingForSelfOrder = (order) => {
  const quantity = Number(order.quantity || 0);
  let pendingQuantity = order.pendingQuantity;

  if (
    (pendingQuantity === undefined ||
      pendingQuantity === null ||
      (pendingQuantity === 0 && order.status === "active")) &&
    order.status !== "closed"
  ) {
    pendingQuantity = quantity;
  } else {
    pendingQuantity = Number(pendingQuantity || 0);
  }

  const isClosed = false;

  return { pendingQuantity, isClosed };
};

router.get("/lorry-wise", async (req, res) => {
  try {
    const lorryNumber = (req.query.lorryNumber || "").trim();
    const status = (req.query.status || "all").trim();
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "10", 10);

    const andParts = [];

    if (lorryNumber) {
      andParts.push({
        lorryNumber: { $regex: new RegExp(escapeRegex(lorryNumber), "i") },
      });
    }

    if (status !== "all") {
      if (status === "received") {
        andParts.push({
          $or: [
            { unloadingWeight: { $gt: 0 } },
            { unloadingDate: { $exists: true, $ne: null } },
          ],
        });
      } else if (status === "transit") {
        andParts.push({
          $and: [
            {
              $or: [
                { unloadingWeight: { $lte: 0 } },
                { unloadingWeight: { $exists: false } },
              ],
            },
            {
              $or: [
                { unloadingDate: { $exists: false } },
                { unloadingDate: null },
              ],
            },
          ],
        });
      }
    }

    const finalQuery = andParts.length > 0 ? { $and: andParts } : {};

    const [items, total] = await Promise.all([
      LoadingEntry.find(finalQuery)
        .sort({ loadingNo: -1, loadingDate: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("supplier", "sellerName")
        .lean(),
      LoadingEntry.countDocuments(finalQuery),
    ]);

    res.json({
      data: items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Lorry wise loading error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/company-report", async (req, res) => {
  try {
    const { supplierCompany, buyerCompany, mobile } = req.query;
    if (!mobile || (!supplierCompany && !buyerCompany)) {
      return res
        .status(400)
        .json({ message: "Company name and mobile are required" });
    }

    let query = {};
    let companyDetails = null;

    if (supplierCompany) {
      const seller = await Seller.findOne({
        "phoneNumbers.value": { $regex: new RegExp(mobile + "$") },
      });

      if (!seller) {
        return res.status(404).json({ message: "Seller not found" });
      }

      query = {
        supplierCompany: {
          $regex: new RegExp(`^${escapeRegex(supplierCompany)}$`, "i"),
        },
        supplier: seller._id,
      };

      companyDetails = await mongoose
        .model("SellerCompany")
        .findOne({
          companyName: {
            $regex: new RegExp(`^${escapeRegex(supplierCompany)}$`, "i"),
          },
        })
        .lean();
    } else if (buyerCompany) {
      const buyer = await Buyer.findOne({
        mobile: { $regex: new RegExp(mobile + "$") },
      });

      if (!buyer) {
        // Fallback: check by name if mobile not found directly on buyer doc
        // (Assuming mobile is what we use to identify the user)
      }

      query = {
        buyerCompany: {
          $regex: new RegExp(`^${escapeRegex(buyerCompany)}$`, "i"),
        },
      };

      companyDetails = await mongoose
        .model("Company")
        .findOne({
          companyName: {
            $regex: new RegExp(`^${escapeRegex(buyerCompany)}$`, "i"),
          },
        })
        .lean();
    }

    const rawEntries = await LoadingEntry.find(query)
      .sort({ unloadingDate: -1, loadingDate: -1 })
      .lean();

    const entries = await Promise.all(
      rawEntries.map(async (entry) => {
        const selfOrder = await mongoose
          .model("SelfOrder")
          .findOne({ saudaNo: entry.saudaNo });
        let rate = 0;
        if (selfOrder) {
          if (supplierCompany) {
            rate = selfOrder.buyerBrokerage?.brokerageSupplier || 0;
            if (rate === 0 && selfOrder.supplier && selfOrder.commodity) {
              const sellerDoc = await Seller.findById(selfOrder.supplier);
              if (sellerDoc && sellerDoc.commodities) {
                const comm = sellerDoc.commodities.find(
                  (c) =>
                    c.name.toLowerCase() === selfOrder.commodity.toLowerCase(),
                );
                if (comm) rate = comm.brokerage;
              }
            }
          } else if (buyerCompany) {
            rate = selfOrder.buyerBrokerage?.brokerageBuyer || 0;
          }
        }

        if (rate > 0 && entry.unloadingWeight) {
          if (supplierCompany) {
            entry.sellerBrokerage = +(entry.unloadingWeight * rate).toFixed(2);
          } else {
            entry.buyerBrokerage = +(entry.unloadingWeight * rate).toFixed(2);
          }
        }
        return entry;
      }),
    );

    res.json({
      entries,
      company: companyDetails || {
        companyName: supplierCompany || buyerCompany,
      },
    });
  } catch (error) {
    console.error("Company report error:", error);
    res.status(500).json({ message: error.message });
  }
});

const getBrokerageReportData = async (query, skip = null, limit = null) => {
  const {
    type,
    search,
    buyerCompany,
    supplierCompany,
    startDate,
    endDate,
    ids,
  } = query;

  const match = {};

  if (ids && Array.isArray(ids) && ids.length > 0) {
    match._id = { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) };
  }

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i");
    match.$or = [
      { lorryNumber: searchRegex },
      { saudaNo: searchRegex },
      { billNumber: searchRegex },
      { buyerCompany: searchRegex },
      { supplierCompany: searchRegex },
      { commodity: searchRegex },
    ];
  }

  if (buyerCompany) {
    match.buyerCompany = { $regex: new RegExp(escapeRegex(buyerCompany), "i") };
  }
  if (supplierCompany) {
    match.supplierCompany = {
      $regex: new RegExp(escapeRegex(supplierCompany), "i"),
    };
  }

  if (startDate || endDate) {
    match.loadingDate = {};
    if (startDate) match.loadingDate.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      match.loadingDate.$lte = end;
    }
  }

  const pipeline = [
    { $match: match },
    { $sort: { saudaNo: 1 } },
  ];

  if (skip !== null) pipeline.push({ $skip: skip });
  if (limit !== null) pipeline.push({ $limit: limit });

  pipeline.push(
    {
      $lookup: {
        from: "selforders",
        localField: "saudaNo",
        foreignField: "saudaNo",
        as: "sauda",
      },
    },
    { $unwind: { path: "$sauda", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "sellers",
        localField: "supplier",
        foreignField: "_id",
        as: "sellerInfo",
      },
    },
    { $unwind: { path: "$sellerInfo", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "sellercompanies",
        localField: "supplierCompany",
        foreignField: "companyName",
        as: "sellerCompanyInfo",
      },
    },
    {
      $unwind: {
        path: "$sellerCompanyInfo",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        sellerAccount: { $ifNull: ["$sellerInfo.sellerName", "N/A"] },
        consignee: { $ifNull: ["$consignee", "$loadingFrom"] },
        place: { $ifNull: ["$loadingFrom", "$consignee"] },
        orderDate: { $ifNull: ["$sauda.poDate", "$loadingDate"] },
        brokerageRate: {
          $cond: {
            if: { $eq: [type, "buyer"] },
            then: { $ifNull: ["$sauda.buyerBrokerage.brokerageBuyer", 0] },
            else: {
              $let: {
                vars: {
                  saudaRate: {
                    $ifNull: ["$sauda.buyerBrokerage.brokerageSupplier", 0],
                  },
                  sellerCommodity: {
                    $filter: {
                      input: { $ifNull: ["$sellerInfo.commodities", []] },
                      as: "c",
                      cond: {
                        $eq: [
                          { $toLower: "$$c.name" },
                          { $toLower: "$commodity" },
                        ],
                      },
                    },
                  },
                },
                in: {
                  $cond: {
                    if: { $gt: ["$$saudaRate", 0] },
                    then: "$$saudaRate",
                    else: {
                      $ifNull: [
                        { $arrayElemAt: ["$$sellerCommodity.brokerage", 0] },
                        0,
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    {
      $addFields: {
        // Use loading weight if unloading weight is 0 or not present
        calculatedWeight: {
          $cond: {
            if: {
              $or: [
                { $eq: ["$unloadingWeight", null] },
                { $eq: ["$unloadingWeight", 0] },
                { $not: ["$unloadingWeight"] }
              ]
            },
            then: { $ifNull: ["$loadingWeight", 0] },
            else: { $ifNull: ["$unloadingWeight", 0] }
          }
        },
        totalBrokerage: {
          $multiply: [
            {
              $cond: {
                if: {
                  $or: [
                    { $eq: ["$unloadingWeight", null] },
                    { $eq: ["$unloadingWeight", 0] },
                    { $not: ["$unloadingWeight"] }
                  ]
                },
                then: { $ifNull: ["$loadingWeight", 0] },
                else: { $ifNull: ["$unloadingWeight", 0] }
              }
            },
            "$brokerageRate"
          ],
        },
      },
    },
  );

  return await LoadingEntry.aggregate(pipeline);
};

router.get("/brokerage-report", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      buyerCompany,
      supplierCompany,
      startDate,
      endDate,
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const pageSize = parseInt(limit);

    // Optimized: Count only the documents that match the filters first
    const match = {};
    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");
      match.$or = [
        { lorryNumber: searchRegex },
        { saudaNo: searchRegex },
        { billNumber: searchRegex },
        { buyerCompany: searchRegex },
        { supplierCompany: searchRegex },
        { commodity: searchRegex },
      ];
    }
    if (buyerCompany) {
      match.buyerCompany = {
        $regex: new RegExp(escapeRegex(buyerCompany), "i"),
      };
    }
    if (supplierCompany) {
      match.supplierCompany = {
        $regex: new RegExp(escapeRegex(supplierCompany), "i"),
      };
    }
    if (startDate || endDate) {
      match.loadingDate = {};
      if (startDate) match.loadingDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        match.loadingDate.$lte = end;
      }
    }

    const [total, data] = await Promise.all([
      LoadingEntry.countDocuments(match),
      getBrokerageReportData(req.query, skip, pageSize),
    ]);

    res.json({
      data,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Brokerage report error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/brokerage-report/excel", async (req, res) => {
  try {
    const { ids, type } = req.query;
    const queryParams = { ...req.query };
    if (ids && typeof ids === "string") {
      queryParams.ids = ids.split(",");
    }

    const data = await getBrokerageReportData(queryParams);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Brokerage Report");

    const isBuyerReport = type === "buyer";

    worksheet.columns = [
      { header: "SL No", key: "slNo", width: 8 },
      { header: "Order Date", key: "orderDate", width: 12 },
      { header: "Sauda No", key: "saudaNo", width: 15 },
      { header: "Bill No", key: "billNo", width: 15 },
      { header: "Lorry No", key: "lorryNo", width: 15 },
      {
        header: "Buyer Company",
        key: "buyerCompany",
        width: 30,
      },
      {
        header: "Seller Company",
        key: "sellerCompany",
        width: 30,
      },
      { header: "CONSIGNEE NAME", key: "consignee", width: 20 },
      { header: "Item", key: "item", width: 15 },
      { header: "Weight", key: "weight", width: 12 },
      { header: "Rate", key: "rate", width: 10 },
      { header: "Loading", key: "loading", width: 12 },
      { header: "Unloading", key: "unloading", width: 12 },
      { header: "Total Amount", key: "totalAmount", width: 15 },
    ];

    data.forEach((item, index) => {
      worksheet.addRow({
        slNo: index + 1,
        orderDate: item.orderDate
          ? new Date(item.orderDate).toLocaleDateString("en-GB")
          : "N/A",
        saudaNo: item.saudaNo || "N/A",
        billNo: item.billNumber || "N/A",
        lorryNo: item.lorryNumber || "N/A",
        buyerCompany: item.buyerCompany || "N/A",
        sellerCompany: item.supplierCompany || "N/A",
        consignee: item.consignee || item.place || "N/A",
        item: item.commodity || "N/A",
        weight: item.calculatedWeight || item.unloadingWeight || item.loadingWeight || 0,
        rate: item.brokerageRate || 0,
        loading: item.loadingWeight || 0,
        unloading: item.unloadingWeight || 0,
        totalAmount: item.totalBrokerage || 0,
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { horizontal: "center" };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" +
        `${isBuyerReport ? "Buyer" : "Seller"}_Brokerage_Report.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Brokerage excel export error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/brokerage-report/pdf", async (req, res) => {
  try {
    const { ids, type } = req.query;
    const queryParams = { ...req.query };
    if (ids && typeof ids === "string") {
      queryParams.ids = ids.split(",");
    }

    const data = await getBrokerageReportData(queryParams);

    if (data.length === 0) {
      return res.status(404).json({ message: "No data found for the report" });
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const logoPath = path.join(__dirname, "../assets/Hans.png");
    let logoBase64 = null;
    if (fs.existsSync(logoPath)) {
      logoBase64 = fs.readFileSync(logoPath, { encoding: "base64" });
    }

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const isBuyerReport = type === "buyer";

    const hansariaBankDetails = {
      accountHolderName: "HANSARIA FOOD PRIVATE LIMITED",
      bankName: "ICIC BANK",
      accountNumber: "627905015689",
      ifscCode: "ICIC0006279",
      branch: "BURRA BAZAR Branch",
    };

    const totalBrokerageAmount = data.reduce(
      (sum, item) => sum + (item.totalBrokerage || 0),
      0,
    );

    const qrCodeData = `Hansaria Food Private Limited\nBrokerage Amount: Rs. ${totalBrokerageAmount.toFixed(2)}\nBank: ${hansariaBankDetails.bankName}\nA/C: ${hansariaBankDetails.accountNumber}`;
    const qrCodeBase64 = await QRCode.toDataURL(qrCodeData);

    const drawTallyHeader = (doc) => {
      doc.setLineWidth(0.4);
      doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);

      // Add logo
      if (logoBase64) {
        doc.addImage(logoBase64, "PNG", margin + 5, margin + 2, 25, 25);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("HANSARIA FOOD PRIVATE LIMITED", pageWidth / 2, margin + 10, {
        align: "center",
      });

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(
        "207, Maharshi Debendra Road, 6th Floor, Room No. 111, Kolkata - 700007",
        pageWidth / 2,
        margin + 15,
        { align: "center" },
      );
      doc.text(
        "Contact: +91 98304 33535 | Email: info@hansariafood.com",
        pageWidth / 2,
        margin + 19,
        { align: "center" },
      );

      doc.setLineWidth(0.2);
      doc.line(margin, margin + 22, pageWidth - margin, margin + 22);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(
        `${type.toUpperCase()} BROKERAGE ADVICE`,
        pageWidth / 2,
        margin + 28,
        {
          align: "center",
        },
      );

      doc.line(margin, margin + 32, pageWidth - margin, margin + 32);

      doc.setFontSize(9);
      const partyName = isBuyerReport
        ? data[0].buyerCompany || "N/A"
        : data[0].supplierCompany || "N/A";

      doc.text(
        `Party Name: ${partyName.toUpperCase()}`,
        margin + 5,
        margin + 38,
      );
      doc.text(
        `Date: ${new Date().toLocaleDateString("en-GB")}`,
        pageWidth - margin - 5,
        margin + 38,
        { align: "right" },
      );

      doc.line(margin, margin + 42, pageWidth - margin, margin + 42);
    };

    drawTallyHeader(doc);

    const tableColumn = [
      "SL No",
      "Date",
      "Sauda No",
      "Bill No",
      "Lorry No",
      "Buyer Company",
      "Seller Company",
      "CONSIGNEE NAME",
      "Item",
      "Weight",
      "Rate",
      "Amount",
    ];

    const tableRows = data.map((item, index) => [
      index + 1,
      item.orderDate
        ? new Date(item.orderDate).toLocaleDateString("en-GB")
        : "N/A",
      item.saudaNo || "N/A",
      item.billNumber || "N/A",
      item.lorryNumber || "N/A",
      item.buyerCompany || "N/A",
      item.supplierCompany || "N/A",
      item.consignee || item.place || "N/A",
      item.commodity || "N/A",
      Number(item.calculatedWeight || item.unloadingWeight || item.loadingWeight || 0).toFixed(2),
      Number(item.brokerageRate || 0).toFixed(2),
      Number(item.totalBrokerage || 0).toFixed(2),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: margin + 45,
      theme: "grid",
      margin: { left: margin + 2, right: margin + 2 },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        valign: "middle",
        halign: "center",
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 10 },
        2: { halign: "left", cellWidth: 40 },
        3: { cellWidth: 20 },
        7: { halign: "right" },
      },
      didDrawPage: (d) => {
        if (d.pageNumber > 1) {
          doc.setLineWidth(0.4);
          doc.rect(
            margin,
            margin,
            pageWidth - 2 * margin,
            pageHeight - 2 * margin,
          );
        }
      },
    });

    let finalY = doc.lastAutoTable.finalY || 150;

    if (finalY > pageHeight - 80) {
      doc.addPage();
      doc.setLineWidth(0.4);
      doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);
      finalY = margin + 10;
    }

    doc.line(margin, finalY, pageWidth - margin, finalY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Total Amount (Brokerage):", pageWidth - margin - 50, finalY + 8, {
      align: "right",
    });
    doc.text(
      `Rs. ${totalBrokerageAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      pageWidth - margin - 5,
      finalY + 8,
      { align: "right" },
    );

    doc.line(margin, finalY + 12, pageWidth - margin, finalY + 12);

    doc.setFontSize(9);
    doc.text("Amount in Words:", margin + 5, finalY + 18);
    doc.setFont("helvetica", "normal");
    const words = numberToWords(totalBrokerageAmount);
    doc.text(words, margin + 5, finalY + 23, {
      maxWidth: pageWidth - 2 * margin - 10,
    });

    doc.line(margin, finalY + 30, pageWidth - margin, finalY + 30);

    doc.setFont("helvetica", "bold");
    doc.text(
      "Hansaria Food Private Limited Bank Details:",
      margin + 5,
      finalY + 36,
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      `Bank Name: ${hansariaBankDetails.bankName}`,
      margin + 5,
      finalY + 41,
    );
    doc.text(
      `A/C No: ${hansariaBankDetails.accountNumber}`,
      margin + 5,
      finalY + 45,
    );
    doc.text(
      `IFSC Code: ${hansariaBankDetails.ifscCode}`,
      margin + 5,
      finalY + 49,
    );
    doc.text(`Branch: ${hansariaBankDetails.branch}`, margin + 5, finalY + 53);

    if (qrCodeBase64) {
      doc.addImage(
        qrCodeBase64,
        "PNG",
        pageWidth - margin - 40,
        finalY + 33,
        25,
        25,
      );
      doc.setFontSize(7);
      doc.text(
        "Scan for Details",
        pageWidth - margin - 40 + 12.5,
        finalY + 60,
        {
          align: "center",
        },
      );
    }

    doc.line(margin, finalY + 65, pageWidth - margin, finalY + 65);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(
      "For HANSARIA FOOD PRIVATE LIMITED",
      pageWidth - margin - 10,
      finalY + 75,
      {
        align: "right",
      },
    );
    doc.setFont("helvetica", "normal");
    doc.text("Authorised Signatory", pageWidth - margin - 10, finalY + 90, {
      align: "right",
    });

    const pdfBuffer = doc.output("arraybuffer");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Brokerage_Report.pdf",
    );
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error("Brokerage pdf export error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/filters", async (req, res) => {
  try {
    const role = req.user?.role;
    const mobile = req.user?.mobile;

    if (role !== "Admin" && role !== "Employee" && role !== "Seller") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const [groups, sellers] = await Promise.all([
      Group.find().select("_id groupName").sort({ groupName: 1 }).lean(),
      role === "Seller" && mobile
        ? Seller.find({ "phoneNumbers.value": String(mobile) })
            .select("_id sellerName companies phoneNumbers status")
            .lean()
        : Seller.find()
            .select("_id sellerName companies phoneNumbers status")
            .lean(),
    ]);

    res.json({
      groups: (groups || []).map((g) => ({
        _id: g._id,
        groupName: g.groupName || "",
      })),
      sellers: (sellers || [])
        .filter(
          (s) => String(s.status || "active").toLowerCase() !== "inactive",
        )
        .map((s) => ({
          _id: s._id,
          sellerName: s.sellerName || "",
          companies: Array.isArray(s.companies) ? s.companies : [],
        }))
        .sort((a, b) => a.sellerName.localeCompare(b.sellerName)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/buyers", async (req, res) => {
  try {
    const role = req.user?.role;
    if (role !== "Admin" && role !== "Employee") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const groupIdRaw = req.query.groupId;
    if (!groupIdRaw) {
      return res.status(400).json({ message: "groupId is required" });
    }

    const groupIds = groupIdRaw.split(",").map(toObjectId).filter(Boolean);

    const buyers = await Buyer.find({ groupId: { $in: groupIds } })
      .select("_id name companyIds consigneeIds")
      .populate({
        path: "companyIds",
        select: "companyName consigneeIds",
        populate: {
          path: "consigneeIds",
          select: "name location district state",
        },
      })
      .populate({
        path: "consigneeIds",
        select: "name location district state",
      })
      .sort({ name: 1, _id: 1 })
      .lean();

    // Fetch all distinct buyerCompany and consignee values in 2 single queries instead of N+1
    const buyerNames = (buyers || []).map(b => b.name).filter(Boolean);
    let allFallbackCompanies = {};
    let allFallbackConsignees = {};

    if (buyerNames.length > 0) {
      // Get all fallback company names for all buyers in one query
      const companyResults = await SelfOrder.aggregate([
        { $match: { buyer: { $in: buyerNames }, buyerCompany: { $exists: true, $ne: "" } } },
        { $group: { _id: "$buyer", companies: { $addToSet: "$buyerCompany" } } }
      ]);

      // Get all fallback consignees for all buyers in one query
      const consigneeResults = await SelfOrder.aggregate([
        { $match: { buyer: { $in: buyerNames } } },
        { $group: { _id: "$buyer", consignees: { $addToSet: "$consignee" } } }
      ]);

      // Convert arrays to maps for quick lookups
      companyResults.forEach(r => { allFallbackCompanies[r._id] = r.companies || []; });
      consigneeResults.forEach(r => { allFallbackConsignees[r._id] = r.consignees || []; });
    }

    const buyersWithCompanies = (buyers || []).map((b) => {
      const populatedCompanyNames = (b.companyIds || [])
        .map((c) => c?.companyName || "")
        .filter(Boolean);

      let companyNames = populatedCompanyNames;

      const consigneeMap = new Map();

      (b.consigneeIds || []).forEach((c) => {
        if (c && c.name) {
          const label = `${c.name || "N/A"} - ${c.location || "N/A"}, ${c.district || "N/A"}, ${c.state || "N/A"}`;
          consigneeMap.set(c.name.trim().toLowerCase(), {
            _id: c._id,
            name: c.name,
            label: label,
          });
        }
      });

      (b.companyIds || []).forEach((comp) => {
        (comp.consigneeIds || []).forEach((c) => {
          if (c && c.name) {
            const key = c.name.trim().toLowerCase();
            if (!consigneeMap.has(key)) {
              const label = `${c.name || "N/A"} - ${c.location || "N/A"}, ${c.district || "N/A"}, ${c.state || "N/A"}`;
              consigneeMap.set(key, {
                _id: c._id,
                name: c.name,
                label: label,
              });
            }
          }
        });
      });

      if (companyNames.length === 0 && b.name) {
        const fallbackCompanyNames = allFallbackCompanies[b.name] || [];
        companyNames = fallbackCompanyNames.filter(Boolean);
      }

      if (b.name) {
        const selfOrderConsignees = allFallbackConsignees[b.name] || [];
        selfOrderConsignees.forEach((name) => {
          if (name) {
            const key = name.trim().toLowerCase();
            if (!consigneeMap.has(key)) {
              consigneeMap.set(key, {
                _id: name,
                name: name,
                label: name,
              });
            }
          }
        });
      }

      return {
        _id: b._id,
        name: b.name || "",
        companyNames,
        consignees: Array.from(consigneeMap.values()),
      };
    });

    res.json(buyersWithCompanies);
  } catch (error) {
    console.error("Buyers endpoint error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/saudas", async (req, res) => {
  try {
    const role = req.user?.role;
    const mobile = req.user?.mobile;

    if (role !== "Admin" && role !== "Employee" && role !== "Seller") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const buyerId = toObjectId(req.query.buyerId);
    const groupIdRaw = req.query.groupId;
    const buyerCompany = String(req.query.buyerCompany || "").trim();
    const consigneeName = String(req.query.consigneeName || "").trim();
    const sellerIdFromQuery = toObjectId(req.query.sellerId);
    const sellerCompany = String(req.query.sellerCompany || "").trim();
    const saudaNo = String(req.query.saudaNo || "").trim();

    let sellerId = sellerIdFromQuery;
    if (!sellerId && role === "Seller") {
      sellerId = toObjectId(req.user?.sub);
    }

    const andParts = [];

    if (buyerId) {
      const buyer = await Buyer.findById(buyerId)
        .select("_id name companyIds groupId")
        .populate({ path: "companyIds", select: "companyName" })
        .lean();

      if (!buyer) return res.status(404).json({ message: "Buyer not found" });

      const companyIds = (buyer.companyIds || [])
        .map((c) => c?._id || c)
        .filter(Boolean);
      const companyNames = (buyer.companyIds || [])
        .map((c) => c?.companyName || "")
        .filter(Boolean);

      const buyerOr = [];
      if (companyIds.length) buyerOr.push({ companyId: { $in: companyIds } });
      if (companyNames.length)
        buyerOr.push({ buyerCompany: { $in: companyNames } });
      if (buyer.name) buyerOr.push({ buyer: buyer.name });

      if (buyerOr.length) andParts.push({ $or: buyerOr });
    } else if (groupIdRaw) {
      const groupIds = groupIdRaw.split(",").map(toObjectId).filter(Boolean);
      const buyers = await Buyer.find({ groupId: { $in: groupIds } })
        .select("_id companyIds name")
        .populate({ path: "companyIds", select: "companyName" })
        .lean();

      if (buyers.length) {
        const allCompanyIds = [];
        const allCompanyNames = [];
        const allBuyerNames = [];

        buyers.forEach((b) => {
          if (b.name) allBuyerNames.push(b.name);
          (b.companyIds || []).forEach((c) => {
            if (c?._id) allCompanyIds.push(c._id);
            if (c?.companyName) allCompanyNames.push(c.companyName);
          });
        });

        const groupOr = [];
        if (allCompanyIds.length)
          groupOr.push({ companyId: { $in: allCompanyIds } });
        if (allCompanyNames.length)
          groupOr.push({ buyerCompany: { $in: allCompanyNames } });
        if (allBuyerNames.length)
          groupOr.push({ buyer: { $in: allBuyerNames } });

        if (groupOr.length) andParts.push({ $or: groupOr });
        else andParts.push({ _id: null });
      } else {
        andParts.push({ _id: null });
      }
    }

    if (buyerCompany) {
      andParts.push({
        buyerCompany: {
          $regex: new RegExp(`^${escapeRegex(buyerCompany)}$`, "i"),
        },
      });
    }

    if (consigneeName) {
      andParts.push({ consignee: consigneeName });
    }

    if (sellerId) {
      andParts.push({ supplier: sellerId });
    } else if (role === "Seller" && mobile) {
      andParts.push({ sellerMobile: String(mobile) });
    }

    if (sellerCompany) {
      andParts.push({ supplierCompany: sellerCompany });
    }

    if (saudaNo) {
      andParts.push({
        saudaNo: { $regex: new RegExp(escapeRegex(saudaNo), "i") },
      });
    }

    const query = andParts.length ? { $and: andParts } : {};

    const limit = Math.min(Math.max(Number(req.query.limit || 200), 1), 1000);
    const items = await SelfOrder.find(query)
      .sort({ poDate: -1, createdAt: -1 })
      .limit(limit)
      .populate("supplier", "sellerName")
      .lean();

    const processed = (items || []).map((o) => {
      const computed = computePendingForSelfOrder(o);
      return { ...o, ...computed };
    });

    processed.sort((a, b) => {
      if (Boolean(a.isClosed) !== Boolean(b.isClosed))
        return a.isClosed ? 1 : -1;
      const aTime = new Date(a.poDate || a.createdAt || 0).getTime();
      const bTime = new Date(b.poDate || b.createdAt || 0).getTime();
      return (
        (Number.isFinite(bTime) ? bTime : 0) -
        (Number.isFinite(aTime) ? aTime : 0)
      );
    });

    res.json({ data: processed, total: processed.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// New efficient endpoints to get unique sellers/seller companies directly via aggregation
router.get("/unique-sellers", async (req, res) => {
  try {
    const role = req.user?.role;
    const mobile = req.user?.mobile;

    if (role !== "Admin" && role !== "Employee" && role !== "Seller") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const groupIdRaw = req.query.groupId;
    const buyerCompany = String(req.query.buyerCompany || "").trim();

    const andParts = [];

    // Build query for selfOrders based on filters
    if (groupIdRaw) {
      const groupIds = groupIdRaw.split(",").map(toObjectId).filter(Boolean);
      const buyers = await Buyer.find({ groupId: { $in: groupIds } })
        .select("_id companyIds name")
        .populate({ path: "companyIds", select: "companyName" })
        .lean();

      if (buyers.length) {
        const allCompanyIds = [];
        const allCompanyNames = [];
        const allBuyerNames = [];

        buyers.forEach((b) => {
          if (b.name) allBuyerNames.push(b.name);
          (b.companyIds || []).forEach((c) => {
            if (c?._id) allCompanyIds.push(c._id);
            if (c?.companyName) allCompanyNames.push(c.companyName);
          });
        });

        const groupOr = [];
        if (allCompanyIds.length) groupOr.push({ companyId: { $in: allCompanyIds } });
        if (allCompanyNames.length) groupOr.push({ buyerCompany: { $in: allCompanyNames } });
        if (allBuyerNames.length) groupOr.push({ buyer: { $in: allBuyerNames } });
        if (groupOr.length) andParts.push({ $or: groupOr });
      }
    }

    if (buyerCompany) {
      andParts.push({
        buyerCompany: { $regex: new RegExp(`^${escapeRegex(buyerCompany)}$`, "i") },
      });
    }

    if (role === "Seller" && mobile) {
      const seller = await Seller.findOne({ "phoneNumbers.value": { $regex: new RegExp(mobile + "$") } }).lean();
      if (seller) {
        andParts.push({ supplier: seller._id });
      }
    }

    const query = andParts.length ? { $and: andParts } : {};

    // Aggregate to get unique suppliers and their names
    const uniqueSellers = await SelfOrder.aggregate([
      { $match: { ...query, supplier: { $exists: true, $ne: null } } },
      { $group: { _id: "$supplier" } },
      {
        $lookup: {
          from: "sellers",
          localField: "_id",
          foreignField: "_id",
          as: "sellerInfo"
        }
      },
      { $unwind: { path: "$sellerInfo", preserveNullAndEmptyArrays: false } },
      { $project: { _id: 1, sellerName: "$sellerInfo.sellerName" } },
      { $sort: { sellerName: 1 } }
    ]);

    const formatted = uniqueSellers.map((s) => ({
      value: s._id.toString(),
      label: s.sellerName || "N/A"
    }));

    res.json({ data: formatted });
  } catch (error) {
    console.error("Error getting unique sellers:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/unique-seller-companies", async (req, res) => {
  try {
    const role = req.user?.role;
    const mobile = req.user?.mobile;

    if (role !== "Admin" && role !== "Employee" && role !== "Seller") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const groupIdRaw = req.query.groupId;
    const buyerCompany = String(req.query.buyerCompany || "").trim();
    const sellerId = toObjectId(req.query.sellerId);

    const andParts = [];

    // Build query for selfOrders based on filters
    if (groupIdRaw) {
      const groupIds = groupIdRaw.split(",").map(toObjectId).filter(Boolean);
      const buyers = await Buyer.find({ groupId: { $in: groupIds } })
        .select("_id companyIds name")
        .populate({ path: "companyIds", select: "companyName" })
        .lean();

      if (buyers.length) {
        const allCompanyIds = [];
        const allCompanyNames = [];
        const allBuyerNames = [];

        buyers.forEach((b) => {
          if (b.name) allBuyerNames.push(b.name);
          (b.companyIds || []).forEach((c) => {
            if (c?._id) allCompanyIds.push(c._id);
            if (c?.companyName) allCompanyNames.push(c.companyName);
          });
        });

        const groupOr = [];
        if (allCompanyIds.length) groupOr.push({ companyId: { $in: allCompanyIds } });
        if (allCompanyNames.length) groupOr.push({ buyerCompany: { $in: allCompanyNames } });
        if (allBuyerNames.length) groupOr.push({ buyer: { $in: allBuyerNames } });
        if (groupOr.length) andParts.push({ $or: groupOr });
      }
    }

    if (buyerCompany) {
      andParts.push({
        buyerCompany: { $regex: new RegExp(`^${escapeRegex(buyerCompany)}$`, "i") },
      });
    }

    if (sellerId) {
      andParts.push({ supplier: sellerId });
    }

    if (role === "Seller" && mobile && !sellerId) {
      const seller = await Seller.findOne({ "phoneNumbers.value": { $regex: new RegExp(mobile + "$") } }).lean();
      if (seller) {
        andParts.push({ supplier: seller._id });
      }
    }

    const query = andParts.length ? { $and: andParts } : {};

    // Aggregate to get unique supplier companies
    const uniqueCompanies = await SelfOrder.aggregate([
      { $match: { ...query, supplierCompany: { $exists: true, $ne: null, $ne: "" } } },
      { $group: { _id: { $toLower: "$supplierCompany" }, name: { $first: "$supplierCompany" } } },
      { $sort: { name: 1 } }
    ]);

    const formatted = uniqueCompanies.map((c) => ({
      value: c.name,
      label: c.name
    }));

    res.json({ data: formatted });
  } catch (error) {
    console.error("Error getting unique seller companies:", error);
    res.status(500).json({ message: error.message });
  }
});

// New fast endpoint for sauda number suggestions
router.get("/sauda-suggestions", async (req, res) => {
  try {
    const role = req.user?.role;
    const mobile = req.user?.mobile;

    if (role !== "Admin" && role !== "Employee" && role !== "Seller") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const saudaNo = String(req.query.saudaNo || "").trim();
    const groupIdRaw = req.query.groupId;
    const buyerCompany = String(req.query.buyerCompany || "").trim();
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);

    if (!saudaNo) {
      return res.json({ data: [] });
    }

    const andParts = [];
    andParts.push({
      saudaNo: { $regex: new RegExp(escapeRegex(saudaNo), "i") }
    });

    // Build query filters
    if (groupIdRaw) {
      const groupIds = groupIdRaw.split(",").map(toObjectId).filter(Boolean);
      const buyers = await Buyer.find({ groupId: { $in: groupIds } })
        .select("_id companyIds name")
        .populate({ path: "companyIds", select: "companyName" })
        .lean();

      if (buyers.length) {
        const allCompanyIds = [];
        const allCompanyNames = [];
        const allBuyerNames = [];

        buyers.forEach((b) => {
          if (b.name) allBuyerNames.push(b.name);
          (b.companyIds || []).forEach((c) => {
            if (c?._id) allCompanyIds.push(c._id);
            if (c?.companyName) allCompanyNames.push(c.companyName);
          });
        });

        const groupOr = [];
        if (allCompanyIds.length) groupOr.push({ companyId: { $in: allCompanyIds } });
        if (allCompanyNames.length) groupOr.push({ buyerCompany: { $in: allCompanyNames } });
        if (allBuyerNames.length) groupOr.push({ buyer: { $in: allBuyerNames } });
        if (groupOr.length) andParts.push({ $or: groupOr });
      }
    }

    if (buyerCompany) {
      andParts.push({
        buyerCompany: { $regex: new RegExp(`^${escapeRegex(buyerCompany)}$`, "i") },
      });
    }

    if (role === "Seller" && mobile) {
      const seller = await Seller.findOne({ "phoneNumbers.value": { $regex: new RegExp(mobile + "$") } }).lean();
      if (seller) {
        andParts.push({ supplier: seller._id });
      }
    }

    const query = andParts.length ? { $and: andParts } : {};

    // Get only the fields we need for suggestions
    const suggestions = await SelfOrder.find(query)
      .select("saudaNo buyerCompany supplierCompany consignee supplier")
      .populate("supplier", "sellerName")
      .sort({ saudaNo: -1 })
      .limit(limit)
      .lean();

    // Deduplicate by saudaNo
    const uniqMap = new Map();
    suggestions.forEach(s => {
      if (!uniqMap.has(s.saudaNo)) {
        uniqMap.set(s.saudaNo, s);
      }
    });

    const formatted = Array.from(uniqMap.values()).map(s => ({
      ...s,
      _count: 1
    }));

    res.json({ data: formatted });
  } catch (error) {
    console.error("Sauda suggestions error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "10", 10);
    const search = (req.query.search || "").trim();
    const saudaNo = (req.query.saudaNo || "").trim();
    const lorryNumber = (req.query.lorryNumber || "").trim();
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const date = req.query.date;
    const commodity = (req.query.commodity || "").trim();
    const role = req.query.role;
    const mobile = req.query.mobile;
    const buyerId = req.query.buyerId;
    const supplierId = req.query.supplier;
    const paymentStatus = req.query.paymentStatus;
    const buyerCompany = req.query.buyerCompany;
    const supplierCompany = req.query.supplierCompany;
    const companyId = req.query.companyId;
    const isUnloaded = req.query.isUnloaded === "true";

    let query = {};

    if (role === "Seller" && mobile) {
      const phoneRegex = /^(?:\+91|0)?([6-9]\d{9})$/;
      const phoneMatch = String(mobile).match(phoneRegex);
      const normalizedMobile = phoneMatch ? phoneMatch[1] : mobile;

      const seller = await Seller.findOne({
        "phoneNumbers.value": { $regex: new RegExp(normalizedMobile + "$") },
      }).lean();

      if (seller) {
        query.supplier = seller._id;
      } else {
        query.sellerMobile = normalizedMobile;
      }
    } else if (role === "Buyer" && mobile) {
      const phoneRegex = /^(?:\+91|0)?([6-9]\d{9})$/;
      const phoneMatch = String(mobile).match(phoneRegex);
      const normalizedMobile = phoneMatch ? phoneMatch[1] : mobile;

      const buyer = await Buyer.findOne({
        mobile: { $regex: new RegExp(normalizedMobile + "$") },
      }).lean();

      if (buyer) {
        const companyNames = (buyer.companyIds || []).map((c) => c.companyName);
        if (buyer.name) companyNames.push(buyer.name);

        if (companyNames.length) {
          const companyRegexes = companyNames.map(
            (name) => new RegExp(`^${escapeRegex(name)}$`, "i"),
          );
          query.$or = [
            { buyerCompany: { $in: companyRegexes } },
            { consignee: { $in: companyRegexes } },
          ];
        }
      }
    }

    const andParts = [];
    if (Object.keys(query).length > 0) {
      andParts.push(query);
    }

    if (buyerId) {
      const buyer = await Buyer.findById(buyerId).populate("companyIds").lean();
      if (buyer) {
        const buyerOr = [];

        buyerOr.push({ buyer: toObjectId(buyerId) });
        buyerOr.push({ buyerId: toObjectId(buyerId) });

        if (buyerCompany) {
          const companyRegex = {
            $regex: new RegExp(`^${escapeRegex(buyerCompany)}$`, "i"),
          };
          buyerOr.push({ buyerCompany: companyRegex });
          buyerOr.push({ consignee: companyRegex });
          if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
            buyerOr.push({ companyId: toObjectId(companyId) });
          }
        } else {
          const companyNames = (buyer.companyIds || []).map(
            (c) => c.companyName,
          );
          if (buyer.name) companyNames.push(buyer.name);

          if (companyNames.length) {
            const companyRegexes = companyNames.map(
              (name) => new RegExp(`^${escapeRegex(name)}$`, "i"),
            );
            buyerOr.push({ buyerCompany: { $in: companyRegexes } });
            buyerOr.push({ consignee: { $in: companyRegexes } });
          }

          const companyIds = (buyer.companyIds || []).map((c) => c._id || c);
          if (companyIds.length) {
            buyerOr.push({
              companyId: { $in: companyIds.map((id) => toObjectId(id)) },
            });
          }
        }

        if (buyerOr.length) andParts.push({ $or: buyerOr });
      }
    }

    if (supplierId) {
      const supplierPart = { supplier: toObjectId(supplierId) };

      if (supplierCompany) {
        const companyOr = [];
        companyOr.push({
          supplierCompany: {
            $regex: new RegExp(`^${escapeRegex(supplierCompany)}$`, "i"),
          },
        });
        if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
          companyOr.push({ companyId: toObjectId(companyId) });
        }

        andParts.push({
          $and: [supplierPart, { $or: companyOr }],
        });
      } else {
        andParts.push(supplierPart);
      }
    } else if (supplierCompany) {
      andParts.push({
        supplierCompany: {
          $regex: new RegExp(`^${escapeRegex(supplierCompany)}$`, "i"),
        },
      });
    }

    if (buyerCompany) {
      const companyRegex = {
        $regex: new RegExp(
          `^${escapeRegex(String(buyerCompany).trim())}$`,
          "i",
        ),
      };
      const buyerCompanyOr = [
        { buyerCompany: companyRegex },
        { consignee: companyRegex },
      ];
      if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
        buyerCompanyOr.push({ companyId: toObjectId(companyId) });
      }
      andParts.push({ $or: buyerCompanyOr });
    }

    if (paymentStatus === "pending") {
      andParts.push({ paymentStatus: { $ne: "done" } });
    } else if (paymentStatus) {
      andParts.push({ paymentStatus });
    }

    if (isUnloaded) {
      andParts.push({
        $or: [{ unloadingWeight: { $gt: 0 } }, { loadingWeight: { $gt: 0 } }],
      });
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");
      andParts.push({
        $or: [
          { supplierCompany: { $regex: searchRegex } },
          { buyerCompany: { $regex: searchRegex } },
          { consignee: { $regex: searchRegex } },
          { saudaNo: { $regex: searchRegex } },
          { lorryNumber: { $regex: searchRegex } },
          { billNumber: { $regex: searchRegex } },
          { commodity: { $regex: searchRegex } },
        ],
      });
    }

    if (saudaNo) {
      andParts.push({
        saudaNo: { $regex: new RegExp(escapeRegex(saudaNo), "i") },
      });
    }

    if (lorryNumber) {
      andParts.push({
        lorryNumber: { $regex: new RegExp(escapeRegex(lorryNumber), "i") },
      });
    }

    if (commodity) {
      andParts.push({
        commodity: { $regex: new RegExp(`^${escapeRegex(commodity)}$`, "i") },
      });
    }

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      andParts.push({ loadingDate: { $gte: start, $lte: end } });
    } else if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      andParts.push({ loadingDate: dateFilter });
    }

    const finalQuery =
      andParts.length > 1 ? { $and: andParts } : andParts[0] || {};

    const items = await LoadingEntry.find(finalQuery)
      .sort({ paymentStatus: -1, loadingNo: -1, loadingDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select(
        "loadingNo loadingDate saudaNo lorryNumber supplier supplierCompany consignee buyerCompany commodity loadingWeight unloadingWeight unloadingDate paymentStatus paidAmount billNumber transporterId addedTransport driverName driverPhoneNumber freightRate totalFreight advance balance dateOfIssue documents bags deliveryDate buyerBrokerage sellerBrokerage loadingFrom createdAt creatorName creatorMobile entryByRole",
      )
      .populate("supplier", "sellerName")
      .lean();

    const total = await LoadingEntry.countDocuments(finalQuery);

    const saudaNos = [...new Set(items.map((i) => i.saudaNo).filter(Boolean))];
    const selfOrders = await SelfOrder.find({ saudaNo: { $in: saudaNos } })
      .select(
        "saudaNo rate gst cd buyerCompany consignee commodity paymentTerms buyerBrokerage status quantity pendingQuantity",
      )
      .lean();
    const saudaMap = selfOrders.reduce((acc, so) => {
      acc[so.saudaNo] = so;
      return acc;
    }, {});

    const itemsWithDetails = items.map((item) => {
      const order = saudaMap[item.saudaNo] || {};
      return {
        ...item,
        actualRate: order.rate || 0,
        gst: order.gst || 0,
        cd: order.cd || 0,
        commodity: item.commodity || order.commodity || "",
      };
    });

    const baseAndParts = [];
    if (Object.keys(query).length > 0) {
      baseAndParts.push(query);
    }
    const baseQuery = baseAndParts.length > 0 ? { $and: baseAndParts } : {};

    const itemsWithSlNo = itemsWithDetails.map((item) => {
      return { ...item, slNo: item.loadingNo };
    });

    res.json({
      data: itemsWithSlNo,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/receiving", async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "10", 10);
    const search = (req.query.search || "").trim();
    const sentStatus = req.query.sentStatus;
    const role = req.query.role;
    const mobile = req.query.mobile;

    let query = {
      $or: [
        { unloadingWeight: { $gt: 0 } },
        { unloadingDate: { $exists: true, $ne: null } },
      ],
    };

    if (sentStatus && sentStatus !== "All") {
      query.sentStatus = sentStatus;
    }

    if (role === "Seller" && mobile) {
      const seller = await Seller.findOne({
        "phoneNumbers.value": String(mobile),
      }).lean();
      if (seller) {
        query.supplier = seller._id;
      } else {
        return res.json({ data: [], total: 0, page, totalPages: 0 });
      }
    }

    const andParts = [query];

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");
      andParts.push({
        $or: [
          { supplierCompany: { $regex: searchRegex } },
          { saudaNo: { $regex: searchRegex } },
          { lorryNumber: { $regex: searchRegex } },
          { buyerCompany: { $regex: searchRegex } },
          { consignee: { $regex: searchRegex } },
        ],
      });
    }

    const finalQuery = { $and: andParts };

    const items = await LoadingEntry.find(finalQuery)
      .sort({ unloadingDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("supplier")
      .lean();

    const total = await LoadingEntry.countDocuments(finalQuery);

    const saudaNos = [...new Set(items.map((i) => i.saudaNo).filter(Boolean))];
    const selfOrders = await SelfOrder.find({ saudaNo: { $in: saudaNos } })
      .select(
        "saudaNo rate gst cd buyerCompany consignee buyer poNumber location district state pin pinCode billTo commodity",
      )
      .lean();
    const saudaMap = selfOrders.reduce((acc, so) => {
      acc[so.saudaNo] = so;
      return acc;
    }, {});

    const itemsWithDetails = items.map((item) => {
      const order = saudaMap[item.saudaNo] || {};
      return {
        ...item,
        actualRate: order.rate || 0,
        gst: order.gst || 0,
        cd: order.cd || 0,
        poNumber: order.poNumber || "",
        location: order.location || "",
        district: order.district || "",
        state: order.state || "",
        pin: order.pin || order.pinCode || "",
        billTo: order.billTo || "",
        commodity: item.commodity || order.commodity || "",
      };
    });

    res.json({
      data: itemsWithDetails,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/suggestions", async (req, res) => {
  try {
    const role = req.query.role;
    const mobile = req.query.mobile;
    let query = {};

    if (role === "Seller" && mobile) {
      const seller = await Seller.findOne({
        "phoneNumbers.value": String(mobile),
      }).lean();
      if (seller) {
        query.supplier = seller._id;
      } else {
        return res.json({ sellers: [], saudas: [], lorries: [] });
      }
    } else if (role === "Buyer" && mobile) {
      const buyer = await Buyer.findOne({
        mobile: { $regex: new RegExp(mobile + "$") },
      }).lean();

      if (buyer) {
        const companyNames = (buyer.companyIds || []).map((c) => c.companyName);
        if (buyer.name) companyNames.push(buyer.name);

        if (companyNames.length) {
          const companyRegexes = companyNames.map(
            (name) => new RegExp(`^${escapeRegex(name)}$`, "i"),
          );
          query.$or = [
            { buyerCompany: { $in: companyRegexes } },
            { consignee: { $in: companyRegexes } },
          ];
        }
      }
    }

    const [sellers, buyers, saudas, lorries] = await Promise.all([
      LoadingEntry.distinct("supplierCompany", query),
      LoadingEntry.distinct("consignee", query),
      LoadingEntry.distinct("saudaNo", query),
      LoadingEntry.distinct("lorryNumber", query),
    ]);

    res.json({
      sellers: [...new Set([...sellers, ...buyers])].filter(Boolean),
      saudas: saudas.filter(Boolean),
      lorries: lorries.filter(Boolean),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/export/excel", async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    const saudaNo = (req.query.saudaNo || "").trim();
    const lorryNumber = (req.query.lorryNumber || "").trim();
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const role = req.query.role;
    const mobile = req.query.mobile;

    let query = {};

    if (role === "Seller" && mobile) {
      const seller = await Seller.findOne({
        "phoneNumbers.value": String(mobile),
      }).lean();
      if (seller) {
        query.supplier = seller._id;
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
    } else if (role === "Buyer" && mobile) {
      const buyer = await Buyer.findOne({
        mobile: { $regex: new RegExp(mobile + "$") },
      }).lean();

      if (buyer) {
        const companyNames = (buyer.companyIds || []).map((c) => c.companyName);
        if (buyer.name) companyNames.push(buyer.name);

        if (companyNames.length) {
          const companyRegexes = companyNames.map(
            (name) => new RegExp(`^${escapeRegex(name)}$`, "i"),
          );
          query.$or = [
            { buyerCompany: { $in: companyRegexes } },
            { consignee: { $in: companyRegexes } },
          ];
        }
      }
    }

    const andParts = [];
    if (Object.keys(query).length > 0) {
      andParts.push(query);
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");
      andParts.push({
        $or: [
          { supplierCompany: { $regex: searchRegex } },
          { consignee: { $regex: searchRegex } },
          { saudaNo: { $regex: searchRegex } },
          { lorryNumber: { $regex: searchRegex } },
          { billNumber: { $regex: searchRegex } },
          { commodity: { $regex: searchRegex } },
        ],
      });
    }

    if (saudaNo) {
      andParts.push({
        saudaNo: { $regex: new RegExp(escapeRegex(saudaNo), "i") },
      });
    }

    if (lorryNumber) {
      andParts.push({
        lorryNumber: { $regex: new RegExp(escapeRegex(lorryNumber), "i") },
      });
    }

    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      andParts.push({ loadingDate: dateFilter });
    }

    const finalQuery =
      andParts.length > 1 ? { $and: andParts } : andParts[0] || {};

    const items = await LoadingEntry.find(finalQuery)
      .sort({ loadingNo: 1, loadingDate: 1, createdAt: 1 })
      .populate("supplier", "sellerName")
      .lean();

    const baseAndParts = [];
    if (Object.keys(query).length > 0) {
      baseAndParts.push(query);
    }
    const baseQuery = baseAndParts.length > 0 ? { $and: baseAndParts } : {};

    const allBaseItems = await LoadingEntry.find(baseQuery)
      .select("_id")
      .sort({ loadingNo: 1, loadingDate: 1, createdAt: 1 })
      .lean();

    const idToSlNo = {};
    allBaseItems.forEach((item, index) => {
      idToSlNo[item._id.toString()] = index + 1;
    });

    const saudaNos = [...new Set(items.map((i) => i.saudaNo).filter(Boolean))];
    const selfOrders = await SelfOrder.find({ saudaNo: { $in: saudaNos } })
      .select(
        "saudaNo buyerCompany paymentTerms rate buyerBrokerage quantity pendingQuantity",
      )
      .lean();
    const saudaData = selfOrders.reduce((acc, so) => {
      acc[so.saudaNo] = {
        buyerCompany: so.buyerCompany,
        paymentTerms: so.paymentTerms,
        rate: so.rate || 0,
        buyerBrokerageRate: so.buyerBrokerage?.brokerageBuyer || 0,
        sellerBrokerageRate: so.buyerBrokerage?.brokerageSupplier || 0,
        totalQuantity: so.quantity || 0,
        pendingQuantity: so.pendingQuantity || 0,
      };
      return acc;
    }, {});

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Loading Entries");

    worksheet.columns = [
      { header: "Sl No", key: "slNo", width: 10 },
      { header: "Loading No", key: "loadingNo", width: 15 },
      { header: "Sauda No", key: "saudaNo", width: 15 },
      { header: "Supplier", key: "supplierName", width: 30 },
      { header: "Supplier Company", key: "supplierCompany", width: 30 },
      { header: "Buyer Company", key: "buyerCompany", width: 30 },
      { header: "Consignee", key: "consignee", width: 30 },
      { header: "Commodity", key: "commodity", width: 20 },
      { header: "Total Sauda Qty", key: "totalQuantity", width: 15 },
      { header: "Pending Sauda Qty", key: "pendingQuantity", width: 15 },
      { header: "Bill Number", key: "billNumber", width: 20 },
      { header: "Lorry Number", key: "lorryNumber", width: 20 },
      { header: "Loading Date", key: "loadingDate", width: 15 },
      { header: "Loading Weight", key: "loadingWeight", width: 15 },
      { header: "Unloading Date", key: "unloadingDate", width: 15 },
      { header: "Unloading Weight", key: "unloadingWeight", width: 15 },
      { header: "Rate", key: "rate", width: 15 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Buyer Brokerage/Ton", key: "buyerBrokerage", width: 20 },
      {
        header: "Total Buyer Brokerage",
        key: "totalBuyerBrokerage",
        width: 20,
      },
      { header: "Seller Brokerage/Ton", key: "sellerBrokerage", width: 20 },
      {
        header: "Total Seller Brokerage",
        key: "totalSellerBrokerage",
        width: 20,
      },
      { header: "Bags", key: "bags", width: 10 },
      { header: "Payment Terms", key: "paymentTerms", width: 20 },
    ];

    items.forEach((item) => {
      const rate = saudaData[item.saudaNo]?.rate || 0;
      const unloadingWeight = item.unloadingWeight || 0;
      const amount = unloadingWeight * rate;

      const bBrokerageRate = saudaData[item.saudaNo]?.buyerBrokerageRate || 0;
      const sBrokerageRate = saudaData[item.saudaNo]?.sellerBrokerageRate || 0;

      worksheet.addRow({
        slNo: idToSlNo[item._id.toString()] || "-",
        loadingNo: item.loadingNo || "-",
        saudaNo: item.saudaNo || "N/A",
        supplierName: item.supplier?.sellerName || "Unknown Supplier",
        supplierCompany: item.supplierCompany || "N/A",
        buyerCompany:
          item.buyerCompany || saudaData[item.saudaNo]?.buyerCompany || "N/A",
        consignee: item.consignee || "N/A",
        commodity: item.commodity || "N/A",
        totalQuantity: saudaData[item.saudaNo]?.totalQuantity || 0,
        pendingQuantity: saudaData[item.saudaNo]?.pendingQuantity || 0,
        billNumber: item.billNumber || "N/A",
        lorryNumber: item.lorryNumber || "N/A",
        loadingDate: item.loadingDate
          ? new Date(item.loadingDate).toLocaleDateString("en-GB")
          : "N/A",
        loadingWeight: item.loadingWeight || 0,
        unloadingDate: item.unloadingDate
          ? new Date(item.unloadingDate).toLocaleDateString("en-GB")
          : "N/A",
        unloadingWeight: unloadingWeight,
        rate: rate,
        amount: amount,
        buyerBrokerage: bBrokerageRate,
        totalBuyerBrokerage: (bBrokerageRate * unloadingWeight).toFixed(2),
        sellerBrokerage: sBrokerageRate,
        totalSellerBrokerage: (sBrokerageRate * unloadingWeight).toFixed(2),
        bags: item.bags || 0,
        paymentTerms: saudaData[item.saudaNo]?.paymentTerms || "N/A",
      });
    });

    const totalLoadingWeight = items.reduce(
      (sum, item) => sum + (item.loadingWeight || 0),
      0,
    );
    const totalUnloadingWeight = items.reduce(
      (sum, item) => sum + (item.unloadingWeight || 0),
      0,
    );
    const totalBuyerBrokerage = items.reduce((sum, item) => {
      const rate = saudaData[item.saudaNo]?.buyerBrokerageRate || 0;
      return sum + rate * (item.unloadingWeight || 0);
    }, 0);
    const totalSellerBrokerage = items.reduce((sum, item) => {
      const rate = saudaData[item.saudaNo]?.sellerBrokerageRate || 0;
      return sum + rate * (item.unloadingWeight || 0);
    }, 0);

    const totalRow = worksheet.addRow({
      slNo: "TOTAL",
      loadingWeight: totalLoadingWeight,
      unloadingWeight: totalUnloadingWeight,
      totalBuyerBrokerage: totalBuyerBrokerage.toFixed(2),
      totalSellerBrokerage: totalSellerBrokerage.toFixed(2),
    });
    totalRow.font = { bold: true };

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=LoadingEntries.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export Excel Error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/sauda/:saudaNo", async (req, res) => {
  try {
    const items = await LoadingEntry.find({ saudaNo: req.params.saudaNo })
      .sort({ loadingDate: -1 })
      .lean();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const data = await LoadingEntry.findById(req.params.id)
      .populate("supplier")
      .populate("transporterId")
      .lean();

    if (!data) {
      return res.status(404).json({ message: "Loading entry not found" });
    }

    const order = await SelfOrder.findOne({ saudaNo: data.saudaNo }).lean();

    const result = {
      ...data,
      actualRate: order?.rate || 0,
      gst: order?.gst || 0,
      cd: order?.cd || 0,
      commodity: data.commodity || order?.commodity || "",
    };

    res.json({ data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id/pdf", async (req, res) => {
  try {
    const data = await LoadingEntry.findById(req.params.id)
      .populate("supplier")
      .populate("transporterId")
      .lean();

    if (!data) {
      return res.status(404).json({ message: "Loading entry not found" });
    }

    const order = await SelfOrder.findOne({ saudaNo: data.saudaNo }).lean();

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 14;

    const formatDate = (date) => {
      if (!date) return "N/A";
      const d = new Date(date);
      return isNaN(d)
        ? "N/A"
        : d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
    };

    const formatCurrency = (val) =>
      `Rs. ${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

    const getAssetBase64 = (fileName) => {
      try {
        const filePath = path.join(__dirname, "..", "assets", fileName);
        if (fs.existsSync(filePath)) {
          const bitmap = fs.readFileSync(filePath);
          return `data:image/png;base64,${Buffer.from(bitmap).toString("base64")}`;
        }
      } catch (err) {
        console.error(`Error reading asset ${fileName}:`, err);
      }
      return null;
    };

    const logo64 = getAssetBase64("Hans.png");
    const sign64 = getAssetBase64("signature.png");
    const stamp64 = getAssetBase64("stamp.png");

    let qr64 = null;
    try {
      const qrData = `Sauda: ${data.saudaNo || "N/A"}\nLorry: ${data.lorryNumber || "N/A"}\nWeight: ${data.loadingWeight || 0} Tons\nDate: ${formatDate(data.loadingDate)}`;
      qr64 = await QRCode.toDataURL(qrData, { margin: 1, width: 100 });
    } catch (err) {
      console.error("QR Code Error:", err);
    }

    const seller = data.supplier || {};
    const transporter = data.transporterId || {};

    const sellerCompanyName = (
      data.supplierCompany ||
      seller.companyName ||
      "N/A"
    ).toUpperCase();
    const sellerName = seller.sellerName || "N/A";
    const sellerPhone =
      seller.mobileNo ||
      (seller.phoneNumbers && seller.phoneNumbers[0]?.value) ||
      "N/A";
    const sellerGstin = seller.gstNumber || seller.gstin || "NOT AVAILABLE";
    const sellerAddress =
      seller.address ||
      (seller.city && seller.state ? `${seller.city}, ${seller.state}` : "N/A");

    const buyerCompanyName = (
      data.buyerCompany ||
      order?.buyerCompany ||
      order?.buyer ||
      "N/A"
    ).toUpperCase();
    const consigneeName = data.consignee || order?.consignee || "N/A";

    const deliveryDetails =
      [
        data.location || order?.location,
        data.district || order?.district,
        data.state || order?.state,
        data.pin || data.pinCode || order?.pin || order?.pinCode,
      ]
        .filter(Boolean)
        .join(", ") || "Address details not found.";

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.1);
    doc.line(margin, 10, pageWidth - margin, 10);
    doc.line(margin, 48, pageWidth - margin, 48);

    if (logo64) {
      doc.addImage(logo64, "PNG", margin + 2, 14, 24, 24);
    }

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(sellerCompanyName, 47, 22);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`Seller: ${sellerName}`, 47, 28);
    doc.setFontSize(8);
    doc.text(`Contact: ${sellerPhone} | GSTIN: ${sellerGstin}`, 47, 34);
    doc.text(`Address: ${sellerAddress}`, 47, 40);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("LORRY CHALLAN", pageWidth - margin - 5, 22, { align: "right" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `DATE: ${formatDate(data.loadingDate)}`,
      pageWidth - margin - 5,
      34,
      { align: "right" },
    );
    doc.text(
      `CHALLAN NO: ${data.billNumber || "N/A"}`,
      pageWidth - margin - 5,
      39,
      { align: "right" },
    );

    const addTable = (title, y, head, body) => {
      doc.setTextColor(60, 60, 60);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(title.toUpperCase(), margin, y - 2);

      autoTable(doc, {
        startY: y,
        head: [head],
        body: [body],
        theme: "grid",
        headStyles: {
          fillColor: [250, 250, 250],
          textColor: [0, 0, 0],
          fontSize: 7.5,
          fontStyle: "bold",
          halign: "center",
          lineWidth: 0.1,
          lineColor: [200, 200, 200],
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [0, 0, 0],
          halign: "center",
          lineWidth: 0.1,
          lineColor: [230, 230, 230],
        },
        columnStyles: {
          0: { halign: "left" },
        },
        margin: { left: margin, right: margin },
        styles: {
          cellPadding: 3,
          overflow: "linebreak",
        },
      });

      return doc.lastAutoTable.finalY + 12;
    };

    let currentY = 58;

    currentY = addTable(
      "Parties Information",
      currentY,
      ["Buyer Company", "Consignee Name", "Sauda No"],
      [buyerCompanyName, consigneeName, data.saudaNo || "N/A"],
    );

    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.1);
    const splitDeliveryAddress = doc.splitTextToSize(
      deliveryDetails,
      pageWidth - margin * 2 - 10,
    );
    const deliveryHeight = Math.max(16, splitDeliveryAddress.length * 5 + 8);

    doc.rect(margin, currentY - 5, pageWidth - margin * 2, deliveryHeight, "S");
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("DELIVERY ADDRESS", margin + 4, currentY);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(splitDeliveryAddress, margin + 4, currentY + 5);
    currentY += deliveryHeight + 6;

    currentY = addTable(
      "Goods & Weight Details",
      currentY,
      ["Commodity", "Bags", "Loading Weight", "Unloading Weight", "Vehicle No"],
      [
        data.commodity || "N/A",
        data.bags || "0",
        `${data.loadingWeight || 0} Tons`,
        `${data.unloadingWeight || 0} Tons`,
        (data.lorryNumber || "N/A").toUpperCase(),
      ],
    );

    currentY = addTable(
      "Transporter Information",
      currentY,
      ["Transporter Name", "Driver Name", "Driver Contact", "Lorry No"],
      [
        data.addedTransport || transporter.name || "N/A",
        data.driverName || "N/A",
        data.driverPhoneNumber || "N/A",
        (data.lorryNumber || "N/A").toUpperCase(),
      ],
    );

    const totalF = Number(data.totalFreight || 0);
    const adv = Number(data.advance || 0);
    const bal = totalF - adv;

    currentY = addTable(
      "Freight & Payment Summary",
      currentY,
      ["Freight Rate", "Total Freight", "Advance Paid", "Balance Payable"],
      [
        formatCurrency(data.freightRate),
        formatCurrency(totalF),
        formatCurrency(adv),
        formatCurrency(bal),
      ],
    );

    const signY = pageHeight - 40;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.1);
    doc.line(margin, signY + 10, margin + 50, signY + 10);
    doc.line(
      pageWidth - margin - 50,
      signY + 10,
      pageWidth - margin,
      signY + 10,
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("DRIVER'S SIGNATURE", margin + 25, signY + 14, {
      align: "center",
    });
    doc.text("AUTHORIZED SIGNATORY", pageWidth - margin - 25, signY + 14, {
      align: "center",
    });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.text(`FOR ${sellerCompanyName}`, pageWidth - margin - 25, signY + 5, {
      align: "center",
    });

    if (qr64) {
      doc.addImage(qr64, "PNG", pageWidth - margin - 35, signY - 32, 20, 20);
    }

    if (sign64) {
      doc.addImage(sign64, "PNG", pageWidth - margin - 40, signY - 8, 30, 10);
    }
    if (stamp64) {
      try {
        const GState = doc.GState || (jsPDF && jsPDF.GState);
        if (
          typeof GState === "function" &&
          typeof doc.setGState === "function"
        ) {
          doc.setGState(new GState({ opacity: 0.4 }));
          doc.addImage(
            stamp64,
            "PNG",
            pageWidth - margin - 45,
            signY - 20,
            25,
            25,
          );
          doc.setGState(new GState({ opacity: 1.0 }));
        } else {
          doc.addImage(
            stamp64,
            "PNG",
            pageWidth - margin - 45,
            signY - 20,
            25,
            25,
          );
        }
      } catch (err) {
        console.error("GState error:", err);
        doc.addImage(
          stamp64,
          "PNG",
          pageWidth - margin - 45,
          signY - 20,
          25,
          25,
        );
      }
    }

    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    const footerText =
      "This is a system-generated Lorry Challan issued via the Hansaria Food platform.\n" +
      "No physical signature is required.\n" +
      "Hansaria Food Private Limited shall not be held liable for any discrepancies\n" +
      "or inaccuracies in the loading data provided by users.";

    const splitFooter = doc.splitTextToSize(footerText, pageWidth - margin * 2);
    const lineHeight = 3.5;
    const footerHeight = splitFooter.length * lineHeight;
    const footerY = pageHeight - 8 - footerHeight;

    doc.text(splitFooter, pageWidth / 2, footerY, { align: "center" });

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=LoadingEntry-${data.billNumber || "document"}.pdf`,
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF Generation Error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/bulk", async (req, res) => {
  try {
    const { entries, saudaNo } = req.body;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ message: "No entries provided" });
    }

    const selfOrder = await SelfOrder.findOne({ saudaNo });

    const processedEntries = [];
    for (const entry of entries) {
      const newEntry = {
        ...entry,
        createdBy: req.user.sub,
        creatorName: req.user.name || "Unknown",
        creatorMobile: req.user.mobile || "",
        entryByRole: req.user.role,
      };
      // Assign loadingNo
      newEntry.loadingNo = await getNextLoadingNo(entry.loadingDate);

      if (selfOrder && entry.unloadingWeight) {
        const uWeight = parseFloat(entry.unloadingWeight) || 0;
        const buyerRate = selfOrder.buyerBrokerage?.brokerageBuyer || 0;
        let sellerRate = selfOrder.buyerBrokerage?.brokerageSupplier || 0;

        if (sellerRate === 0 && selfOrder.supplier && selfOrder.commodity) {
          sellerRate = await getSellerBrokerage(
            selfOrder.supplier,
            selfOrder.commodity,
          );
        }

        newEntry.buyerBrokerage = +(uWeight * buyerRate).toFixed(2);
        newEntry.sellerBrokerage = +(uWeight * sellerRate).toFixed(2);
      }
      processedEntries.push(newEntry);
    }

    const savedEntries = await LoadingEntry.insertMany(processedEntries);

    if (selfOrder) {
      const allEntries = await LoadingEntry.find({ saudaNo });
      const totalLoaded = allEntries.reduce(
        (sum, e) => sum + (e.loadingWeight || 0),
        0,
      );
      selfOrder.pendingQuantity = (selfOrder.quantity || 0) - totalLoaded;

      if (totalLoaded >= (selfOrder.quantity || 0) * 0.95) {
        selfOrder.status = "closed";
      } else {
        selfOrder.status = "active";
      }

      await selfOrder.save();
    }

    res.status(201).json({
      message: "Bulk entries saved successfully",
      count: savedEntries.length,
    });
  } catch (error) {
    console.error("Bulk save error:", error);
    res.status(400).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = {
      ...req.body,
      createdBy: req.user.sub,
      creatorName: req.user.name || "Unknown",
      creatorMobile: req.user.mobile || "",
      entryByRole: req.user.role,
    };
    // Assign loadingNo
    data.loadingNo = await getNextLoadingNo(data.loadingDate);

    const selfOrder = await SelfOrder.findOne({ saudaNo: data.saudaNo });

    if (selfOrder && data.unloadingWeight) {
      const uWeight = parseFloat(data.unloadingWeight) || 0;
      const buyerRate = selfOrder.buyerBrokerage?.brokerageBuyer || 0;
      let sellerRate = selfOrder.buyerBrokerage?.brokerageSupplier || 0;

      if (sellerRate === 0 && selfOrder.supplier && selfOrder.commodity) {
        sellerRate = await getSellerBrokerage(
          selfOrder.supplier,
          selfOrder.commodity,
        );
      }

      data.buyerBrokerage = +(uWeight * buyerRate).toFixed(2);
      data.sellerBrokerage = +(uWeight * sellerRate).toFixed(2);
    }

    const entry = await LoadingEntry.create(data);

    if (selfOrder) {
      const allEntries = await LoadingEntry.find({ saudaNo: entry.saudaNo });
      const totalLoaded = allEntries.reduce(
        (sum, e) => sum + (e.loadingWeight || 0),
        0,
      );
      selfOrder.pendingQuantity = (selfOrder.quantity || 0) - totalLoaded;

      if (totalLoaded >= (selfOrder.quantity || 0) * 0.95) {
        selfOrder.status = "closed";
      } else {
        selfOrder.status = "active";
      }

      await selfOrder.save();
    }

    res.status(201).json(entry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const oldEntry = await LoadingEntry.findById(req.params.id);
    if (!oldEntry) return res.status(404).json({ message: "Entry not found" });

    const data = { ...req.body };
    const selfOrder = await SelfOrder.findOne({
      saudaNo: data.saudaNo || oldEntry.saudaNo,
    });

    if (selfOrder && data.unloadingWeight) {
      const uWeight = parseFloat(data.unloadingWeight) || 0;
      const buyerRate = selfOrder.buyerBrokerage?.brokerageBuyer || 0;
      let sellerRate = selfOrder.buyerBrokerage?.brokerageSupplier || 0;

      if (sellerRate === 0 && selfOrder.supplier && selfOrder.commodity) {
        sellerRate = await getSellerBrokerage(
          selfOrder.supplier,
          selfOrder.commodity,
        );
      }

      data.buyerBrokerage = +(uWeight * buyerRate).toFixed(2);
      data.sellerBrokerage = +(uWeight * sellerRate).toFixed(2);
    }

    const updatedEntry = await LoadingEntry.findByIdAndUpdate(
      req.params.id,
      data,
      {
        new: true,
      },
    );

    if (
      oldEntry.loadingWeight !== updatedEntry.loadingWeight ||
      oldEntry.saudaNo !== updatedEntry.saudaNo
    ) {
      if (selfOrder) {
        const allEntries = await LoadingEntry.find({
          saudaNo: updatedEntry.saudaNo,
        });
        const totalLoaded = allEntries.reduce(
          (sum, e) => sum + (e.loadingWeight || 0),
          0,
        );
        selfOrder.pendingQuantity = (selfOrder.quantity || 0) - totalLoaded;

        if (totalLoaded >= (selfOrder.quantity || 0) * 0.95) {
          selfOrder.status = "closed";
        } else {
          selfOrder.status = "active";
        }

        await selfOrder.save();
      }
    }

    res.json(updatedEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const entry = await LoadingEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: "Entry not found" });

    const saudaNo = entry.saudaNo;
    await LoadingEntry.findByIdAndDelete(req.params.id);

    const selfOrder = await SelfOrder.findOne({ saudaNo });
    if (selfOrder) {
      const allEntries = await LoadingEntry.find({ saudaNo });
      const totalLoaded = allEntries.reduce(
        (sum, e) => sum + (e.loadingWeight || 0),
        0,
      );
      selfOrder.pendingQuantity = (selfOrder.quantity || 0) - totalLoaded;

      const tolerance = (selfOrder.quantity || 0) * 0.05;
      if (
        selfOrder.pendingQuantity <= 0 &&
        selfOrder.pendingQuantity >= -tolerance
      ) {
        selfOrder.status = "closed";
      } else {
        selfOrder.status = "active";
      }

      await selfOrder.save();
    }

    res.json({ message: "Entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
