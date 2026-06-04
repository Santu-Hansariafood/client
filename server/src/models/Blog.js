import mongoose from "mongoose";

const blogContentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["paragraph", "subheading"], default: "paragraph" },
    text: { type: String, required: true },
    bold: { type: Boolean, default: false },
    italic: { type: Boolean, default: false },
    underline: { type: Boolean, default: false },
  },
  { _id: false }
);

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    heading: { type: String, required: true },
    content: [blogContentSchema],
    imageUrl: { type: String },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, default: Date.now },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

blogSchema.index({ date: -1 });

export default mongoose.model("Blog", blogSchema);
