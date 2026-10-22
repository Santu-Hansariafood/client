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
import api, { clearApiCache } from "../../utils/apiClient/apiClient";
import AdminPageShell from "../../common/AdminPageShell/AdminPageShell";
import Loading from "../../common/Loading/Loading";

const CATEGORIES = [
  "General",
  "Commodity",
  "Logistics",
  "Market Analysis",
  "Company Update",
];

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
      imageUrl:
        prev.imageUrl === removedUrl ? newImages[0] || "" : prev.imageUrl,
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
      clearApiCache();
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
      clearApiCache();
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
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-4">
            <h3 className="font-serif text-xl font-semibold tracking-tight text-lux-ink">
              News Bulletin
            </h3>
            <div className="flex items-center gap-2 rounded-xl border border-[#e6dcc4] bg-lux-cream px-3 py-1.5 shadow-sm">
              <FaRegCalendarAlt size={12} className="text-lux-muted" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-transparent text-[10px] font-black uppercase text-lux-muted outline-none"
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
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-cream px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-lux-emerald shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
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
          <div className="lux-card lux-gold-top overflow-hidden animate-fade-in-up">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ece4d2] bg-lux-ivory p-4 sm:p-6">
              <h4 className="font-serif text-sm font-semibold uppercase tracking-widest text-lux-ink">
                New Publication
              </h4>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-lux-muted">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isPublished: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  Published
                </label>
                <div className="flex items-center gap-2">
                  <FaTags className="text-lux-muted" size={12} />
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="rounded-lg border border-[#e6dcc4] bg-lux-cream px-3 py-1.5 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-lux-gold/30"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6 p-4 sm:p-6 lg:p-8">
              <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                    Main Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g. Annual Commodity Forecast 2026"
                    className="h-12 w-full rounded-xl border border-[#e6dcc4] bg-lux-cream px-4 font-bold text-lux-ink outline-none transition-all focus:border-lux-emerald focus:ring-2 focus:ring-lux-gold/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                    Publication Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="h-12 w-full rounded-xl border border-[#e6dcc4] bg-lux-cream px-4 font-bold text-lux-ink outline-none transition-all focus:border-lux-emerald focus:ring-2 focus:ring-lux-gold/30"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                  Sub-heading (Summary)
                </label>
                <textarea
                  value={formData.heading}
                  onChange={(e) =>
                    setFormData({ ...formData, heading: e.target.value })
                  }
                  placeholder="A brief overview of the news..."
                  rows={2}
                  className="w-full resize-none rounded-xl border border-[#e6dcc4] bg-lux-cream p-4 font-bold text-lux-ink outline-none transition-all focus:border-lux-emerald focus:ring-2 focus:ring-lux-gold/30"
                />
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="block text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                    News Content
                  </label>
                  <div className="flex flex-wrap gap-4">
                    <button
                      type="button"
                      onClick={() => handleAddBlock("paragraph")}
                      className="text-[10px] font-black uppercase tracking-widest text-lux-emerald hover:text-lux-deep hover:underline"
                    >
                      + Paragraph
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock("subheading")}
                      className="text-[10px] font-black uppercase tracking-widest text-lux-emerald hover:text-lux-deep hover:underline"
                    >
                      + Heading
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock("list", "bullet")}
                      className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-lux-emerald hover:text-lux-deep hover:underline"
                    >
                      <FaListUl size={10} /> + Bullet List
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock("list", "number")}
                      className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-lux-emerald hover:text-lux-deep hover:underline"
                    >
                      <FaListOl size={10} /> + Number List
                    </button>
                  </div>
                </div>
                {formData.content.map((block, index) => (
                  <div
                    key={index}
                    className="group relative rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4 sm:p-6"
                  >
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                          block.type === "subheading"
                            ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                            : block.type === "list"
                              ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                              : "border-[#e6dcc4] bg-[#f2eee2] text-lux-muted"
                        }`}
                      >
                        {block.type === "list"
                          ? `${block.listType} list`
                          : block.type}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleBlockChange(index, "bold", !block.bold)
                          }
                          className={`flex h-8 w-8 items-center justify-center rounded font-bold border ${block.bold ? "border-lux-emerald bg-lux-emerald text-lux-gold-soft" : "border-[#e6dcc4] bg-lux-cream text-lux-muted"}`}
                          title="Bold"
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleBlockChange(index, "italic", !block.italic)
                          }
                          className={`flex h-8 w-8 items-center justify-center rounded italic border ${block.italic ? "border-lux-emerald bg-lux-emerald text-lux-gold-soft" : "border-[#e6dcc4] bg-lux-cream text-lux-muted"}`}
                          title="Italic"
                        >
                          I
                        </button>
                        <input
                          type="color"
                          value={block.color || "#334155"}
                          onChange={(e) =>
                            handleBlockChange(index, "color", e.target.value)
                          }
                          className="h-8 w-8 cursor-pointer rounded border border-[#e6dcc4]"
                          title="Text Color"
                        />
                      </div>
                    </div>

                    {block.type === "list" ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={block.text}
                          onChange={(e) =>
                            handleBlockChange(index, "text", e.target.value)
                          }
                          placeholder="List title (optional)..."
                          className="h-10 w-full rounded-xl border border-[#e6dcc4] bg-lux-cream px-4 text-xs font-bold"
                          style={{ color: block.color || "#334155" }}
                        />
                        <div className="space-y-2 ml-4">
                          {block.listItems.map((item, itemIdx) => (
                            <div
                              key={itemIdx}
                              className="flex items-center gap-2"
                            >
                              <span className="w-4 text-xs font-bold text-lux-muted">
                                {block.listType === "bullet"
                                  ? "•"
                                  : `${itemIdx + 1}.`}
                              </span>
                              <input
                                type="text"
                                value={item}
                                onChange={(e) =>
                                  handleListItemChange(
                                    index,
                                    itemIdx,
                                    e.target.value,
                                  )
                                }
                                className="h-9 flex-1 rounded-lg border border-[#e6dcc4] bg-lux-cream px-3 text-xs font-medium"
                                placeholder={`Item ${itemIdx + 1}...`}
                                style={{ color: block.color || "#334155" }}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveListItem(index, itemIdx)
                                }
                                className="text-rose-400 hover:text-rose-600"
                              >
                                <FaTrash size={10} />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleAddListItem(index)}
                            className="mt-2 text-[9px] font-black uppercase text-lux-emerald hover:text-lux-deep hover:underline"
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
                        className={`w-full rounded-xl border border-[#e6dcc4] bg-lux-cream p-4 outline-none transition-all focus:border-lux-emerald focus:ring-2 focus:ring-lux-gold/30 ${block.bold ? "font-bold" : "font-medium"} ${block.italic ? "italic" : ""} ${block.underline ? "underline" : ""}`}
                        style={{ color: block.color || "#334155" }}
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveBlock(index)}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                    >
                      <FaTrash size={10} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                  Featured Gallery (Multiple Images)
                </label>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
                    {formData.images.map((url, idx) => (
                      <div
                        key={idx}
                        className="group relative aspect-square overflow-hidden rounded-xl border border-[#ece4d2] bg-lux-ivory"
                      >
                        <img
                          src={url}
                          className="h-full w-full object-cover"
                          alt={`Gallery ${idx}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                        >
                          <FaTrash size={10} />
                        </button>
                        {formData.imageUrl === url && (
                          <div className="absolute inset-x-0 bottom-0 bg-lux-emerald py-0.5 text-center text-[8px] font-black uppercase text-lux-gold-soft">
                            Primary
                          </div>
                        )}
                        {formData.imageUrl !== url && (
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, imageUrl: url })
                            }
                            className="absolute inset-0 flex items-center justify-center bg-black/40 text-[8px] font-black uppercase text-white opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            Set Primary
                          </button>
                        )}
                      </div>
                    ))}
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#e6dcc4] bg-lux-ivory transition-all hover:bg-white">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                      />
                      <FaPlus className="mb-2 text-lux-muted" size={20} />
                      <span className="text-[9px] font-black uppercase text-lux-muted">
                        Add Images
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-[#ece4d2] pt-6">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-cream px-6 py-3 text-xs font-bold uppercase tracking-widest text-lux-emerald shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-8 py-3 text-xs font-bold uppercase tracking-widest text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/25 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60"
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {loading ? (
            <Loading />
          ) : blogs.length > 0 ? (
            blogs.map((blog) => (
              <div
                key={blog._id}
                className="lux-card lux-card-hover flex flex-col overflow-hidden"
              >
                <div className="relative h-40 bg-lux-ivory">
                  {(blog.imageUrl || blog.images?.[0]) && (
                    <img
                      src={blog.imageUrl || blog.images?.[0]}
                      className="h-full w-full object-cover"
                      alt=""
                    />
                  )}
                  <div className="absolute left-3 top-3 flex flex-col gap-2">
                    <div className="rounded-lg bg-lux-cream/90 px-2 py-1 shadow-sm backdrop-blur">
                      <span className="text-[9px] font-black uppercase tracking-tighter text-lux-emerald">
                        {blog.category || "General"}
                      </span>
                    </div>
                    {!blog.isPublished && (
                      <div className="rounded-lg bg-lux-emerald px-2 py-1 shadow-sm">
                        <span className="text-[9px] font-black uppercase text-lux-gold-soft">
                          Draft
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(blog._id)}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-xl bg-lux-cream/90 text-rose-500 shadow-sm backdrop-blur transition-all hover:bg-rose-500 hover:text-white"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-lux-muted">
                      <FaRegCalendarAlt size={10} />
                      {new Date(blog.date).toLocaleDateString("en-GB")}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-lux-muted">
                      <FaEye size={10} className="text-lux-muted" />
                      {blog.views || 0}
                    </div>
                  </div>
                  <h5 className="mb-2 font-serif text-lg font-semibold text-lux-ink line-clamp-2">
                    {blog.title}
                  </h5>
                  <p className="mb-4 text-xs font-medium text-lux-muted line-clamp-3">
                    {blog.heading}
                  </p>
                  <div className="mt-auto flex items-center justify-between border-t border-[#ece4d2] pt-4">
                    <div className="flex items-center gap-1.5">
                      {blog.images?.length > 1 && (
                        <span className="rounded-full border border-[#e6dcc4] bg-[#f2eee2] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-lux-muted">
                          +{blog.images.length - 1} Images
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => window.open(`/blog/${blog._id}`, "_blank")}
                      className="text-[10px] font-black uppercase text-lux-muted transition-colors hover:text-lux-emerald"
                    >
                      View Preview
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center font-serif text-sm font-semibold uppercase tracking-widest text-lux-muted">
              No news publications found
            </div>
          )}
        </div>
      </div>
    </AdminPageShell>
  );
};

export default BlogManagement;
