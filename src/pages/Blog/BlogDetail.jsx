import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPrint, FaUser, FaBookmark, FaRegBookmark, FaEye, FaCalendarAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../utils/apiClient/apiClient";
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
          user ? api.get("/blogs/user/bookmarks") : Promise.resolve({ data: [] })
        ]);
        
        setBlog(blogRes.data);
        if (user) {
          const bookmarked = userBookmarksRes.data.some(b => b._id === id);
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
      setIsBookmarked(res.data.bookmarked);
      toast.success(res.data.bookmarked ? "Bookmarked" : "Removed from bookmarks");
    } catch (error) {
      toast.error("Failed to update bookmark");
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  if (!blog) return <div className="p-10 text-center">News not found</div>;

  const galleryImages = blog.images?.length > 0 ? blog.images : (blog.imageUrl ? [blog.imageUrl] : []);

  return (
    <div className="min-h-screen bg-[#f4f1ea] py-10 px-4 print:bg-white print:py-0 print:px-0">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl border-x border-slate-200 min-h-[1000px] print:shadow-none print:border-none">
        <div className="p-8 border-b-4 border-double border-slate-900 text-center">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 print:hidden">
            <span>Established 2026</span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="hover:text-slate-900 transition-colors flex items-center gap-1"
              >
                <FaArrowLeft size={8} /> Back
              </button>
              <button
                onClick={handleBookmark}
                className={`${isBookmarked ? "text-blue-600" : "hover:text-slate-900"} transition-colors flex items-center gap-1`}
              >
                {isBookmarked ? <FaBookmark size={10} /> : <FaRegBookmark size={10} />}
                {isBookmarked ? "Bookmarked" : "Bookmark"}
              </button>
              <button
                onClick={() => window.print()}
                className="hover:text-slate-900 transition-colors flex items-center gap-1"
              >
                <FaPrint size={8} /> Print
              </button>
            </div>
            <span>Volume I · No. 1</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-serif font-black tracking-tighter text-slate-900 my-6 italic">
            Hansaria Food News
          </h1>

          <div className="border-y border-slate-900 py-2 flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-slate-800">
            <span>KOLKATA, WEST BENGAL</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <FaCalendarAlt size={10} className="text-slate-400" />
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
                <FaEye size={10} className="text-slate-400" />
                {blog.views || 0}
              </span>
            </div>
            <span>PRICE: FREE</span>
          </div>
        </div>

        <div className="p-8 md:p-12">
          <div className="mb-8 text-center">
            <div className="mb-2">
              <span className="text-[10px] font-black uppercase bg-blue-600 text-white px-3 py-1 rounded-full tracking-widest">
                {blog.category || "General"}
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif font-black leading-tight text-[#1e3a5f] mb-4 drop-shadow-sm">
              {blog.title}
            </h2>
            <div className="w-24 h-1 bg-[#1e3a5f] mx-auto mb-6"></div>
            <p className="text-xl font-bold italic text-[#059669] max-w-2xl mx-auto leading-relaxed">
              &quot;{blog.heading}&quot;
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-8">
              {galleryImages.length > 0 && (
                <div className="mb-8">
                  <div className="relative aspect-video border-4 border-slate-100 p-2 shadow-sm bg-slate-50 overflow-hidden group">
                    <img
                      src={galleryImages[activeImageIdx]}
                      alt={`${blog.title} - ${activeImageIdx + 1}`}
                      className="w-full h-full object-cover transition-all duration-700 rounded shadow-inner"
                    />
                    
                    {galleryImages.length > 1 && (
                      <>
                        <button
                          onClick={() => setActiveImageIdx(prev => (prev > 0 ? prev - 1 : galleryImages.length - 1))}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FaChevronLeft size={12} />
                        </button>
                        <button
                          onClick={() => setActiveImageIdx(prev => (prev < galleryImages.length - 1 ? prev + 1 : 0))}
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
                          className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${activeImageIdx === idx ? "border-blue-600 shadow-md" : "border-transparent opacity-60 hover:opacity-100"}`}
                        >
                          <img src={img} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="mt-2 text-[10px] italic font-bold text-slate-400 text-center border-t border-slate-200 pt-2 uppercase tracking-widest">
                    News Bulletin from Hansaria Food Pvt. Ltd.
                  </p>
                </div>
              )}

              <div className="prose prose-slate max-w-none">
                {blog.content.map((block, idx) => {
                  const style = `${block.bold ? "font-bold" : ""} ${block.italic ? "italic" : ""} ${block.underline ? "underline" : ""}`;
                  const colorStyle = { color: block.color || (block.type === "subheading" ? "#1e3a5f" : "#334155") };

                  if (block.type === "subheading") {
                    return (
                      <h3
                        key={idx}
                        className={`text-xl font-serif font-black mt-8 mb-4 border-b border-slate-100 pb-2 ${style}`}
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
                          <p className={`text-lg font-bold mb-2 ${style}`} style={colorStyle}>
                            {block.text}
                          </p>
                        )}
                        <ul className={`space-y-2 ml-6 ${block.listType === "number" ? "list-decimal" : "list-disc"}`}>
                          {block.listItems?.map((item, itemIdx) => (
                            <li key={itemIdx} className={`text-lg font-serif ${style}`} style={colorStyle}>
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

            <div className="md:col-span-4 border-l border-slate-200 pl-8 hidden md:block">
              <div className="sticky top-10 space-y-8">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                    Posted By
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <FaUser size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 uppercase">
                        {blog.author?.name || "Admin"}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                        {blog.author?.role || "Staff"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                    Notice
                  </h4>
                  <p className="text-[11px] font-bold text-slate-600 leading-relaxed italic">
                    &quot;This news bulletin is intended for internal
                    communication between Hansaria Food and its valued partners
                    including Transporters, Sellers, and Buyers.&quot;
                  </p>
                </div>

                {isBookmarked && (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
                    <FaBookmark className="text-blue-600" />
                    <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest">
                      Saved in your bookmarks
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="p-8 border-t border-slate-200 text-center bg-slate-50">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            © 2026 Hansaria Food Pvt. Ltd. · All Rights Reserved
          </p>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;
