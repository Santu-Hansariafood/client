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
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [consigneeMap, setConsigneeMap] = useState(new Map());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [orderRes, consigneeRes, buyersRes] = await Promise.all([
          axios.get(API_URL),
          axios.get("/consignees").catch(() => ({ data: [] })),
          userRole === "Buyer"
            ? axios.get("/buyers")
            : Promise.resolve({ data: [] }),
        ]);

        if (isMounted) {
          let raw = Array.isArray(orderRes.data)
            ? orderRes.data
            : orderRes.data?.data || [];

          if (userRole === "Buyer") {
            const buyers = buyersRes.data?.data || buyersRes.data || [];
            const buyer = buyers.find((b) =>
              b.mobile?.some((m) => String(m) === String(mobile)),
            );
            if (buyer) {
              const buyerCompanyId = buyer.companyId;
              const buyerCompanyName = buyer.companyName;

              raw = raw.filter((item) => {
                const matchId =
                  buyerCompanyId &&
                  item.companyId &&
                  String(item.companyId) === String(buyerCompanyId);
                const matchName =
                  buyerCompanyName &&
                  item.buyerCompany &&
                  item.buyerCompany.trim().toLowerCase() ===
                    buyerCompanyName.trim().toLowerCase();

                return matchId || matchName;
              });
            }
          }

          setData(raw);
          setFilteredData(raw);
          const consignees = Array.isArray(consigneeRes.data)
            ? consigneeRes.data
            : consigneeRes.data?.data || [];
          const map = new Map();
          consignees.forEach((c) => {
            if (c?._id) map.set(String(c._id), c.name || c.label || "-");
          });
          setConsigneeMap(map);
        }
      } catch {
        if (isMounted) toast.error("Failed to fetch data from the server.");
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [userRole, mobile]);

  const indexOfLastItem = useMemo(
    () => currentPage * itemsPerPage,
    [currentPage, itemsPerPage],
  );
  const indexOfFirstItem = useMemo(
    () => indexOfLastItem - itemsPerPage,
    [indexOfLastItem, itemsPerPage],
  );

  const currentItems = useMemo(
    () => filteredData.slice(indexOfFirstItem, indexOfLastItem),
    [filteredData, indexOfFirstItem, indexOfLastItem],
  );

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
  const handleWhatsAppDirectShare = async (item) => {
    if (!item.buyerMobile) {
      toast.error("Mobile number not available for this buyer.");
      return;
    }

    try {
      const response = await axios.get(`/self-order/pdf/${item._id}`, {
        responseType: "blob",
      });

      const blob = response.data;
      const fileName = `Sauda-${item.saudaNo}.pdf`;
      const file = new File([blob], fileName, { type: "application/pdf" });

      // Native Share (Mobile)
      const shareData = {
        files: [file],
        title: "Sauda PDF",
        text: `Sauda No: ${item.saudaNo}`,
      };

      const canShareFiles = (() => {
        try {
          return (
            typeof navigator !== "undefined" &&
            typeof navigator.share === "function" &&
            typeof navigator.canShare === "function" &&
            navigator.canShare({ files: [file] })
          );
        } catch {
          return false;
        }
      })();

      if (canShareFiles) {
        await navigator.share(shareData);
        // After successful share, update status
        await axios.patch(`/self-order/${item._id}/whatsapp-sent`);
        // Update local state
        setData((prev) =>
          prev.map((order) =>
            order._id === item._id ? { ...order, whatsappSent: true } : order
          )
        );
        setFilteredData((prev) =>
          prev.map((order) =>
            order._id === item._id ? { ...order, whatsappSent: true } : order
          )
        );
        return;
      }

      // Fallback: Download and open WhatsApp Web with number
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const cleanMobile = item.buyerMobile.replace(/\D/g, "");
      const waUrl = `https://wa.me/${cleanMobile.startsWith("91") ? cleanMobile : "91" + cleanMobile}?text=${encodeURIComponent(`Dear Sir, please find attached Sauda No: ${item.saudaNo}`)}`;
      window.open(waUrl, "_blank");

      // Update status even on fallback if they clicked it
      await axios.patch(`/self-order/${item._id}/whatsapp-sent`);
      setData((prev) =>
        prev.map((order) =>
          order._id === item._id ? { ...order, whatsappSent: true } : order
        )
      );
      setFilteredData((prev) =>
        prev.map((order) =>
          order._id === item._id ? { ...order, whatsappSent: true } : order
        )
      );

      toast.info("PDF downloaded. Please attach it in the opened WhatsApp chat.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to process WhatsApp share");
    }
  };

  const handleWhatsAppShare = async (item) => {
    try {
      const response = await axios.get(`/self-order/pdf/${item._id}`, {
        responseType: "blob",
      });

      const blob = response.data;

      const fileName = `Sauda-${item.saudaNo}.pdf`;
      const file =
        typeof File !== "undefined"
          ? new File([blob], fileName, { type: "application/pdf" })
          : blob;

      const shareData = {
        title: "Sauda PDF",
        text: `Sauda No: ${item.saudaNo}`,
        files: [file],
      };

      // canShare(...) might throw in some browsers; wrap it.
      const canShareFiles = (() => {
        try {
          return (
            typeof navigator !== "undefined" &&
            typeof navigator.share === "function" &&
            typeof navigator.canShare === "function" &&
            navigator.canShare({ files: [file] })
          );
        } catch {
          return false;
        }
      })();

      if (canShareFiles) {
        await navigator.share(shareData);
        return;
      }

      // Fallback: Download the PDF and open WhatsApp Web
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const waText = `Sauda No: ${item.saudaNo}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, "_blank");
      toast.info("PDF downloaded. Please attach it in WhatsApp.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to process PDF");
    }
  };

  const handleView = useCallback(
    (item) => {
      setSelectedItem({ ...item, consignee: getConsigneeDisplay(item) });
    },
    [getConsigneeDisplay],
  );

  const handleClosePopup = useCallback(() => setSelectedItem(null), []);

  const headers = useMemo(
    () => [
      "Sl No",
      "Sauda No",
      "PO Number",
      "Buyer",
      "Buyer Company",
      userRole === "Admin" ? "Mobile" : null,
      "Consignee",
      "Commodity",
      "Quantity",
      "Rate",
      "Loading Station",
      "Location",
      "Agent Name",
      "Buyer Emails",
      "Seller Emails",
      "Action",
    ].filter(Boolean),
    [userRole],
  );

  const handleEdit = useCallback(
    (item) => {
      navigate(`/manage-order/edit-self-order/${item._id}`, {
        state: { orderData: item },
      });
    },
    [navigate],
  );

  const rows = useMemo(
    () =>
      currentItems.map((item, index) => [
        (currentPage - 1) * itemsPerPage + index + 1,
        item.saudaNo,
        item.poNumber,
        item.buyer,
        item.buyerCompany,
        userRole === "Admin" ? (
          <div className="flex items-center gap-2">
            <span>{item.buyerMobile || "N/A"}</span>
            {item.buyerMobile && (
              <button
                onClick={() => handleWhatsAppDirectShare(item)}
                className={`transition-colors ${
                  item.whatsappSent
                    ? "text-green-600"
                    : "text-slate-400 hover:text-green-500"
                }`}
                title={item.whatsappSent ? "Sent" : "Send on WhatsApp"}
              >
                <FaWhatsapp size={18} />
              </button>
            )}
          </div>
        ) : null,
        getConsigneeDisplay(item),
        item.commodity,
        item.quantity,
        `₹${item.rate}`,
        item.state,
        item.location,
        item.agentName,
        item.buyerEmails?.filter(Boolean)?.join(", ") ||
          item.buyerEmail ||
          "N/A",
        item.sellerEmails?.filter(Boolean)?.join(", ") || "N/A",
        <div
          className="flex flex-col gap-2 items-start min-w-[120px]"
          key={item._id}
        >
          <div className="flex flex-wrap gap-2">
            <Actions
              onView={() => handleView(item)}
              onEdit={() => handleEdit(item)}
              onDelete={() =>
                toast.error(`Deleting PO Number: ${item.poNumber}`)
              }
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <DownloadSauda
              data={{ ...item, consignee: getConsigneeDisplay(item) }}
              button={
                <button className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100">
                  <FaDownload size={16} />
                </button>
              }
            />

            <button
              type="button"
              onClick={() =>
                handleWhatsAppShare({
                  ...item,
                  consignee: getConsigneeDisplay(item),
                })
              }
              className="sm:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg bg-green-50 text-green-600 border border-green-100 hover:bg-green-100"
            >
              <FaWhatsapp size={16} />
            </button>
          </div>
        </div>,
      ].filter(Boolean)),
    [
      currentItems,
      handleView,
      handleEdit,
      getConsigneeDisplay,
      currentPage,
      itemsPerPage,
      handleWhatsAppDirectShare,
      userRole,
    ],
  );

  const handleSearchChange = useCallback(
    (e) => {
      const searchTerm = e.target.value;
      setSearchInput(searchTerm);
      if (!searchTerm || searchTerm.trim() === "") {
        setFilteredData(data);
      } else {
        const lowerSearch = searchTerm.toLowerCase();
        setFilteredData(
          data.filter(
            (order) =>
              (order.buyer &&
                order.buyer.toLowerCase().includes(lowerSearch)) ||
              (order.buyerCompany &&
                order.buyerCompany.toLowerCase().includes(lowerSearch)) ||
              (order.commodity &&
                order.commodity.toLowerCase().includes(lowerSearch)) ||
              (order.saudaNo &&
                order.saudaNo.toString().toLowerCase().includes(lowerSearch)) ||
              (order.poNumber &&
                order.poNumber.toString().toLowerCase().includes(lowerSearch)),
          ),
        );
      }
      setCurrentPage(1);
    },
    [data],
  );

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Self order list"
        subtitle="Manage orders — search by buyer, Sauda no, or PO number"
        icon={FaClipboardList}
        noContentCard
      >
        <div className="max-w-full space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
            >
              Back
            </button>
            <div
              className="flex items-center w-full max-w-md bg-white border border-emerald-100 rounded-xl px-4 py-2.5 shadow-md shadow-emerald-900/5 focus-within:ring-2 focus-within:ring-emerald-400/50 focus-within:border-emerald-400 transition-all"
              role="search"
            >
              <svg
                className="text-emerald-600/70 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
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
                placeholder="Search by buyer, Sauda no, or PO..."
                className="w-full min-w-0 px-3 py-2 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none"
                value={searchInput}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-4 sm:p-6 shadow-lg shadow-emerald-900/5 overflow-hidden">
            <Tables headers={headers} rows={rows} />
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredData.length}
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

export default SelfOrderList;
