import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaRegCalendarAlt,
  FaBookmark,
  FaRegBookmark,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
  FaSearch,
  FaNewspaper,
  FaTags,
} from "react-icons/fa";
import { toast } from "react-toastify";
import api, { clearApiCache } from "../../utils/apiClient/apiClient";
import Loading from "../../common/Loading/Loading";
import { useAuth } from "../../context/AuthContext/AuthContext";

const CATEGORIES = [
  "All",
  "General",
  "Commodity",
  "Logistics",
  "Market Analysis",
  "Company Update",
];

const NewsArchive = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [blogs, setBlogs] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterDate, setFilterDate] = useState("");
  const [category, setCategory] = useState("All");
  const [viewMode, setViewMode] = useState("archive"); // "archive" or "bookmarks"

  useEffect(() => {
    fetchNews();
    if (user) fetchBookmarks();
  }, [page, filterDate, category, viewMode, user]);

  const fetchNews = async () => {
    if (viewMode === "bookmarks") return;
    try {
      setLoading(true);
      const params = {
        page,
        limit: 9,
        date: filterDate,
        category: category === "All" ? "" : category,
      };
      const res = await api.get("/blogs", { params });
      setBlogs(res.data.blogs);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      toast.error("Error fetching news");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const res = await api.get("/blogs/user/bookmarks");
      setBookmarks(res.data);
      if (viewMode === "bookmarks") {
        setBlogs(res.data);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching bookmarks");
    }
  };

  const handleBookmark = async (e, id) => {
    e.stopPropagation();
    if (!user) {
      toast.info("Please login to bookmark news");
      return;
    }
    try {
      const res = await api.post(`/blogs/${id}/bookmark`);
      clearApiCache();
      if (res.data.bookmarked) {
        toast.success("Added to bookmarks");
      } else {
        toast.success("Removed from bookmarks");
      }
      fetchBookmarks();
    } catch (error) {
      toast.error("Action failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#1e3a5f] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200">
              <FaNewspaper size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">
                {viewMode === "archive"
                  ? "Hansaria News Archive"
                  : "My Bookmarks"}
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                {viewMode === "archive"
                  ? "Browse historical news and daily bulletins"
                  : "Your curated list of saved news and reports"}
              </p>
            </div>
          </div>

          <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            <button
              onClick={() => {
                setViewMode("archive");
                setPage(1);
              }}
              className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                viewMode === "archive"
                  ? "bg-[#1e3a5f] text-white shadow-lg shadow-blue-100"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              All News
            </button>
            <button
              onClick={() => {
                setViewMode("bookmarks");
                setPage(1);
              }}
              className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                viewMode === "bookmarks"
                  ? "bg-[#1e3a5f] text-white shadow-lg shadow-blue-100"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Saved
            </button>
          </div>
        </div>

        {/* Filters */}
        {viewMode === "archive" && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <FaRegCalendarAlt className="text-slate-400" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setPage(1);
                }}
                className="text-sm font-bold text-slate-700 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            <div className="h-8 w-px bg-slate-200 hidden md:block" />

            <div className="flex items-center gap-3">
              <FaTags className="text-slate-400" />
              <div className="flex gap-2 overflow-x-auto max-w-md scrollbar-hide">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategory(cat);
                      setPage(1);
                    }}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                      category === cat
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {(filterDate || category !== "All") && (
              <button
                onClick={() => {
                  setFilterDate("");
                  setCategory("All");
                  setPage(1);
                }}
                className="ml-auto text-rose-500 text-[10px] font-black uppercase hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <div className="col-span-full py-32">
              <Loading size="lg" />
            </div>
          ) : blogs.length > 0 ? (
            blogs.map((blog) => (
              <div
                key={blog._id}
                onClick={() => navigate(`/blog/${blog._id}`)}
                className="group bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer flex flex-col"
              >
                <div className="h-52 bg-slate-100 relative overflow-hidden">
                  {blog.images?.[0] || blog.imageUrl ? (
                    <img
                      src={blog.images?.[0] || blog.imageUrl}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      alt=""
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <FaNewspaper size={48} />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-sm">
                    <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">
                      {blog.category || "General"}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleBookmark(e, blog._id)}
                    className={`absolute top-4 right-4 w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur transition-all ${
                      bookmarks.some((b) => b._id === blog._id)
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                        : "bg-white/90 text-slate-400 hover:text-blue-600 shadow-sm"
                    }`}
                  >
                    {bookmarks.some((b) => b._id === blog._id) ? (
                      <FaBookmark />
                    ) : (
                      <FaRegBookmark />
                    )}
                  </button>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      <FaRegCalendarAlt size={12} className="text-slate-300" />
                      {new Date(blog.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-400">
                      <FaEye size={12} className="text-slate-300" />
                      {blog.views || 0}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-800 line-clamp-2 mb-3 group-hover:text-blue-600 transition-colors">
                    {blog.title}
                  </h3>

                  <p className="text-sm text-slate-500 font-medium line-clamp-3 leading-relaxed mb-6">
                    {blog.heading}
                  </p>

                  <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {blog.images?.slice(0, 3).map((img, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-slate-200"
                        >
                          <img
                            src={img}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        </div>
                      ))}
                      {blog.images?.length > 3 && (
                        <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">
                          +{blog.images.length - 3}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest group-hover:translate-x-1 transition-transform">
                      Read Full Story →
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-40 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                <FaSearch size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  No news items found
                </h3>
                <p className="text-slate-500 text-sm font-medium">
                  Try adjusting your filters or search for another date
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && viewMode === "archive" && (
          <div className="flex justify-center items-center gap-4 pt-10">
            <button
              disabled={page === 1}
              onClick={() => setPage((prev) => prev - 1)}
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${
                page === 1
                  ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-500 hover:text-blue-600 shadow-sm"
              }`}
            >
              <FaChevronLeft />
            </button>
            <div className="flex items-center gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-12 h-12 rounded-2xl text-xs font-black transition-all ${
                    page === i + 1
                      ? "bg-[#1e3a5f] text-white shadow-lg shadow-blue-200"
                      : "bg-white text-slate-400 border border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((prev) => prev + 1)}
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${
                page === totalPages
                  ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-500 hover:text-blue-600 shadow-sm"
              }`}
            >
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsArchive;
