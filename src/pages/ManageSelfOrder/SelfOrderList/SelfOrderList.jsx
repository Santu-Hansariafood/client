import {
  lazy,
  Suspense,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaDownload, FaWhatsapp, FaTimes } from "react-icons/fa";
import { AiOutlineEye, AiOutlineSearch } from "react-icons/ai";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaClipboardList } from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import { fetchAllPages } from "../../../utils/apiClient/fetchAllPages";
import { downloadFile } from "../../../utils/fileDownloader";
import { pdf } from "@react-pdf/renderer";
import SaudaPDF from "../../../components/DownloadSauda/SaudaPDF/SaudaPDF";
import { buildSaudaPdfData } from "../../../utils/saudaPdf/buildSaudaPdfData";
import { extractUploadUrl } from "../../../utils/saudaPdf/resolveUploadUrl";

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
  const [lookupsLoading, setLookupsLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  const [consigneeMap, setConsigneeMap] = useState(new Map());
  const [consigneeData, setConsigneeData] = useState([]);
  const [supplierData, setSupplierData] = useState([]);
  const [buyerData, setBuyerData] = useState([]);
  const [sellerProfileData, setSellerProfileData] = useState([]);
  const [companyData, setCompanyData] = useState([]);
  const [commodityData, setCommodityData] = useState([]);
  const [qualityParameterData, setQualityParameterData] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [reloadFlag, setReloadFlag] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchLookups = async () => {
      setLookupsLoading(true);
      try {
        const [
          consignees,
          allBuyers,
          suppliers,
          sellerProfiles,
          companies,
          commodities,
          qualityParams,
        ] = await Promise.all([
          fetchAllPages("/consignees", { limit: 200 }).catch(() => []),
          fetchAllPages("/buyers", { limit: 200 }).catch(() => []),
          fetchAllPages("/seller-company", { limit: 200 }).catch(() => []),
          fetchAllPages("/sellers", { limit: 200 }).catch(() => []),
          fetchAllPages("/companies", { limit: 200 }).catch(() => []),
          fetchAllPages("/commodities", { limit: 200 }).catch(() => []),
          fetchAllPages("/quality-parameters", { limit: 200 }).catch(() => []),
        ]);

        setConsigneeData(consignees);
        setSupplierData(suppliers);
        setBuyerData(allBuyers);
        setSellerProfileData(sellerProfiles);
        setCompanyData(companies);
        setCommodityData(commodities);
        setQualityParameterData(qualityParams);

        const map = new Map();
        consignees.forEach((c) => {
          if (c?._id) map.set(String(c._id), c.name || c.label || "-");
        });
        setConsigneeMap(map);
      } catch (error) {
        console.error("Lookup fetch error:", error);
      } finally {
        setLookupsLoading(false);
      }
    };
    fetchLookups();
  }, []);

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

      const orderRes = await api.get(`${API_URL}?${queryParams}`);

      const orderData = orderRes.data || {};
      const items = Array.isArray(orderData.data)
        ? orderData.data
        : Array.isArray(orderData)
          ? orderData
          : [];
      const total = orderData.total || orderData.totalItems || items.length;

      setData(items);
      setTotalItems(total);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch order data");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    itemsPerPage,
    searchInput,
    userRole,
    mobile,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData, reloadFlag]);

  const handleClearFilters = () => {
    setSearchInput("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
    setReloadFlag((prev) => prev + 1);
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

      const toastId = toast.loading("Generating PDF & uploading...");

      let fileUrl = null;
      try {
        const pdfData = buildSaudaPdfData({
          item,
          consigneeData,
          supplierData,
          buyerData,
          companyData,
          commodityData,
          qualityParameterData,
          sellerProfileData,
          getConsigneeDisplay,
        });

        const blob = await pdf(<SaudaPDF data={pdfData} />).toBlob();
        console.log("[SelfOrderList WhatsApp] PDF blob:", {
          size: blob?.size,
          type: blob?.type,
          valid: blob && blob.size > 0,
        });

        if (blob && blob.size > 0) {
          const fileName = `Sauda-${item.saudaNo || "N/A"}.pdf`;
          const uploadFormData = new FormData();
          uploadFormData.append("file", blob, fileName);
          uploadFormData.append("saudaNo", item.saudaNo || "N/A");

          console.log("[SelfOrderList WhatsApp] Uploading PDF to ImageKit:", {
            saudaNo: item.saudaNo,
            fileName,
            blobSize: blob.size,
          });

          const uploadRes = await api.post("/uploads/whatsapp", uploadFormData);
          console.log("[SelfOrderList WhatsApp] Upload response:", uploadRes);
          console.log(
            "[SelfOrderList WhatsApp] uploadRes.data:",
            uploadRes?.data,
          );

          const raw = uploadRes?.data ?? {};
          fileUrl =
            extractUploadUrl(raw) ||
            raw?.url ||
            raw?.fileUrl ||
            raw?.cloudUrl ||
            raw?.link ||
            raw?.downloadUrl ||
            raw?.href ||
            raw?.publicUrl ||
            raw?.secure_url ||
            null;

          if (
            fileUrl &&
            !/^https?:\/\//i.test(fileUrl) &&
            fileUrl.startsWith("/")
          ) {
            fileUrl = `${window.location.origin}${fileUrl}`;
          }

          console.log("[SelfOrderList WhatsApp] Resolved fileUrl:", fileUrl);

          if (!fileUrl || !/^https?:\/\//i.test(fileUrl)) {
            console.warn(
              "[SelfOrderList WhatsApp] Could not find a public PDF URL in upload response. Keys:",
              Object.keys(raw),
            );
            fileUrl = null;
          }
        } else {
          console.error(
            "[SelfOrderList WhatsApp] PDF blob was empty, skipping upload",
          );
        }
      } catch (pdfErr) {
        console.error(
          "[SelfOrderList WhatsApp] PDF generation/upload failed:",
          pdfErr?.message || pdfErr,
        );
      }

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

        const formattedSaudaDate = item.poDate
          ? new Date(item.poDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : item.createdAt
            ? new Date(item.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : "N/A";

        const pdfSection = fileUrl
          ? `
*View / Download Sauda PDF:*
${fileUrl}
`
          : "";

        const finalMessage = `*HANSARIA FOOD PRIVATE LIMITED*

*SAUDA CONFIRMATION*

*Date:* -  _${formattedSaudaDate}_
*Sauda No:* -  _${item.saudaNo || "N/A"}_
*PO Number:* -  _${item.poNumber || "N/A"}_
*Buyer Company:* -  _${item.buyerCompany || item.buyer || "N/A"}_
*Supplier Company:* -  _${item.supplierCompany || item.supplier || "N/A"}_
*Delivery Address:* -  _${getConsigneeDisplay(item) || "N/A"}_
*Commodity:* -  _${item.commodity || "N/A"}_
*Quantity:* -  _${item.quantity || "0"} Tons_
*Rate:* -  _₹${item.rate || "0"}${
          Number(item.gst) > 0 ? ` + ${item.gst}% GST` : ""
        }_
${
  item.cd && item.cd !== "0" && item.cd !== 0 && item.cd !== "N/A"
    ? `*CD:* -  _${item.cd}_`
    : ""
}
*Payment Terms:* -  _${item.paymentTerms || "N/A"} Days_
${pdfSection}
*Thank You,*
*Hansaria Food Private Limited*

*https://bid.hansariafood.in*`;

        window.open(
          `https://wa.me/${finalMobile}?text=${encodeURIComponent(finalMessage)}`,
          "_blank",
        );

        await api.patch(`/self-order/${item._id}/whatsapp-sent`);
        setData((prev) =>
          prev.map((o) =>
            o._id === item._id ? { ...o, whatsappSent: true } : o,
          ),
        );

        toast.dismiss(toastId);
        if (fileUrl) {
          toast.success("WhatsApp opened with PDF link");
        } else {
          toast.warn(
            "WhatsApp opened but PDF upload failed – no document attached",
          );
        }
      } catch (error) {
        toast.dismiss(toastId);
        console.error(error);
        toast.error("Failed to prepare WhatsApp message");
      }
    },
    [
      userRole,
      setData,
      consigneeData,
      supplierData,
      buyerData,
      companyData,
      commodityData,
      qualityParameterData,
      sellerProfileData,
      getConsigneeDisplay,
    ],
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
      return [
        "Sl No",
        "Date",
        "Sauda No",
        "Supplier",
        "Buyer",
        "Consignee",
        "Commodity",
        "Qty",
        "Rate",
        "Action",
      ];
    }
    return [
      "Sl No",
      "Date",
      "Sauda No",
      "PO Number",
      "Buyer Company",
      userRole === "Admin" ? "Buyer Mobile" : null,
      "Consignee",
      "Commodity",
      "Quantity",
      "Rate",
      "Seller",
      "Seller Company",
      userRole === "Admin" || userRole === "Employee" ? "Seller Mobile" : null,
      "Agent Name",
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
          supplierData: sellerProfileData,
          sellerCompanyData: supplierData,
          buyerData,
          companyData,
        },
      });
    },
    [
      navigate,
      consigneeData,
      supplierData,
      buyerData,
      companyData,
      sellerProfileData,
    ],
  );

  const handleDelete = useCallback(async (item) => {
    if (!item?._id) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete PO Number: ${item.poNumber || "N/A"}?`,
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`${API_URL}/${item._id}`);
      clearApiCache();
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
        const displaySlNo = slNo;

        const formattedDate = item.poDate
          ? new Date(item.poDate).toLocaleDateString("en-GB")
          : item.createdAt
            ? new Date(item.createdAt).toLocaleDateString("en-GB")
            : "N/A";

        if (userRole === "Seller") {
          return [
            <span key={`sl-${item._id}`} className="font-black text-lux-muted">
              {slNo}
            </span>,
            <span key={`date-${item._id}`} className="font-bold text-lux-muted">
              {formattedDate}
            </span>,
            <span
              key={`sauda-${item._id}`}
              className="rounded-lg border border-[#e6dcc4] bg-lux-ivory px-2 py-1 font-black text-lux-emerald"
            >
              {item.saudaNo || "N/A"}
            </span>,
            <span
              key={`supplier-${item._id}`}
              className="font-bold text-lux-ink"
            >
              {item?.supplier?.sellerName || item.supplierCompany || "N/A"}
            </span>,
            <span
              key={`buyer-${item._id}`}
              className="font-medium text-lux-muted"
            >
              {item.buyerCompany || "N/A"}
            </span>,
            getConsigneeDisplay(item) || "N/A",
            <span key={`comm-${item._id}`} className="font-bold text-lux-ink">
              {item.commodity || "N/A"}
            </span>,
            <span key={`qty-${item._id}`} className="font-black text-lux-ink">
              {item.quantity || "0"}
            </span>,
            <span
              key={`rate-${item._id}`}
              className="rounded-lg border border-[#e6dcc4] bg-lux-ivory px-2 py-1 font-black text-lux-emerald"
            >
              ₹{item.rate || "0"}
            </span>,
            <div
              className="flex items-center gap-2"
              key={`actions-${item._id}`}
            >
              <button
                onClick={() => handleView(item)}
                className="rounded-xl border border-[#e4dbc6] bg-lux-cream p-2 text-lux-emerald shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
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
                companyData={companyData}
                commodityData={commodityData}
                qualityParameterData={qualityParameterData}
                button={
                  <button
                    className="rounded-xl border border-[#e4dbc6] bg-lux-ivory p-2 text-lux-emerald shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
                    title="Download Sauda"
                  >
                    <FaDownload size={16} />
                  </button>
                }
              />
            </div>,
          ];
        }

        return [
          <div className="flex items-center gap-2" key={`sl-${item._id}`}>
            <span className="font-black text-lux-muted">{displaySlNo}</span>
            <DownloadSauda
              data={{ ...item, consignee: getConsigneeDisplay(item) }}
              consigneeData={consigneeData}
              supplierData={supplierData}
              buyerData={buyerData}
              sellerProfileData={sellerProfileData}
              companyData={companyData}
              commodityData={commodityData}
              qualityParameterData={qualityParameterData}
              button={
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#e4dbc6] bg-lux-ivory text-lux-emerald shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
                  title="Download Sauda"
                >
                  <FaDownload size={14} />
                </button>
              }
            />
          </div>,

          <span key={`date-${item._id}`} className="font-bold text-lux-muted">
            {formattedDate}
          </span>,
          <span
            key={`sauda-${item._id}`}
            className="rounded-lg border border-[#e6dcc4] bg-lux-ivory px-2 py-1 font-black text-lux-emerald"
          >
            {item.saudaNo || "N/A"}
          </span>,
          <span
            key={`po-${item._id}`}
            className="font-bold uppercase tracking-tight text-lux-ink"
          >
            {item.poNumber || "N/A"}
          </span>,
          <span key={`buyer-${item._id}`} className="font-bold text-lux-ink">
            {item.buyerCompany || "N/A"}
          </span>,

          userRole === "Admin" ? (
            <div className="flex items-center gap-2" key={`mobile-${item._id}`}>
              <span className="font-medium text-lux-muted">
                {item.buyerMobile || "N/A"}
              </span>
              {item.buyerMobile && (
                <button
                  onClick={() => handleSmartWhatsApp(item, "buyer")}
                  className="rounded-lg p-1.5 text-lux-emerald transition-colors hover:bg-lux-ivory"
                  title="Share on WhatsApp"
                >
                  <FaWhatsapp size={20} />
                </button>
              )}
            </div>
          ) : null,

          getConsigneeDisplay(item) || "N/A",
          <span key={`comm-${item._id}`} className="font-bold text-lux-ink">
            {item.commodity || "N/A"}
          </span>,
          <span key={`qty-${item._id}`} className="font-black text-lux-ink">
            {item.quantity || "0"}
          </span>,
          <span
            key={`rate-${item._id}`}
            className="rounded-lg border border-[#e6dcc4] bg-lux-ivory px-2 py-1 font-black text-lux-emerald"
          >
            ₹{item.rate || "0"}
          </span>,

          <span key={`seller-${item._id}`} className="font-bold text-lux-ink">
            {item?.supplier?.sellerName || item.supplierCompany || "N/A"}
          </span>,
          <span
            key={`seller-company-${item._id}`}
            className="font-bold text-lux-ink"
          >
            {item.supplierCompany || "N/A"}
          </span>,

          userRole === "Admin" ? (
            <div
              className="flex items-center gap-2"
              key={`seller-mob-${item._id}`}
            >
              <span className="font-medium text-lux-muted">
                {item.sellerMobile || "N/A"}
              </span>
              {item.sellerMobile && (
                <button
                  onClick={() => handleSmartWhatsApp(item, "seller")}
                  className="rounded-lg p-1.5 text-lux-emerald transition-colors hover:bg-lux-ivory"
                  title="Share on WhatsApp"
                >
                  <FaWhatsapp size={20} />
                </button>
              )}
            </div>
          ) : null,

          item.agentName || "N/A",

          userRole === "Admin" || userRole === "Employee" ? (
            <div className="flex justify-center" key={`status-${item._id}`}>
              {item.whatsappSent ? (
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 shadow-sm">
                  Sent
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-[#e6dcc4] bg-[#f2eee2] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-lux-muted shadow-sm">
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
    [
      data,
      handleView,
      handleEdit,
      handleDelete,
      handleSmartWhatsApp,
      getConsigneeDisplay,
      currentPage,
      itemsPerPage,
      userRole,
      consigneeData,
      supplierData,
      buyerData,
      sellerProfileData,
      companyData,
      commodityData,
      qualityParameterData,
    ],
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
        startDate:
          startDate instanceof Date ? startDate.toISOString() : startDate || "",
        endDate:
          endDate instanceof Date ? endDate.toISOString() : endDate || "",
        userRole,
        mobile,
        saudaNo: searchInput?.trim() || "",
      };

      const response = await api.get(`${API_URL}/export/excel`, {
        params,
        responseType: "blob",
        timeout: 120000,
      });

      const fileName = `SelfOrders_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      await downloadFile(response.data, fileName);

      toast.dismiss(toastId);
      toast.success("Excel downloaded successfully");
    } catch (error) {
      if (toastId) toast.dismiss(toastId);
      console.error("Excel Export Error:", error);
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
        <div className="relative min-h-screen overflow-hidden p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl space-y-6 animate-fade-in-up">
            <div className="lux-card lux-gold-top w-full p-6 sm:p-8">
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

            <div className="lux-card w-full p-4 sm:p-8">
              {loading || (data.length === 0 && lookupsLoading) ? (
                <div className="flex flex-col items-center justify-center gap-4 py-24">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-lux-emerald border-t-transparent" />
                  <p className="lux-eyebrow">
                    Synchronizing Data...
                  </p>
                </div>
              ) : (
                <>
                  <SelfOrderTable headers={headers} rows={rows} />

                  {data.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[#ece4d2] bg-lux-ivory text-lux-gold-soft shadow-inner">
                        <FaClipboardList size={40} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-serif text-xl font-black tracking-tight text-lux-ink">
                          No orders found
                        </h3>
                        <p className="text-sm font-medium text-lux-muted">
                          Try adjusting your filters or search terms
                        </p>
                      </div>
                      <button
                        onClick={handleClearFilters}
                        className="rounded-2xl border border-[#e4dbc6] bg-lux-cream px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-lux-emerald shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg"
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}

                  <div className="mt-8 border-t border-[#ece4d2] pt-8">
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
    <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-2xl border border-[#e4dbc6] bg-lux-cream px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-lux-emerald shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-lg active:scale-95"
        >
          Back
        </button>
        <button
          onClick={onDownloadExcel}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-lux-emerald to-lux-deep px-6 py-2.5 text-xs font-black uppercase tracking-widest text-lux-gold-soft shadow-lg shadow-lux-emerald/25 ring-1 ring-lux-gold/30 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
        >
          <FaDownload size={14} />
          <span>Export Excel</span>
        </button>

        <div className="mx-2 hidden h-10 w-[1px] bg-[#ece4d2] sm:block" />

        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="lux-eyebrow mb-1 ml-1">
              Start Date
            </span>
            <DateSelector
              selectedDate={startDate}
              onChange={onStartDateChange}
            />
          </div>
          <div className="flex flex-col">
            <span className="lux-eyebrow mb-1 ml-1">
              End Date
            </span>
            <DateSelector selectedDate={endDate} onChange={onEndDateChange} />
          </div>
          {(startDate || endDate || searchInput) && (
            <button
              onClick={onClearFilters}
              className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 shadow-sm transition-all hover:bg-rose-100"
              title="Clear all filters"
            >
              <FaTimes size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="w-full lg:max-w-md">
        <div className="group relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <AiOutlineSearch
              size={20}
              className="text-lux-muted transition-colors group-focus-within:text-lux-emerald"
            />
          </div>
          <input
            type="text"
            placeholder="Search by Sauda, PO, Buyer, or Commodity..."
            className="w-full rounded-2xl border border-[#e4dbc6] bg-lux-cream py-3 pl-11 pr-4 text-sm font-medium text-lux-ink placeholder-lux-muted transition-all focus:border-lux-emerald focus:outline-none focus:ring-4 focus:ring-lux-gold/20"
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
    <div className="overflow-hidden rounded-2xl border border-[#ece4d2]">
      <Tables headers={headers} rows={rows} />
    </div>
  );
};

export default SelfOrderList;
