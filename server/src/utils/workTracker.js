
import EmployeeWork from "../models/EmployeeWork.js";

export const trackEmployeeWork = async ({
  req,
  workType,
  title,
  description,
  relatedId,
  priority = "Medium",
  status = "Completed",
}) => {
  try {
    const user = req?.user;
    if (!user) return null; // Only track if we have user info
    if (user.role !== "Employee") return null; // Only track employees

    // Create the work entry
    const work = await EmployeeWork.create({
      employeeId: user.sub,
      workType,
      title,
      description,
      relatedId,
      priority,
      status,
      completedAt: status === "Completed" ? new Date() : null,
    });
    console.log("Work tracked successfully:", work);
    return work;
  } catch (error) {
    console.error("Error tracking employee work:", error);
    return null;
  }
};
