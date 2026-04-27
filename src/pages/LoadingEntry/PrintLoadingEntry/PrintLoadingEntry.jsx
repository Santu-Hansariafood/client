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

    const transporter =
      transporters.find((t) => String(t._id) === String(data.transporterId)) ||
      {};

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

    const sellerLocation = matchingSellerCompany
      ? [matchingSellerCompany.district, matchingSellerCompany.state]
          .filter(Boolean)
          .join(", ")
      : [sauda.location, sauda.state].filter(Boolean).join(", ") ||
        data.from ||
        "N/A";

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

    const buyerLocation = matchingBuyerCompany
      ? [matchingBuyerCompany.district, matchingBuyerCompany.state]
          .filter(Boolean)
          .join(", ")
      : data.placeOfDelivery || "N/A";

    const consigneeAddress =
      [consignee.location, consignee.district, consignee.state, consignee.pin]
        .filter(Boolean)
        .join(", ") ||
      data.deliveryAddress ||
      "N/A";

    if (logo64) {
      doc.addImage(logo64, "PNG", margin + 5, 12, 20, 20);
    }

    const sellerCompanyName = data?.supplierCompany || "N/A";

    setBold();
    doc.setFontSize(15);
    doc.text(`${sellerCompanyName.toUpperCase()}`, 45, 17);

    setNormal();
    doc.setFontSize(8.5);
    doc.text("General Merchant & Commission Agent", 45, 22);
    doc.text(`${sellerFullAddress}`, 45, 26);
    if (sellerTaxNumber !== "N/A") {
      doc.text(`${sellerTaxLabel}: ${sellerTaxNumber}`, 45, 30);
    }

    setBold();
    doc.setFontSize(13);
    doc.text("LORRY CHALLAN", pageWidth / 2, 42, { align: "center" });

    doc.setLineWidth(0.5);
    doc.rect(margin, 10, pageWidth - margin * 2, pageHeight - 18);

    let y = 52;

    doc.setFontSize(9);
    setNormal();

    setBold();
    doc.text(`Challan No:`, margin + 5, y);
    setItalic();
    doc.text(`${pick(data.billNumber)}`, margin + 33, y);
    setBold();
    doc.text(`Date:`, pageWidth - margin - 25, y);
    setItalic();
    doc.text(`${formatDate(data.loadingDate)}`, pageWidth - margin - 15, y, {
      align: "right",
    });

    y += 8;
    setBold();
    doc.text(`P.O No:`, margin + 5, y);
    setItalic();
    doc.text(`${pick(finalPoNumber)}`, margin + 27, y);

    y += 8;
    setBold();
    doc.text(`A/c Broker:`, margin + 5, y);
    setItalic();
    doc.text(`Hansaria Food Private Limited`, margin + 37, y);

    y += 8;
    setBold();
    doc.text(`Consignee:`, margin + 5, y);
    setItalic();
    doc.text(`${consignee.name || pick(data.consignee)}`, margin + 33, y);

    y += 8;
    setBold();
    doc.text(`Address:`, margin + 5, y);
    setItalic();
    doc.text(`${consigneeAddress}`, margin + 27, y);

    y += 12;

    setBold();
    doc.text(`Description of Goods:`, margin + 5, y);
    setItalic();
    doc.text(`${pick(data.commodity)}`, margin + 55, y);
    setBold();
    doc.text(`Bags:`, margin + 105, y);
    setItalic();
    doc.text(`${pick(data.bags)}`, margin + 120, y);

    y += 8;
    setBold();
    doc.text(`Weight:`, margin + 105, y);
    setItalic();
    doc.text(`${pick(data.loadingWeight)} Tons`, margin + 125, y);

    y += 12;

    setBold();
    doc.text(`From:`, margin + 5, y);
    setItalic();
    doc.text(`${pick(sellerFullAddress)}`, margin + 23, y);

    y += 8;
    setBold();
    doc.text(`To:`, margin + 5, y);
    setItalic();
    doc.text(`${pick(buyerLocation)}`, margin + 23, y);

    y += 8;
    setBold();
    doc.text(`Delivery At:`, margin + 5, y);
    setItalic();
    doc.text(`${pick(data.deliveryAddress)}`, margin + 37, y);

    y += 8;
    setBold();
    doc.text(`Lorry No:`, margin + 5, y);
    setItalic();
    doc.text(`${(data.lorryNumber || "N/A").toUpperCase()}`, margin + 30, y);

    y += 15;

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
    doc.text("Total Lorry Freight:", margin + 5, y);
    setItalic();
    doc.text(totalFreight, margin + 57, y);
    doc.line(margin + 55, y + 1, pageWidth - margin - 5, y + 1);

    y += 10;
    setBold();
    doc.text("Advance:", margin + 5, y);
    setItalic();
    doc.text(advance, margin + 37, y);
    doc.line(margin + 35, y + 1, pageWidth - margin - 5, y + 1);

    y += 10;
    setBold();
    doc.text("To Pay:", margin + 5, y);
    setItalic();
    doc.text(toPayValue, margin + 37, y);
    doc.line(margin + 35, y + 1, pageWidth - margin - 5, y + 1);

    y += 15;

    const ownerName = data.ownerName || "N/A";
    const driverName = data.driverName || "N/A";
    const driverLicense = data.driverLicense || "N/A";
    const insuranceNo = data.insuranceNo || "N/A";
    const ownerMobile = data.ownerMobile || "N/A";
    const driverPhone = data.driverPhoneNumber || "N/A";

    setBold();
    doc.text("Owner's Name:", margin + 5, y);
    setItalic();
    doc.text(ownerName, margin + 47, y);
    setBold();
    doc.text(`Mob:`, pageWidth / 2 + 15, y);
    setItalic();
    doc.text(`${ownerMobile}`, pageWidth / 2 + 30, y);
    doc.line(margin + 45, y + 1, pageWidth - margin - 5, y + 1);

    y += 10;
    setBold();
    doc.text("Driver's Name:", margin + 5, y);
    setItalic();
    doc.text(driverName, margin + 47, y);
    setBold();
    doc.text(`Mob:`, pageWidth / 2 + 15, y);
    setItalic();
    doc.text(`${driverPhone}`, pageWidth / 2 + 30, y);
    doc.line(margin + 45, y + 1, pageWidth - margin - 5, y + 1);

    y += 10;
    setBold();
    doc.text("Driver Lic No:", margin + 5, y);
    setItalic();
    doc.text(driverLicense, margin + 47, y);
    doc.line(margin + 45, y + 1, pageWidth - margin - 5, y + 1);

    y += 10;
    setBold();
    doc.text("Insurance No:", margin + 5, y);
    setItalic();
    doc.text(insuranceNo, margin + 47, y);
    doc.line(margin + 45, y + 1, pageWidth - margin - 5, y + 1);

    y += 12;

    const transporterName = transporter.name || pick(data.addedTransport);
    const transporterAddress = transporter.address || "N/A";

    setBold();
    doc.text(`Transporter:`, margin + 5, y);
    setItalic();
    doc.text(`${transporterName}`, margin + 37, y);

    y += 8;
    setBold();
    doc.text(`Address:`, margin + 5, y);
    setItalic();
    doc.text(`${transporterAddress}`, margin + 27, y);

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
      "This is a computer-generated challan created using Hansaria Food Private Limited platform.\nThe platform is not responsible for loading details.",
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
