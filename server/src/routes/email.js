import express from "express";
import nodemailer from "nodemailer";
import PaymentReceived from "../models/PaymentReceived.js";
import SellerCompany from "../models/SellerCompany.js";

const router = express.Router();

const getEmailServiceConfig = (overrides = {}) => {
  const service = overrides.service || process.env.EMAIL_SERVICE || "gmail";
  const host = overrides.host || process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const port = overrides.port || process.env.EMAIL_PORT || process.env.SMTP_PORT;
  const secure = overrides.secure ?? (process.env.EMAIL_SECURE !== undefined ? process.env.EMAIL_SECURE === "true" : undefined);

  if (host) {
    return {
      host,
      port: Number(port || 587),
      secure: secure ?? Number(port || 587) === 465,
    };
  }

  return {
    service,
    host: service === "gmail" ? "smtp.gmail.com" : undefined,
    port: service === "gmail" ? 465 : undefined,
    secure: service === "gmail" ? true : undefined,
  };
};

const verifySmtpConnection = async (transporter, label = "SMTP") => {
  try {
    await transporter.verify();
    return true;
  } catch (verifyError) {
    console.error(`[${label}] Connection verification failed:`, {
      code: verifyError.code,
      responseCode: verifyError.responseCode,
      command: verifyError.command,
      message: verifyError.message,
    });
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
  const { pdf, recipientEmail, reportType, startDate, endDate, buyerCompany, supplierCompany, individualPaymentId, voucherNumber } = req.body;
  let paymentRecipientEmail = typeof recipientEmail === "string" ? recipientEmail.trim() : "";

  let senderAuthEmail = "";
  let senderAuthPassword = "";
  if (process.env.PAYMENTS_EMAIL && process.env.PAYMENTS_PASS) {
    senderAuthEmail = process.env.PAYMENTS_EMAIL.trim();
    senderAuthPassword = process.env.PAYMENTS_PASS.trim();
  } else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    senderAuthEmail = process.env.EMAIL_USER.trim();
    senderAuthPassword = process.env.EMAIL_PASS.trim();
  }

  const paymentSenderEmail = (process.env.PAYMENTS_FROM || senderAuthEmail || "").trim();

  if (!pdf || !reportType) {
    return res.status(400).send("Missing required fields: pdf, reportType");
  }

  if (!paymentRecipientEmail && supplierCompany) {
    const company = await SellerCompany.findOne({
      companyName: { $regex: `^${String(supplierCompany).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    })
      .select("email")
      .lean();
    paymentRecipientEmail = String(company?.email || "").trim();
  }

  if (!paymentRecipientEmail) {
    return res.status(400).send("No seller email found for the selected supplier company");
  }

  if (!senderAuthEmail || !senderAuthPassword) {
    console.error("[EMAIL] Missing PAYMENTS_EMAIL/PAYMENTS_PASS pair or EMAIL_USER/EMAIL_PASS pair");
    return res.status(500).send("Payment email sender is not configured. Please contact admin.");
  }

  try {
    const paymentServiceConfig = process.env.PAYMENTS_EMAIL_SERVICE
      ? { service: process.env.PAYMENTS_EMAIL_SERVICE }
      : process.env.PAYMENTS_SMTP_HOST
        ? {
            host: process.env.PAYMENTS_SMTP_HOST,
            port: Number(process.env.PAYMENTS_SMTP_PORT || 587),
            secure: process.env.PAYMENTS_SMTP_SECURE !== undefined
              ? process.env.PAYMENTS_SMTP_SECURE === "true"
              : Number(process.env.PAYMENTS_SMTP_PORT || 587) === 465,
          }
        : {};

    const transporter = nodemailer.createTransport({
      ...getEmailServiceConfig(),
      ...paymentServiceConfig,
      auth: {
        user: senderAuthEmail,
        pass: senderAuthPassword,
      },
    });

    const isVerified = await verifySmtpConnection(transporter, "PAYMENT SMTP");
    if (!isVerified) {
      return res.status(500).send("Payments email authentication failed. Please check credentials.");
    }

    let subject = "";
    let filename = "";
    let body = "";

    if (reportType === "IndividualVoucher") {
      let actualVoucherNo = voucherNumber || "";
      if (!actualVoucherNo && individualPaymentId) {
        try {
          const payRec = await PaymentReceived.findById(individualPaymentId)
            .select("voucherNumber voucherNo date supplierCompany buyerCompany")
            .lean();
          if (payRec) {
            actualVoucherNo = payRec.voucherNumber || payRec.voucherNo || individualPaymentId;
            if (!supplierCompany) supplierCompany = payRec.supplierCompany || "";
            if (!buyerCompany) buyerCompany = payRec.buyerCompany || "";
          }
        } catch (lookupErr) {
          console.warn("[EMAIL] Failed to lookup payment voucher details:", lookupErr.message);
        }
      }

      const vchDisplay = actualVoucherNo ? ` #${String(actualVoucherNo)}` : "";
      const companyParts = [];
      if (buyerCompany) companyParts.push(String(buyerCompany));
      if (supplierCompany) companyParts.push(String(supplierCompany));
      const companyText = companyParts.length > 0
        ? ` · ${companyParts.join(" → ")}`
        : "";

      const safeName = (str) => String(str || "").replace(/[^a-zA-Z0-9]/g, "_");
      const fileNameParts = [
        "Payment_Voucher",
        safeName(buyerCompany),
        safeName(supplierCompany),
        safeName(actualVoucherNo),
      ].filter(Boolean);
      filename = fileNameParts.join("_") + ".pdf";

      subject = `Payment Voucher${vchDisplay}${companyText}`;
      body = `Dear Sir/Madam,

Please find attached the Payment Voucher${vchDisplay}.${buyerCompany ? `\nBuyer Company: ${buyerCompany}` : ""}${supplierCompany ? `\nSupplier Company: ${supplierCompany}` : ""}

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
