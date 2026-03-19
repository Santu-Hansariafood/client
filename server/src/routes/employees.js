import { Router } from "express";
import Employee from "../models/Employee.js";
import nodemailer from "nodemailer";

const router = Router();

const generateEmployeeId = async () => {
  const lastEmployee = await Employee.findOne().sort({ createdAt: -1 });
  if (!lastEmployee || !lastEmployee.employeeId) {
    return "HANS001";
  }
  const lastId = lastEmployee.employeeId;
  const match = lastId.match(/HANS(\d+)/);
  if (!match) return "HANS001";
  const nextNum = parseInt(match[1]) + 1;
  return `HANS${nextNum.toString().padStart(3, "0")}`;
};

const sendEmployeeRegistrationEmail = async (employeeData) => {
  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #065f46; padding: 24px; text-align: center;">
          <h1 style="color: #fbbf24; margin: 0; font-size: 24px; letter-spacing: 1px;">Hansaria Food Pvt. Ltd.</h1>
          <p style="color: #ecfdf5; margin: 8px 0 0 0; font-size: 14px;">Official Employee Registration</p>
        </div>
        
        <div style="padding: 32px; background-color: #ffffff;">
          <h2 style="color: #1e293b; margin-top: 0; font-size: 20px;">Welcome to the Team, ${employeeData.name}!</h2>
          <p style="color: #475569; line-height: 1.6;">We are excited to have you join Hansaria Food Private Limited. Your official registration has been completed successfully. Below are your account details:</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Employee ID</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${employeeData.employeeId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Full Name</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 500; text-align: right;">${employeeData.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Email Address</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 500; text-align: right;">${employeeData.email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Mobile Number</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 500; text-align: right;">${employeeData.mobile}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Gender</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 500; text-align: right;">${employeeData.sex}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Status</td>
                <td style="padding: 8px 0; color: #059669; font-weight: 700; text-align: right;">${employeeData.status}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;"><strong>Security Note:</strong> Please use your mobile number and the password set during registration to log in to the portal.</p>
          </div>
          
          <p style="color: #475569; font-size: 14px; margin-bottom: 0;">If you have any questions, please contact the IT or HR department.</p>
        </div>
        
        <div style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">© 2025 Hansaria Food Pvt. Ltd. | All Rights Reserved</p>
          <p style="color: #94a3b8; font-size: 11px; margin: 8px 0 0 0;">This is an automated message, please do not reply.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"Hansaria HR" <${process.env.EMAIL_USER}>`,
      to: employeeData.email,
      subject: `Welcome to Team HANS - ${employeeData.employeeId}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Registration email sent to ${employeeData.email}`);
  } catch (error) {
    console.error("Error sending registration email:", error);
  }
};

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const employees = await Employee.find()
      .select("name employeeId email mobile sex status")
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Employee.countDocuments();

    res.json({
      data: employees,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const employeeId = await generateEmployeeId();
    const employeeData = { ...req.body, employeeId };
    const employee = new Employee(employeeData);
    const saved = await employee.save();
    
    // Send email asynchronously
    sendEmployeeRegistrationEmail(saved);
    
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updated = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Employee not found" });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Employee.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Employee not found" });
    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
