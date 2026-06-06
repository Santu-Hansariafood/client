import { Router } from "express";
import Blog from "../models/Blog.js";
import User from "../models/User.js";
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
    const { date, page = 1, limit = 10, category } = req.query;
    const query = { isPublished: true };
    
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    if (category) {
      query.category = category;
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

// Public: Get single blog and increment views
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate("author", "name role");
    
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Protected: Bookmark/Unbookmark news
router.post("/:id/bookmark", authJwt, async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    const blogId = req.params.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isBookmarked = user.bookmarks.includes(blogId);
    if (isBookmarked) {
      user.bookmarks = user.bookmarks.filter((id) => id.toString() !== blogId);
    } else {
      user.bookmarks.push(blogId);
    }

    await user.save();
    res.json({ bookmarked: !isBookmarked });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Protected: Get user bookmarks
router.get("/user/bookmarks", authJwt, async (req, res) => {
  try {
    const userId = req.user.id || req.user.sub;
    const user = await User.findById(userId).populate({
      path: "bookmarks",
      populate: { path: "author", select: "name role" }
    });
    
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.bookmarks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Protected: Admin only can create/edit/delete
router.post("/", authJwt, async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied. Only Admin can publish news." });
    }

    const { title, heading, content, imageUrl, images, date, category } = req.body;
    
    // Extract author ID from token (handles both 'id' and 'sub' naming conventions)
    const authorId = req.user.id || req.user.sub;

    if (!authorId) {
      return res.status(400).json({ message: "User identification failed. Please log in again." });
    }

    const blog = new Blog({
      title,
      heading,
      content,
      imageUrl,
      images: images || [],
      date: date || new Date(),
      author: authorId,
      category: category || "General",
    });

    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id", authJwt, async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
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
    if (req.user.role !== "Admin") {
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
