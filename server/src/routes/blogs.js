import { Router } from "express";
import Blog from "../models/Blog.js";
import authJwt from "../middleware/authJwt.js";

const router = Router();

// Public: Get latest blog
router.get("/latest", async (req, res) => {
  try {
    const blog = await Blog.findOne({ isPublished: true })
      .sort({ date: -1 })
      .populate("author", "name role");
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Public: Get blogs by date/page
router.get("/", async (req, res) => {
  try {
    const { date, page = 1, limit = 10 } = req.query;
    const query = { isPublished: true };
    
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const blogs = await Blog.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("author", "name role");

    const count = await Blog.countDocuments(query);

    res.json({
      blogs,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Protected: Admin/Employee can create/edit/delete
router.post("/", authJwt, async (req, res) => {
  try {
    if (!["Admin", "Employee"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { title, heading, content, imageUrl, date } = req.body;
    const blog = new Blog({
      title,
      heading,
      content,
      imageUrl,
      date: date || new Date(),
      author: req.user.id,
    });

    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id", authJwt, async (req, res) => {
  try {
    if (!["Admin", "Employee"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", authJwt, async (req, res) => {
  try {
    if (!["Admin", "Employee"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json({ message: "Blog deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
