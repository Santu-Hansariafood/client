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

    // ✅ Load logo
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

    // ✅ Fetch data (optional safety)
    const safeFetch = async (url) => {
      try {
        const res = await api.get(url);
        return res.data?.data || res.data || [];
      } catch {
        return [];
      }
    };

    const [consignees, transporters] = await Promise.all([
      safeFetch("/consignees?limit=0"),
      safeFetch("/transporters?limit=0"),
    ]);

    const consignee =
      consignees.find(
        (c) =>
          String(c._id) === String(data.consignee) ||
          c.name === data.consignee
      ) || {};

    const transporter =
      transporters.find(
        (t) => String(t._id) === String(data.transporterId)
      ) || {};

    const consigneeAddress =
      [
        consignee.location,
        consignee.district,
        consignee.state,
        consignee.pin,
      ]
        .filter(Boolean)
        .join(", ") || data.deliveryAddress || "N/A";

    // ================= HEADER =================
    if (logo64) {
      doc.addImage(logo64, "PNG", margin, 10, 20, 20);
    }

    const sellerCompanyName = data?.supplierCompany || "N/A";

    setBold();
    doc.setFontSize(16);
    doc.text(`M/S ${sellerCompanyName.toUpperCase()}`, 40, 18);

    setNormal();
    doc.setFontSize(10);
    doc.text("General Merchant & Commission Agent", 40, 24);
    doc.text(
      "Marketing Yard, Shop No. K/10, Gulabbagh, Purnea - 854326 (Bihar)",
      40,
      29
    );

    setBold();
    doc.setFontSize(13);
    doc.text("LORRY CHALLAN", pageWidth / 2, 38, { align: "center" });

    doc.setLineWidth(0.5);
    doc.rect(margin, 8, pageWidth - margin * 2, pageHeight - margin * 2 + 4);

    // ================= BODY =================
    let y = 48;

    doc.setFontSize(9);
    setNormal();

    setBold();
    doc.text(`Challan No:`, margin, y);
    setItalic();
    doc.text(`${pick(data.billNumber)}`, margin + 28, y);
    setBold();
    doc.text(`Date:`, pageWidth - margin - 20, y);
    setItalic();
    doc.text(`${formatDate(data.loadingDate)}`, pageWidth - margin, y, {
      align: "right",
    });

    y += 8;
    setBold();
    doc.text(`P.O No:`, margin, y);
    setItalic();
    doc.text(`${consigneeAddress}`, margin + 22, y);

    y += 8;
    setBold();
    doc.text(`A/c Broker:`, margin, y);
    setItalic();
    doc.text(`Hansaria Food Private Limited`, margin + 32, y);

    y += 8;
    setBold();
    doc.text(`Consignee:`, margin, y);
    setItalic();
    doc.text(
      `${consignee.name || pick(data.consignee)}`,
      margin + 28,
      y
    );

    y += 8;
    setBold();
    doc.text(`Address:`, margin, y);
    setItalic();
    doc.text(`${consigneeAddress}`, margin + 22, y);

    y += 10;

    setBold();
    doc.text(`Description of Goods:`, margin, y);
    setItalic();
    doc.text(`${pick(data.commodity)}`, margin + 50, y);
    setBold();
    doc.text(`Bags:`, margin + 100, y);
    setItalic();
    doc.text(`${pick(data.bags)}`, margin + 115, y);

    y += 8;
    setBold();
    doc.text(`Weight:`, margin + 100, y);
    setItalic();
    doc.text(`${pick(data.loadingWeight)} KG`, margin + 120, y);

    y += 10;

    setBold();
    doc.text(`From:`, margin, y);
    setItalic();
    doc.text(`${pick(data.from)}`, margin + 18, y);
    setBold();
    doc.text(`To:`, margin + 90, y);
    setItalic();
    doc.text(`${pick(data.placeOfDelivery)}`, margin + 100, y);

    y += 8;
    setBold();
    doc.text(`Delivery At:`, margin, y);
    setItalic();
    doc.text(`${pick(data.deliveryAddress)}`, margin + 32, y);

    y += 8;
    setBold();
    doc.text(`Lorry No:`, margin, y);
    setItalic();
    doc.text(
      `${(data.lorryNumber || "N/A").toUpperCase()}`,
      margin + 25,
      y
    );

    y += 12;

    // ================= FREIGHT =================
    const totalFreight = data.totalFreight ? `Rs. ${Number(data.totalFreight).toLocaleString("en-IN")}` : "N/A";
    const advance = data.advance ? `Rs. ${Number(data.advance).toLocaleString("en-IN")}` : "N/A";
    const toPayValue = data.totalFreight && data.advance
      ? `Rs. ${Number(data.totalFreight - data.advance).toLocaleString("en-IN")}`
      : "N/A";

    setBold();
    doc.text("Total Lorry Freight:", margin, y);
    setItalic();
    doc.text(totalFreight, margin + 52, y);
    doc.line(margin + 50, y, pageWidth - margin, y);

    y += 8;
    setBold();
    doc.text("Advance:", margin, y);
    setItalic();
    doc.text(advance, margin + 32, y);
    doc.line(margin + 30, y, pageWidth - margin, y);

    y += 8;
    setBold();
    doc.text("To Pay:", margin, y);
    setItalic();
    doc.text(toPayValue, margin + 32, y);
    doc.line(margin + 30, y, pageWidth - margin, y);

    y += 12;

    // ================= DRIVER =================
    const ownerName = data.ownerName || "N/A";
    const driverName = data.driverName || "N/A";
    const driverLicense = data.driverLicense || "N/A";
    const insuranceNo = data.insuranceNo || "N/A";
    const ownerMobile = data.ownerMobile || "N/A";
    const driverPhone = data.driverPhoneNumber || "N/A";

    setBold();
    doc.text("Owner's Name:", margin, y);
    setItalic();
    doc.text(ownerName, margin + 42, y);
    setBold();
    doc.text(`Mob:`, pageWidth / 2 + 10, y);
    setItalic();
    doc.text(`${ownerMobile}`, pageWidth / 2 + 25, y);
    doc.line(margin + 40, y, pageWidth - margin / 2, y);

    y += 8;
    setBold();
    doc.text("Driver's Name:", margin, y);
    setItalic();
    doc.text(driverName, margin + 42, y);
    setBold();
    doc.text(`Mob:`, pageWidth / 2 + 10, y);
    setItalic();
    doc.text(`${driverPhone}`, pageWidth / 2 + 25, y);
    doc.line(margin + 40, y, pageWidth - margin / 2, y);

    y += 8;
    setBold();
    doc.text("Driver Lic No:", margin, y);
    setItalic();
    doc.text(driverLicense, margin + 42, y);
    doc.line(margin + 40, y, pageWidth - margin / 2, y);

    y += 8;
    setBold();
    doc.text("Insurance No:", margin, y);
    setItalic();
    doc.text(insuranceNo, margin + 42, y);
    doc.line(margin + 40, y, pageWidth - margin / 2, y);

    y += 10;

    const transporterName = transporter.name || pick(data.addedTransport);
    const transporterAddress = transporter.address || "N/A";

    setBold();
    doc.text(`Transporter:`, margin, y);
    setItalic();
    doc.text(`${transporterName}`, margin + 32, y);

    y += 8;
    setBold();
    doc.text(`Address:`, margin, y);
    setItalic();
    doc.text(`${transporterAddress}`, margin + 22, y);

    y += 12;

    // ================= SIGNATURE =================
    const signY = pageHeight - 35;

    setBold();
    doc.text("Driver Signature", margin, signY);
    doc.line(margin, signY + 5, margin + 60, signY + 5);

    setBold();
    doc.text("Authorized Signature", pageWidth - margin - 60, signY);
    doc.line(
      pageWidth - margin - 60,
      signY + 5,
      pageWidth - margin,
      signY + 5
    );

    // ================= FOOTER =================
    doc.setFontSize(7);
    setBold();
    doc.text(
      "1. Shortage/damage will be deducted from freight.\n" +
        "2. Free delivery within 25 km.\n" +
        "3. Detention ₹300/day after 24 hrs.\n" +
        "4. No detention on closing days.\n" +
        "5. Transporter responsible for goods.",
      margin,
      pageHeight - 20
    );

    doc.text(
      "This is a computer-generated challan created using Hansaria Food Private Limited platform.\nThe platform is not responsible for loading details.",
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );

    // ================= OUTPUT =================
    const blob = doc.output("blob");
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export default PrintLoadingEntry;