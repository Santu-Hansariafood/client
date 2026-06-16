import { useState, useEffect } from "react";
import {
  FaPlus,
  FaTrash,
  FaImage,
  FaSave,
  FaNewspaper,
  FaRegCalendarAlt,
  FaListUl,
  FaListOl,
  FaEye,
  FaTags,
} from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../../utils/apiClient/apiClient";
import AdminPageShell from "../../common/AdminPageShell/AdminPageShell";
import Loading from "../../common/Loading/Loading";

const CATEGORIES = ["General", "Commodity", "Logistics", "Market Analysis", "Company Update"];

const BlogManagement = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterDate, setFilterDate] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    heading: "",
    category: "General",
    content: [
      {
        type: "paragraph",
        text: "",
        bold: false,
        italic: false,
        underline: false,
        color: "#334155",
        listType: "none",
        listItems: [],
      },
    ],
    imageUrl: "",
    images: [],
    date: new Date().toISOString().split("T")[0],
    isPublished: true,
  });

  useEffect(() => {
    fetchBlogs();
  }, [filterDate]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterDate) params.date = filterDate;
      const res = await api.get("/blogs", { params });
      setBlogs(res.data.blogs || []);
    } catch (error) {
      toast.error("Error fetching blogs");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBlock = (type, listType = "none") => {
    setFormData((prev) => ({
      ...prev,
      content: [
        ...prev.content,
        {
          type,
          text: "",
          bold: false,
          italic: false,
          underline: false,
          listType,
          listItems: type === "list" ? [""] : [],
        },
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

  const handleAddListItem = (blockIndex) => {
    const newContent = [...formData.content];
    newContent[blockIndex].listItems.push("");
    setFormData((prev) => ({ ...prev, content: newContent }));
  };

  const handleRemoveListItem = (blockIndex, itemIndex) => {
    const newContent = [...formData.content];
    newContent[blockIndex].listItems.splice(itemIndex, 1);
    setFormData((prev) => ({ ...prev, content: newContent }));
  };

  const handleListItemChange = (blockIndex, itemIndex, value) => {
    const newContent = [...formData.content];
    newContent[blockIndex].listItems[itemIndex] = value;
    setFormData((prev) => ({ ...prev, content: newContent }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      toast.info(`Uploading ${files.length} image(s)...`);
      const uploadPromises = files.map((file) => {
        const uploadData = new FormData();
        uploadData.append("file", file);
        uploadData.append("folder", "news");
        return api.post("/uploads", uploadData);
      });

      const results = await Promise.all(uploadPromises);
      const urls = results.map((res) => res.data.url);

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...urls],
        // Set first image as primary if none exists
        imageUrl: prev.imageUrl || urls[0],
      }));
      toast.success("Images uploaded successfully");
    } catch (error) {
      toast.error("Image upload failed");
    }
  };

  const removeImage = (index) => {
    const newImages = [...formData.images];
    const removedUrl = newImages.splice(index, 1)[0];
    setFormData((prev) => ({
      ...prev,
      images: newImages,
      imageUrl: prev.imageUrl === removedUrl ? (newImages[0] || "") : prev.imageUrl,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.title ||
      !formData.heading ||
      formData.content.some((c) => c.type !== "list" && !c.text)
    ) {
      toast.warning("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/blogs", formData);
      if (res.status === 201 || res.status === 200) {
        toast.success("News publication created successfully");
        setShowAddForm(false);
        setFormData({
          title: "",
          heading: "",
          category: "General",
          content: [
            {
              type: "paragraph",
              text: "",
              bold: false,
              italic: false,
              underline: false,
              color: "#334155",
              listType: "none",
              listItems: [],
            },
          ],
          imageUrl: "",
          images: [],
          date: new Date().toISOString().split("T")[0],
          isPublished: true,
        });
        fetchBlogs();
      }
    } catch (error) {
      console.error("Publish error:", error);
      toast.error(error.response?.data?.message || "Error creating news post");
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
      subtitle="Manage internal news, announcements, and bulletins"
      icon={FaNewspaper}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
              News Bulletin
            </h3>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
              <FaRegCalendarAlt size={12} className="text-slate-400" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="text-[10px] font-black uppercase bg-transparent outline-none text-slate-600"
              />
              {filterDate && (
                <button 
                  onClick={() => setFilterDate("")}
                  className="text-rose-500 hover:text-rose-700"
                >
                  <FaTrash size={10} />
                </button>
              )}
            </div>
          </div>
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
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h4 className="font-black text-slate-800 uppercase tracking-widest text-[11px]">
                New Publication
              </h4>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-600">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="w-4 h-4"
                  />
                  Published
                </label>
                <div className="flex items-center gap-2">
                  <FaTags className="text-slate-400" size={12} />
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="text-[10px] font-black uppercase bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/10"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
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
                      + Paragraph
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock("subheading")}
                      className="text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:underline"
                    >
                      + Heading
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock("list", "bullet")}
                      className="text-amber-600 text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-1"
                    >
                      <FaListUl size={10} /> + Bullet List
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock("list", "number")}
                      className="text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-1"
                    >
                      <FaListOl size={10} /> + Number List
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
                        className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${
                          block.type === "subheading" 
                            ? "bg-emerald-100 text-emerald-700" 
                            : block.type === "list"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {block.type === "list" ? `${block.listType} list` : block.type}
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
                        <input
                          type="color"
                          value={block.color || "#334155"}
                          onChange={(e) => handleBlockChange(index, "color", e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border border-slate-200"
                          title="Text Color"
                        />
                      </div>
                    </div>

                    {block.type === "list" ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={block.text}
                          onChange={(e) => handleBlockChange(index, "text", e.target.value)}
                          placeholder="List title (optional)..."
                          className="w-full h-10 px-4 rounded-xl border border-slate-200 text-xs font-bold"
                          style={{ color: block.color || "#334155" }}
                        />
                        <div className="space-y-2 ml-4">
                          {block.listItems.map((item, itemIdx) => (
                            <div key={itemIdx} className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400 w-4">
                                {block.listType === "bullet" ? "•" : `${itemIdx + 1}.`}
                              </span>
                              <input
                                type="text"
                                value={item}
                                onChange={(e) => handleListItemChange(index, itemIdx, e.target.value)}
                                className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-xs font-medium"
                                placeholder={`Item ${itemIdx + 1}...`}
                                style={{ color: block.color || "#334155" }}
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveListItem(index, itemIdx)}
                                className="text-rose-400 hover:text-rose-600"
                              >
                                <FaTrash size={10} />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleAddListItem(index)}
                            className="text-[9px] font-black uppercase text-blue-600 hover:underline mt-2"
                          >
                            + Add Item
                          </button>
                        </div>
                      </div>
                    ) : (
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
                        className={`w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all ${block.bold ? "font-bold" : "font-medium"} ${block.italic ? "italic" : ""} ${block.underline ? "underline" : ""}`}
                        style={{ color: block.color || "#334155" }}
                      />
                    )}

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
                  Featured Gallery (Multiple Images)
                </label>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    {formData.images.map((url, idx) => (
                      <div key={idx} className="relative aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 group">
                        <img src={url} className="w-full h-full object-cover" alt={`Gallery ${idx}`} />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                          <FaTrash size={10} />
                        </button>
                        {formData.imageUrl === url && (
                          <div className="absolute bottom-0 inset-x-0 bg-emerald-500 text-white text-[8px] font-black uppercase text-center py-0.5">
                            Primary
                          </div>
                        )}
                        {formData.imageUrl !== url && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, imageUrl: url })}
                            className="absolute inset-0 bg-black/40 text-white text-[8px] font-black uppercase flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Set Primary
                          </button>
                        )}
                      </div>
                    ))}
                    <label className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all bg-slate-50/50">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                      />
                      <FaPlus className="text-slate-300 mb-2" size={20} />
                      <span className="text-[9px] font-black text-slate-400 uppercase">Add Images</span>
                    </label>
                  </div>
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
                  {(blog.imageUrl || blog.images?.[0]) && (
                    <img
                      src={blog.imageUrl || blog.images?.[0]}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  )}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <div className="bg-white/90 backdrop-blur px-2 py-1 rounded-lg shadow-sm">
                      <span className="text-[9px] font-black uppercase text-blue-600 tracking-tighter">
                        {blog.category || "General"}
                      </span>
                    </div>
                    {!blog.isPublished && (
                      <div className="bg-amber-500 text-white px-2 py-1 rounded-lg shadow-sm">
                        <span className="text-[9px] font-black uppercase">Draft</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(blog._id)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur text-rose-500 rounded-xl flex items-center justify-center shadow-sm hover:bg-rose-500 hover:text-white transition-all"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <FaRegCalendarAlt size={10} />
                      {new Date(blog.date).toLocaleDateString("en-GB")}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
                      <FaEye size={10} className="text-slate-300" />
                      {blog.views || 0}
                    </div>
                  </div>
                  <h5 className="text-lg font-bold text-slate-800 line-clamp-2 mb-2">
                    {blog.title}
                  </h5>
                  <p className="text-xs text-slate-500 font-medium line-clamp-3 mb-4">
                    {blog.heading}
                  </p>
                  <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {blog.images?.length > 1 && (
                        <span className="bg-slate-100 text-slate-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                          +{blog.images.length - 1} Images
                        </span>
                      )}
                    </div>
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
