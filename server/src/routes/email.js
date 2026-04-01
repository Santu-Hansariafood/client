import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/send-pdf", async (req, res) => {
  const {
    pdf,
    email,
    saudaNo,
    poNumber,
    buyer,
    buyerCompany,
    consignee,
    supplierCompany,
    commodity,
    quantity,
    rate,
  } = req.body;

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
Hansaria Food Pvt. Ltd.`,
      attachments: [
        {
          filename: `HANS-2025-${saudaNo}.pdf`,
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
