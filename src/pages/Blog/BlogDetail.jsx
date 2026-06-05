import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPrint, FaUser } from "react-icons/fa";
import api from "../../utils/apiClient/apiClient";
import Loading from "../../common/Loading/Loading";

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await api.get(`/blogs/${id}`);
        setBlog(res.data);
      } catch (error) {
        console.error("Error fetching blog:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [id]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  if (!blog) return <div className="p-10 text-center">News not found</div>;

  return (
    <div className="min-h-screen bg-[#f4f1ea] py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl border-x border-slate-200 min-h-[1000px]">
        <div className="p-8 border-b-4 border-double border-slate-900 text-center">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">
            <span>Established 2026</span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="hover:text-slate-900 transition-colors flex items-center gap-1"
              >
                <FaArrowLeft size={8} /> Back
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
            <span>
              {new Date(blog.date)
                .toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
                .toUpperCase()}
            </span>
            <span>PRICE: FREE</span>
          </div>
        </div>

        <div className="p-8 md:p-12">
          <div className="mb-8 text-center">
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
              {blog.imageUrl && (
                <div className="mb-8 border-4 border-slate-100 p-2 shadow-sm bg-slate-50">
                  <img
                    src={blog.imageUrl}
                    alt={blog.title}
                    className="w-full h-auto transition-all duration-700 rounded shadow-inner"
                  />
                  <p className="mt-2 text-[10px] italic font-bold text-slate-400 text-center border-t border-slate-200 pt-2 uppercase tracking-widest">
                    Official bulletin from Hansaria Food Pvt. Ltd.
                  </p>
                </div>
              )}

              <div className="prose prose-slate max-w-none">
                {blog.content.map((block, idx) => {
                  const style = `${block.bold ? "font-bold" : ""} ${block.italic ? "italic" : ""} ${block.underline ? "underline" : ""}`;

                  if (block.type === "subheading") {
                    return (
                      <h3
                        key={idx}
                        className={`text-xl font-serif font-black text-[#1e3a5f] mt-8 mb-4 border-b border-slate-100 pb-2 ${style}`}
                      >
                        {block.text}
                      </h3>
                    );
                  }

                  return (
                    <p
                      key={idx}
                      className={`text-lg leading-relaxed text-[#334155] font-serif mb-6 text-justify ${idx === 0 ? "first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-[#1e3a5f]" : ""} ${style}`}
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
