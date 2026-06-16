import mongoose from "mongoose";

const blogContentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["paragraph", "subheading", "list"],
      default: "paragraph",
    },
    text: { type: String, required: true },
    bold: { type: Boolean, default: false },
    italic: { type: Boolean, default: false },
    underline: { type: Boolean, default: false },
    color: { type: String },
    listType: {
      type: String,
      enum: ["none", "bullet", "number", "alpha"],
      default: "none",
    },
    listItems: [{ type: String }],
  },
  { _id: false },
);

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    heading: { type: String, required: true },
    content: [blogContentSchema],
    imageUrl: { type: String }, // Keep for backward compatibility
    images: [{ type: String }], // Support multiple images
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: { type: Date, default: Date.now },
    isPublished: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
    category: { type: String, default: "General" },
  },
  { timestamps: true },
);

blogSchema.index({ date: -1 });

export default mongoose.model("Blog", blogSchema);
