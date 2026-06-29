import express from "express";
import nodemailer from "nodemailer";
import PaymentReceived from "../models/PaymentReceived.js";

const router = express.Router();

router.post("/send-pdf", async (req, res) => {
  const { pdf, email, saudaNo } = req.body;

  if (!pdf || !email || !saudaNo) {
    return res.status(400).send("Missing required fields: pdf, email, saudaNo");
  }

  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Sauda ID - ${saudaNo} Confirmation From Hansaria Food Pvt. Ltd.`,

      text: `Dear Sir/Madam,

Please find attached The Sauda Agreement with this mail.


Thank you for your business.

Best Regards,
Hansaria Food Private Limited
Contact: +91-8336924066 | +91-9330433535
Email: sauda@hansariafood.com`,
      attachments: [
        {
          filename: `HANS-2026-2027-${saudaNo}.pdf`,
          content: pdf,
          encoding: "base64",
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).send("Error sending email");
  }
});

router.post("/send-receiving-report", async (req, res) => {
  const { 
    pdf, 
    sellerEmail, 
    saudaNo,
    billNo,
    claimParameters, 
    sentByMobile, 
    sentByName 
  } = req.body;

  if (!pdf || !sellerEmail || !saudaNo) {
    return res.status(400).send("Missing required fields: pdf, sellerEmail, saudaNo");
  }

  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.CLAIMS_EMAIL,
        pass: process.env.CLAIMS_PASS,
      },
    });

    // Prepare claim parameters text (filter out claims with 0 amount)
    let claimText = "";
    if (claimParameters && claimParameters.length > 0) {
      const validClaims = claimParameters.filter(c => Number(c.claimAmount || 0) > 0);
      if (validClaims.length > 0) {
        claimText = `\n\nQUALITY CLAIMS:\n` + 
          validClaims.map(c => 
            `• ${c.parameterName || "Unnamed Parameter"}: Standard ${c.standardValue || 0}%, Actual ${c.actualValue || 0}%, Claim Amount ₹${Number(c.claimAmount || 0).toFixed(2)}`
          ).join("\n");
      }
    }

    // Prepare sent by verification text
    let sentByText = "";
    if (sentByName || sentByMobile) {
      sentByText = `\n\nSENT BY:\nName: ${sentByName || "N/A"}\nMobile: ${sentByMobile || "N/A"}`;
    }

    const mailOptions = {
      from: process.env.CLAIMS_EMAIL,
      to: sellerEmail,
      subject: `Receiving Report - Sauda No. ${saudaNo}${billNo ? ` | Bill No. ${billNo}` : ""}`,

      text: `Dear Sir/Madam,

Please find attached the receiving report for Sauda No. ${saudaNo}${billNo ? ` and Bill No. ${billNo}` : ""}.

${claimText}

${sentByText ? `\nVERIFIED AND SENT BY:\nName: ${sentByName || "N/A"}\nMobile: ${sentByMobile || "N/A"}` : ""}

Thank you for your business.

Best Regards,
Hansaria Food Private Limited
Contact: +91-8336924066 | +91-9330433535`,
      attachments: [
        {
          filename: `Receiving_Report_${saudaNo}${billNo ? `_Bill_${billNo}` : ""}.pdf`,
          content: pdf,
          encoding: "base64",
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).send("Error sending email");
  }
});

router.post("/send-payment-received", async (req, res) => {
  const { pdf, recipientEmail, reportType, startDate, endDate, buyerCompany, supplierCompany } = req.body;

  if (!pdf || !recipientEmail || !reportType) {
    return res.status(400).send("Missing required fields: pdf, recipientEmail, reportType");
  }

  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.PAYMENTS_EMAIL,
        pass: process.env.PAYMENTS_PASS,
      },
    });

    const dateRangeText = startDate && endDate 
      ? `${new Date(startDate).toLocaleDateString("en-GB")} to ${new Date(endDate).toLocaleDateString("en-GB")}`
      : "All Time";

    const subject = reportType === "MIS" 
      ? `Payment MIS Report - ${dateRangeText}`
      : `Payment Advice - ${dateRangeText}`;

    const filename = reportType === "MIS" 
      ? `MIS_Payment_Received_${startDate || "All"}_to_${endDate || "All"}.pdf`
      : `Payment_Advice_${startDate || "All"}_to_${endDate || "All"}.pdf`;

    const mailOptions = {
      from: process.env.PAYMENTS_EMAIL,
      to: recipientEmail,
      subject: subject,
      text: `Dear Sir/Madam,

Please find attached the ${reportType === "MIS" ? "Payment MIS Report" : "Payment Advice"} for the period ${dateRangeText}.
${buyerCompany ? `\nBuyer Company: ${buyerCompany}` : ""}
${supplierCompany ? `\nSupplier Company: ${supplierCompany}` : ""}

Thank you for your business.

Best Regards,
Hansaria Food Private Limited
Contact: +91-8336924066 | +91-9330433535
Email: payments@hansariafood.com`,
      attachments: [
        {
          filename: filename,
          content: pdf,
          encoding: "base64",
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    // Update payment records to mark email as sent
    const filter = {};
    if (startDate) filter.date = { $gte: new Date(startDate) };
    if (endDate) filter.date = { ...filter.date, $lte: new Date(endDate) };
    if (buyerCompany) filter.buyerCompany = buyerCompany;
    if (supplierCompany) filter.supplierCompany = supplierCompany;

    await PaymentReceived.updateMany(filter, {
      $set: {
        emailSent: true,
        emailSentAt: new Date(),
      },
    });

    res.status(200).send("Email sent successfully");
  } catch (error) {
    console.error("Error sending payment received email:", error);
    res.status(500).send("Error sending email");
  }
});

export default router;
