const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

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
      subject: `Sauda Confirmation - HANS-2025-${saudaNo}`,
      text: `Dear Sir/Madam,\n\nPlease find attached the Sauda Confirmation for Sauda No: HANS-2025-${saudaNo}.\n\nThank you for your business.\n\nBest Regards,\nHansaria Food Pvt. Ltd.`,
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

module.exports = router;
