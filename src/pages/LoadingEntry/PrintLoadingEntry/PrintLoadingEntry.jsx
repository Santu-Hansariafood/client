import { jsPDF } from "jspdf";
import { toast } from "react-toastify";
import api from "../../../utils/apiClient/apiClient";
import logo from "../../../assets/Hans.png";
import {
  formatDate,
  pick,
  setBold,
  setNormal,
  getBase64,
  normalizeText,
  wrapText,
  hasValue,
  pickDisplay,
  formatMoney,
  drawLabelValue,
  buildAddressFromObject,
  formatConsigneeAddress,
  firstNonEmpty,
} from "./utils/pdfUtils";
import {
  safeFetch,
  safeGet,
} from "./utils/dataFetchers";
import {
  extractBuyerInfoFromSauda,
  extractConsigneeId,
  extractConsigneeTextValues,
  isConsigneeAddressLike,
  pickBestShipToCandidate,
  deriveShipToSearchKey,
  findExactConsigneeMatch,
  resolveConsigneeDetails,
} from "./utils/dataExtractors";
import {
  normalizeLoose,
  isObjectId,
  pickBestConsigneeMatch,
  getAllConsigneeRows,
  fetchConsigneeBySearch,
} from "./utils/dataFetchers";

const PrintLoadingEntry = async (inputData) => {
  if (!inputData) {
    toast.error("No data available for PDF generation");
    return null;
  }

  try {
    let entries = Array.isArray(inputData) ? inputData : [inputData];
    const firstEntry = entries[0];
    const saudaNo = firstEntry.saudaNo;

    if (!Array.isArray(inputData) && saudaNo) {
      try {
        const res = await api.get(`/loading-entries/sauda/${saudaNo}`);
        const fetchedEntries = Array.isArray(res.data) ? res.data : [];
        if (fetchedEntries.length > 0) {
          entries = fetchedEntries;
        }
      } catch (err) {
        console.error("Error fetching entries by sauda number:", err);
      }
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 14;

    const [
      sellers,
      sellerCompanies,
      buyers,
      companies,
      saudaDataResponse,
    ] = await Promise.all([
      safeFetch("/sellers?limit=0"),
      safeFetch("/seller-company?limit=0"),
      safeFetch("/buyers?limit=0"),
      safeFetch("/companies?limit=0"),
      safeFetch(`/self-order?saudaNo=${encodeURIComponent(firstEntry.saudaNo)}`),
    ]);

    const saudaData = Array.isArray(saudaDataResponse)
      ? saudaDataResponse
      : saudaDataResponse?.data || [];
    const sauda =
      (saudaData || []).find(
        (s) => String(s.saudaNo) === String(firstEntry.saudaNo),
      ) || (saudaData[0] || {});

    const shipToCandidates = [
      sauda.consignee,
      sauda.shipTo,
      firstEntry.consignee,
    ].filter(Boolean);

    const shipToRaw = pickBestShipToCandidate(shipToCandidates);

    let shipToDetails = (await resolveConsigneeDetails(shipToCandidates)) || {};

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
      firstEntry.consigneeMobile ||
      "N/A";

    const consigneeState = shipToDetails.state || "N/A";

    const supplierCompanyNameNormalized = normalizeText(firstEntry.supplierCompany);
    const matchingSeller =
      (sellers || []).find((s) => String(s._id) === String(firstEntry.supplier)) ||
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
      : firstEntry.supplierAddress ||
        [sauda.location, sauda.state].filter(Boolean).join(", ") ||
        firstEntry.from ||
        "N/A";

    const sellerState = matchingSellerCompany?.state || sauda.state || "N/A";

    const rawBuyerKey = firstEntry?.buyerCompany ?? firstEntry?.buyer ?? "";
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

    const logo64 = await getBase64(logo);
    if (logo64) {
      doc.addImage(logo64, "PNG", pageWidth - margin - 35, 12, 30, 22);
    }

    const sellerCompanyName = firstEntry?.supplierCompany || "N/A";
    const vendorCode = matchingSeller?.vendorCode || firstEntry?.vendorCode || "";
    const textStartX = margin + 5;

    setBold(doc);
    doc.setFontSize(15);
    doc.text(`${sellerCompanyName.toUpperCase()}`, textStartX, 17);
    if (vendorCode) {
      setNormal(doc);
      doc.setFontSize(9);
      doc.text(`(Vendor Code: ${vendorCode})`, textStartX, 21);
    }

    setNormal(doc);
    doc.setFontSize(8.5);
    const merchantTextY = vendorCode ? 23 : 20;

    const headerAddressLines = wrapText(sellerFullAddress, 85, 2);
    headerAddressLines.slice(0, 2).forEach((line, index) => {
      doc.text(line, textStartX, merchantTextY + 4 + index * 4);
    });

    const taxY =
      headerAddressLines.length > 1 ? merchantTextY + 12 : merchantTextY + 8;
    if (sellerTaxNumber !== "N/A") {
      doc.text(`${sellerTaxLabel}: ${sellerTaxNumber}`, textStartX, taxY);
    }

    setBold(doc);
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

    setBold(doc);
    doc.text(`HFPL Sauda No:`, headerLeftLabelX, y);
    setNormal(doc);
    doc.text(`${pick(firstEntry.saudaNo)}`, headerLeftValueX, y);

    setBold(doc);
    doc.text(`Buyer Po No:`, headerRightLabelX, y);
    setNormal(doc);
    doc.text(`${pick(sauda.poNumber || firstEntry.poNumber)}`, headerRightValueX, y);

    y += 7;

    setBold(doc);
    doc.text(`Challan No:`, headerLeftLabelX, y);
    setNormal(doc);
    doc.text(`${pick(firstEntry.billNumber)}`, headerLeftValueX, y);

    setBold(doc);
    doc.text(`Date:`, headerRightLabelX, y);
    setNormal(doc);
    doc.text(`${formatDate(firstEntry.loadingDate)}`, headerRightValueX, y);

    y += 7;

    setBold(doc);
    doc.text(`Broker:`, headerLeftLabelX, y);
    setNormal(doc);
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
        firstEntry.shipToAddress,
        firstEntry.consigneeAddress,
      ].filter(Boolean)[0] ||
      "N/A";

    const cAddrLines = wrapText(shipToAddress, 78, 3);

    const consigneeName =
      shipToDetails.name ||
      shipToDetails.label ||
      shipToDetails.consigneeName ||
      (typeof shipToRaw === "string" ? shipToRaw : "") ||
      pick(firstEntry.consignee);

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
        firstEntry.consigneeMobile,
        firstEntry.mobile,
        firstEntry.phone,
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
    setBold(doc);
    doc.setFontSize(9);
    doc.text("SHIP TO (CONSIGNEE)", boxTitleX, consigneeCurrentY);
    consigneeCurrentY += 5;

    consigneeCurrentY += drawLabelValue({
      doc,
      label: "Consignee:",
      value: consigneeNameLines.join(" "),
      x: sectionLabelX,
      y: consigneeCurrentY,
      valueX: consigneeValueX,
      wrapLength: 74,
      maxLines: 2,
    });

    consigneeCurrentY += drawLabelValue({
      doc,
      label: "Address:",
      value: cAddrLines.join(", "),
      x: sectionLabelX,
      y: consigneeCurrentY,
      valueX: consigneeValueX,
      wrapLength: 78,
      maxLines: 3,
    });

    consigneeCurrentY += drawLabelValue({
      doc,
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
        doc,
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
        doc,
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

    // Get buyer information directly from self order API (sauda data)
    const buyerCompany = 
      sauda.buyerCompany ||
      sauda.companyId?.companyName ||
      sauda.buyerName ||
      firstEntry.buyerCompany ||
      firstEntry.buyer ||
      'N/A';
      
    const buyerAddress = 
      sauda.buyerAddress ||
      sauda.deliveryAddress ||
      [sauda.companyId?.location, sauda.companyId?.district, sauda.companyId?.state, sauda.companyId?.pinCode].filter(Boolean).join(', ') ||
      firstEntry.placeOfDelivery ||
      'N/A';
      
    const buyerGst = 
      sauda.buyerGstNo ||
      sauda.buyerGstNumber ||
      sauda.buyerGst ||
      sauda.gstNo ||
      sauda.companyId?.gstNumber ||
      '';
      
    const buyerPan = 
      sauda.buyerPanNo ||
      sauda.buyerPanNumber ||
      sauda.buyerPan ||
      sauda.panNo ||
      sauda.companyId?.panNumber ||
      '';
    
    const buyerNameLines = wrapText(buyerCompany, 70, 2);
    const buyerAddrLines = wrapText(buyerAddress, 72, 3);

    let buyerBoxHeight = 8;
    buyerBoxHeight += Math.max(buyerNameLines.length, 1) * 4;
    buyerBoxHeight += Math.max(buyerAddrLines.length, 1) * 4;
    if (buyerGst) buyerBoxHeight += 4;
    if (buyerPan) buyerBoxHeight += 4;
    buyerBoxHeight += 7;

    const buyerBoxStartY = y - 5;
    doc.rect(
      margin + 2,
      buyerBoxStartY,
      pageWidth - margin * 2 - 4,
      buyerBoxHeight,
    );

    let buyerCurrentY = buyerBoxStartY + 5;
    setBold(doc);
    doc.setFontSize(9);

    doc.text("BUYER ACCOUNT", boxTitleX, buyerCurrentY);

    buyerCurrentY += 5;

    buyerCurrentY += drawLabelValue({
      doc,
      label: "Buyer Company:",
      value: buyerNameLines.join(" "),
      x: sectionLabelX,
      y: buyerCurrentY,
      valueX: buyerValueX,
      wrapLength: 62,
      maxLines: 2,
    });

    buyerCurrentY += drawLabelValue({
      doc,
      label: "Address:",
      value: buyerAddrLines.join(", "),
      x: sectionLabelX,
      y: buyerCurrentY,
      valueX: buyerValueX,
      wrapLength: 62,
      maxLines: 3,
    });

    if (buyerPan) {
      buyerCurrentY += drawLabelValue({
        doc,
        label: "PAN No:",
        value: buyerPan,
        x: sectionLabelX,
        y: buyerCurrentY,
        valueX: buyerValueX,
        wrapLength: 36,
        maxLines: 1,
      });
    }

    if (buyerGst) {
      drawLabelValue({
        doc,
        label: "GST:",
        value: buyerGst,
        x: sectionLabelX,
        y: buyerCurrentY,
        valueX: buyerValueX,
        wrapLength: 36,
        maxLines: 1,
      });
    }

    y = buyerBoxStartY + buyerBoxHeight + 5;

    const checkAddPage = (requiredHeight) => {
      if (y + requiredHeight > pageHeight - margin - 50) {
        doc.addPage();
        y = margin + 20;
      }
    };

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      let transporterDetails = null;
      if (entry.transporterId) {
        try {
          transporterDetails = await safeGet(`/transporters/${entry.transporterId}`);
        } catch (err) {
          console.error("Error fetching transporter details:", err);
        }
      }
      const transporter =
        transporterDetails && typeof transporterDetails === "object"
          ? transporterDetails
          : {};
      const displayTransporterName = String(
        transporter.name || entry.addedTransport || "N/A",
      );
      const displayTransporterAddress = String(transporter.address || "N/A");

      setBold(doc);
      doc.setFontSize(10);
      doc.text(`Entry #${i + 1}`, boxTitleX, y);
      y += 5;

      const entryBoxStartY = y - 5;
      let entryBoxHeight = 10;

      const commodityLines = wrapText(pick(entry.commodity), 55, 2);
      entryBoxHeight += 14 + Math.max(commodityLines.length - 1, 0) * 4 + 5;

      const transporterLines = wrapText(displayTransporterName, 68, 2);
      const lorryNo = pickDisplay(entry.lorryNumber).toUpperCase();
      const driverLine = pickDisplay(entry.driverName);
      const driverMobileLine = pickDisplay(entry.driverPhoneNumber);
      const tAddrLines = wrapText(displayTransporterAddress, 66, 3);
      entryBoxHeight += 8 + 4 + Math.max(transporterLines.length, 1) * 4 + 4 + 4 + Math.max(tAddrLines.length, 1) * 4 + 7 + 5;

      entryBoxHeight += 18 + 5;

      checkAddPage(entryBoxHeight);

      const currentEntryBoxStartY = y - 5;
      doc.rect(
        margin + 2,
        currentEntryBoxStartY,
        pageWidth - margin * 2 - 4,
        entryBoxHeight,
      );

      const goodsBoxTitleY = y;
      const goodsBoxStartYForEntry = goodsBoxTitleY - 5;
      setBold(doc);
      doc.setFontSize(9);
      doc.text(`DESCRIPTION OF GOODS`, boxTitleX, goodsBoxTitleY);

      const goodsContentY = goodsBoxTitleY + 4;
      setBold(doc);
      doc.text(`Item:`, sectionLabelX, goodsContentY);
      setNormal(doc);
      commodityLines.forEach((line, idx) => {
        doc.text(line, goodsItemValueX, goodsContentY + idx * 4);
      });

      const goodsMetaY =
        goodsContentY + Math.max(commodityLines.length - 1, 0) * 4;
      setBold(doc);
      doc.text(`Bags:`, goodsMetaLabelX, goodsMetaY);
      setNormal(doc);
      doc.text(`${pick(entry.bags)}`, goodsMetaValueX, goodsMetaY);
      setBold(doc);
      doc.text(`Weight:`, goodsWeightLabelX, goodsMetaY);
      setNormal(doc);
      doc.text(
        hasValue(entry.loadingWeight) ? `${entry.loadingWeight} Tons` : "N/A",
        goodsWeightValueX,
        goodsMetaY,
      );

      y = goodsBoxTitleY + 14 + Math.max(commodityLines.length - 1, 0) * 4 + 5;

      const routeBoxTitleY = y;
      let routeCurrentY = routeBoxTitleY;
      setBold(doc);
      doc.setFontSize(9);
      doc.text(`ROUTE & VEHICLE DETAILS`, boxTitleX, routeCurrentY);
      routeCurrentY += 5;

      setBold(doc);
      doc.text(`From:`, sectionLabelX, routeCurrentY);
      setNormal(doc);
      doc.text(`${sellerState}`, routeValueX, routeCurrentY);
      setBold(doc);
      doc.text(`To:`, goodsMetaLabelX, routeCurrentY);
      setNormal(doc);
      doc.text(`${consigneeState}`, goodsMetaValueX, routeCurrentY);
      routeCurrentY += 5;

      setBold(doc);
      doc.text(`Transporter:`, sectionLabelX, routeCurrentY);
      setNormal(doc);
      transporterLines.forEach((line, idx) => {
        doc.text(line, routeValueX, routeCurrentY + idx * 4);
      });
      routeCurrentY += Math.max(transporterLines.length, 1) * 4;

      setBold(doc);
      doc.text(`Lorry No:`, sectionLabelX, routeCurrentY);
      setNormal(doc);
      doc.text(lorryNo, routeValueX, routeCurrentY);
      routeCurrentY += 4;

      setBold(doc);
      doc.text(`Driver:`, sectionLabelX, routeCurrentY);
      setNormal(doc);
      doc.text(driverLine, routeValueX, routeCurrentY);
      setBold(doc);
      doc.text(`Mob:`, routeRightLabelX, routeCurrentY);
      setNormal(doc);
      doc.text(driverMobileLine, routeRightValueX, routeCurrentY);
      routeCurrentY += 4;

      setBold(doc);
      doc.text(`Transporter Address:`, sectionLabelX, routeCurrentY);
      setNormal(doc);
      tAddrLines.forEach((line, idx) => {
        doc.text(line, routeAddressValueX, routeCurrentY + idx * 4);
      });

      y = routeCurrentY + Math.max(tAddrLines.length, 1) * 4 + 7 + 5;

      const freightBoxTitleY = y;
      const totalFreight = formatMoney(entry.totalFreight);
      const advance = formatMoney(entry.advance);
      const toPayAmount =
        hasValue(entry.totalFreight) && hasValue(entry.advance)
          ? Number(entry.totalFreight) - Number(entry.advance)
          : hasValue(entry.totalFreight)
            ? Number(entry.totalFreight)
            : null;
      const toPayValue = toPayAmount !== null ? formatMoney(toPayAmount) : "N/A";
      setBold(doc);
      doc.setFontSize(9);
      doc.text(`FREIGHT DETAILS`, boxTitleX, freightBoxTitleY);

      const freightContentY = freightBoxTitleY + 5;
      setBold(doc);
      doc.text("Total Freight:", freightLeftLabelX, freightContentY);
      setNormal(doc);
      doc.text(totalFreight, freightLeftValueX, freightContentY);
      setBold(doc);
      doc.text("Advance:", freightRightLabelX, freightContentY);
      setNormal(doc);
      doc.text(advance, freightRightValueX, freightContentY);
      setBold(doc);
      doc.text("To Pay:", freightLeftLabelX, freightContentY + 5);
      setNormal(doc);
      doc.text(toPayValue, freightLeftValueX, freightContentY + 5);

      y = freightBoxTitleY + 18 + 10;
    }

    if (y + 50 > pageHeight - margin) {
      doc.addPage();
      y = margin + 20;
    }

    const signY = pageHeight - 38;
    setBold(doc);
    doc.setFontSize(9);
    doc.text("Driver Signature", margin + 10, signY);
    doc.line(margin + 10, signY + 2, margin + 70, signY + 2);
    setBold(doc);
    doc.text("Authorized Signature", pageWidth - margin - 70, signY);
    doc.line(
      pageWidth - margin - 70,
      signY + 2,
      pageWidth - margin - 10,
      signY + 2,
    );

    doc.setFontSize(7);
    setBold(doc);
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
