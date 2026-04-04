import {
  lazy,
  Suspense,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaDownload, FaWhatsapp } from "react-icons/fa";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaClipboardList } from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import { pdf } from "@react-pdf/renderer";
import SaudaPDF from "../../../components/DownloadSauda/SaudaPDF/SaudaPDF";
import generateExcel from "../../../common/GenerateExcel/GenerateExcel";
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

const API_URL = "/self-order";

const SelfOrderList = () => {
  const navigate = useNavigate();
  const { userRole, mobile } = useAuth();
  const [, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [consigneeMap, setConsigneeMap] = useState(new Map());
  const [consigneeData, setConsigneeData] = useState([]);
  const [supplierData, setSupplierData] = useState([]);
  const [buyerData, setBuyerData] = useState([]);
  const [sellerProfileData, setSellerProfileData] = useState([]);
  const [companyData, setCompanyData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [serverPaginated, setServerPaginated] = useState(false);
  const [reloadFlag, setReloadFlag] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const page = currentPage || 1;
        const search = searchInput?.trim() || "";
        const [orderRes, consignees, allBuyers, suppliers, sellerProfiles, companies] =
          await Promise.all([
          axios.get(
            `${API_URL}?page=${page}&limit=${itemsPerPage}&search=${search}`,
          ),
          fetchAllPages("/consignees", { limit: 200 }).catch(() => []),
          fetchAllPages("/buyers", { limit: 200 }).catch(() => []),
          fetchAllPages("/seller-company", { limit: 200 }).catch(() => []),
          fetchAllPages("/sellers", { limit: 200 }).catch(() => []),
          fetchAllPages("/companies", { limit: 200 }).catch(() => []),
        ]);

        if (!isMounted) return;

        const orderData = orderRes.data || {};
        let raw = [];
        let total = 0;
        const hasPaginationMeta =
          typeof orderData.page === "number" ||
          typeof orderData.totalPages === "number" ||
          typeof orderData.limit === "number" ||
          typeof orderData.total === "number" ||
          typeof orderData.totalItems === "number";

        if (orderData && Array.isArray(orderData.data)) {
          raw = orderData.data;
          total =
            typeof orderData.total === "number"
              ? orderData.total
              : typeof orderData.totalItems === "number"
                ? orderData.totalItems
                : raw.length;
        } else if (Array.isArray(orderData)) {
          raw = orderData;
          total = raw.length;
        } else {
          raw = orderData?.data || [];
          total = raw.length;
        }
        setServerPaginated(hasPaginationMeta);

        let filteredOrders = raw;

        if (userRole === "Buyer") {
          const buyer = allBuyers.find((b) =>
            b.mobile?.some((m) => String(m) === String(mobile)),
          );
          if (buyer) {
            const buyerCompanyIds = (buyer.companyIds || []).map((id) =>
              String(id),
            );
            const buyerCompanyNames = (buyer.companyNames || []).map((name) =>
              name.trim().toLowerCase(),
            );

            filteredOrders = raw.filter((item) => {
              const matchId =
                item.companyId &&
                buyerCompanyIds.includes(String(item.companyId));
              const matchName =
                item.buyerCompany &&
                buyerCompanyNames.includes(
                  item.buyerCompany.trim().toLowerCase(),
                );

              return matchId || matchName;
            });

            if (total === raw.length) {
              total = filteredOrders.length;
            }
          }
        } else if (userRole === "Seller") {
          const seller = sellerProfiles.find((s) =>
            s.phoneNumbers?.some((p) => String(p.value) === String(mobile))
          );
          
          filteredOrders = raw.filter((item) => {
            return (
              String(item.sellerMobile) === String(mobile) ||
              (seller && String(item.supplier) === String(seller._id))
            );
          });
          if (total === raw.length) {
            total = filteredOrders.length;
          }
        }

        filteredOrders = [...filteredOrders].sort((a, b) => {
          const aDate = a.createdAt || a.poDate;
          const bDate = b.createdAt || b.poDate;
          if (aDate && bDate) {
            const diff = new Date(bDate) - new Date(aDate);
            if (diff !== 0) return diff;
          }
          const aSauda = Number(a.saudaNo) || 0;
          const bSauda = Number(b.saudaNo) || 0;
          return bSauda - aSauda;
        });

        setData(filteredOrders);
        setFilteredData(filteredOrders);
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
      } catch {
        if (isMounted) toast.error("Failed to fetch data from the server.");
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [userRole, mobile, currentPage, itemsPerPage, searchInput, reloadFlag]);

  const currentItems = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    if (serverPaginated || totalItems > filteredData.length) {
      return filteredData;
    }
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredData.slice(start, end);
  }, [filteredData, totalItems, currentPage, itemsPerPage, serverPaginated]);

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

        const finalMobile =
          cleanMobile.length === 10
            ? `91${cleanMobile}`
            : cleanMobile.startsWith("91")
              ? cleanMobile
              : cleanMobile;

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

        const fileName = `Sauda-${item.saudaNo}.pdf`;

        let shared = false;

        try {
          if (
            navigator.share &&
            navigator.canShare &&
            typeof File !== "undefined"
          ) {
            const file = new File([blob], fileName, {
              type: "application/pdf",
            });

            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                text: message,
                title: fileName,
              });
              shared = true;
            }
          }
        } catch (err) {
          console.error("Share failed:", err);
        }

        if (!shared) {
          try {
            const formData = new FormData();
            formData.append("file", blob, fileName);

            const uploadRes = await axios.post("/upload-pdf", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });

            const fileUrl = uploadRes?.data?.url || uploadRes?.data?.fileUrl;

            const newMessage = fileUrl
              ? `${message}

Download PDF: ${fileUrl}`
              : message;

            const url = `https://wa.me/${finalMobile}?text=${encodeURIComponent(
              newMessage,
            )}`;

            window.open(url, "_blank");
          } catch (err) {
            console.error("Upload failed:", err);
            toast.error(
              err?.response?.data?.message ||
                "Failed to upload PDF for WhatsApp. Sending text only.",
            );

            const url = `https://wa.me/${finalMobile}?text=${encodeURIComponent(
              message,
            )}`;
            window.open(url, "_blank");
          }
        }

        try {
          await axios.patch(`/self-order/${item._id}/whatsapp-sent`);

          setData((prev) =>
            prev.map((o) =>
              o._id === item._id ? { ...o, whatsappSent: true } : o,
            ),
          );

          setFilteredData((prev) =>
            prev.map((o) =>
              o._id === item._id ? { ...o, whatsappSent: true } : o,
            ),
          );
        } catch (err) {
          console.error("Status update failed:", err);
        }

        toast.dismiss(toastId);
        toast.success("WhatsApp opened");
      } catch (error) {
        toast.dismiss(toastId);
        console.error(error);
        toast.error(
          error?.message || "Something went wrong while preparing WhatsApp",
        );
      }
    },
    [
      userRole,
      getConsigneeDisplay,
      buyerData,
      supplierData,
      consigneeData,
      companyData,
    ],
  );

  const openWhatsAppChat = useCallback((mobileNumber, item) => {
    if (!mobileNumber || (Array.isArray(mobileNumber) && !mobileNumber[0])) {
      toast.error("Mobile number not available");
      return;
    }

    const value = Array.isArray(mobileNumber) ? mobileNumber[0] : mobileNumber;
    const cleanMobile = String(value).replace(/\D/g, "");

    if (!cleanMobile || cleanMobile.length < 10) {
      toast.error("Invalid mobile number");
      return;
    }

    const finalMobile =
      cleanMobile.length === 10
        ? `91${cleanMobile}`
        : cleanMobile.startsWith("91")
          ? cleanMobile
          : cleanMobile;

    const message = `Hello, regarding Sauda No: ${item?.saudaNo || ""}`;

    const url = `https://wa.me/${finalMobile}?text=${encodeURIComponent(
      message,
    )}`;

    window.open(url, "_blank");
  }, []);

  const handleView = useCallback(
    (item) => {
      setSelectedItem({ ...item, consignee: getConsigneeDisplay(item) });
    },
    [getConsigneeDisplay],
  );

  const handleClosePopup = useCallback(() => setSelectedItem(null), []);

  const headers = useMemo(
    () =>
      [
        "Sl No",
        "Date",
        "Sauda No",
        "PO Number",
        userRole === "Admin" || userRole === "Employee" ? "Buyer" : null,
        "Buyer Company",
        userRole === "Admin" ? "Mobile" : null,
        "Consignee",
        "Commodity",
        "Quantity",
        "Rate",
        "Loading Station",
        "Location",
        "Agent Name",
        userRole === "Admin" || userRole === "Employee" ? "Buyer Emails" : null,
        userRole === "Admin" || userRole === "Employee"
          ? "Seller Emails"
          : null,
        userRole === "Admin" || userRole === "Employee" ? "WhatsApp Sent" : null,
        userRole === "Admin" || userRole === "Employee" ? "Action" : null,
      ].filter(Boolean),
    [userRole],
  );

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
    if (!item?._id) {
      toast.error("Missing order id. Cannot delete this order.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete PO Number: ${item.poNumber || "N/A"}?`,
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_URL}/${item._id}`);
      toast.success("Order deleted successfully");
      setReloadFlag((prev) => prev + 1);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete order");
    }
  }, []);

  const rows = useMemo(
    () =>
      currentItems.map((item, index) => {
        const slNo = totalItems - ((currentPage - 1) * itemsPerPage + index);

        const formattedDate = item.poDate
          ? new Date(item.poDate).toLocaleDateString("en-GB")
          : item.createdAt
            ? new Date(item.createdAt).toLocaleDateString("en-GB")
            : "N/A";

        return [
          slNo,
          formattedDate,
          item.saudaNo || "N/A",
          item.poNumber || "N/A",
          userRole === "Admin" || userRole === "Employee"
            ? item.buyer || "N/A"
            : null,
          item.buyerCompany || "N/A",
          userRole === "Admin" ? (
            <div className="flex items-center gap-2" key={`mobile-${item._id}`}>
              <span>{item.buyerMobile || "N/A"}</span>
              {item.buyerMobile && (
                <button
                  onClick={() => handleSmartWhatsApp(item, "buyer")}
                  className="text-slate-400 hover:text-green-500"
                  title="Chat on WhatsApp"
                >
                  <FaWhatsapp size={18} />
                </button>
              )}
            </div>
          ) : null,
          getConsigneeDisplay(item) || "N/A",
          item.commodity || "N/A",
          item.quantity || "0",
          item.rate || "0",
          item.loadingStation || "N/A",
          item.location || "N/A",
          item.agentName || "N/A",
          userRole === "Admin" || userRole === "Employee"
            ? item.buyerEmails?.filter(Boolean).join(", ") || "N/A"
            : null,
          userRole === "Admin" || userRole === "Employee" ? (
            <div className="flex flex-col gap-1" key={`seller-${item._id}`}>
              <span className="text-xs text-slate-500">
                {item.sellerEmails?.filter(Boolean).join(", ") || "N/A"}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-700">
                  {item.sellerMobile || "N/A"}
                </span>
                {item.sellerMobile && userRole === "Admin" && (
                  <button
                    onClick={() => handleSmartWhatsApp(item, "seller")}
                    className="text-slate-400 hover:text-green-500"
                    title="Chat on WhatsApp"
                  >
                    <FaWhatsapp size={18} />
                  </button>
                )}
              </div>
            </div>
          ) : null,
          userRole === "Admin" || userRole === "Employee" ? (
            <div className="flex justify-center" key={`status-${item._id}`}>
              {item.whatsappSent ? (
                <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                  Sent
                </span>
              ) : (
                <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
                  Pending
                </span>
              )}
            </div>
          ) : null,
          userRole === "Admin" || userRole === "Employee" ? (
            <div
              className="flex flex-col gap-2 items-start min-w-[120px]"
              key={`actions-${item._id}`}
            >
              <Actions
                onView={() => handleView(item)}
                onEdit={() => handleEdit(item)}
                onDelete={() => handleDelete(item)}
              />

              <div className="flex gap-2">
                <DownloadSauda
                  data={{ ...item, consignee: getConsigneeDisplay(item) }}
                  consigneeData={consigneeData}
                  supplierData={supplierData}
                  buyerData={buyerData}
                  sellerProfileData={sellerProfileData}
                  autoEmail
                  button={
                    <button className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                      <FaDownload size={16} />
                    </button>
                  }
                />

                {item.buyerMobile && userRole === "Admin" && (
                  <button
                    onClick={() => handleSmartWhatsApp(item, "buyer")}
                    className="sm:hidden w-9 h-9 rounded-lg bg-green-50 text-green-600"
                  >
                    <FaWhatsapp size={16} />
                  </button>
                )}
              </div>
            </div>
          ) : null,
        ].filter(Boolean);
      }),
    [
      currentItems,
      handleView,
      handleEdit,
      handleDelete,
      handleSmartWhatsApp,
      openWhatsAppChat,
      getConsigneeDisplay,
      currentPage,
      itemsPerPage,
      userRole,
      totalItems,
      consigneeData,
      supplierData,
      buyerData,
      sellerProfileData,
    ],
  );

  const handleSearchChange = useCallback((e) => {
    const searchTerm = e.target.value;
    setSearchInput(searchTerm);
    setCurrentPage(1);
  }, []);

  const handleDownloadExcel = useCallback(async () => {
    try {
      const toastId = toast.loading("Preparing Excel...");
      const res = await axios.get(API_URL);

      const orderData = res.data;
      let raw = [];

      if (orderData && Array.isArray(orderData.data)) {
        raw = orderData.data;
      } else if (Array.isArray(orderData)) {
        raw = orderData;
      } else {
        raw = orderData?.data || [];
      }

      let exportOrders = raw;

      if (userRole === "Buyer" && buyerData.length > 0) {
        const buyer = buyerData.find((b) =>
          b.mobile?.some((m) => String(m) === String(mobile)),
        );
        if (buyer) {
          const buyerCompanyIds = (buyer.companyIds || []).map((id) =>
            String(id),
          );
          const buyerCompanyNames = (buyer.companyNames || []).map((name) =>
            name.trim().toLowerCase(),
          );

          exportOrders = raw.filter((item) => {
            const matchId =
              item.companyId &&
              buyerCompanyIds.includes(String(item.companyId));
            const matchName =
              item.buyerCompany &&
              buyerCompanyNames.includes(
                item.buyerCompany.trim().toLowerCase(),
              );

            return matchId || matchName;
          });
        }
      }

      if (searchInput && searchInput.trim() !== "") {
        const lowerSearch = searchInput.toLowerCase();
        exportOrders = exportOrders.filter(
          (order) =>
            (order.buyer && order.buyer.toLowerCase().includes(lowerSearch)) ||
            (order.buyerCompany &&
              order.buyerCompany.toLowerCase().includes(lowerSearch)) ||
            (order.commodity &&
              order.commodity.toLowerCase().includes(lowerSearch)) ||
            (order.saudaNo &&
              order.saudaNo.toString().toLowerCase().includes(lowerSearch)) ||
            (order.poNumber &&
              order.poNumber.toString().toLowerCase().includes(lowerSearch)),
        );
      }

      exportOrders = [...exportOrders].sort((a, b) => {
        const aSauda = Number(a.saudaNo) || 0;
        const bSauda = Number(b.saudaNo) || 0;
        return aSauda - bSauda;
      });

      const excelRows = exportOrders.map((item) => ({
        Date: item.poDate
          ? new Date(item.poDate).toLocaleDateString("en-GB")
          : item.createdAt
            ? new Date(item.createdAt).toLocaleDateString("en-GB")
            : "",
        "Sauda No": item.saudaNo || "",
        "PO Number": item.poNumber || "",
        Buyer: item.buyer || "",
        "Buyer Company": item.buyerCompany || "",
        "Seller Company": item.supplierCompany || "",
        "Seller Name": item.supplier?.sellerName || "",
        Consignee: getConsigneeDisplay(item) || "",
        Commodity: item.commodity || "",
        Quantity: item.quantity || "",
        Rate: item.rate || "",
        Tax: "",
        CD: item.cd || "",
        "Delivery Date": item.deliveryDate
          ? new Date(item.deliveryDate).toLocaleDateString("en-GB")
          : "",
        "Payment Time": item.paymentTerms || "",
      }));

      if (excelRows.length === 0) {
        toast.dismiss(toastId);
        toast.info("No data available to download.");
        return;
      }

      generateExcel(excelRows, "SelfOrders.xlsx");

      toast.dismiss(toastId);
      toast.success("Excel downloaded");
    } catch {
      toast.error("Failed to generate Excel");
    }
  }, [userRole, buyerData, mobile, searchInput, getConsigneeDisplay]);

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Self order list"
        subtitle="Manage orders — search by buyer, Sauda no, or PO number"
        icon={FaClipboardList}
        noContentCard
      >
        <div className="max-w-full space-y-4 sm:space-y-6">
          <SelfOrderSearchBar
            onBack={() => navigate(-1)}
            searchInput={searchInput}
            onSearchChange={handleSearchChange}
            onDownloadExcel={handleDownloadExcel}
          />

          <SelfOrderTable headers={headers} rows={rows} />

          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />

          {selectedItem && (
            <PopupBox
              isOpen={!!selectedItem}
              onClose={handleClosePopup}
              title={`Sauda details — ${selectedItem.saudaNo}`}
            >
              <OrderDetails item={selectedItem} />
            </PopupBox>
          )}
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
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1 sm:px-0">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-300 transition"
        >
          Back
        </button>
        <button
          onClick={onDownloadExcel}
          className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-emerald-700 transition"
        >
          <FaDownload size={14} />
          <span>Download Excel</span>
        </button>
      </div>
      <div className="flex-1 w-full sm:w-auto">
        <div
          className="flex items-center w-full max-w-md bg-white border border-emerald-100 rounded-xl px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-emerald-400/50 focus-within:border-emerald-400 transition-all"
          role="search"
        >
          <svg
            className="text-emerald-600/70 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            className="w-full min-w-0 px-2 py-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
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
    <div className="rounded-xl sm:rounded-2xl border border-emerald-100 bg-white p-2 sm:p-6 shadow-md sm:shadow-lg shadow-emerald-900/5 overflow-hidden">
      <Tables headers={headers} rows={rows} />
    </div>
  );
};

export default SelfOrderList;
