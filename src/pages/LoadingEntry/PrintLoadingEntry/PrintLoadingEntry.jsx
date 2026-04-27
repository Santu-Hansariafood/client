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
        .join(", ") || "N/A";

    // ================= HEADER =================
    if (logo64) {
      doc.addImage(logo64, "PNG", margin, 10, 20, 20);
    }

    const sellerCompanyName = data?.supplierCompany || "N/A";

doc.setFont("helvetica", "bold");
doc.setFontSize(16);
doc.text(`M/S ${sellerCompanyName.toUpperCase()}`, 40, 18);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("General Merchant & Commission Agent", 40, 24);
    doc.text(
      "Marketing Yard, Shop No. K/10, Gulabbagh, Purnea - 854326 (Bihar)",
      40,
      29
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("LORRY CHALLAN", pageWidth / 2, 38, { align: "center" });

    // ================= BODY =================
    let y = 48;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    doc.text(`Challan No: ${pick(data.billNumber)}`, margin, y);
    doc.text(`Date: ${formatDate(data.loadingDate)}`, pageWidth - margin, y, {
      align: "right",
    });

    y += 8;
    doc.text(`P.O No: ${pick(data.poNumber)}`, margin, y);

    y += 8;
    doc.text(`A/c Broker: ${pick(data.broker)}`, margin, y);

    y += 8;
    doc.text(
      `Consignee: ${consignee.name || pick(data.consignee)}`,
      margin,
      y
    );

    y += 8;
    doc.text(`Address: ${consigneeAddress}`, margin, y);

    y += 10;

    doc.text(`Description of Goods: ${pick(data.commodity)}`, margin, y);
    doc.text(`Bags: ${pick(data.bags)}`, margin + 100, y);

    y += 8;
    doc.text(`Weight: ${pick(data.loadingWeight)} KG`, margin + 100, y);

    y += 10;

    doc.text(`From: ${pick(data.from)}`, margin, y);
    doc.text(`To: ${pick(data.placeOfDelivery)}`, margin + 90, y);

    y += 8;
    doc.text(`Delivery At: ${pick(data.deliveryAddress)}`, margin, y);

    y += 8;
    doc.text(
      `Lorry No: ${(data.lorryNumber || "N/A").toUpperCase()}`,
      margin,
      y
    );

    y += 12;

    // ================= FREIGHT =================
    doc.text("Total Lorry Freight:", margin, y);
    doc.line(margin + 50, y, pageWidth - margin, y);

    y += 8;
    doc.text("Advance:", margin, y);
    doc.line(margin + 30, y, pageWidth - margin, y);

    y += 8;
    doc.text("To Pay:", margin, y);
    doc.line(margin + 30, y, pageWidth - margin, y);

    y += 12;

    // ================= DRIVER =================
    doc.text("Owner's Name:", margin, y);
    doc.line(margin + 40, y, pageWidth - margin / 2, y);

    y += 8;
    doc.text("Driver's Name:", margin, y);
    doc.line(margin + 40, y, pageWidth - margin / 2, y);

    y += 8;
    doc.text("Driver Lic No:", margin, y);
    doc.line(margin + 40, y, pageWidth - margin / 2, y);

    y += 8;
    doc.text("Insurance No:", margin, y);
    doc.line(margin + 40, y, pageWidth - margin / 2, y);

    y += 10;

    doc.text(
      `Transporter: ${transporter.name || pick(data.addedTransport)}`,
      margin,
      y
    );

    // ================= SIGNATURE =================
    const signY = pageHeight - 35;

    doc.text("Driver Signature", margin, signY);
    doc.line(margin, signY + 5, margin + 60, signY + 5);

    doc.text("Authorized Signature", pageWidth - margin - 60, signY);
    doc.line(
      pageWidth - margin - 60,
      signY + 5,
      pageWidth - margin,
      signY + 5
    );

    // ================= FOOTER =================
    doc.setFontSize(7);

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