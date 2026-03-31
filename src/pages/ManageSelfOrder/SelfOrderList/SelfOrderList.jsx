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
  const [consigneeData, setConsigneeData] = useState([]);
  const [supplierData, setSupplierData] = useState([]);
  const [buyerData, setBuyerData] = useState([]);
  const [sellerProfileData, setSellerProfileData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [
          orderRes,
          consigneeRes,
          buyersRes,
          supplierRes,
          sellerProfileRes,
        ] = await Promise.all([
          axios.get(API_URL),
          axios.get("/consignees").catch(() => ({ data: [] })),
          axios.get("/buyers").catch(() => ({ data: [] })),
          axios.get("/seller-company").catch(() => ({ data: [] })),
          axios.get("/sellers").catch(() => ({ data: [] })),
        ]);

        if (isMounted) {
          let raw = Array.isArray(orderRes.data)
            ? orderRes.data
            : orderRes.data?.data || [];

          const allBuyers = Array.isArray(buyersRes.data)
            ? buyersRes.data
            : buyersRes.data?.data || [];

          if (userRole === "Buyer") {
            const buyer = allBuyers.find((b) =>
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
          setConsigneeData(consignees);

          const suppliers = Array.isArray(supplierRes.data)
            ? supplierRes.data
            : supplierRes.data?.data || [];
          setSupplierData(suppliers);

          setBuyerData(allBuyers);

          const sellerProfiles = Array.isArray(sellerProfileRes.data)
            ? sellerProfileRes.data
            : sellerProfileRes.data?.data || [];
          setSellerProfileData(sellerProfiles);

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

  const handleWhatsAppShare = useCallback(
    async (item, target = "buyer") => {
      const mobileNumber =
        target === "buyer" ? item.buyerMobile : item.sellerMobile;

      if (!mobileNumber) {
        toast.error("Mobile number not available.");
        return;
      }

      const toastId = toast.loading("Opening WhatsApp...");

      try {
        const message = [
          `Sauda No: ${item.saudaNo || "N/A"}`,
          `PO Number: ${item.poNumber || "N/A"}`,
          `Buyer: ${item.buyerCompany || item.buyer || "N/A"}`,
          `Supplier: ${item.supplierCompany || item.supplier || "N/A"}`,
        ].join("\n");

        const cleanMobile = mobileNumber.replace(/\D/g, "");
        const finalMobile = cleanMobile.startsWith("91")
          ? cleanMobile
          : "91" + cleanMobile;

        const waUrl = `https://wa.me/${finalMobile}?text=${encodeURIComponent(
          message,
        )}`;

        const updateStatus = async () => {
          try {
            await axios.patch(`/self-order/${item._id}/whatsapp-sent`);
            setData((prev) =>
              prev.map((order) =>
                order._id === item._id
                  ? { ...order, whatsappSent: true }
                  : order,
              ),
            );
            setFilteredData((prev) =>
              prev.map((order) =>
                order._id === item._id
                  ? { ...order, whatsappSent: true }
                  : order,
              ),
            );
          } catch (err) {
            console.error("Failed to update WhatsApp status:", err);
          }
        };

        window.open(waUrl, "_blank", "noopener,noreferrer");
        await updateStatus();

        toast.dismiss(toastId);
        toast.success("WhatsApp opened with order details.");
      } catch (error) {
        toast.dismiss(toastId);
        console.error(error);
        toast.error("Failed to open WhatsApp.");
      }
    },
    [],
  );
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
        "WhatsApp Sent",
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
      currentItems.map((item, index) => {
        const slNo =
          filteredData.length - ((currentPage - 1) * itemsPerPage + index);

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
          item.buyer || "N/A",
          item.buyerCompany || "N/A",
          userRole === "Admin" ? (
            <div className="flex items-center gap-2" key={`mobile-${item._id}`}>
              <span>{item.buyerMobile || "N/A"}</span>
              {item.buyerMobile && (
                <button
                  onClick={() => handleWhatsAppShare(item, "buyer")}
                  className={`sm:hidden transition-colors ${
                    item.whatsappSent
                      ? "text-green-600"
                      : "text-slate-400 hover:text-green-500"
                  }`}
                  title={item.whatsappSent ? "Sent" : "Send WhatsApp"}
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
          item.buyerEmails?.filter(Boolean).join(", ") || "N/A",
          <div className="flex flex-col gap-1" key={`seller-${item._id}`}>
            <span className="text-xs text-slate-500">
              {item.sellerEmails?.filter(Boolean).join(", ") || "N/A"}
            </span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700">
                {item.sellerMobile || "N/A"}
              </span>
              {item.sellerMobile && (
                <button
                  onClick={() => handleWhatsAppShare(item, "seller")}
                  className="sm:hidden text-slate-400 hover:text-green-500"
                  title="Send WhatsApp"
                >
                  <FaWhatsapp size={18} />
                </button>
              )}
            </div>
          </div>,
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
          </div>,
          <div
            className="flex flex-col gap-2 items-start min-w-[120px]"
            key={`actions-${item._id}`}
          >
            <Actions
              onView={() => handleView(item)}
              onEdit={() => handleEdit(item)}
              onDelete={() =>
                toast.error(`Deleting PO Number: ${item.poNumber}`)
              }
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

              <button
                onClick={() => handleWhatsAppShare(item)}
                className="sm:hidden w-9 h-9 rounded-lg bg-green-50 text-green-600"
              >
                <FaWhatsapp size={16} />
              </button>
            </div>
          </div>,
        ].filter(Boolean);
      }),
    [
      currentItems,
      handleView,
      handleEdit,
      getConsigneeDisplay,
      currentPage,
      itemsPerPage,
      userRole,
      filteredData.length,
      handleWhatsAppShare,
      consigneeData,
      supplierData,
      buyerData,
      sellerProfileData,
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
        <div className="max-w-full space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1 sm:px-0">
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-300 transition"
            >
              Back
            </button>
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
                onChange={handleSearchChange}
              />
            </div>
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-emerald-100 bg-white p-2 sm:p-6 shadow-md sm:shadow-lg shadow-emerald-900/5 overflow-hidden">
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
