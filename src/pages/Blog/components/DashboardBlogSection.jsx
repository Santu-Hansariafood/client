import React, { useState, useEffect } from "react";
import { FaNewspaper } from "react-icons/fa";
import api from "../../../utils/apiClient/apiClient";
import BlogCard from "./BlogCard";
import Loading from "../../../common/Loading/Loading";

const DashboardBlogSection = () => {
  const [latestBlog, setLatestBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await api.get("/blogs/latest");
        setLatestBlog(res.data);
      } catch (error) {
        console.error("Error fetching latest news:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLatest();
  }, []);

  if (loading) return <div className="h-48 flex items-center justify-center"><Loading size="sm" /></div>;
  if (!latestBlog) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200">
          <FaNewspaper size={14} />
        </div>
        <div>
          <h4 className="font-black text-slate-800 uppercase tracking-tight">Hansaria Food News</h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Latest updates & announcements</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <BlogCard blog={latestBlog} />
        <div className="hidden md:flex bg-slate-50 rounded-3xl border border-dashed border-slate-200 p-8 flex-col items-center justify-center text-center group hover:bg-slate-100/50 transition-all">
          <div className="w-16 h-16 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-300 mb-4 group-hover:scale-110 transition-transform">
            <FaNewspaper size={24} />
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">More news coming soon</p>
          <p className="text-[10px] font-medium text-slate-400 mt-2">Stay tuned for the latest updates from Hansaria Food.</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardBlogSection;
