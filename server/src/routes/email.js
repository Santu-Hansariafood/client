import express from "express";
import nodemailer from "nodemailer";

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
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Prepare claim parameters text
    let claimText = "";
    if (claimParameters && claimParameters.length > 0) {
      claimText = `\n\nQUALITY CLAIMS:\n` + 
        claimParameters.map(c => 
          `• ${c.parameterName || "Unnamed Parameter"}: Standard ${c.standardValue || 0}%, Actual ${c.actualValue || 0}%, Claim Amount ₹${Number(c.claimAmount || 0).toFixed(2)}`
        ).join("\n");
    }

    // Prepare sent by verification text
    let sentByText = "";
    if (sentByName || sentByMobile) {
      sentByText = `\n\nSENT BY:\nName: ${sentByName || "N/A"}\nMobile: ${sentByMobile || "N/A"}`;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: [sellerEmail, process.env.CLAIMS_EMAIL || "claim@hansariafood.com"],
      subject: `Receiving Report - Sauda No. ${saudaNo}`,

      text: `Dear Sir/Madam,

Please find attached the receiving report for Sauda No. ${saudaNo}.

${claimText}

${sentByText ? `\nVERIFIED AND SENT BY:\nName: ${sentByName || "N/A"}\nMobile: ${sentByMobile || "N/A"}` : ""}

Thank you for your business.

Best Regards,
Hansaria Food Private Limited
Contact: +91-8336924066 | +91-9330433535`,
      attachments: [
        {
          filename: `Receiving_Report_${saudaNo}.pdf`,
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

export default router;
