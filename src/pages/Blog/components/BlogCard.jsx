import { FaRegCalendarAlt, FaChevronRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const BlogCard = ({ blog }) => {
  const navigate = useNavigate();

  if (!blog) return null;

  return (
    <div
      className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => navigate(`/blog/${blog._id}`)}
    >
      <div className="relative h-48 overflow-hidden">
        {blog.imageUrl ? (
          <img
            src={blog.imageUrl}
            alt={blog.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
            No Image
          </div>
        )}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600">
          Latest News
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-3">
          <FaRegCalendarAlt size={10} />
          {new Date(blog.date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </div>

        <h3 className="text-lg font-bold text-[#1e3a5f] line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
          {blog.title}
        </h3>

        <p className="text-sm text-[#334155] line-clamp-3 mb-4 font-medium leading-relaxed">
          {blog.heading}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#059669]">
            Hansaria Food News
          </span>
          <div className="flex items-center gap-1 text-blue-600 text-[10px] font-black uppercase tracking-widest group-hover:translate-x-1 transition-transform">
            Read More <FaChevronRight size={8} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
