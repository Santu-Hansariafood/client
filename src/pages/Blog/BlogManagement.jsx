import { useState, useEffect } from "react";
import {
  FaPlus,
  FaTrash,
  FaImage,
  FaSave,
  FaNewspaper,
  FaRegCalendarAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../utils/apiClient/apiClient";
import AdminPageShell from "../../common/AdminPageShell/AdminPageShell";
import Loading from "../../common/Loading/Loading";

const BlogManagement = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    heading: "",
    content: [
      {
        type: "paragraph",
        text: "",
        bold: false,
        italic: false,
        underline: false,
      },
    ],
    imageUrl: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/blogs");
      setBlogs(res.data.blogs || []);
    } catch (error) {
      toast.error("Error fetching blogs");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBlock = (type) => {
    setFormData((prev) => ({
      ...prev,
      content: [
        ...prev.content,
        { type, text: "", bold: false, italic: false, underline: false },
      ],
    }));
  };

  const handleRemoveBlock = (index) => {
    const newContent = [...formData.content];
    newContent.splice(index, 1);
    setFormData((prev) => ({ ...prev, content: newContent }));
  };

  const handleBlockChange = (index, field, value) => {
    const newContent = [...formData.content];
    newContent[index] = { ...newContent[index], [field]: value };
    setFormData((prev) => ({ ...prev, content: newContent }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      toast.info("Uploading image...");
      const res = await api.post("/uploads", uploadData);
      setFormData((prev) => ({ ...prev, imageUrl: res.data.url }));
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Image upload failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.title ||
      !formData.heading ||
      formData.content.some((c) => !c.text)
    ) {
      toast.warning("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/blogs", formData);
      if (res.status === 201 || res.status === 200) {
        toast.success("Blog post created successfully");
        setShowAddForm(false);
        setFormData({
          title: "",
          heading: "",
          content: [
            {
              type: "paragraph",
              text: "",
              bold: false,
              italic: false,
              underline: false,
            },
          ],
          imageUrl: "",
          date: new Date().toISOString().split("T")[0],
        });
        fetchBlogs();
      }
    } catch (error) {
      console.error("Publish error:", error);
      toast.error(error.response?.data?.message || "Error creating blog post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this news?")) return;
    try {
      await api.delete(`/blogs/${id}`);
      toast.success("News deleted");
      fetchBlogs();
    } catch (error) {
      toast.error("Error deleting news");
    }
  };

  return (
    <AdminPageShell
      title="Hansaria Food News"
      subtitle="Manage internal news and announcements"
      icon={FaNewspaper}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
            News Bulletin
          </h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
          >
            {showAddForm ? (
              "Close Form"
            ) : (
              <>
                <FaPlus /> Create News
              </>
            )}
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h4 className="font-black text-slate-800 uppercase tracking-widest text-[11px]">
                New Publication
              </h4>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Main Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g. Annual Commodity Forecast 2026"
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Publication Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Sub-heading (Summary)
                </label>
                <textarea
                  value={formData.heading}
                  onChange={(e) =>
                    setFormData({ ...formData, heading: e.target.value })
                  }
                  placeholder="A brief overview of the news..."
                  rows={2}
                  className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 resize-none"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    News Content
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => handleAddBlock("paragraph")}
                      className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline"
                    >
                      + Add Paragraph
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock("subheading")}
                      className="text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:underline"
                    >
                      + Add Heading
                    </button>
                  </div>
                </div>
                {formData.content.map((block, index) => (
                  <div
                    key={index}
                    className="relative group bg-slate-50 p-6 rounded-2xl border border-slate-200"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <span
                        className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${block.type === "subheading" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}
                      >
                        {block.type}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleBlockChange(index, "bold", !block.bold)
                          }
                          className={`w-8 h-8 rounded flex items-center justify-center font-bold border ${block.bold ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-400 border-slate-200"}`}
                          title="Bold"
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleBlockChange(index, "italic", !block.italic)
                          }
                          className={`w-8 h-8 rounded flex items-center justify-center italic border ${block.italic ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-400 border-slate-200"}`}
                          title="Italic"
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleBlockChange(
                              index,
                              "underline",
                              !block.underline,
                            )
                          }
                          className={`w-8 h-8 rounded flex items-center justify-center underline border ${block.underline ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-400 border-slate-200"}`}
                          title="Underline"
                        >
                          U
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={block.text}
                      onChange={(e) =>
                        handleBlockChange(index, "text", e.target.value)
                      }
                      placeholder={
                        block.type === "subheading"
                          ? "Enter subheading..."
                          : "Enter paragraph content..."
                      }
                      rows={block.type === "subheading" ? 2 : 4}
                      className={`w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-800 ${block.bold ? "font-bold" : "font-medium"} ${block.italic ? "italic" : ""} ${block.underline ? "underline" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveBlock(index)}
                      className="absolute -right-2 -top-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <FaTrash size={10} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Featured Image
                </label>
                <div className="flex items-center gap-4">
                  <div
                    className={`flex-1 h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${formData.imageUrl ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}
                  >
                    {formData.imageUrl ? (
                      <div className="relative w-full h-full p-2">
                        <img
                          src={formData.imageUrl}
                          className="w-full h-full object-contain rounded-lg"
                          alt="Preview"
                        />
                        <button
                          onClick={() =>
                            setFormData({ ...formData, imageUrl: "" })
                          }
                          className="absolute top-1 right-1 bg-white text-rose-500 p-1 rounded-full shadow-sm hover:text-rose-700"
                        >
                          <FaTrash size={10} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <FaImage size={24} className="text-slate-300 mb-2" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          No image selected
                        </span>
                      </>
                    )}
                  </div>
                  <label className="shrink-0 cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <div className="bg-white border border-slate-200 px-6 py-12 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">
                      Choose Image
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 text-white px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
                >
                  {submitting ? (
                    <Loading size="xs" />
                  ) : (
                    <>
                      <FaSave /> Publish News
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20">
              <Loading size="lg" />
            </div>
          ) : blogs.length > 0 ? (
            blogs.map((blog) => (
              <div
                key={blog._id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                <div className="h-40 bg-slate-100 relative">
                  {blog.imageUrl && (
                    <img
                      src={blog.imageUrl}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  )}
                  <button
                    onClick={() => handleDelete(blog._id)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur text-rose-500 rounded-xl flex items-center justify-center shadow-sm hover:bg-rose-500 hover:text-white transition-all"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    <FaRegCalendarAlt size={10} />
                    {new Date(blog.date).toLocaleDateString("en-GB")}
                  </div>
                  <h5 className="text-lg font-bold text-slate-800 line-clamp-2 mb-2">
                    {blog.title}
                  </h5>
                  <p className="text-xs text-slate-500 font-medium line-clamp-3 mb-4">
                    {blog.heading}
                  </p>
                  <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-blue-600">
                      Published
                    </span>
                    <button
                      onClick={() => window.open(`/blog/${blog._id}`, "_blank")}
                      className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900"
                    >
                      View Preview
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">
              No news publications found
            </div>
          )}
        </div>
      </div>
    </AdminPageShell>
  );
};

export default BlogManagement;
