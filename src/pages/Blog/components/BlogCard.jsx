import { FaRegCalendarAlt, FaChevronRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const BlogCard = ({ blog }) => {
  const navigate = useNavigate();

  if (!blog) return null;

  return (
    <div
      className="lux-card lux-card-hover overflow-hidden cursor-pointer group flex flex-col"
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
          <div className="w-full h-full bg-lux-ivory flex items-center justify-center text-lux-muted">
            No Image
          </div>
        )}
        <div className="absolute top-4 left-4 bg-lux-cream/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-lux-muted">
          Latest News
        </div>
      </div>

      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        <div className="flex items-center gap-2 text-lux-emerald text-[10px] font-black uppercase tracking-widest mb-3">
          <FaRegCalendarAlt size={10} />
          {new Date(blog.date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </div>

        <h3 className="font-serif text-lg font-semibold text-lux-ink line-clamp-2 mb-2 group-hover:text-lux-emerald transition-colors">
          {blog.title}
        </h3>

        <p className="text-sm text-lux-muted line-clamp-3 mb-4 font-medium leading-relaxed">
          {blog.heading}
        </p>

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-[#ece4d2]">
          <span className="text-[10px] font-black uppercase tracking-widest text-lux-emerald">
            Hansaria Food News
          </span>
          <div className="flex items-center gap-1 text-lux-emerald text-[10px] font-black uppercase tracking-widest group-hover:text-lux-deep group-hover:translate-x-1 transition-transform">
            Read More <FaChevronRight size={8} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
