import { Router } from "express";
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import SelfOrder from "../models/SelfOrder.js";
import LoadingEntry from "../models/LoadingEntry.js";
import Seller from "../models/Seller.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();

const PARTY_TYPES = ["buyer", "seller"];
const REPORT_TYPES = ["sauda", "loading", "unloading"];

const REPORT_COLUMNS = [
  { header: "Date", key: "date", width: 15 },
  { header: "Sauda No", key: "saudaNo", width: 16 },
  { header: "Consignee", key: "consignee", width: 22 },
  { header: "Buyer Company", key: "buyerCompany", width: 24 },
  { header: "Seller Company", key: "sellerCompany", width: 24 },
  { header: "Commodity", key: "commodity", width: 16 },
  { header: "Quantity", key: "quantity", width: 12 },
  { header: "Rate", key: "rate", width: 10 },
  { header: "Lorry No", key: "lorryNumber", width: 14 },
  { header: "Loading Date", key: "loadingDate", width: 15 },
  { header: "Loading Wt", key: "loadingWeight", width: 12 },
  { header: "Unloading Date", key: "unloadingDate", width: 15 },
  { header: "Unloading Wt", key: "unloadingWeight", width: 12 },
];

const pdfColumnStyles = {
  0: { cellWidth: 18 },
  1: { cellWidth: 18 },
  2: { cellWidth: 26, halign: "left" },
  3: { cellWidth: 29, halign: "left" },
  4: { cellWidth: 29, halign: "left" },
  5: { cellWidth: 18, halign: "left" },
  6: { cellWidth: 14 },
  7: { cellWidth: 12 },
  8: { cellWidth: 16 },
  9: { cellWidth: 18 },
  10: { cellWidth: 15 },
  11: { cellWidth: 18 },
  12: { cellWidth: 15 },
};

const getScaledPdfColumnStyles = (tableWidth) => {
  const totalBaseWidth = Object.values(pdfColumnStyles).reduce(
    (sum, column) => sum + Number(column.cellWidth || 0),
    0,
  );

  if (!totalBaseWidth) {
    return pdfColumnStyles;
  }

  const scaleFactor = tableWidth / totalBaseWidth;

  return Object.fromEntries(
    Object.entries(pdfColumnStyles).map(([index, column]) => [
      index,
      {
        ...column,
        cellWidth: Number(
          (Number(column.cellWidth || 0) * scaleFactor).toFixed(2),
        ),
      },
    ]),
  );
};

const normalizePartyType = (value) =>
  PARTY_TYPES.includes(String(value || "").toLowerCase())
    ? String(value).toLowerCase()
    : "buyer";

const normalizeReportType = (value) =>
  REPORT_TYPES.includes(String(value || "").toLowerCase())
    ? String(value).toLowerCase()
    : "sauda";

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "-";

const formatNumber = (value, digits = 3) => Number(value || 0).toFixed(digits);

const parseDateValue = (value, endOfDay = false) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0,
  );
  return parsed;
};

const requireAdmin = (req, res) => {
  if (req.user?.role !== "Admin") {
    res.status(403).json({ message: "Only admin can access these reports" });
    return false;
  }
  return true;
};

const validateReportFilters = (partyType, partyValue, startDate, endDate) => {
  if (!partyValue || !startDate || !endDate) {
    return "Party, start date, and end date are required";
  }

  if (partyType === "seller" && !isValidObjectId(partyValue)) {
    return "Invalid seller selected";
  }

  if (startDate > endDate) {
    return "Start date cannot be after end date";
  }

  return null;
};

const buildDateMatch = (field, startDate, endDate) => {
  const start = parseDateValue(startDate);
  const end = parseDateValue(endDate, true);
  const condition = {};

  if (start) condition.$gte = start;
  if (end) condition.$lte = end;

  return Object.keys(condition).length > 0 ? { [field]: condition } : {};
};

const buildSaudaMatch = ({ partyType, partyValue, startDate, endDate }) => {
  const match = {
    ...buildDateMatch("poDate", startDate, endDate),
  };

  if (partyType === "buyer") {
    match.buyer = partyValue;
  } else {
    match.supplier = new mongoose.Types.ObjectId(partyValue);
  }

  return match;
};

const buildLoadingEntryMatch = ({
  reportType,
  partyType,
  partyValue,
  startDate,
  endDate,
}) => {
  const dateField =
    reportType === "unloading" ? "unloadingDate" : "loadingDate";
  const match = {
    ...buildDateMatch(dateField, startDate, endDate),
  };

  if (reportType === "unloading") {
    match.unloadingDate = {
      ...(match.unloadingDate || {}),
      $ne: null,
    };
    match.unloadingWeight = { $gt: 0 };
  }

  if (partyType === "seller") {
    match.supplier = new mongoose.Types.ObjectId(partyValue);
  }

  return match;
};

const buildSaudaDataPipeline = ({
  partyType,
  partyValue,
  startDate,
  endDate,
  skip,
  limit,
}) => {
  const pipeline = [
    { $match: buildSaudaMatch({ partyType, partyValue, startDate, endDate }) },
    { $sort: { poDate: -1, createdAt: -1, saudaNo: -1 } },
  ];

  if (Number.isInteger(skip) && skip >= 0) {
    pipeline.push({ $skip: skip });
  }

  if (Number.isInteger(limit) && limit > 0) {
    pipeline.push({ $limit: limit });
  }

  pipeline.push(
    {
      $lookup: {
        from: "loadingentries",
        let: { saudaNo: "$saudaNo" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$saudaNo", "$$saudaNo"] },
            },
          },
          {
            $group: {
              _id: null,
              loadingWeight: { $sum: { $ifNull: ["$loadingWeight", 0] } },
              unloadingWeight: { $sum: { $ifNull: ["$unloadingWeight", 0] } },
              loadingDate: { $max: "$loadingDate" },
              unloadingDate: { $max: "$unloadingDate" },
            },
          },
        ],
        as: "loadingSummary",
      },
    },
    {
      $unwind: {
        path: "$loadingSummary",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        date: "$poDate",
        saudaNo: { $ifNull: ["$saudaNo", "N/A"] },
        consignee: { $ifNull: ["$consignee", "N/A"] },
        buyerCompany: { $ifNull: ["$buyerCompany", "N/A"] },
        sellerCompany: { $ifNull: ["$supplierCompany", "N/A"] },
        commodity: { $ifNull: ["$commodity", "N/A"] },
        quantity: { $ifNull: ["$quantity", 0] },
        rate: { $ifNull: ["$rate", 0] },
        lorryNumber: { $literal: "" },
        loadingDate: "$loadingSummary.loadingDate",
        loadingWeight: { $ifNull: ["$loadingSummary.loadingWeight", 0] },
        unloadingDate: "$loadingSummary.unloadingDate",
        unloadingWeight: { $ifNull: ["$loadingSummary.unloadingWeight", 0] },
      },
    },
  );

  return pipeline;
};

const buildSaudaCountPipeline = (filters) => [
  { $match: buildSaudaMatch(filters) },
  { $count: "total" },
];

const buildSaudaTotalsPipeline = (filters) => [
  { $match: buildSaudaMatch(filters) },
  {
    $lookup: {
      from: "loadingentries",
      let: { saudaNo: "$saudaNo" },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ["$saudaNo", "$$saudaNo"] },
          },
        },
        {
          $group: {
            _id: null,
            loadingWeight: { $sum: { $ifNull: ["$loadingWeight", 0] } },
            unloadingWeight: { $sum: { $ifNull: ["$unloadingWeight", 0] } },
          },
        },
      ],
      as: "loadingSummary",
    },
  },
  {
    $unwind: {
      path: "$loadingSummary",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $group: {
      _id: null,
      totalRecords: { $sum: 1 },
      totalLoadingWeight: {
        $sum: { $ifNull: ["$loadingSummary.loadingWeight", 0] },
      },
      totalUnloadingWeight: {
        $sum: { $ifNull: ["$loadingSummary.unloadingWeight", 0] },
      },
    },
  },
];

const buildLoadingDataPipeline = ({
  reportType,
  partyType,
  partyValue,
  startDate,
  endDate,
  skip,
  limit,
}) => {
  const dateField =
    reportType === "unloading" ? "unloadingDate" : "loadingDate";
  const pipeline = [
    {
      $match: buildLoadingEntryMatch({
        reportType,
        partyType,
        partyValue,
        startDate,
        endDate,
      }),
    },
    {
      $lookup: {
        from: "selforders",
        localField: "saudaNo",
        foreignField: "saudaNo",
        as: "sauda",
      },
    },
    {
      $unwind: {
        path: "$sauda",
        preserveNullAndEmptyArrays: true,
      },
    },
  ];

  if (partyType === "buyer") {
    pipeline.push({
      $match: {
        "sauda.buyer": partyValue,
      },
    });
  }

  pipeline.push({ $sort: { [dateField]: -1, createdAt: -1, saudaNo: -1 } });

  if (Number.isInteger(skip) && skip >= 0) {
    pipeline.push({ $skip: skip });
  }

  if (Number.isInteger(limit) && limit > 0) {
    pipeline.push({ $limit: limit });
  }

  pipeline.push({
    $project: {
      _id: 1,
      date: `$${dateField}`,
      saudaNo: { $ifNull: ["$saudaNo", "N/A"] },
      consignee: {
        $ifNull: ["$consignee", { $ifNull: ["$sauda.consignee", "N/A"] }],
      },
      buyerCompany: {
        $ifNull: ["$buyerCompany", { $ifNull: ["$sauda.buyerCompany", "N/A"] }],
      },
      sellerCompany: {
        $ifNull: [
          "$supplierCompany",
          { $ifNull: ["$sauda.supplierCompany", "N/A"] },
        ],
      },
      commodity: {
        $ifNull: ["$commodity", { $ifNull: ["$sauda.commodity", "N/A"] }],
      },
      quantity: { $ifNull: ["$sauda.quantity", 0] },
      rate: { $ifNull: ["$sauda.rate", 0] },
      lorryNumber: { $ifNull: ["$lorryNumber", ""] },
      loadingDate: "$loadingDate",
      loadingWeight: { $ifNull: ["$loadingWeight", 0] },
      unloadingDate: "$unloadingDate",
      unloadingWeight: { $ifNull: ["$unloadingWeight", 0] },
    },
  });

  return pipeline;
};

const buildLoadingCountPipeline = (filters) => {
  const pipeline = [
    {
      $match: buildLoadingEntryMatch(filters),
    },
    {
      $lookup: {
        from: "selforders",
        localField: "saudaNo",
        foreignField: "saudaNo",
        as: "sauda",
      },
    },
    {
      $unwind: {
        path: "$sauda",
        preserveNullAndEmptyArrays: true,
      },
    },
  ];

  if (filters.partyType === "buyer") {
    pipeline.push({
      $match: {
        "sauda.buyer": filters.partyValue,
      },
    });
  }

  pipeline.push({ $count: "total" });
  return pipeline;
};

const buildLoadingTotalsPipeline = (filters) => {
  const pipeline = [
    {
      $match: buildLoadingEntryMatch(filters),
    },
    {
      $lookup: {
        from: "selforders",
        localField: "saudaNo",
        foreignField: "saudaNo",
        as: "sauda",
      },
    },
    {
      $unwind: {
        path: "$sauda",
        preserveNullAndEmptyArrays: true,
      },
    },
  ];

  if (filters.partyType === "buyer") {
    pipeline.push({
      $match: {
        "sauda.buyer": filters.partyValue,
      },
    });
  }

  pipeline.push({
    $group: {
      _id: null,
      totalRecords: { $sum: 1 },
      totalLoadingWeight: { $sum: { $ifNull: ["$loadingWeight", 0] } },
      totalUnloadingWeight: { $sum: { $ifNull: ["$unloadingWeight", 0] } },
    },
  });

  return pipeline;
};

const getReportRows = async ({
  partyType,
  reportType,
  partyValue,
  startDate,
  endDate,
  page = 1,
  limit = 10,
  exportAll = false,
}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 10);
  const skip = exportAll ? null : (safePage - 1) * safeLimit;
  const dataPipelineBuilder =
    reportType === "sauda" ? buildSaudaDataPipeline : buildLoadingDataPipeline;
  const countPipelineBuilder =
    reportType === "sauda"
      ? buildSaudaCountPipeline
      : buildLoadingCountPipeline;
  const totalsPipelineBuilder =
    reportType === "sauda"
      ? buildSaudaTotalsPipeline
      : buildLoadingTotalsPipeline;

  const filters = {
    partyType,
    reportType,
    partyValue,
    startDate,
    endDate,
  };

  const [rows, totalResult, totalsResult] = await Promise.all([
    (reportType === "sauda" ? SelfOrder : LoadingEntry).aggregate(
      dataPipelineBuilder({
        ...filters,
        skip,
        limit: exportAll ? null : safeLimit,
      }),
    ),
    (reportType === "sauda" ? SelfOrder : LoadingEntry).aggregate(
      countPipelineBuilder(filters),
    ),
    (reportType === "sauda" ? SelfOrder : LoadingEntry).aggregate(
      totalsPipelineBuilder(filters),
    ),
  ]);

  const total = totalResult[0]?.total || 0;
  const summary = totalsResult[0] || {
    totalRecords: 0,
    totalLoadingWeight: 0,
    totalUnloadingWeight: 0,
  };

  return { rows, total, summary };
};

const getPartyOptions = async (partyType) => {
  if (partyType === "buyer") {
    const buyers = await SelfOrder.distinct("buyer", {
      buyer: { $nin: [null, ""] },
    });

    return buyers
      .filter(Boolean)
      .sort((a, b) => String(a).localeCompare(String(b)))
      .map((buyerName) => ({
        value: buyerName,
        label: buyerName,
      }));
  }

  const sellers = await Seller.find({
    status: { $ne: "inactive" },
  })
    .select("_id sellerName")
    .lean();

  return sellers
    .filter((seller) => seller?._id && seller?.sellerName)
    .sort((a, b) => a.sellerName.localeCompare(b.sellerName))
    .map((seller) => ({
      value: seller._id.toString(),
      label: seller.sellerName,
    }));
};

const getPdfTitle = (partyType, reportType) =>
  `${partyType.toUpperCase()} ${reportType.toUpperCase()} REPORT`;

const buildWorksheetRows = (rows = []) =>
  rows.map((item) => ({
    date: formatDate(item.date),
    saudaNo: item.saudaNo || "N/A",
    consignee: item.consignee || "N/A",
    buyerCompany: item.buyerCompany || "N/A",
    sellerCompany: item.sellerCompany || "N/A",
    commodity: item.commodity || "N/A",
    quantity: formatNumber(item.quantity, 3),
    rate: formatNumber(item.rate, 2),
    lorryNumber: item.lorryNumber || "-",
    loadingDate: formatDate(item.loadingDate),
    loadingWeight: formatNumber(item.loadingWeight, 3),
    unloadingDate: formatDate(item.unloadingDate),
    unloadingWeight: formatNumber(item.unloadingWeight, 3),
  }));

const getPartyDisplayLabel = (partyType) =>
  partyType === "buyer" ? "Buyer Name" : "Seller Name";

router.get("/filters", async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const partyType = normalizePartyType(req.query.partyType);
    const parties = await getPartyOptions(partyType);
    res.json({ parties });
  } catch (error) {
    console.error("Sauda report filters error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const partyType = normalizePartyType(req.query.partyType);
    const reportType = normalizeReportType(req.query.reportType);
    const { partyValue, startDate, endDate } = req.query;
    const validationError = validateReportFilters(
      partyType,
      partyValue,
      startDate,
      endDate,
    );

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const result = await getReportRows({
      partyType,
      reportType,
      partyValue,
      startDate,
      endDate,
      page: req.query.page,
      limit: req.query.limit,
    });

    res.json({
      data: result.rows,
      total: result.total,
      summary: result.summary,
    });
  } catch (error) {
    console.error("Sauda report fetch error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/excel", async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const partyType = normalizePartyType(req.query.partyType);
    const reportType = normalizeReportType(req.query.reportType);
    const { partyValue, startDate, endDate } = req.query;
    const validationError = validateReportFilters(
      partyType,
      partyValue,
      startDate,
      endDate,
    );

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { rows } = await getReportRows({
      partyType,
      reportType,
      partyValue,
      startDate,
      endDate,
      exportAll: true,
    });

    if (!rows.length) {
      return res.status(404).json({ message: "No report data found" });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(
      `${partyType}-${reportType}-report`,
    );

    worksheet.columns = REPORT_COLUMNS;
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "0F766E" },
    };
    worksheet.getRow(1).alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    buildWorksheetRows(rows).forEach((row) => {
      worksheet.addRow(row);
    });

    worksheet.views = [{ state: "frozen", ySplit: 1 }];
    worksheet.autoFilter = {
      from: "A1",
      to: "M1",
    };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${partyType}_${reportType}_report.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Sauda report excel error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/pdf", async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const partyType = normalizePartyType(req.query.partyType);
    const reportType = normalizeReportType(req.query.reportType);
    const { partyValue, partyLabel, startDate, endDate } = req.query;
    const validationError = validateReportFilters(
      partyType,
      partyValue,
      startDate,
      endDate,
    );

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { rows, summary } = await getReportRows({
      partyType,
      reportType,
      partyValue,
      startDate,
      endDate,
      exportAll: true,
    });

    if (!rows.length) {
      return res.status(404).json({ message: "No report data found" });
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 6;
    const footerHeight = 14;
    const firstPageTableStartY = margin + 48;
    const logoPath = path.join(__dirname, "../assets/Hans.png");
    let logoBase64 = null;

    if (fs.existsSync(logoPath)) {
      logoBase64 = fs.readFileSync(logoPath, { encoding: "base64" });
    }

    const drawPageFrame = () => {
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.35);
      doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);
    };

    const drawFirstPageHeader = () => {
      if (logoBase64) {
        doc.addImage(logoBase64, "PNG", margin + 4, margin + 3, 20, 20);
      }

      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      doc.text("HANSARIA FOOD PRIVATE LIMITED", pageWidth / 2, margin + 8, {
        align: "center",
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(
        "207, Maharshi Debendra Road, 6th Floor, Room No. 111, Kolkata - 700007",
        pageWidth / 2,
        margin + 13,
        { align: "center" },
      );
      doc.text(
        "Contact: +91 98304 33535 | Email: info@hansariafood.com",
        pageWidth / 2,
        margin + 17,
        { align: "center" },
      );

      doc.line(margin, margin + 22, pageWidth - margin, margin + 22);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(getPdfTitle(partyType, reportType), pageWidth / 2, margin + 29, {
        align: "center",
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(
        `${getPartyDisplayLabel(partyType)}: ${partyLabel || partyValue}`,
        margin + 4,
        margin + 35,
      );
      doc.text(
        `Date Range: ${formatDate(startDate)} to ${formatDate(endDate)}`,
        margin + 4,
        margin + 40,
      );
      doc.text(
        `Generated On: ${new Date().toLocaleString("en-GB")}`,
        pageWidth - margin - 4,
        margin + 35,
        { align: "right" },
      );
      doc.text(
        `Records: ${summary.totalRecords || rows.length}`,
        pageWidth - margin - 4,
        margin + 40,
        { align: "right" },
      );

      doc.line(margin, margin + 44, pageWidth - margin, margin + 44);
    };

    const drawFooter = (pageNumber, totalPages) => {
      const footerLineY = pageHeight - footerHeight;
      const footerTextY = pageHeight - footerHeight + 4.5;

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.25);
      doc.line(margin + 2, footerLineY, pageWidth - margin - 2, footerLineY);

      doc.setTextColor(90, 90, 90);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.text("*This report has been system-generated by the Hansaria Food Private Limited System and is intended for internal reference purposes only. No handwritten signature or company seal is required.*", pageWidth / 2, footerTextY, {
        align: "center",
      });

      doc.setFont("helvetica", "normal");
      doc.text(
        `Page ${pageNumber} of ${totalPages}`,
        pageWidth - margin - 3,
        footerTextY,
        { align: "right" },
      );
      doc.setTextColor(0, 0, 0);
    };

    const tableWidth = pageWidth - 2 * (margin + 1);
    const scaledPdfColumnStyles = getScaledPdfColumnStyles(tableWidth);

    autoTable(doc, {
      head: [REPORT_COLUMNS.map((column) => column.header)],
      body: buildWorksheetRows(rows).map((row) =>
        REPORT_COLUMNS.map((column) => row[column.key]),
      ),
      startY: firstPageTableStartY,
      theme: "grid",
      margin: {
        top: margin + 4,
        right: margin + 1,
        bottom: footerHeight + 2,
        left: margin + 1,
      },
      tableWidth,
      styles: {
        fontSize: 7,
        cellPadding: 1.2,
        lineColor: [203, 213, 225],
        lineWidth: 0.1,
        halign: "center",
        valign: "middle",
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [15, 118, 110],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      columnStyles: scaledPdfColumnStyles,
    });

    let finalY = doc.lastAutoTable?.finalY || firstPageTableStartY + 20;
    const requiredEndSpace = 24;
    const contentBottomLimit = pageHeight - footerHeight - 4;

    if (finalY + requiredEndSpace > contentBottomLimit) {
      doc.addPage();
      finalY = margin + 8;
    }

    const summaryY = finalY + 6;

    // Totals on the left
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(
      `Total Loading Wt: ${formatNumber(summary.totalLoadingWeight, 3)}`,
      margin + 4,
      summaryY,
    );
    doc.text(
      `Total Unloading Wt: ${formatNumber(summary.totalUnloadingWeight, 3)}`,
      margin + 72,
      summaryY,
    );

    // *This report has been system-generated by the Hansaria Food Private Limited System and is intended for internal reference purposes only. No handwritten signature or company seal is required.*, Thanks and Regards, and Hansaria Food Pvt Ltd aligned to the right
    const rightAlignX = pageWidth - margin - 4;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.text("*This report has been system-generated by the Hansaria Food Private Limited System and is intended for internal reference purposes only. No handwritten signature or company seal is required.*", rightAlignX, summaryY + 6, {
      align: "right",
    });

    doc.setFont("helvetica", "normal");
    doc.text("Thanks and Regards,", rightAlignX, summaryY + 11, {
      align: "right",
    });

    doc.setFont("helvetica", "bold");
    doc.text("Hansaria Food Pvt Ltd", rightAlignX, summaryY + 16, {
      align: "right",
    });

    const totalPages = doc.getNumberOfPages();
    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      doc.setPage(pageNumber);
      drawPageFrame();
      if (pageNumber === 1) {
        drawFirstPageHeader();
      }
      drawFooter(pageNumber, totalPages);
    }

    const pdfBuffer = doc.output("arraybuffer");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${partyType}_${reportType}_report.pdf`,
    );
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error("Sauda report pdf error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
