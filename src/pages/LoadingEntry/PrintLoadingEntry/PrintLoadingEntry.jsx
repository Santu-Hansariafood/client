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

    const normalizeText = (value) =>
      String(value || "")
        .trim()
        .toLowerCase();

    const consignee =
      consignees.find(
        (c) =>
          String(c._id) === String(data.consignee) || 
          normalizeText(c.name) === normalizeText(data.consignee),
      ) || {};

    const consigneeMobile =
      consignee.phone ||
      consignee.mobile ||
      consignee.mobileNo ||
      data.consigneeMobile ||
      "N/A";

    const transporter =
      transporters.find((t) => String(t._id) === String(data.transporterId)) ||
      {};

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

    const consigneeAddress =
      [
        consignee.address,
        consignee.location,
        consignee.city,
        consignee.district,
        consignee.state,
        consignee.pin,
        consignee.pincode
      ].filter(Boolean).join(", ") ||
      data.deliveryAddress ||
      "N/A";

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
    doc.text(`Hansaria Food Private Limited`, pageWidth / 2, y + 4, { align: "center" });

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
    const shipToConsignee = sauda.shipTo || sauda.consignee || data.consignee;
    const consigneeName = 
      (shipToConsignee && typeof shipToConsignee === 'object' 
        ? (shipToConsignee.name || shipToConsignee.consigneeName) 
        : shipToConsignee) || consignee.name || pick(data.consignee);
    doc.text(`${consigneeName}`, margin + 30, y);

    y += 4;
    setBold();
    doc.text(`Address:`, margin + 5, y);
    setNormal();
    
    let shipToAddress = 'N/A';
    
    const matchedConsignee = consignees.find(
      (c) =>
        String(c._id) === String(data.consignee) || 
        normalizeText(c.name) === normalizeText(data.consignee)
    );
    
    if (matchedConsignee) {
      const consigneeAddrParts = [
        matchedConsignee.location,
        matchedConsignee.district,
        matchedConsignee.state,
        matchedConsignee.pin
      ].filter(Boolean);
      if (consigneeAddrParts.length > 0) {
        shipToAddress = consigneeAddrParts.join(', ');
      }
    }
    
    const cAddrLines = wrapText(shipToAddress, 100);
    cAddrLines.slice(0, 2).forEach((line, index) => {
      doc.text(line, margin + 30, y + index * 4);
    });

    y += 4;
    setBold();
    doc.text(`Mobile:`, margin + 5, y);
    setNormal();
    const shipToMobile = 
      (sauda.shipTo && typeof sauda.shipTo === 'object' 
        ? (sauda.shipTo.mobile || sauda.shipTo.phone) 
        : sauda.shipToMobile) || 
      consigneeMobile;
    doc.text(`${shipToMobile}`, margin + 30, y);

    y += 20;

    doc.setLineWidth(0.2);
    doc.rect(margin + 2, y - 5, pageWidth - margin * 2 - 4, 35);
    setBold();
    doc.setFontSize(9);
    doc.text(`BUYER ACCOUNT`, margin + 5, y);
    y += 6;
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
    const buyerAddrLines = wrapText(buyerLocation || consigneeAddress, 70);
    buyerAddrLines.slice(0, 1).forEach((line, index) => {
      doc.text(line, margin + 35, y + index * 4);
    });

    y += 25;

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
      "*Shortage/damage will be Deducted from Freight.",
      pageWidth / 2,
      pageHeight - 21,
      { align: "center" },
    );

    doc.text(
      "*This is Computer Generated challan, from Hansaria Food Pvt. Ltd., This challan only for information and not for legal evidence.",
      pageWidth / 2,
      pageHeight - 12,
      { align: "center" },
    );

    return doc;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export default PrintLoadingEntry;
