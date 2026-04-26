import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import api from "../../../utils/apiClient/apiClient";
import logo from "../../../assets/Hans.png";
import signature from "../../../assets/signature.png";
import stamp from "../../../assets/stamp.png";

const PrintLoadingEntry = async (data) => {
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

    let seller = {};
    let order = {};
    let transporter = {};

    try {
      const promises = [];
      if (data.supplier && typeof data.supplier === "string") {
        promises.push(
          api
            .get(`/sellers/${data.supplier}`)
            .then((res) => (seller = res.data))
            .catch(() => {}),
        );
      } else if (data.supplier && typeof data.supplier === "object") {
        seller = data.supplier;
      }

      if (data.saudaNo) {
        promises.push(
          api
            .get(`/self-order/sauda/${data.saudaNo}`)
            .then((res) => (order = res.data))
            .catch(() => {}),
        );
      }

      if (data.transporterId) {
        promises.push(
          api
            .get(`/transporters/${data.transporterId}`)
            .then((res) => (transporter = res.data))
            .catch(() => {}),
        );
      }

      await Promise.all(promises);
    } catch (error) {
      console.error("Error fetching related data for PDF:", error);
    }

    const [logo64, sign64, stamp64] = await Promise.all([
      getBase64(logo),
      getBase64(signature),
      getBase64(stamp),
    ]);

    // Generate QR Code with basic details
    let qr64 = null;
    try {
      const qrData = `Sauda: ${data.saudaNo || "N/A"}\nLorry: ${data.lorryNumber || "N/A"}\nWeight: ${data.loadingWeight || 0} Tons\nDate: ${formatDate(data.loadingDate)}`;
      qr64 = await QRCode.toDataURL(qrData, { margin: 1, width: 100 });
    } catch (err) {
      console.error("QR Code Error:", err);
    }

    // Fallback logic for all fields
    const sellerCompanyName = (
      data.supplierCompany ||
      seller.companyName ||
      "N/A"
    ).toUpperCase();
    const sellerName = data.sellerName || seller.sellerName || "N/A";
    const sellerPhone =
      data.sellerPhone ||
      seller.mobileNo ||
      (seller.phoneNumbers && seller.phoneNumbers[0]?.value) ||
      "N/A";
    const sellerGstin =
      data.sellerGstin || seller.gstNumber || seller.gstin || "NOT AVAILABLE";
    const sellerAddress =
      data.sellerAddress ||
      seller.address ||
      (seller.city && seller.state ? `${seller.city}, ${seller.state}` : "N/A");

    const buyerCompanyName = (
      data.buyerCompany ||
      (Array.isArray(order) ? order[0]?.buyerCompany : order?.buyerCompany) ||
      (Array.isArray(order) ? order[0]?.buyer : order?.buyer) ||
      "N/A"
    ).toUpperCase();
    const consigneeName =
      data.consignee ||
      (Array.isArray(order) ? order[0]?.consignee : order?.consignee) ||
      "N/A";

    const orderData = Array.isArray(order) ? order[0] : order;
    const deliveryDetails =
      [
        data.location || orderData?.location,
        data.district || orderData?.district,
        data.state || orderData?.state,
        data.pin || data.pinCode || orderData?.pin || orderData?.pinCode,
      ]
        .filter(Boolean)
        .join(", ") || "Address details not found.";

    // Page setup
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    // Simple Header - Elegant thin lines
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

    // Title Section - Right Aligned
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
      {
        align: "right",
      },
    );
    doc.text(
      `CHALLAN NO: ${data.billNumber || "N/A"}`,
      pageWidth - margin - 5,
      39,
      {
        align: "right",
      },
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

    // 1. Parties Info - Simple
    currentY = addTable(
      "Parties Information",
      currentY,
      ["Buyer Company", "Consignee Name", "Sauda No"],
      [buyerCompanyName, consigneeName, data.saudaNo || "N/A"],
    );

    // 2. Delivery Address - Reverted to standalone box
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

    // 3. Goods Details
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

    // Signatures Section
    const signY = pageHeight - 40;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.1);
    doc.line(margin, signY + 10, margin + 50, signY + 10);
    doc.line(pageWidth - margin - 50, signY + 10, pageWidth - margin, signY + 10);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("DRIVER'S SIGNATURE", margin + 25, signY + 14, { align: "center" });
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
        // More robust GState handling
        const GState = doc.GState || (jsPDF && jsPDF.GState);
        if (typeof GState === 'function') {
          doc.setGState(new GState({ opacity: 0.4 }));
          doc.addImage(stamp64, "PNG", pageWidth - margin - 45, signY - 20, 25, 25);
          doc.setGState(new GState({ opacity: 1.0 }));
        } else {
          doc.addImage(stamp64, "PNG", pageWidth - margin - 45, signY - 20, 25, 25);
        }
      } catch (err) {
        console.error("GState error:", err);
        // Fallback: add image without opacity
        try {
          doc.addImage(stamp64, "PNG", pageWidth - margin - 45, signY - 20, 25, 25);
        } catch (imgErr) {
          console.error("Error adding stamp image:", imgErr);
        }
      }
    }

    // Final Footer
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

    doc.text(splitFooter, pageWidth / 2, footerY, {
      align: "center",
      lineHeightFactor: 1.2,
    });

    return doc.output("blob");
  } catch (error) {
    console.error("Critical error during PDF generation:", error);
    return null;
  }
};

export default PrintLoadingEntry;
