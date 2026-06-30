import mongoose from "mongoose";

const employeeWorkSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    workType: {
      type: String,
      enum: [
        "Loading Entry",
        "Sauda Management",
        "Bid Participation",
        "Custom Task",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Assigned",
        "In Progress",
        "Completed",
        "Cancelled",
      ],
      default: "Pending",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    dueDate: {
      type: Date,
    },
    relatedId: {
      type: String, // Can be ID of LoadingEntry, Bid, Sauda, etc.
      default: "",
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // or Employee
    },
    completedAt: {
      type: Date,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

employeeWorkSchema.index({ employeeId: 1, status: 1 });
employeeWorkSchema.index({ workType: 1 });

export default mongoose.model("EmployeeWork", employeeWorkSchema);
