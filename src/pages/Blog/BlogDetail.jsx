import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  FaArrowLeft,
  FaPrint,
  FaUser,
  FaBookmark,
  FaRegBookmark,
  FaEye,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { toast } from "react-toastify";
import api, { clearApiCache } from "../../utils/apiClient/apiClient";
import Loading from "../../common/Loading/Loading";
import { useAuth } from "../../context/AuthContext/AuthContext";

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [blogRes, userBookmarksRes] = await Promise.all([
          api.get(`/blogs/${id}`),
          user
            ? api.get("/blogs/user/bookmarks")
            : Promise.resolve({ data: [] }),
        ]);

        setBlog(blogRes.data);
        if (user) {
          const bookmarked = userBookmarksRes.data.some((b) => b._id === id);
          setIsBookmarked(bookmarked);
        }
      } catch (error) {
        console.error("Error fetching blog data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const handleBookmark = async () => {
    if (!user) {
      toast.info("Please login to bookmark news");
      return;
    }
    try {
      const res = await api.post(`/blogs/${id}/bookmark`);
      clearApiCache();
      setIsBookmarked(res.data.bookmarked);
      toast.success(
        res.data.bookmarked ? "Bookmarked" : "Removed from bookmarks",
      );
    } catch (error) {
      toast.error("Failed to update bookmark");
    }
  };

  if (loading) return <Loading size="lg" />;
  if (!blog) return <div className="p-10 text-center text-lux-muted">News not found</div>;

  const galleryImages =
    blog.images?.length > 0
      ? blog.images
      : blog.imageUrl
        ? [blog.imageUrl]
        : [];

  return (
    <>
      {blog && (
        <Helmet>
          <title>{blog.title} | Hansaria Food News</title>
          <meta
            name="description"
            content={
              blog.heading ||
              blog.content?.[0]?.text ||
              "Latest news from Hansaria Food"
            }
          />
          <meta property="og:title" content={blog.title} />
          <meta
            property="og:description"
            content={
              blog.heading ||
              blog.content?.[0]?.text ||
              "Latest news from Hansaria Food"
            }
          />
          <meta property="og:type" content="article" />
          <meta
            property="og:url"
            content={`https://bid.hansariafood.in/blog/${id}`}
          />
          <meta
            property="og:image"
            content={
              blog.imageUrl ||
              blog.images?.[0] ||
              "https://bid.hansariafood.in/images/og-image.png"
            }
          />
          <meta property="article:published_time" content={blog.date} />
          <meta
            property="article:author"
            content={blog.author?.name || "Hansaria Food"}
          />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={blog.title} />
          <meta
            name="twitter:description"
            content={
              blog.heading ||
              blog.content?.[0]?.text ||
              "Latest news from Hansaria Food"
            }
          />
          <meta
            name="twitter:image"
            content={
              blog.imageUrl ||
              blog.images?.[0] ||
              "https://bid.hansariafood.in/images/og-image.png"
            }
          />
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              headline: blog.title,
              description: blog.heading || blog.content?.[0]?.text,
              image:
                blog.imageUrl ||
                blog.images?.[0] ||
                "https://bid.hansariafood.in/images/og-image.png",
              author: {
                "@type": "Person",
                name: blog.author?.name || "Hansaria Food",
              },
              publisher: {
                "@type": "Organization",
                name: "Hansaria Food Private Limited",
                logo: {
                  "@type": "ImageObject",
                  url: "https://bid.hansariafood.in/icons/android-chrome-512x512.png",
                },
              },
              datePublished: blog.date,
              dateModified: blog.updatedAt || blog.date,
              mainEntityOfPage: {
                "@type": "WebPage",
                "@id": `https://bid.hansariafood.in/blog/${id}`,
              },
            })}
          </script>
        </Helmet>
      )}
      <div className="lux-canvas min-h-screen px-4 py-10 print:bg-white print:px-0 print:py-0">
        <div className="mx-auto min-h-[1000px] max-w-4xl border-x border-[#ece4d2] bg-lux-cream shadow-2xl print:border-none print:shadow-none">
          <div className="border-b-4 border-double border-lux-ink p-8 text-center">
            <div className="mb-4 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-lux-muted print:hidden">
              <span>Established 2026</span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-1 transition-colors hover:text-lux-ink"
                >
                  <FaArrowLeft size={8} /> Back
                </button>
                <button
                  onClick={handleBookmark}
                  className={`${isBookmarked ? "text-lux-emerald" : "hover:text-lux-ink"} flex items-center gap-1 transition-colors`}
                >
                  {isBookmarked ? (
                    <FaBookmark size={10} />
                  ) : (
                    <FaRegBookmark size={10} />
                  )}
                  {isBookmarked ? "Bookmarked" : "Bookmark"}
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 transition-colors hover:text-lux-ink"
                >
                  <FaPrint size={8} /> Print
                </button>
              </div>
              <span>Volume I · No. 1</span>
            </div>

            <h1 className="my-6 font-serif text-5xl font-semibold italic tracking-tighter text-lux-ink md:text-7xl">
              Hansaria Food News
            </h1>

            <div className="flex items-center justify-between border-y border-lux-ink/30 py-2 text-[11px] font-black uppercase tracking-widest text-lux-ink">
              <span>KOLKATA, WEST BENGAL</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <FaCalendarAlt size={10} className="text-lux-muted" />
                  {new Date(blog.date)
                    .toLocaleDateString("en-GB", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                    .toUpperCase()}
                </span>
                <span className="flex items-center gap-1.5 print:hidden">
                  <FaEye size={10} className="text-lux-muted" />
                  {blog.views || 0}
                </span>
              </div>
              <span>PRICE: FREE</span>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="mb-8 text-center">
              <div className="mb-2">
                <span className="rounded-full bg-lux-emerald px-3 py-1 text-[10px] font-black uppercase tracking-widest text-lux-gold-soft">
                  {blog.category || "General"}
                </span>
              </div>
              <h2 className="mb-4 font-serif text-3xl font-semibold leading-tight text-lux-ink drop-shadow-sm md:text-5xl">
                {blog.title}
              </h2>
              <div className="mx-auto mb-6 h-1 w-24 bg-lux-gold"></div>
              <p className="mx-auto max-w-2xl text-xl font-semibold italic leading-relaxed text-lux-emerald">
                &quot;{blog.heading}&quot;
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
              <div className="md:col-span-8">
                {galleryImages.length > 0 && (
                  <div className="mb-8">
                    <div className="group relative aspect-video overflow-hidden border-4 border-lux-ivory bg-lux-ivory p-2 shadow-sm">
                      <img
                        src={galleryImages[activeImageIdx]}
                        alt={`${blog.title} - ${activeImageIdx + 1}`}
                        className="w-full h-full object-cover transition-all duration-700 rounded shadow-inner"
                      />

                      {galleryImages.length > 1 && (
                        <>
                          <button
                            onClick={() =>
                              setActiveImageIdx((prev) =>
                                prev > 0 ? prev - 1 : galleryImages.length - 1,
                              )
                            }
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FaChevronLeft size={12} />
                          </button>
                          <button
                            onClick={() =>
                              setActiveImageIdx((prev) =>
                                prev < galleryImages.length - 1 ? prev + 1 : 0,
                              )
                            }
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <FaChevronRight size={12} />
                          </button>
                          <div className="absolute bottom-4 right-4 bg-black/50 text-white text-[10px] font-black px-2 py-1 rounded">
                            {activeImageIdx + 1} / {galleryImages.length}
                          </div>
                        </>
                      )}
                    </div>

                    {galleryImages.length > 1 && (
                      <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {galleryImages.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveImageIdx(idx)}
                            className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${activeImageIdx === idx ? "border-lux-emerald shadow-md" : "border-transparent opacity-60 hover:opacity-100"}`}
                          >
                            <img
                              src={img}
                              className="w-full h-full object-cover"
                              alt={`Thumb ${idx}`}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="mt-2 border-t border-[#ece4d2] pt-2 text-center text-[10px] font-bold uppercase italic tracking-widest text-lux-muted">
                      News Bulletin from Hansaria Food Pvt. Ltd.
                    </p>
                  </div>
                )}

                <div className="prose prose-slate max-w-none">
                  {blog.content.map((block, idx) => {
                    const style = `${block.bold ? "font-bold" : ""} ${block.italic ? "italic" : ""} ${block.underline ? "underline" : ""}`;
                    const colorStyle = {
                      color:
                        block.color ||
                        (block.type === "subheading" ? "#1e3a5f" : "#334155"),
                    };

                    if (block.type === "subheading") {
                      return (
                        <h3
                          key={idx}
                          className={`mt-8 mb-4 border-b border-[#ece4d2] pb-2 font-serif text-xl font-semibold ${style}`}
                          style={colorStyle}
                        >
                          {block.text}
                        </h3>
                      );
                    }

                    if (block.type === "list") {
                      return (
                        <div key={idx} className="mb-6">
                          {block.text && (
                            <p
                              className={`text-lg font-bold mb-2 ${style}`}
                              style={colorStyle}
                            >
                              {block.text}
                            </p>
                          )}
                          <ul
                            className={`space-y-2 ml-6 ${block.listType === "number" ? "list-decimal" : "list-disc"}`}
                          >
                            {block.listItems?.map((item, itemIdx) => (
                              <li
                                key={itemIdx}
                                className={`text-lg font-serif ${style}`}
                                style={colorStyle}
                              >
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    }

                    return (
                      <p
                        key={idx}
                        className={`text-lg leading-relaxed font-serif mb-6 text-justify ${idx === 0 ? "first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-1" : ""} ${style}`}
                        style={colorStyle}
                      >
                        {block.text}
                      </p>
                    );
                  })}
                </div>
              </div>

              <div className="hidden border-l border-[#ece4d2] pl-8 md:col-span-4 md:block">
                <div className="sticky top-10 space-y-8">
                  <div>
                    <h4 className="lux-eyebrow mb-3">
                      Posted By
                    </h4>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lux-ivory text-lux-muted">
                        <FaUser size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase text-lux-ink">
                          {blog.author?.name || "Admin"}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-tighter text-lux-muted">
                          {blog.author?.role || "Staff"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4">
                    <h4 className="lux-eyebrow mb-3">
                      Notice
                    </h4>
                    <p className="text-[11px] font-bold italic leading-relaxed text-lux-muted">
                      &quot;This news bulletin is intended for internal
                      communication between Hansaria Food and its valued
                      partners including Transporters, Sellers, and
                      Buyers.&quot;
                    </p>
                  </div>

                  {isBookmarked && (
                    <div className="flex items-center gap-3 rounded-2xl border border-[#e6dcc4] bg-lux-cream p-4">
                      <FaBookmark className="text-lux-emerald" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-lux-emerald">
                        Saved in your bookmarks
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-[#ece4d2] bg-lux-ivory p-8 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-lux-muted">
              © 2026 Hansaria Food Pvt. Ltd. · All Rights Reserved
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default BlogDetail;
