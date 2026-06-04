import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    heading: { type: String, required: true },
    content: [{ type: String, required: true }], // Array of paragraphs
    imageUrl: { type: String },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, default: Date.now },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

blogSchema.index({ date: -1 });

export default mongoose.model("Blog", blogSchema);
