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
  const [viewMode, setViewMode] = useState("archive");

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
    <div className="lux-canvas min-h-screen px-4 py-10">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft shadow-lg shadow-lux-emerald/25 ring-1 ring-lux-gold/40">
              <FaNewspaper size={24} />
            </div>
            <div>
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-lux-ink">
                {viewMode === "archive"
                  ? "Hansaria News Archive"
                  : "My Bookmarks"}
              </h1>
              <p className="text-sm font-medium text-lux-muted">
                {viewMode === "archive"
                  ? "Browse historical news and daily bulletins"
                  : "Your curated list of saved news and reports"}
              </p>
            </div>
          </div>

          <div className="flex rounded-2xl border border-[#e6dcc4] bg-lux-cream p-1.5 shadow-sm">
            <button
              onClick={() => {
                setViewMode("archive");
                setPage(1);
              }}
              className={`rounded-xl px-6 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all ${
                viewMode === "archive"
                  ? "bg-lux-emerald text-lux-gold-soft shadow-lg shadow-lux-emerald/25"
                  : "text-lux-muted hover:text-lux-ink"
              }`}
            >
              All News
            </button>
            <button
              onClick={() => {
                setViewMode("bookmarks");
                setPage(1);
              }}
              className={`rounded-xl px-6 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all ${
                viewMode === "bookmarks"
                  ? "bg-lux-emerald text-lux-gold-soft shadow-lg shadow-lux-emerald/25"
                  : "text-lux-muted hover:text-lux-ink"
              }`}
            >
              Saved
            </button>
          </div>
        </div>

        {viewMode === "archive" && (
          <div className="lux-card lux-gold-top flex flex-wrap items-center gap-6 p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <FaRegCalendarAlt className="text-lux-muted" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-[#e6dcc4] bg-lux-cream px-4 py-2 text-sm font-bold text-lux-ink focus:outline-none focus:ring-2 focus:ring-lux-gold/30"
              />
            </div>

            <div className="hidden h-8 w-px bg-[#e6dcc4] md:block" />

            <div className="flex items-center gap-3">
              <FaTags className="text-lux-muted" />
              <div className="flex max-w-md gap-2 overflow-x-auto scrollbar-hide">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategory(cat);
                      setPage(1);
                    }}
                    className={`shrink-0 rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${
                      category === cat
                        ? "border-lux-emerald bg-lux-emerald text-lux-gold-soft"
                        : "border-[#e6dcc4] bg-lux-cream text-lux-muted hover:border-lux-gold/50"
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
                className="ml-auto text-[10px] font-black uppercase text-rose-500 hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {loading ? (
            <Loading />
          ) : blogs.length > 0 ? (
            blogs.map((blog) => (
              <div
                key={blog._id}
                onClick={() => navigate(`/blog/${blog._id}`)}
                className="lux-card lux-card-hover group flex cursor-pointer flex-col overflow-hidden"
              >
                <div className="relative h-52 overflow-hidden bg-lux-ivory">
                  {blog.images?.[0] || blog.imageUrl ? (
                    <img
                      src={blog.images?.[0] || blog.imageUrl}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      alt=""
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lux-muted">
                      <FaNewspaper size={48} />
                    </div>
                  )}
                  <div className="absolute left-4 top-4 rounded-full bg-lux-cream/90 px-3 py-1 shadow-sm backdrop-blur">
                    <span className="text-[10px] font-black uppercase tracking-wider text-lux-emerald">
                      {blog.category || "General"}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleBookmark(e, blog._id)}
                    className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-2xl backdrop-blur transition-all ${
                      bookmarks.some((b) => b._id === blog._id)
                        ? "bg-lux-emerald text-lux-gold-soft shadow-lg shadow-lux-emerald/25"
                        : "bg-lux-cream/90 text-lux-muted shadow-sm hover:text-lux-emerald"
                    }`}
                  >
                    {bookmarks.some((b) => b._id === blog._id) ? (
                      <FaBookmark />
                    ) : (
                      <FaRegBookmark />
                    )}
                  </button>
                </div>

                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-lux-muted">
                      <FaRegCalendarAlt size={12} className="text-lux-muted" />
                      {new Date(blog.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-black text-lux-muted">
                      <FaEye size={12} className="text-lux-muted" />
                      {blog.views || 0}
                    </div>
                  </div>

                  <h3 className="mb-3 font-serif text-xl font-semibold text-lux-ink line-clamp-2 transition-colors group-hover:text-lux-emerald">
                    {blog.title}
                  </h3>

                  <p className="mb-6 text-sm font-medium leading-relaxed text-lux-muted line-clamp-3">
                    {blog.heading}
                  </p>

                  <div className="mt-auto flex items-center justify-between border-t border-[#ece4d2] pt-6">
                    <div className="flex -space-x-2">
                      {blog.images?.slice(0, 3).map((img, i) => (
                        <div
                          key={i}
                          className="h-6 w-6 overflow-hidden rounded-full border-2 border-lux-cream bg-lux-ivory"
                        >
                          <img
                            src={img}
                            className="h-full w-full object-cover"
                            alt=""
                          />
                        </div>
                      ))}
                      {blog.images?.length > 3 && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-lux-cream bg-lux-ivory text-[8px] font-black text-lux-muted">
                          +{blog.images.length - 3}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-lux-emerald transition-transform group-hover:translate-x-1">
                      Read Full Story →
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center space-y-4 py-40 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-lux-ivory text-lux-muted">
                <FaSearch size={32} />
              </div>
              <div>
                <h3 className="font-serif text-xl font-semibold text-lux-ink">
                  No news items found
                </h3>
                <p className="text-sm font-medium text-lux-muted">
                  Try adjusting your filters or search for another date
                </p>
              </div>
            </div>
          )}
        </div>

        {totalPages > 1 && viewMode === "archive" && (
          <div className="flex items-center justify-center gap-4 pt-10">
            <button
              disabled={page === 1}
              onClick={() => setPage((prev) => prev - 1)}
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all ${
                page === 1
                  ? "cursor-not-allowed border-[#ece4d2] bg-lux-ivory text-lux-muted"
                  : "border-[#e6dcc4] bg-lux-cream text-lux-muted shadow-sm hover:border-lux-gold/60 hover:text-lux-emerald"
              }`}
            >
              <FaChevronLeft />
            </button>
            <div className="flex items-center gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`h-12 w-12 rounded-2xl text-xs font-black transition-all ${
                    page === i + 1
                      ? "bg-lux-emerald text-lux-gold-soft shadow-lg shadow-lux-emerald/25"
                      : "border border-[#e6dcc4] bg-lux-cream text-lux-muted hover:border-lux-gold/50"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((prev) => prev + 1)}
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all ${
                page === totalPages
                  ? "cursor-not-allowed border-[#ece4d2] bg-lux-ivory text-lux-muted"
                  : "border-[#e6dcc4] bg-lux-cream text-lux-muted shadow-sm hover:border-lux-gold/60 hover:text-lux-emerald"
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
