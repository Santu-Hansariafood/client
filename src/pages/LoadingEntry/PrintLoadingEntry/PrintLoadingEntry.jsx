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

    const wrapText = (text, maxLength, maxLines = 3) => {
      if (!text) return [""];
      const words = text.split(" ");
      const lines = [];
      let currentLine = "";
      words.forEach((word) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (testLine.length > maxLength) {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
          if (lines.length >= maxLines - 1 && maxLines > 1) {
            currentLine = currentLine.substring(0, maxLength - 3) + "...";
            lines.push(currentLine);
            currentLine = "";
          }
        } else {
          currentLine = testLine;
        }
      });
      if (currentLine && lines.length < maxLines) lines.push(currentLine);
      if (lines.length === 0) lines.push("");
      return lines;
    };

    const hasValue = (value) =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== "" &&
      String(value).trim().toLowerCase() !== "n/a";

    const pickDisplay = (value, fallback = "N/A") =>
      hasValue(value) ? String(value).trim() : fallback;

    const formatMoney = (value) =>
      hasValue(value) ? `Rs. ${Number(value).toLocaleString("en-IN")}` : "N/A";

    const drawLabelValue = ({
      label,
      value,
      x,
      y,
      valueX,
      labelWidth,
      wrapLength = 60,
      maxLines = 2,
      lineHeight = 4,
    }) => {
      const lines = wrapText(pickDisplay(value), wrapLength, maxLines);
      const resolvedValueX = valueX ?? x + (labelWidth || 18);
      setBold();
      doc.text(label, x, y);
      setNormal();
      lines.forEach((line, index) => {
        doc.text(line, resolvedValueX, y + index * lineHeight);
      });
      return Math.max(lines.length, 1) * lineHeight;
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

    const shipToRaw = pickBestShipToCandidate([
      sauda.consignee,
      sauda.shipTo,
      data.consignee,
    ]);

    let shipToDetails = {};
    const shipToId = extractConsigneeId(shipToRaw);
    if (shipToId) {
      shipToDetails = (await fetchConsigneeById(shipToId)) || {};
    }

    if (!isConsigneeAddressLike(shipToDetails)) {
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

    const consigneeState = shipToDetails.state || "N/A";

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

    const logo64 = await getBase64(logo);
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

    const headerAddressLines = wrapText(sellerFullAddress, 85, 2);
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
    const sectionLabelX = margin + 5;
    const boxTitleX = margin + 5;
    const headerLeftLabelX = margin + 5;
    const headerLeftValueX = margin + 40;
    const headerRightLabelX = margin + 100;
    const headerRightValueX = margin + 135;
    const consigneeValueX = margin + 30;
    const buyerValueX = margin + 35;
    const goodsItemValueX = margin + 20;
    const goodsMetaLabelX = margin + 70;
    const goodsMetaValueX = margin + 85;
    const goodsWeightLabelX = margin + 110;
    const goodsWeightValueX = margin + 125;
    const routeValueX = margin + 30;
    const routeRightLabelX = margin + 80;
    const routeRightValueX = margin + 90;
    const routeAddressValueX = margin + 45;
    const freightLeftLabelX = margin + 5;
    const freightLeftValueX = margin + 35;
    const freightRightLabelX = margin + 90;
    const freightRightValueX = margin + 110;

    const headerBoxStartY = y - 5;
    const headerBoxHeight = 35;
    doc.setLineWidth(0.2);
    doc.rect(
      margin + 2,
      headerBoxStartY,
      pageWidth - margin * 2 - 4,
      headerBoxHeight,
    );
    doc.setFontSize(9);

    setBold();
    doc.text(`HFPL Sauda No:`, headerLeftLabelX, y);
    setNormal();
    doc.text(`${pick(data.saudaNo)}`, headerLeftValueX, y);

    setBold();
    doc.text(`Buyer Po No:`, headerRightLabelX, y);
    setNormal();
    doc.text(`${pick(sauda.poNumber || data.poNumber)}`, headerRightValueX, y);

    y += 7;

    setBold();
    doc.text(`Challan No:`, headerLeftLabelX, y);
    setNormal();
    doc.text(`${pick(data.billNumber)}`, headerLeftValueX, y);

    setBold();
    doc.text(`Date:`, headerRightLabelX, y);
    setNormal();
    doc.text(`${formatDate(data.loadingDate)}`, headerRightValueX, y);

    y += 7;

    setBold();
    doc.text(`Broker:`, headerLeftLabelX, y);
    setNormal();
    doc.text(`Hansaria Food Private Limited`, headerLeftValueX, y);

    y = headerBoxStartY + headerBoxHeight + 5;

    doc.setLineWidth(0.2);

    let shipToAddress =
      formatConsigneeAddress(shipToDetails) ||
      buildAddressFromObject(shipToDetails) ||
      [
        sauda.shipToAddress,
        sauda.consigneeAddress,
        sauda.deliveryAddress,
        data.shipToAddress,
        data.consigneeAddress,
      ].filter(Boolean)[0] ||
      "N/A";

    const cAddrLines = wrapText(shipToAddress, 78, 3);

    const consigneeName =
      shipToDetails.name ||
      shipToDetails.label ||
      shipToDetails.consigneeName ||
      (typeof shipToRaw === "string" ? shipToRaw : "") ||
      pick(data.consignee);

    const consigneeNameLines = wrapText(consigneeName, 78, 2);

    let shipToMobile =
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
      if (saudaMobileParts.length) shipToMobile = saudaMobileParts[0];
    }
    if (shipToMobile === "N/A") shipToMobile = consigneeMobile;
    if (shipToMobile === "N/A") {
      const dataMobileParts = [
        data.consigneeMobile,
        data.mobile,
        data.phone,
      ].filter(Boolean);
      if (dataMobileParts.length) shipToMobile = dataMobileParts[0];
    }

    const consigneeGstNo =
      shipToDetails.gstNo || shipToDetails.gstNumber || shipToDetails.gst || "";
    const consigneePanNo =
      shipToDetails.panNo || shipToDetails.panNumber || shipToDetails.pan || "";

    const consigneeBoxStartY = y - 5;
    let consigneeBoxHeight = 8;
    consigneeBoxHeight += Math.max(consigneeNameLines.length, 1) * 4;
    consigneeBoxHeight += Math.max(cAddrLines.length, 1) * 4;
    consigneeBoxHeight += 4;
    if (consigneeGstNo) consigneeBoxHeight += 4;
    if (consigneePanNo) consigneeBoxHeight += 4;
    consigneeBoxHeight += 7;

    doc.rect(
      margin + 2,
      consigneeBoxStartY,
      pageWidth - margin * 2 - 4,
      consigneeBoxHeight,
    );

    let consigneeCurrentY = consigneeBoxStartY + 5;
    setBold();
    doc.setFontSize(9);
    doc.text("SHIP TO (CONSIGNEE)", boxTitleX, consigneeCurrentY);
    consigneeCurrentY += 5;

    consigneeCurrentY += drawLabelValue({
      label: "Consignee:",
      value: consigneeNameLines.join(" "),
      x: sectionLabelX,
      y: consigneeCurrentY,
      valueX: consigneeValueX,
      wrapLength: 74,
      maxLines: 2,
    });

    consigneeCurrentY += drawLabelValue({
      label: "Address:",
      value: cAddrLines.join(", "),
      x: sectionLabelX,
      y: consigneeCurrentY,
      valueX: consigneeValueX,
      wrapLength: 78,
      maxLines: 3,
    });

    consigneeCurrentY += drawLabelValue({
      label: "Mobile:",
      value: shipToMobile,
      x: sectionLabelX,
      y: consigneeCurrentY,
      valueX: consigneeValueX,
      wrapLength: 40,
      maxLines: 1,
    });

    if (consigneeGstNo) {
      consigneeCurrentY += drawLabelValue({
        label: "GST:",
        value: consigneeGstNo,
        x: sectionLabelX,
        y: consigneeCurrentY,
        valueX: consigneeValueX,
        wrapLength: 45,
        maxLines: 1,
      });
    }

    if (consigneePanNo) {
      drawLabelValue({
        label: "PAN No:",
        value: consigneePanNo,
        x: sectionLabelX,
        y: consigneeCurrentY,
        valueX: consigneeValueX,
        wrapLength: 45,
        maxLines: 1,
      });
    }

    y = consigneeBoxStartY + consigneeBoxHeight + 5;

    const buyerBoxStartY = y - 5;
    const buyerNameLines = wrapText(buyerCompanyName, 70, 2);
    const buyerAddrLines = wrapText(buyerFullAddress, 72, 3);

    let buyerBoxHeight = 8;
    buyerBoxHeight += Math.max(buyerNameLines.length, 1) * 4;
    buyerBoxHeight += Math.max(buyerAddrLines.length, 1) * 4;
    if (buyerPanNo) buyerBoxHeight += 4;
    if (buyerGstNo) buyerBoxHeight += 4;
    buyerBoxHeight += 7;

    doc.rect(
      margin + 2,
      buyerBoxStartY,
      pageWidth - margin * 2 - 4,
      buyerBoxHeight,
    );

    let buyerCurrentY = buyerBoxStartY + 5;
    setBold();
    doc.setFontSize(9);
    doc.text(`BUYER ACCOUNT`, boxTitleX, buyerCurrentY);
    buyerCurrentY += 5;

    buyerCurrentY += drawLabelValue({
      label: "Buyer Company:",
      value: buyerNameLines.join(" "),
      x: sectionLabelX,
      y: buyerCurrentY,
      valueX: buyerValueX,
      wrapLength: 62,
      maxLines: 2,
    });

    buyerCurrentY += drawLabelValue({
      label: "Address:",
      value: buyerAddrLines.join(", "),
      x: sectionLabelX,
      y: buyerCurrentY,
      valueX: buyerValueX,
      wrapLength: 62,
      maxLines: 3,
    });

    if (buyerPanNo) {
      buyerCurrentY += drawLabelValue({
        label: "PAN No:",
        value: buyerPanNo,
        x: sectionLabelX,
        y: buyerCurrentY,
        valueX: buyerValueX,
        wrapLength: 36,
        maxLines: 1,
      });
    }
    if (buyerGstNo) {
      drawLabelValue({
        label: "GST:",
        value: buyerGstNo,
        x: sectionLabelX,
        y: buyerCurrentY,
        valueX: buyerValueX,
        wrapLength: 36,
        maxLines: 1,
      });
    }

    y = buyerBoxStartY + buyerBoxHeight + 5;

    const goodsBoxStartY = y - 5;
    const commodityLines = wrapText(pick(data.commodity), 55, 2);
    const goodsBoxHeight = 14 + Math.max(commodityLines.length - 1, 0) * 4;
    doc.rect(
      margin + 2,
      goodsBoxStartY,
      pageWidth - margin * 2 - 4,
      goodsBoxHeight,
    );
    setBold();
    doc.setFontSize(9);
    doc.text(`DESCRIPTION OF GOODS`, boxTitleX, y);

    const goodsContentY = y + 4;
    setBold();
    doc.text(`Item:`, sectionLabelX, goodsContentY);
    setNormal();
    commodityLines.forEach((line, idx) => {
      doc.text(line, goodsItemValueX, goodsContentY + idx * 4);
    });

    const goodsMetaY =
      goodsContentY + Math.max(commodityLines.length - 1, 0) * 4;
    setBold();
    doc.text(`Bags:`, goodsMetaLabelX, goodsMetaY);
    setNormal();
    doc.text(`${pick(data.bags)}`, goodsMetaValueX, goodsMetaY);
    setBold();
    doc.text(`Weight:`, goodsWeightLabelX, goodsMetaY);
    setNormal();
    doc.text(
      hasValue(data.loadingWeight) ? `${data.loadingWeight} Tons` : "N/A",
      goodsWeightValueX,
      goodsMetaY,
    );

    y = goodsBoxStartY + goodsBoxHeight + 5;

    const transporterLines = wrapText(displayTransporterName, 68, 2);
    const lorryNo = pickDisplay(data.lorryNumber).toUpperCase();
    const driverLine = pickDisplay(data.driverName);
    const driverMobileLine = pickDisplay(data.driverPhoneNumber);
    const tAddrLines = wrapText(displayTransporterAddress, 66, 3);
    const routeBoxStartY = y - 5;

    let routeBoxHeight = 8;
    routeBoxHeight += 4;
    routeBoxHeight += Math.max(transporterLines.length, 1) * 4;
    routeBoxHeight += 4;
    routeBoxHeight += 4;
    routeBoxHeight += Math.max(tAddrLines.length, 1) * 4;
    routeBoxHeight += 7;

    doc.rect(
      margin + 2,
      routeBoxStartY,
      pageWidth - margin * 2 - 4,
      routeBoxHeight,
    );

    let routeCurrentY = routeBoxStartY + 5;
    setBold();
    doc.setFontSize(9);
    doc.text(`ROUTE & VEHICLE DETAILS`, boxTitleX, routeCurrentY);
    routeCurrentY += 5;

    setBold();
    doc.text(`From:`, sectionLabelX, routeCurrentY);
    setNormal();
    doc.text(`${sellerState}`, routeValueX, routeCurrentY);
    setBold();
    doc.text(`To:`, goodsMetaLabelX, routeCurrentY);
    setNormal();
    doc.text(`${consigneeState}`, goodsMetaValueX, routeCurrentY);
    routeCurrentY += 5;

    setBold();
    doc.text(`Transporter:`, sectionLabelX, routeCurrentY);
    setNormal();
    transporterLines.forEach((line, idx) => {
      doc.text(line, routeValueX, routeCurrentY + idx * 4);
    });
    routeCurrentY += Math.max(transporterLines.length, 1) * 4;

    setBold();
    doc.text(`Lorry No:`, sectionLabelX, routeCurrentY);
    setNormal();
    doc.text(lorryNo, routeValueX, routeCurrentY);
    routeCurrentY += 4;

    setBold();
    doc.text(`Driver:`, sectionLabelX, routeCurrentY);
    setNormal();
    doc.text(driverLine, routeValueX, routeCurrentY);
    setBold();
    doc.text(`Mob:`, routeRightLabelX, routeCurrentY);
    setNormal();
    doc.text(driverMobileLine, routeRightValueX, routeCurrentY);
    routeCurrentY += 4;

    setBold();
    doc.text(`Transporter Address:`, sectionLabelX, routeCurrentY);
    setNormal();
    tAddrLines.forEach((line, idx) => {
      doc.text(line, routeAddressValueX, routeCurrentY + idx * 4);
    });

    y = routeBoxStartY + routeBoxHeight + 5;

    const freightBoxStartY = y - 5;
    const totalFreight = formatMoney(data.totalFreight);
    const advance = formatMoney(data.advance);
    const toPayAmount =
      hasValue(data.totalFreight) && hasValue(data.advance)
        ? Number(data.totalFreight) - Number(data.advance)
        : hasValue(data.totalFreight)
          ? Number(data.totalFreight)
          : null;
    const toPayValue = toPayAmount !== null ? formatMoney(toPayAmount) : "N/A";
    const freightBoxHeight = 18;
    doc.rect(
      margin + 2,
      freightBoxStartY,
      pageWidth - margin * 2 - 4,
      freightBoxHeight,
    );
    setBold();
    doc.setFontSize(9);
    doc.text(`FREIGHT DETAILS`, boxTitleX, y);

    const freightContentY = y + 5;
    setBold();
    doc.text("Total Freight:", freightLeftLabelX, freightContentY);
    setNormal();
    doc.text(totalFreight, freightLeftValueX, freightContentY);
    setBold();
    doc.text("Advance:", freightRightLabelX, freightContentY);
    setNormal();
    doc.text(advance, freightRightValueX, freightContentY);
    setBold();
    doc.text("To Pay:", freightLeftLabelX, freightContentY + 5);
    setNormal();
    doc.text(toPayValue, freightLeftValueX, freightContentY + 5);

    y = freightBoxStartY + freightBoxHeight + 10;

    const signY = pageHeight - 38;
    setBold();
    doc.setFontSize(9);
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
