import { useState, useEffect } from "react";
import { FaNewspaper } from "react-icons/fa";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";

import BlogCard from "./BlogCard";
import Loading from "../../../common/Loading/Loading";

const DashboardBlogSection = () => {
  const [latestBlog, setLatestBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        clearApiCache();
        const res = await api.get("/blogs/latest");
        setLatestBlog(res.data);
      } catch (error) {
        console.error("Error fetching latest news", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-lux-emerald to-lux-deep flex items-center justify-center text-lux-gold-soft ring-1 ring-lux-gold/40 shadow-lg shadow-lux-emerald/25">
          <FaNewspaper size={14} />
        </div>
        <div>
          <h4 className="font-serif text-lg font-semibold tracking-tight text-lux-ink">
            Hansaria Food News
          </h4>
          <p className="lux-eyebrow mt-0.5">
            Latest updates & announcements
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {latestBlog ? (
          <BlogCard blog={latestBlog} />
        ) : (
          <div className="lux-card p-8 flex flex-col items-center justify-center text-center border-dashed">
            <div className="w-12 h-12 rounded-full bg-[#ece4d2] flex items-center justify-center text-lux-muted mb-4">
              <FaNewspaper size={20} />
            </div>
            <p className="text-xs font-bold text-lux-muted uppercase tracking-widest">
              No news published yet
            </p>
          </div>
        )}
        <div className="hidden md:flex lux-card border-dashed p-8 flex-col items-center justify-center text-center group transition-all hover:shadow-lux-emerald/15 hover:border-[#dccfa8]">
          <div className="w-16 h-16 rounded-full bg-lux-cream border border-[#e9e2d3] flex items-center justify-center text-lux-muted mb-4 group-hover:scale-110 transition-transform">
            <FaNewspaper size={24} />
          </div>
          <p className="text-sm font-bold text-lux-muted uppercase tracking-widest">
            More news coming soon
          </p>
          <p className="text-[10px] font-medium text-lux-muted mt-2">
            Stay tuned for the latest updates from Hansaria Food.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardBlogSection;
