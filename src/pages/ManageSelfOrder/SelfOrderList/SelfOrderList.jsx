import {
  lazy,
  Suspense,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import api from "../../../utils/apiClient/apiClient";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaDownload, FaWhatsapp, FaFilter, FaTimes } from "react-icons/fa";
import { AiOutlineEye, AiOutlineSearch } from "react-icons/ai";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaClipboardList } from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import { pdf } from "@react-pdf/renderer";
import SaudaPDF from "../../../components/DownloadSauda/SaudaPDF/SaudaPDF";
import { fetchAllPages } from "../../../utils/apiClient/fetchAllPages";
import { buildSaudaPdfData } from "../../../utils/saudaPdf/buildSaudaPdfData";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Pagination = lazy(
  () => import("../../../common/Paginations/Paginations"),
);
const Actions = lazy(() => import("../../../common/Actions/Actions"));
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));
const OrderDetails = lazy(() => import("./OrderDetails/OrderDetails"));
const DownloadSauda = lazy(
  () => import("../../../components/DownloadSauda/DownloadSauda"),
);
const DateSelector = lazy(
  () => import("../../../common/DateSelector/DateSelector"),
);

const API_URL = "/self-order";

const SelfOrderList = () => {
  const navigate = useNavigate();
  const { userRole, mobile } = useAuth();
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  
  const [consigneeMap, setConsigneeMap] = useState(new Map());
  const [consigneeData, setConsigneeData] = useState([]);
  const [supplierData, setSupplierData] = useState([]);
  const [buyerData, setBuyerData] = useState([]);
  const [sellerProfileData, setSellerProfileData] = useState([]);
  const [companyData, setCompanyData] = useState([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [reloadFlag, setReloadFlag] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const page = currentPage || 1;
      const search = searchInput?.trim() || "";
      
      const queryParams = new URLSearchParams({
        page,
        limit: itemsPerPage,
        search,
        sortBy: "saudaNo",
        sortOrder: "desc",
        userRole,
        mobile,
        startDate: startDate || "",
        endDate: endDate || "",
      }).toString();
      
      const [
        orderRes,
        consignees,
        allBuyers,
        suppliers,
        sellerProfiles,
        companies,
      ] = await Promise.all([
        api.get(`${API_URL}?${queryParams}`),
        fetchAllPages("/consignees", { limit: 200 }).catch(() => []),
        fetchAllPages("/buyers", { limit: 200 }).catch(() => []),
        fetchAllPages("/seller-company", { limit: 200 }).catch(() => []),
        fetchAllPages("/sellers", { limit: 200 }).catch(() => []),
        fetchAllPages("/companies", { limit: 200 }).catch(() => []),
      ]);

      const orderData = orderRes.data || {};
      const items = Array.isArray(orderData.data) ? orderData.data : (Array.isArray(orderData) ? orderData : []);
      const total = orderData.total || orderData.totalItems || items.length;

      setData(items);
      setTotalItems(total);
      setConsigneeData(consignees);
      setSupplierData(suppliers);
      setBuyerData(allBuyers);
      setSellerProfileData(sellerProfiles);
      setCompanyData(companies);

      const map = new Map();
      consignees.forEach((c) => {
        if (c?._id) map.set(String(c._id), c.name || c.label || "-");
      });
      setConsigneeMap(map);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch order data");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchInput, userRole, mobile, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData, reloadFlag]);

  const handleClearFilters = () => {
    setSearchInput("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
    setReloadFlag(prev => prev + 1);
  };

  const handlePageChange = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
  }, []);

  const getConsigneeDisplay = useCallback(
    (item) => {
      const c = item.consignee;
      if (typeof c === "object" && c?.name) return c.name;
      if (typeof c === "object" && c?.label) return c.label;
      if (c && typeof c === "string")
        return consigneeMap.get(c) || consigneeMap.get(c.trim()) || c;
      return consigneeMap.get(String(c)) || "N/A";
    },
    [consigneeMap],
  );

  const handleSmartWhatsApp = useCallback(
    async (item, target = "buyer") => {
      if (userRole !== "Admin") {
        toast.error("Only Admin can send WhatsApp from list.");
        return;
      }
      const mobileValue =
        target === "buyer" ? item.buyerMobile : item.sellerMobile;

      if (!mobileValue || (Array.isArray(mobileValue) && !mobileValue[0])) {
        toast.error("Mobile number not available");
        return;
      }

      const mobileNumber = Array.isArray(mobileValue)
        ? mobileValue[0]
        : mobileValue;

      const toastId = toast.loading("Preparing WhatsApp...");

      try {
        const cleanMobile = String(mobileNumber).replace(/\D/g, "");

        if (!cleanMobile || cleanMobile.length < 10) {
          toast.dismiss(toastId);
          toast.error("Invalid mobile number");
          return;
        }

        let finalMobile = cleanMobile;

        if (finalMobile.length === 10) {
          finalMobile = `91${finalMobile}`;
        }

        finalMobile = finalMobile.replace(/^0+/, "");

        const message = `Sauda No: ${item.saudaNo || "N/A"}
PO: ${item.poNumber || "N/A"}
Buyer: ${item.buyerCompany || item.buyer || "N/A"}
Supplier: ${item.supplierCompany || item.supplier || "N/A"}
Commodity: ${item.commodity || "N/A"}
Qty: ${item.quantity || "0"}`;

        const pdfData = buildSaudaPdfData({
          item,
          consigneeData,
          supplierData,
          buyerData,
          companyData,
          getConsigneeDisplay,
        });
        
        const blob = await pdf(<SaudaPDF data={pdfData} />).toBlob();
        if (!blob || blob.size === 0) throw new Error("PDF generation failed");

        const fileName = `Sauda-${item.saudaNo}.pdf`;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        let finalMessage = message;
        try {
          const formData = new FormData();
          formData.append("file", blob, fileName);
          const uploadRes = await api.post("/upload-pdf", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          const fileUrl = uploadRes?.data?.url || uploadRes?.data?.fileUrl;
          if (fileUrl) finalMessage = `${message}\n\nDownload PDF: ${fileUrl}`;
        } catch (err) {
          console.warn("PDF Upload failed, falling back to text only", err);
        }

        window.open(`https://wa.me/${finalMobile}?text=${encodeURIComponent(finalMessage)}`, "_blank");
        
        await api.patch(`/self-order/${item._id}/whatsapp-sent`);
        setData(prev => prev.map(o => o._id === item._id ? { ...o, whatsappSent: true } : o));
        
        toast.dismiss(toastId);
        toast.success("WhatsApp opened successfully");
      } catch (error) {
        toast.dismiss(toastId);
        console.error(error);
        toast.error("Failed to prepare WhatsApp message");
      }
    },
    [userRole, getConsigneeDisplay, buyerData, supplierData, consigneeData, companyData],
  );

  const openWhatsAppChat = useCallback(
    async (mobileNumber, item) => {
      if (!mobileNumber || (Array.isArray(mobileNumber) && !mobileNumber[0])) {
        toast.error("Mobile number not available");
        return;
      }

      const toastId = toast.loading("Preparing sharing...");

      try {
        const value = Array.isArray(mobileNumber) ? mobileNumber[0] : mobileNumber;
        const cleanMobile = String(value).replace(/\D/g, "");

        if (!cleanMobile || cleanMobile.length < 10) {
          toast.dismiss(toastId);
          toast.error("Invalid mobile number");
          return;
        }

        let finalMobile = cleanMobile;
        if (finalMobile.length === 10) finalMobile = `91${finalMobile}`;
        finalMobile = finalMobile.replace(/^0+/, "");

        const pdfData = buildSaudaPdfData({
          item,
          consigneeData,
          supplierData,
          buyerData,
          companyData,
          getConsigneeDisplay,
        });

        const blob = await pdf(<SaudaPDF data={pdfData} />).toBlob();
        const fileName = `Sauda-${item.saudaNo || "Order"}.pdf`;
        const file = new File([blob], fileName, { type: "application/pdf" });

        const shareData = {
          files: [file],
          title: `Sauda No: ${item.saudaNo || "Order"}`,
          text: `Hello, regarding Sauda No: ${item?.saudaNo || ""}`,
        };

        if (navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData);
          toast.dismiss(toastId);
          toast.success("Shared successfully");
          
          // Still try to update status
          api.patch(`/self-order/${item._id}/whatsapp-sent`).catch(() => {});
          setData(prev => prev.map(o => o._id === item._id ? { ...o, whatsappSent: true } : o));
          return;
        }

        // Fallback to link if can't share file
        const message = `Hello, regarding Sauda No: ${item?.saudaNo || ""}`;
        window.open(
          `https://wa.me/${finalMobile}?text=${encodeURIComponent(message)}`,
          "_blank",
        );
        toast.dismiss(toastId);
        toast.success("WhatsApp opened");
      } catch (error) {
        toast.dismiss(toastId);
        console.error("Share error:", error);
        // Final fallback to simple chat link
        const value = Array.isArray(mobileNumber) ? mobileNumber[0] : mobileNumber;
        const cleanMobile = String(value).replace(/\D/g, "");
        let finalMobile = cleanMobile;
        if (finalMobile.length === 10) finalMobile = `91${finalMobile}`;
        finalMobile = finalMobile.replace(/^0+/, "");
        const message = `Hello, regarding Sauda No: ${item?.saudaNo || ""}`;
        window.open(`https://wa.me/${finalMobile}?text=${encodeURIComponent(message)}`, "_blank");
      }
    },
    [consigneeData, supplierData, buyerData, companyData, getConsigneeDisplay],
  );

  const handleView = useCallback(
    (item) => {
      setSelectedItem({ ...item, consignee: getConsigneeDisplay(item) });
    },
    [getConsigneeDisplay],
  );

  const handleClosePopup = useCallback(() => setSelectedItem(null), []);

  const headers = useMemo(() => {
    if (userRole === "Seller") {
      return ["Sl No", "Date", "Sauda No", "Supplier", "Buyer", "Consignee", "Commodity", "Qty", "Rate", "Action"];
    }
    return [
      "Sl No",
      "Date",
      "Sauda No",
      "PO Number",
      "Buyer Company",
      userRole === "Admin" ? "Mobile" : null,
      "Consignee",
      "Commodity",
      "Quantity",
      "Rate",
      "Seller",
      "Agent Name",
      userRole === "Admin" || userRole === "Employee" ? "Buyer Emails" : null,
      userRole === "Admin" || userRole === "Employee" ? "Seller Emails" : null,
      userRole === "Admin" || userRole === "Employee" ? "WhatsApp Sent" : null,
      userRole === "Admin" || userRole === "Employee" ? "Action" : null,
    ].filter(Boolean);
  }, [userRole]);

  const handleEdit = useCallback(
    (item) => {
      navigate(`/manage-order/edit-self-order/${item._id}`, {
        state: {
          orderData: item,
          consigneeData,
          supplierData,
          buyerData,
        },
      });
    },
    [navigate, consigneeData, supplierData, buyerData],
  );

  const handleDelete = useCallback(async (item) => {
    if (!item?._id) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete PO Number: ${item.poNumber || "N/A"}?`,
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`${API_URL}/${item._id}`);
      toast.success("Order deleted successfully");
      setReloadFlag((prev) => prev + 1);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete order");
    }
  }, []);

  const rows = useMemo(
    () =>
      data.map((item, index) => {
        const slNo = (currentPage - 1) * itemsPerPage + index + 1;
        const displaySlNo = userRole === "Seller" ? slNo : totalItems - ((currentPage - 1) * itemsPerPage + index);

        const formattedDate = item.poDate
          ? new Date(item.poDate).toLocaleDateString("en-GB")
          : item.createdAt
            ? new Date(item.createdAt).toLocaleDateString("en-GB")
            : "N/A";

        if (userRole === "Seller") {
          return [
            <span key={`sl-${item._id}`} className="font-black text-slate-400">{slNo}</span>,
            <span key={`date-${item._id}`} className="font-bold text-slate-600">{formattedDate}</span>,
            <span key={`sauda-${item._id}`} className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">{item.saudaNo || "N/A"}</span>,
            <span key={`supplier-${item._id}`} className="font-bold text-slate-800">
              {item?.supplier?.sellerName || item.supplierCompany || "N/A"}
            </span>,
            <span key={`buyer-${item._id}`} className="font-medium text-slate-600">{item.buyerCompany || "N/A"}</span>,
            getConsigneeDisplay(item) || "N/A",
            <span key={`comm-${item._id}`} className="font-bold text-slate-700">{item.commodity || "N/A"}</span>,
            <span key={`qty-${item._id}`} className="font-black text-slate-900">{item.quantity || "0"}</span>,
            <span key={`rate-${item._id}`} className="font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">₹{item.rate || "0"}</span>,
            <div className="flex items-center gap-2" key={`actions-${item._id}`}>
              <button
                onClick={() => handleView(item)}
                className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-slate-200"
                title="View Details"
              >
                <AiOutlineEye size={18} />
              </button>
              <DownloadSauda
                data={{ ...item, consignee: getConsigneeDisplay(item) }}
                consigneeData={consigneeData}
                supplierData={supplierData}
                buyerData={buyerData}
                sellerProfileData={sellerProfileData}
                button={
                  <button
                    className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
                    title="Download Sauda"
                  >
                    <FaDownload size={16} />
                  </button>
                }
              />
            </div>
          ];
        }

        return [
          <div className="flex items-center gap-2" key={`sl-${item._id}`}>
            <span className="font-black text-slate-400">{displaySlNo}</span>
            <DownloadSauda
              data={{ ...item, consignee: getConsigneeDisplay(item) }}
              consigneeData={consigneeData}
              supplierData={supplierData}
              buyerData={buyerData}
              sellerProfileData={sellerProfileData}
              button={
                <button
                  className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
                  title="Download Sauda"
                >
                  <FaDownload size={14} />
                </button>
              }
            />
          </div>,

          <span key={`date-${item._id}`} className="font-bold text-slate-600">{formattedDate}</span>,
          <span key={`sauda-${item._id}`} className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">{item.saudaNo || "N/A"}</span>,
          <span key={`po-${item._id}`} className="font-bold text-slate-700 uppercase tracking-tight">{item.poNumber || "N/A"}</span>,
          <span key={`buyer-${item._id}`} className="font-bold text-slate-800">{item.buyerCompany || "N/A"}</span>,

          userRole === "Admin" ? (
            <div className="flex items-center gap-2" key={`mobile-${item._id}`}>
              <span className="font-medium text-slate-600">{item.buyerMobile || "N/A"}</span>
              {item.buyerMobile && (
                <button
                  onClick={() => {
                    const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
                    if (isMobile) openWhatsAppChat(item.buyerMobile, item);
                    else handleSmartWhatsApp(item, "buyer");
                  }}
                  className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors"
                >
                  <FaWhatsapp size={20} />
                </button>
              )}
            </div>
          ) : null,

          getConsigneeDisplay(item) || "N/A",
          <span key={`comm-${item._id}`} className="font-bold text-slate-700">{item.commodity || "N/A"}</span>,
          <span key={`qty-${item._id}`} className="font-black text-slate-900">{item.quantity || "0"}</span>,
          <span key={`rate-${item._id}`} className="font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">₹{item.rate || "0"}</span>,

          <span key={`seller-${item._id}`} className="font-bold text-slate-800">
            {item?.supplier?.sellerName || item.supplierCompany || "N/A"}
          </span>,

          item.agentName || "N/A",

          userRole === "Admin" || userRole === "Employee"
            ? <span key={`bemails-${item._id}`} className="text-xs text-slate-500 line-clamp-1">{item.buyerEmails?.filter(Boolean).join(", ") || "N/A"}</span>
            : null,

          userRole === "Admin" || userRole === "Employee" ? (
            <div className="flex flex-col gap-1" key={`seller-dt-${item._id}`}>
              <span className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[120px]">
                {item.sellerEmails?.filter(Boolean).join(", ") || "N/A"}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 text-xs">
                  {item.sellerMobile || "N/A"}
                </span>
                {item.sellerMobile && userRole === "Admin" && (
                  <button
                    onClick={() => {
                      const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
                      if (isMobile) openWhatsAppChat(item.sellerMobile, item);
                      else handleSmartWhatsApp(item, "seller");
                    }}
                    className="text-emerald-500 hover:scale-110 transition-transform"
                  >
                    <FaWhatsapp size={16} />
                  </button>
                )}
              </div>
            </div>
          ) : null,

          userRole === "Admin" || userRole === "Employee" ? (
            <div className="flex justify-center" key={`status-${item._id}`}>
              {item.whatsappSent ? (
                <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest shadow-sm">
                  Sent
                </span>
              ) : (
                <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest shadow-sm">
                  Pending
                </span>
              )}
            </div>
          ) : null,

          userRole === "Admin" || userRole === "Employee" ? (
            <div
              className="flex items-center gap-2 min-w-[120px]"
              key={`actions-${item._id}`}
            >
              <Actions
                onView={() => handleView(item)}
                onEdit={() => handleEdit(item)}
                onDelete={() => handleDelete(item)}
              />
            </div>
          ) : null,
        ].filter(Boolean);
      }),
    [data, handleView, handleEdit, handleDelete, handleSmartWhatsApp, openWhatsAppChat, getConsigneeDisplay, currentPage, itemsPerPage, userRole, totalItems, consigneeData, supplierData, buyerData, sellerProfileData],
  );

  const handleSearchChange = useCallback((e) => {
    setSearchInput(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleDownloadExcel = useCallback(async () => {
    let toastId;
    try {
      toastId = toast.loading("Preparing Excel Data...");
      
      const params = {
        search: searchInput?.trim() || "",
        startDate: startDate || "",
        endDate: endDate || "",
        userRole,
        mobile,
      };

      const response = await api.get(`${API_URL}/export/excel`, {
        params,
        responseType: "blob",
        timeout: 120000,
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `SelfOrders_${new Date().toISOString().split("T")[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.dismiss(toastId);
      toast.success("Excel downloaded successfully");
    } catch (error) {
      if (toastId) toast.dismiss(toastId);
      toast.error("Failed to download Excel file");
    }
  }, [userRole, mobile, searchInput, startDate, endDate]);

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Order Intelligence"
        subtitle="Live tracking and management of purchase orders"
        icon={FaClipboardList}
        noContentCard
      >
        <div className="relative min-h-screen overflow-hidden -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
          {/* Animated Background Accents */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-200/20 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/20 blur-[120px] rounded-full animate-pulse delay-700" />
          </div>

          <div className="max-w-full space-y-6 animate-fade-in-up">
            <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] p-6 sm:p-8 border border-white/60 shadow-2xl shadow-slate-200/50">
              <SelfOrderSearchBar
                onBack={() => navigate(-1)}
                searchInput={searchInput}
                onSearchChange={handleSearchChange}
                onDownloadExcel={handleDownloadExcel}
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onClearFilters={handleClearFilters}
              />
            </div>

            <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] p-4 sm:p-8 border border-white/60 shadow-2xl shadow-slate-200/50">
              {loading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Synchronizing Data...</p>
                </div>
              ) : (
                <>
                  <SelfOrderTable headers={headers} rows={rows} />
                  
                  {data.length === 0 && (
                    <div className="py-24 text-center flex flex-col items-center justify-center gap-6">
                      <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 shadow-inner">
                        <FaClipboardList size={40} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">No orders found</h3>
                        <p className="text-sm text-slate-400 font-medium">Try adjusting your filters or search terms</p>
                      </div>
                      <button 
                        onClick={handleClearFilters}
                        className="px-6 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}

                  <div className="mt-8 border-t border-slate-100 pt-8">
                    <Pagination
                      currentPage={currentPage}
                      totalItems={totalItems}
                      itemsPerPage={itemsPerPage}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </>
              )}
            </div>

            {selectedItem && (
              <PopupBox
                isOpen={!!selectedItem}
                onClose={handleClosePopup}
                title={`Order Intelligence — ${selectedItem.saudaNo}`}
                width="w-[95vw] sm:w-[800px]"
              >
                <OrderDetails item={selectedItem} />
              </PopupBox>
            )}
          </div>
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

const SelfOrderSearchBar = ({
  onBack,
  searchInput,
  onSearchChange,
  onDownloadExcel,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClearFilters,
}) => {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-2xl bg-white text-slate-600 text-xs font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
        >
          Back
        </button>
        <button
          onClick={onDownloadExcel}
          className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95"
        >
          <FaDownload size={14} />
          <span>Export Excel</span>
        </button>
        
        <div className="h-10 w-[1px] bg-slate-100 hidden sm:block mx-2" />
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Start Date</span>
            <DateSelector selectedDate={startDate} onChange={onStartDateChange} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">End Date</span>
            <DateSelector selectedDate={endDate} onChange={onEndDateChange} />
          </div>
          {(startDate || endDate || searchInput) && (
            <button
              onClick={onClearFilters}
              className="mt-5 p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-all shadow-sm"
              title="Clear all filters"
            >
              <FaTimes size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="w-full lg:max-w-md">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <AiOutlineSearch size={20} className="text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search by Sauda, PO, Buyer, or Commodity..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/50 transition-all"
            value={searchInput}
            onChange={onSearchChange}
          />
        </div>
      </div>
    </div>
  );
};

const SelfOrderTable = ({ headers, rows }) => {
  return (
    <div className="rounded-[1.5rem] overflow-hidden border border-slate-100">
      <Tables headers={headers} rows={rows} />
    </div>
  );
};

export default SelfOrderList;
