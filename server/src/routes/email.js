import express from "express";
import nodemailer from "nodemailer";
import PaymentReceived from "../models/PaymentReceived.js";

const router = express.Router();

const getEmailServiceConfig = () => ({
  service: process.env.EMAIL_SERVICE || "gmail",
  host: process.env.EMAIL_SERVICE === "gmail" ? "smtp.gmail.com" : undefined,
  port: process.env.EMAIL_SERVICE === "gmail" ? 465 : undefined,
  secure: process.env.EMAIL_SERVICE === "gmail" ? true : undefined,
});

const verifySmtpConnection = async (transporter) => {
  try {
    await transporter.verify();
    return true;
  } catch (verifyError) {
    console.error("[SMTP] Connection verification failed:", verifyError.message);
    return false;
  }
};

router.post("/send-pdf", async (req, res) => {
  const { pdf, email, saudaNo } = req.body;

  if (!pdf || !email || !saudaNo) {
    return res.status(400).send("Missing required fields: pdf, email, saudaNo");
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("[EMAIL] Missing EMAIL_USER or EMAIL_PASS environment variables");
    return res.status(500).send("Email service not configured. Please contact admin.");
  }

  try {
    const transporter = nodemailer.createTransport({
      ...getEmailServiceConfig(),
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const isVerified = await verifySmtpConnection(transporter);
    if (!isVerified) {
      return res.status(500).send("Email service authentication failed. Please check credentials.");
    }

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

  const recipientEmail = typeof sellerEmail === "string" ? sellerEmail.trim() : "";

  if (!pdf || !recipientEmail || !saudaNo) {
    return res.status(400).send("Missing required fields: pdf, sellerEmail, saudaNo");
  }

  if (!process.env.CLAIMS_EMAIL || !process.env.CLAIMS_PASS) {
    console.error("[EMAIL] Missing CLAIMS_EMAIL or CLAIMS_PASS environment variables");
    return res.status(500).send("Claims email service not configured. Please contact admin.");
  }

  try {
    const transporter = nodemailer.createTransport({
      ...getEmailServiceConfig(),
      auth: {
        user: process.env.CLAIMS_EMAIL,
        pass: process.env.CLAIMS_PASS,
      },
    });

    const isVerified = await verifySmtpConnection(transporter);
    if (!isVerified) {
      return res.status(500).send("Claims email authentication failed. Please check credentials.");
    }

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
      to: recipientEmail,
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
  const { pdf, recipientEmail, reportType, startDate, endDate, buyerCompany, supplierCompany, individualPaymentId } = req.body;
  const paymentRecipientEmail = typeof recipientEmail === "string" ? recipientEmail.trim() : "";
  const paymentAuthEmail = process.env.PAYMENTS_EMAIL || process.env.EMAIL_USER;
  const paymentSenderEmail =
    process.env.PAYMENTS_FROM || paymentAuthEmail;
  const paymentSenderPassword = process.env.PAYMENTS_PASS || process.env.EMAIL_PASS;

  if (!pdf || !paymentRecipientEmail || !reportType) {
    return res.status(400).send("Missing required fields: pdf, recipientEmail, reportType");
  }

  if (!paymentSenderEmail || !paymentSenderPassword) {
    console.error("[EMAIL] Missing payment sender credentials");
    return res.status(500).send("Payments email service not configured. Please contact admin.");
  }

  try {
    const transporter = nodemailer.createTransport({
      ...getEmailServiceConfig(),
      auth: {
        user: paymentAuthEmail,
        pass: paymentSenderPassword,
      },
    });

    const isVerified = await verifySmtpConnection(transporter);
    if (!isVerified) {
      return res.status(500).send("Payments email authentication failed. Please check credentials.");
    }

    let subject = "";
    let filename = "";
    let body = "";

    if (reportType === "IndividualVoucher") {
      subject = `Payment Voucher`;
      filename = `Payment_Voucher.pdf`;
      body = `Dear Sir/Madam,

Please find attached the payment voucher.

Thank you for your business.

Best Regards,
Hansaria Food Private Limited
Contact: +91-8336924066 | +91-9330433535
Email: payments@hansariafood.com`;
    } else {
      const dateRangeText = startDate && endDate 
        ? `${new Date(startDate).toLocaleDateString("en-GB")} to ${new Date(endDate).toLocaleDateString("en-GB")}`
        : "All Time";

      subject = reportType === "MIS" 
        ? `Payment MIS Report - ${dateRangeText}`
        : `Payment Advice - ${dateRangeText}`;

      filename = reportType === "MIS" 
        ? `MIS_Payment_Received_${startDate || "All"}_to_${endDate || "All"}.pdf`
        : `Payment_Advice_${startDate || "All"}_to_${endDate || "All"}.pdf`;

      body = `Dear Sir/Madam,

Please find attached the ${reportType === "MIS" ? "Payment MIS Report" : "Payment Advice"} for the period ${dateRangeText}.
${buyerCompany ? `\nBuyer Company: ${buyerCompany}` : ""}
${supplierCompany ? `\nSupplier Company: ${supplierCompany}` : ""}

Thank you for your business.

Best Regards,
Hansaria Food Private Limited
Contact: +91-8336924066 | +91-9330433535
Email: payments@hansariafood.com`;
    }

    const mailOptions = {
      from: paymentSenderEmail,
      to: paymentRecipientEmail,
      subject: subject,
      text: body,
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
    if (individualPaymentId) {
      await PaymentReceived.findByIdAndUpdate(individualPaymentId, {
        $set: {
          emailSent: true,
          emailSentAt: new Date(),
        },
      });
    } else {
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
    }

    res.status(200).send("Email sent successfully");
  } catch (error) {
    console.error("Error sending payment received email:", error);
    res.status(500).send("Error sending email");
  }
});

export default router;
