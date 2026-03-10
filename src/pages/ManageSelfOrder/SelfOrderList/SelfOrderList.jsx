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
import { FaDownload } from "react-icons/fa";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaClipboardList } from "react-icons/fa";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Pagination = lazy(() =>
  import("../../../common/Paginations/Paginations")
);
const Actions = lazy(() => import("../../../common/Actions/Actions"));
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));
const OrderDetails = lazy(() => import("./OrderDetails/OrderDetails"));
const DownloadSauda = lazy(() =>
  import("../../../components/DownloadSauda/DownloadSauda")
);

const API_URL = "/self-order";

const SelfOrderList = () => {
  const navigate = useNavigate();
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
        const [orderRes, consigneeRes] = await Promise.all([
          axios.get(API_URL),
          axios.get("/consignees").catch(() => ({ data: [] })),
        ]);
        if (isMounted) {
          const raw = Array.isArray(orderRes.data)
            ? orderRes.data
            : orderRes.data?.data || [];
          const reversedData = [...raw].reverse();
          setData(reversedData);
          setFilteredData(reversedData);
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
  }, []);

  const indexOfLastItem = useMemo(
    () => currentPage * itemsPerPage,
    [currentPage, itemsPerPage]
  );
  const indexOfFirstItem = useMemo(
    () => indexOfLastItem - itemsPerPage,
    [indexOfLastItem, itemsPerPage]
  );

  const currentItems = useMemo(
    () => filteredData.slice(indexOfFirstItem, indexOfLastItem),
    [filteredData, indexOfFirstItem, indexOfLastItem]
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
    [consigneeMap]
  );

  const handleView = useCallback(
    (item) => {
      setSelectedItem({ ...item, consignee: getConsigneeDisplay(item) });
    },
    [getConsigneeDisplay]
  );

  const handleClosePopup = useCallback(() => setSelectedItem(null), []);

  const headers = useMemo(
    () => [
      "Sauda No",
      "PO Number",
      "Buyer",
      "Buyer Company",
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
    ],
    []
  );

  const handleEdit = useCallback(
    (item) => {
      navigate(`/manage-order/edit-self-order/${item._id}`, {
        state: { orderData: item },
      });
    },
    [navigate]
  );

  const rows = useMemo(
    () =>
      currentItems.map((item) => [
        item.saudaNo,
        item.poNumber,
        item.buyer,
        item.buyerCompany,
        getConsigneeDisplay(item),
        item.commodity,
        item.quantity,
        `₹${item.rate}`,
        item.state,
        item.location,
        item.agentName,
        item.buyerEmails?.join(", ") || "N/A",
        item.sellerEmails?.join(", ") || "N/A",
        <div className="flex flex-wrap items-center gap-2" key={item._id}>
          <Actions
            onView={() => handleView(item)}
            onEdit={() => handleEdit(item)}
            onDelete={() => toast.error(`Deleting PO Number: ${item.poNumber}`)}
          />
          <DownloadSauda
            data={item}
            button={
              <button
                type="button"
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-colors"
                title="Download Sauda PDF"
              >
                <FaDownload size={16} />
              </button>
            }
          />
        </div>,
      ]),
    [currentItems, handleView, handleEdit, getConsigneeDisplay]
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
              (order.saudaNo &&
                order.saudaNo.toLowerCase().includes(lowerSearch)) ||
              (order.poNumber &&
                order.poNumber.toLowerCase().includes(lowerSearch))
          )
        );
      }
      setCurrentPage(1);
    },
    [data]
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
          <div className="flex justify-center sm:justify-start">
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
