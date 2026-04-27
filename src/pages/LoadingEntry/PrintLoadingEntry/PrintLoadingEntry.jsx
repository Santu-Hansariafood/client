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
    const setItalic = () => doc.setFont("helvetica", "italic");

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

    const [
      consignees,
      transporters,
      sellers,
      sellerCompanies,
      buyers,
      companies,
      saudaDataResponse,
    ] = await Promise.all([
      safeFetch("/consignees?limit=0"),
      safeFetch("/transporters?limit=0"),
      safeFetch("/sellers?limit=0"),
      safeFetch("/seller-company?limit=0"),
      safeFetch("/buyers?limit=0"),
      safeFetch("/companies?limit=0"),
      safeFetch(`/self-order?search=${data.saudaNo}`),
    ]);

    const saudaData = Array.isArray(saudaDataResponse)
      ? saudaDataResponse
      : saudaDataResponse?.data || [];
    const sauda =
      (saudaData || []).find(
        (s) => String(s.saudaNo) === String(data.saudaNo),
      ) || {};
    const finalPoNumber = sauda.poNumber || data.poNumber || "N/A";

    const consignee =
      consignees.find(
        (c) =>
          String(c._id) === String(data.consignee) || c.name === data.consignee,
      ) || {};

    const consigneeMobile = consignee.phone || consignee.mobile || consignee.mobileNo || data.consigneeMobile || "N/A";

    const transporter =
      transporters.find((t) => String(t._id) === String(data.transporterId)) ||
      {};

    const displayTransporterName = String(transporter.name || data.addedTransport || "N/A");
    const displayTransporterAddress = String(transporter.address || "N/A");

    const normalizeText = (value) =>
      String(value || "")
        .trim()
        .toLowerCase();

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

    const sellerLocation = matchingSellerCompany
      ? [matchingSellerCompany.district, matchingSellerCompany.state]
          .filter(Boolean)
          .join(", ")
      : [sauda.location, sauda.state].filter(Boolean).join(", ") ||
        data.from ||
        "N/A";

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

    const buyerState = matchingBuyerCompany?.state || data.placeOfDeliveryState || "N/A";

    const buyerLocation = matchingBuyerCompany
      ? [matchingBuyerCompany.district, matchingBuyerCompany.state]
          .filter(Boolean)
          .join(", ")
      : data.placeOfDelivery || "N/A";

    const buyerCompanyName = matchingBuyerCompany?.companyName || data.buyerCompany || data.buyer || "N/A";

    const consigneeAddress =
      [consignee.location, consignee.district, consignee.state, consignee.pin]
        .filter(Boolean)
        .join(", ") ||
      data.deliveryAddress ||
      "N/A";

    if (logo64) {
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      // Logo on the right, bigger box
      const logoBoxWidth = 40;
      const logoBoxHeight = 28;
      const logoBoxX = pageWidth - margin - logoBoxWidth - 2;
      doc.rect(logoBoxX, 12, logoBoxWidth, logoBoxHeight);
      doc.addImage(logo64, "PNG", logoBoxX + 2, 14, logoBoxWidth - 4, logoBoxHeight - 4);
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
      doc.text(line, textStartX, (merchantTextY + 4) + index * 4);
    });

    const taxY = headerAddressLines.length > 1 ? (merchantTextY + 12) : (merchantTextY + 8);
    if (sellerTaxNumber !== "N/A") {
      doc.text(`${sellerTaxLabel}: ${sellerTaxNumber}`, textStartX, taxY);
    }

    setBold();
    doc.setFontSize(13);
    doc.text("LORRY CHALLAN", pageWidth / 2, 45, { align: "center" });
    doc.line(pageWidth / 2 - 20, 47, pageWidth / 2 + 20, 47);

    doc.setLineWidth(0.5);
    doc.rect(margin, 10, pageWidth - margin * 2, pageHeight - 18);

    let y = 55;

    // Block 1: Challan Details
    doc.setLineWidth(0.2);
    doc.rect(margin + 2, y - 5, pageWidth - margin * 2 - 4, 32);

    doc.setFontSize(9);
    setBold();
    doc.text(`Challan No:`, margin + 5, y);
    setNormal();
    doc.text(`${pick(data.billNumber)}`, margin + 30, y);

    setBold();
    doc.text(`Date:`, pageWidth - margin - 50, y);
    setNormal();
    doc.text(`${formatDate(data.loadingDate)}`, pageWidth - margin - 35, y);

    y += 7;
    setBold();
    doc.text(`Buyer PO No:`, margin + 5, y);
    setNormal();
    doc.text(`${pick(finalPoNumber)}`, margin + 30, y);

    y += 7;
    setBold();
    doc.text(`A/c Broker:`, margin + 5, y);
    setNormal();
    doc.text(`Hansaria Food Private Limited`, margin + 30, y);

    y += 7;
    setBold();
    doc.text(`HFPL Sauda No:`, margin + 5, y);
    setNormal();
    doc.text(`${pick(data.saudaNo)}`, margin + 30, y);

    y += 12;
    doc.rect(margin + 2, y - 5, pageWidth - margin * 2 - 4, 35);

    setBold();
    doc.text(`DELIVERY ADDRESS`, margin + 5, y);
    y += 6;
    setBold();
    doc.text(`Consignee:`, margin + 5, y);
    setNormal();
    doc.text(`${consignee.name || pick(data.consignee)}`, margin + 30, y);

    y += 6;
    setBold();
    doc.text(`Buyer Co:`, margin + 5, y);
    setNormal();
    doc.text(`${buyerCompanyName}`, margin + 30, y);

    y += 6;
    setBold();
    doc.text(`Address:`, margin + 5, y);
    setNormal();
    const cAddrLines = wrapText(consigneeAddress, 85);
    cAddrLines.slice(0, 2).forEach((line, index) => {
      doc.text(line, margin + 30, y + index * 4);
    });

    y += 10;
    setBold();
    doc.text(`Mobile:`, margin + 5, y);
    setNormal();
    doc.text(`${consigneeMobile}`, margin + 30, y);

    y += 12;
    doc.rect(margin + 2, y - 5, pageWidth - margin * 2 - 4, 15);
    setBold();
    doc.text(`DESCRIPTION OF GOODS`, margin + 5, y);
    y += 6;
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
    doc.rect(margin + 2, y - 5, pageWidth - margin * 2 - 4, 100);

    setBold();
    doc.text(`ROUTE & VEHICLE DETAILS`, margin + 5, y);
    y += 6;
    setBold();
    doc.text(`From:`, margin + 5, y);
    setNormal();
    doc.text(`${sellerState}`, margin + 20, y);
    setBold();
    doc.text(`To:`, margin + 70, y);
    setNormal();
    doc.text(`${buyerState}`, margin + 80, y);

    y += 8;
    setBold();
    doc.text(`Transporter:`, margin + 5, y);
    setNormal();
    doc.text(`${displayTransporterName}`, margin + 30, y);

    y += 6;
    setBold();
    doc.text(`Lorry No:`, margin + 5, y);
    setNormal();
    doc.text(`${(data.lorryNumber || "N/A").toUpperCase()}`, margin + 30, y);

    y += 6;
    setBold();
    doc.text(`Driver:`, margin + 5, y);
    setNormal();
    doc.text(`${data.driverName || "N/A"}`, margin + 30, y);
    setBold();
    doc.text(`Mob:`, margin + 80, y);
    setNormal();
    doc.text(`${data.driverPhoneNumber || "N/A"}`, margin + 90, y);

    y += 6;
    setBold();
    doc.text(`Owner:`, margin + 5, y);
    setNormal();
    doc.text(`${data.ownerName || "N/A"}`, margin + 30, y);
    setBold();
    doc.text(`Mob:`, margin + 80, y);
    setNormal();
    doc.text(`${data.ownerMobile || "N/A"}`, margin + 90, y);

    y += 6;
    setBold();
    doc.text(`Driver Lic:`, margin + 5, y);
    setNormal();
    doc.text(`${data.driverLicense || "N/A"}`, margin + 30, y);
    setBold();
    doc.text(`Insurance:`, margin + 80, y);
    setNormal();
    doc.text(`${data.insuranceNo || "N/A"}`, margin + 100, y);

    y += 10;
    setBold();
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

    y += 6;
    setBold();
    doc.text("Advance:", margin + 5, y);
    setNormal();
    doc.text(advance, margin + 35, y);

    y += 6;
    setBold();
    doc.text("To Pay:", margin + 5, y);
    setNormal();
    doc.text(toPayValue, margin + 35, y);

    y += 10;
    setBold();
    doc.text(`Transporter Address:`, margin + 5, y);
    setNormal();
    const tAddrLines = wrapText(displayTransporterAddress, 85);
    tAddrLines.slice(0, 2).forEach((line, index) => {
      doc.text(line, margin + 45, y + index * 4);
    });

    y += 15;

    const signY = pageHeight - 40;

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
      "Shortage/damage will be deducted from freight.",
      margin + 10,
      pageHeight - 25,
    );

    doc.text(
      "This is computer generated challan, from Hansaria Food Pvt. Ltd., this challan only for information and not for legal evidence.",
      pageWidth / 2,
      pageHeight - 15,
      { align: "center" },
    );

    const blob = doc.output("blob");
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export default PrintLoadingEntry;
