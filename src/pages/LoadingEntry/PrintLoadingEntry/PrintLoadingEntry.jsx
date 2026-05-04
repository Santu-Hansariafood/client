import { jsPDF } from "jspdf";
import { toast } from "react-toastify";
import api from "../../../utils/apiClient/apiClient";
import logo from "../../../assets/Hans.png";

const PrintLoadingEntry = async (data) => {
  if (!data) {
    toast.error("No data available for PDF generation");
    return null;
  }

  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 14;

    const formatDate = (date) => {
      const d = new Date(date);
      return isNaN(d)
        ? "N/A"
        : d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
    };

    const pick = (v) => v || "N/A";

    const setBold = () => doc.setFont("helvetica", "bold");
    const setNormal = () => doc.setFont("helvetica", "normal");

    const getBase64 = (img) =>
      new Promise((resolve) => {
        const image = new Image();
        image.src = img;
        image.crossOrigin = "Anonymous";

        image.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = image.width;
          canvas.height = image.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(image, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        };

        image.onerror = () => resolve(null);
      });

    const logo64 = await getBase64(logo);

    const safeFetch = async (url) => {
      try {
        const res = await api.get(url);
        return res.data?.data || res.data || [];
      } catch {
        return [];
      }
    };

    const safeGet = async (url) => {
      try {
        const res = await api.get(url);
        return res.data?.data || res.data || null;
      } catch {
        return null;
      }
    };

    const [
      sellers,
      sellerCompanies,
      buyers,
      companies,
      saudaDataResponse,
      transporterDetails,
    ] = await Promise.all([
      safeFetch("/sellers?limit=0"),
      safeFetch("/seller-company?limit=0"),
      safeFetch("/buyers?limit=0"),
      safeFetch("/companies?limit=0"),
      safeFetch(`/self-order?search=${encodeURIComponent(data.saudaNo)}`),
      data?.transporterId
        ? safeGet(`/transporters/${data.transporterId}`)
        : Promise.resolve(null),
    ]);

    const saudaData = Array.isArray(saudaDataResponse)
      ? saudaDataResponse
      : saudaDataResponse?.data || [];
    const sauda =
      (saudaData || []).find(
        (s) => String(s.saudaNo) === String(data.saudaNo),
      ) || {};

    const normalizeText = (value) =>
      String(value || "")
        .trim()
        .toLowerCase();

    const normalizeLoose = (value) =>
      String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
        .replace(/\s+/g, " ");

    const isObjectId = (value) =>
      /^[a-f\d]{24}$/i.test(String(value || "").trim());

    const extractConsigneeId = (candidate) => {
      if (!candidate) return "";
      if (typeof candidate === "string") {
        return isObjectId(candidate) ? candidate.trim() : "";
      }

      if (typeof candidate !== "object") return "";

      const nestedValue = candidate.value;
      const direct =
        candidate._id ||
        candidate.id ||
        (typeof nestedValue === "string" ? nestedValue : "") ||
        (nestedValue && typeof nestedValue === "object"
          ? nestedValue._id || nestedValue.id || ""
          : "");

      return isObjectId(direct) ? String(direct) : "";
    };

    const getConsigneeCandidateName = (candidate) => {
      if (!candidate) return "";
      if (typeof candidate === "string") return candidate.trim();
      if (typeof candidate !== "object") return "";

      const nestedValue = candidate.value;
      return String(
        candidate.name ||
          candidate.label ||
          candidate.consigneeName ||
          (typeof nestedValue === "string" ? nestedValue : "") ||
          "",
      ).trim();
    };

    const isConsigneeAddressLike = (details) =>
      Boolean(
        details &&
        typeof details === "object" &&
        (details.address ||
          details.location ||
          details.district ||
          details.state ||
          details.pin ||
          details.pinNo ||
          details.pincode ||
          details.pinCode),
      );

    const firstNonEmpty = (...values) => {
      for (const v of values) {
        if (!v) continue;
        if (typeof v === "string") {
          const trimmed = v.trim();
          if (trimmed) return trimmed;
          continue;
        }
        return v;
      }
      return null;
    };

    const pickBestShipToCandidate = (candidates) => {
      const list = (candidates || []).filter(Boolean);
      const withId = list.find((c) => Boolean(extractConsigneeId(c)));
      if (withId) return withId;
      const withAddress = list.find((c) => isConsigneeAddressLike(c));
      if (withAddress) return withAddress;
      return firstNonEmpty(...list);
    };

    const shipToRaw = pickBestShipToCandidate([
      sauda.consignee,
      sauda.shipTo,
      data.consignee,
    ]);
    const deriveShipToSearchKey = (raw) => {
      if (!raw) return "";
      let text = "";
      if (typeof raw === "string") {
        text = raw;
      } else if (typeof raw === "object") {
        const nested = raw.value;
        text =
          raw.name ||
          raw.label ||
          raw.consigneeName ||
          (typeof nested === "string" ? nested : "") ||
          "";
      }
      text = String(text || "").trim();
      if (!text) return "";
      const beforeDash = text.split("-")[0]?.trim();
      return beforeDash || text;
    };

    const hasUsefulShipToAddress = isConsigneeAddressLike;

    const pickBestConsigneeMatch = (rows, key) => {
      const needle = normalizeLoose(key);
      if (!needle) return null;

      const needleTokens = new Set(needle.split(" ").filter(Boolean));

      let best = null;
      let bestScore = -1;

      for (const row of rows || []) {
        const hay = normalizeLoose(row?.name);
        if (!hay) continue;

        let score = 0;
        if (hay === needle) score = 100;
        else if (hay.includes(needle) || needle.includes(hay)) score = 85;
        else {
          const hayTokens = hay.split(" ").filter(Boolean);
          const common = hayTokens.reduce(
            (acc, t) => acc + (needleTokens.has(t) ? 1 : 0),
            0,
          );
          score = (common / Math.max(1, needleTokens.size)) * 70;
        }

        if (score > bestScore) {
          bestScore = score;
          best = row;
        }
      }

      return bestScore >= 40 ? best : null;
    };

    const fetchConsigneeById = async (id) => {
      if (!isObjectId(id)) return null;
      const direct = await safeGet(`/consignees/${id}`);
      if (direct && typeof direct === "object") return direct;

      const limit = 200;
      const maxPages = 25;

      for (let page = 1; page <= maxPages; page += 1) {
        try {
          const res = await api.get(`/consignees?page=${page}&limit=${limit}`);
          const payload = res.data || {};
          const rows = Array.isArray(payload?.data) ? payload.data : [];
          const found = rows.find((c) => String(c?._id) === String(id));
          if (found) return found;

          const pages = Number(payload?.pages || 0);
          if (pages && page >= pages) break;
          if (rows.length === 0) break;
        } catch {
          break;
        }
      }

      return null;
    };

    const fetchConsigneeBySearch = async (key) => {
      if (!key) return null;
      try {
        const res = await api.get(
          `/consignees?page=1&limit=50&search=${encodeURIComponent(key)}`,
        );
        const payload = res.data || {};
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        return pickBestConsigneeMatch(rows, key);
      } catch {
        return null;
      }
    };

    let shipToDetails = {};
    const shipToId = extractConsigneeId(shipToRaw);
    if (shipToId) {
      shipToDetails = (await fetchConsigneeById(shipToId)) || {};
    }

    if (!hasUsefulShipToAddress(shipToDetails)) {
      const key = deriveShipToSearchKey(shipToRaw);
      const best = key ? await fetchConsigneeBySearch(key) : null;
      if (best) shipToDetails = best;
      else if (typeof shipToRaw === "object" && shipToRaw)
        shipToDetails = shipToRaw;
    }

    const consigneeMobile =
      shipToDetails.phone ||
      shipToDetails.mobile ||
      shipToDetails.mobileNo ||
      data.consigneeMobile ||
      "N/A";

    const transporter =
      transporterDetails && typeof transporterDetails === "object"
        ? transporterDetails
        : {};

    const displayTransporterName = String(
      transporter.name || data.addedTransport || "N/A",
    );
    const displayTransporterAddress = String(transporter.address || "N/A");

    const supplierCompanyNameNormalized = normalizeText(data.supplierCompany);

    const matchingSeller =
      (sellers || []).find((s) => String(s._id) === String(data.supplier)) ||
      (sellers || []).find(
        (s) => normalizeText(s.sellerName) === supplierCompanyNameNormalized,
      ) ||
      null;

    let matchingSellerCompany =
      (sellerCompanies || []).find(
        (sc) => normalizeText(sc.companyName) === supplierCompanyNameNormalized,
      ) ||
      (sellerCompanies || []).find((sc) => {
        const scName = normalizeText(sc.companyName);
        return (
          scName.includes(supplierCompanyNameNormalized) ||
          supplierCompanyNameNormalized.includes(scName)
        );
      }) ||
      null;

    if (!matchingSellerCompany && matchingSeller?.companies?.length) {
      matchingSellerCompany =
        (sellerCompanies || []).find((sc) =>
          matchingSeller.companies.some(
            (cName) => normalizeText(cName) === normalizeText(sc.companyName),
          ),
        ) ||
        (sellerCompanies || []).find((sc) =>
          matchingSeller.companies.some((cName) => {
            const normalizedCName = normalizeText(cName);
            const normalizedSCName = normalizeText(sc.companyName);
            return (
              normalizedCName.includes(normalizedSCName) ||
              normalizedSCName.includes(normalizedCName)
            );
          }),
        ) ||
        null;
    }

    const sellerGstNo =
      matchingSellerCompany?.gstNo || matchingSeller?.gstNumber || "";
    const sellerPanNo =
      matchingSellerCompany?.panNo || matchingSeller?.panNumber || "";
    const sellerTaxNumber = sellerGstNo || sellerPanNo || "N/A";
    const sellerTaxLabel = sellerGstNo ? "GST" : "PAN";

    const sellerFullAddress = matchingSellerCompany
      ? [
          matchingSellerCompany.address,
          matchingSellerCompany.district,
          matchingSellerCompany.state,
          matchingSellerCompany.pinNo,
        ]
          .filter(Boolean)
          .join(", ")
      : data.supplierAddress ||
        [sauda.location, sauda.state].filter(Boolean).join(", ") ||
        data.from ||
        "N/A";

    const sellerState = matchingSellerCompany?.state || sauda.state || "N/A";

    const wrapText = (text, maxLength) => {
      if (!text) return [""];
      const words = text.split(" ");
      const lines = [];
      let currentLine = "";

      words.forEach((word) => {
        if ((currentLine + word).length > maxLength) {
          lines.push(currentLine.trim());
          currentLine = word + " ";
        } else {
          currentLine += word + " ";
        }
      });
      lines.push(currentLine.trim());
      return lines;
    };

    const buildAddressFromObject = (obj) => {
      if (!obj || typeof obj !== "object") return "";
      return [
        obj.address,
        obj.location,
        obj.city,
        obj.district,
        obj.state,
        obj.pin || obj.pincode || obj.pinNo || obj.pinCode,
      ]
        .filter(Boolean)
        .join(", ");
    };

    const rawBuyerKey = data?.buyerCompany ?? data?.buyer ?? "";
    const normalizedBuyerKey = normalizeText(rawBuyerKey);

    const matchingBuyerCompany =
      (companies || []).find((company) => {
        const idMatch =
          company?._id &&
          rawBuyerKey &&
          String(company._id) === String(rawBuyerKey);
        const nameMatch =
          normalizeText(company?.companyName) === normalizedBuyerKey;
        return idMatch || nameMatch;
      }) ||
      (buyers || []).find((buyer) => {
        const idMatch =
          buyer?._id &&
          rawBuyerKey &&
          String(buyer._id) === String(rawBuyerKey);
        const nameMatch =
          normalizeText(buyer?.companyName) === normalizedBuyerKey;
        return idMatch || nameMatch;
      }) ||
      (sellers || []).find((seller) => {
        const idMatch =
          seller?._id &&
          rawBuyerKey &&
          String(seller._id) === String(rawBuyerKey);
        const nameMatch =
          normalizeText(seller?.companyName) === normalizedBuyerKey;
        return idMatch || nameMatch;
      }) ||
      null;

    const buyerState =
      matchingBuyerCompany?.state || data.placeOfDeliveryState || "N/A";

    const buyerLocation = matchingBuyerCompany
      ? [matchingBuyerCompany.district, matchingBuyerCompany.state]
          .filter(Boolean)
          .join(", ")
      : data.placeOfDelivery || "N/A";

    const buyerCompanyName =
      matchingBuyerCompany?.companyName ||
      data.buyerCompany ||
      data.buyer ||
      "N/A";

    const buyerFullAddress = matchingBuyerCompany
      ? buildAddressFromObject(matchingBuyerCompany) ||
        [matchingBuyerCompany.district, matchingBuyerCompany.state]
          .filter(Boolean)
          .join(", ")
      : data.placeOfDelivery || "N/A";

    const buyerGstNo =
      matchingBuyerCompany?.gstNo ||
      matchingBuyerCompany?.gstNumber ||
      matchingBuyerCompany?.gst ||
      "";
    const buyerPanNo =
      matchingBuyerCompany?.panNo ||
      matchingBuyerCompany?.panNumber ||
      matchingBuyerCompany?.pan ||
      "";

    const consigneeAddress =
      buildAddressFromObject(shipToDetails) || data.deliveryAddress || "N/A";

    if (logo64) {
      doc.addImage(logo64, "PNG", pageWidth - margin - 35, 12, 30, 22);
    }

    const sellerCompanyName = data?.supplierCompany || "N/A";
    const vendorCode = matchingSeller?.vendorCode || data?.vendorCode || "";

    const textStartX = margin + 5;
    setBold();
    doc.setFontSize(15);
    doc.text(`${sellerCompanyName.toUpperCase()}`, textStartX, 17);
    if (vendorCode) {
      setNormal();
      doc.setFontSize(9);
      doc.text(`(Vendor Code: ${vendorCode})`, textStartX, 21);
    }

    setNormal();
    doc.setFontSize(8.5);
    const merchantTextY = vendorCode ? 25 : 22;
    doc.text("General Merchant & Commission Agent", textStartX, merchantTextY);

    const headerAddressLines = wrapText(sellerFullAddress, 85);
    headerAddressLines.slice(0, 2).forEach((line, index) => {
      doc.text(line, textStartX, merchantTextY + 4 + index * 4);
    });

    const taxY =
      headerAddressLines.length > 1 ? merchantTextY + 12 : merchantTextY + 8;
    if (sellerTaxNumber !== "N/A") {
      doc.text(`${sellerTaxLabel}: ${sellerTaxNumber}`, textStartX, taxY);
    }

    setBold();
    doc.setFontSize(13);
    doc.text("LORRY CHALLAN", pageWidth / 2, 45, { align: "center" });

    doc.setLineWidth(0.5);
    doc.rect(margin, 10, pageWidth - margin * 2, pageHeight - 18);

    let y = 58;

    doc.setLineWidth(0.2);
    doc.rect(margin + 2, y - 5, pageWidth - margin * 2 - 4, 35);
    doc.setFontSize(9);

    setBold();
    doc.text(`HFPL Sauda No:`, margin + 5, y);
    setNormal();
    doc.text(`${pick(data.saudaNo)}`, margin + 40, y);

    setBold();
    doc.text(`Buyer Po No:`, margin + 100, y);
    setNormal();
    doc.text(`${pick(sauda.poNumber || data.poNumber)}`, margin + 135, y);

    y += 7;

    setBold();
    doc.text(`Challan No:`, margin + 5, y);
    setNormal();
    doc.text(`${pick(data.billNumber)}`, margin + 35, y);

    setBold();
    doc.text(`Date:`, margin + 100, y);
    setNormal();
    doc.text(`${formatDate(data.loadingDate)}`, margin + 120, y);

    y += 7;

    setBold();
    doc.text(`Broker:`, pageWidth / 2, y, { align: "center" });
    setNormal();
    doc.text(`Hansaria Food Private Limited`, pageWidth / 2, y + 4, {
      align: "center",
    });

    y += 22;

    doc.setLineWidth(0.2);
    doc.rect(margin + 2, y - 5, pageWidth - margin * 2 - 4, 28);
    setBold();
    doc.setFontSize(9);
    doc.text(`SHIP TO (CONSIGNEE)`, margin + 5, y);
    y += 5;
    setBold();
    doc.text(`Consignee:`, margin + 5, y);
    setNormal();
    const consigneeName =
      shipToDetails.name ||
      shipToDetails.label ||
      shipToDetails.consigneeName ||
      (typeof shipToRaw === "string" ? shipToRaw : "") ||
      pick(data.consignee);
    doc.text(`${consigneeName}`, margin + 30, y);

    y += 4;
    setBold();
    doc.text(`Address:`, margin + 5, y);
    setNormal();

    let shipToAddress = "N/A";

    const formatConsigneeAddress = (details) => {
      if (!details || typeof details !== "object") return "";
      const base = details.address || details.location || "";
      const district = details.district || "";
      const state = details.state || "";
      const pin =
        details.pin ||
        details.pinNo ||
        details.pincode ||
        details.pinCode ||
        "";

      const place = [district, state].filter(Boolean).join(", ");

      let out = "";
      if (base) out = base;
      if (place) out = out ? `${out}, ${place}` : place;
      if (pin) out = out ? `${out} - ${pin}` : pin;
      return out;
    };

    shipToAddress =
      formatConsigneeAddress(shipToDetails) ||
      buildAddressFromObject(shipToDetails) ||
      [
        [shipToDetails.district, shipToDetails.state]
          .filter(Boolean)
          .join(", ") +
          (shipToDetails.pin ||
          shipToDetails.pinNo ||
          shipToDetails.pincode ||
          shipToDetails.pinCode
            ? ` - ${
                shipToDetails.pin ||
                shipToDetails.pinNo ||
                shipToDetails.pincode ||
                shipToDetails.pinCode
              }`
            : ""),
        sauda.shipToAddress,
        sauda.consigneeAddress,
        sauda.deliveryAddress,
        sauda.address,
        data.shipToAddress,
        data.consigneeAddress,
        data.address,
      ].filter(Boolean)[0] ||
      "N/A";

    const cAddrLines = wrapText(shipToAddress, 100);
    cAddrLines.slice(0, 2).forEach((line, index) => {
      doc.text(line, margin + 30, y + index * 4);
    });

    y += 4;
    setBold();
    doc.text(`Mobile:`, margin + 5, y);
    setNormal();
    let shipToMobile = "N/A";

    shipToMobile =
      shipToDetails.mobile ||
      shipToDetails.phone ||
      shipToDetails.mobileNo ||
      "N/A";

    if (shipToMobile === "N/A") {
      const saudaMobileParts = [
        sauda.shipToMobile,
        sauda.consigneeMobile,
        sauda.mobile,
        sauda.phone,
      ].filter(Boolean);
      if (saudaMobileParts.length > 0) {
        shipToMobile = saudaMobileParts[0];
      }
    }

    if (shipToMobile === "N/A") {
      shipToMobile = consigneeMobile;
    }

    if (shipToMobile === "N/A") {
      const dataMobileParts = [
        data.consigneeMobile,
        data.mobile,
        data.phone,
      ].filter(Boolean);
      if (dataMobileParts.length > 0) {
        shipToMobile = dataMobileParts[0];
      }
    }

    doc.text(`${shipToMobile}`, margin + 30, y);

    y += 20;

    doc.setLineWidth(0.2);
    const buyerBoxTopY = y;
    doc.rect(margin + 2, buyerBoxTopY - 5, pageWidth - margin * 2 - 4, 44);
    setBold();
    doc.setFontSize(9);
    doc.text(`BUYER ACCOUNT`, margin + 5, buyerBoxTopY);
    y = buyerBoxTopY + 6;
    doc.setFontSize(9);
    setBold();
    doc.text(`Buyer Company:`, margin + 5, y);
    setNormal();
    const buyerNameLines = wrapText(buyerCompanyName, 70);
    buyerNameLines.slice(0, 1).forEach((line, index) => {
      doc.text(line, margin + 35, y + index * 4);
    });

    y += 6;
    setBold();
    doc.text(`Address:`, margin + 5, y);
    setNormal();
    const buyerAddrLines = wrapText(buyerFullAddress, 70);
    buyerAddrLines.slice(0, 2).forEach((line, index) => {
      doc.text(line, margin + 35, y + index * 4);
    });

    y += 10;
    if (buyerPanNo) {
      setBold();
      doc.text(`PAN No:`, margin + 5, y);
      setNormal();
      doc.text(`${buyerPanNo}`, margin + 35, y);
      y += 5;
    }

    if (buyerGstNo) {
      setBold();
      doc.text(`GST:`, margin + 5, y);
      setNormal();
      doc.text(`${buyerGstNo}`, margin + 35, y);
    }

    y = buyerBoxTopY + 52;

    doc.rect(margin + 2, y - 5, pageWidth - margin * 2 - 4, 13);
    setBold();
    doc.setFontSize(9);
    doc.text(`DESCRIPTION OF GOODS`, margin + 5, y);
    y += 4;
    doc.setFontSize(9);
    setBold();
    doc.text(`Item:`, margin + 5, y);
    setNormal();
    doc.text(`${pick(data.commodity)}`, margin + 20, y);
    setBold();
    doc.text(`Bags:`, margin + 70, y);
    setNormal();
    doc.text(`${pick(data.bags)}`, margin + 85, y);
    setBold();
    doc.text(`Weight:`, margin + 110, y);
    setNormal();
    doc.text(`${pick(data.loadingWeight)} Tons`, margin + 125, y);

    y += 15;

    doc.setLineWidth(0.2);
    doc.rect(margin + 2, y - 5, pageWidth - margin * 2 - 4, 65);
    setBold();
    doc.setFontSize(9);
    doc.text(`ROUTE & VEHICLE DETAILS`, margin + 5, y);
    y += 6;
    doc.setFontSize(9);
    setBold();
    doc.text(`From:`, margin + 5, y);
    setNormal();
    doc.text(`${sellerState}`, margin + 20, y);
    setBold();
    doc.text(`To:`, margin + 70, y);
    setNormal();
    doc.text(`${buyerState}`, margin + 80, y);

    y += 6;
    setBold();
    doc.text(`Transporter:`, margin + 5, y);
    setNormal();
    doc.text(`${displayTransporterName}`, margin + 30, y);

    y += 5;
    setBold();
    doc.text(`Lorry No:`, margin + 5, y);
    setNormal();
    doc.text(`${(data.lorryNumber || "N/A").toUpperCase()}`, margin + 30, y);

    y += 5;
    setBold();
    doc.text(`Driver:`, margin + 5, y);
    setNormal();
    doc.text(`${data.driverName || "N/A"}`, margin + 30, y);
    setBold();
    doc.text(`Mob:`, margin + 80, y);
    setNormal();
    doc.text(`${data.driverPhoneNumber || "N/A"}`, margin + 90, y);

    y += 5;
    setBold();
    doc.text(`Transporter Address:`, margin + 5, y);
    setNormal();
    const tAddrLines = wrapText(displayTransporterAddress, 80);
    tAddrLines.slice(0, 1).forEach((line, index) => {
      doc.text(line, margin + 45, y + index * 4);
    });

    y += 17;

    doc.setLineWidth(0.2);
    doc.rect(margin + 2, y - 5, pageWidth - margin * 2 - 4, 28);
    setBold();
    doc.setFontSize(9);
    doc.text(`FREIGHT DETAILS`, margin + 5, y);
    y += 6;
    const totalFreight = data.totalFreight
      ? `Rs. ${Number(data.totalFreight).toLocaleString("en-IN")}`
      : "N/A";
    const advance = data.advance
      ? `Rs. ${Number(data.advance).toLocaleString("en-IN")}`
      : "N/A";
    const toPayValue =
      data.totalFreight && data.advance
        ? `Rs. ${Number(data.totalFreight - data.advance).toLocaleString("en-IN")}`
        : "N/A";

    setBold();
    doc.text("Total Freight:", margin + 5, y);
    setNormal();
    doc.text(totalFreight, margin + 35, y);
    setBold();
    doc.text("Advance:", margin + 90, y);
    setNormal();
    doc.text(advance, margin + 110, y);
    setBold();
    doc.text("To Pay:", pageWidth - margin - 50, y);
    setNormal();
    doc.text(toPayValue, pageWidth - margin - 25, y);

    y += 15;

    const signY = pageHeight - 35;

    setBold();
    doc.text("Driver Signature", margin + 10, signY);
    doc.line(margin + 10, signY + 2, margin + 70, signY + 2);

    setBold();
    doc.text("Authorized Signature", pageWidth - margin - 70, signY);
    doc.line(
      pageWidth - margin - 70,
      signY + 2,
      pageWidth - margin - 10,
      signY + 2,
    );

    doc.setFontSize(7);
    setBold();
    doc.text(
      "*Any shortage or damage shall be deducted from the freight amount.",
      pageWidth / 2,
      pageHeight - 21,
      { align: "center" },
    );

    doc.text(
      "*This is a computer-generated challan issued by Hansaria Food Private Limited. It is for informational purposes only and shall not be considered as a legal document or proof of delivery.",
      pageWidth / 2,
      pageHeight - 12,
      { align: "center", maxWidth: 180 },
    );
    return doc;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export default PrintLoadingEntry;
