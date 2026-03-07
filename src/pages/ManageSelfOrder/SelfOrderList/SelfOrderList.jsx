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
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaDownload } from "react-icons/fa";
import Loading from "../../../common/Loading/Loading";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const response = await axios.get(API_URL);
        if (isMounted) {
          const raw = Array.isArray(response.data)
            ? response.data
            : response.data?.data || [];
          const reversedData = [...raw].reverse();
          setData(reversedData);
          setFilteredData(reversedData);
        }
      } catch {
        if (isMounted) {
          toast.error("Failed to fetch data from the server.");
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const indexOfLastItem = useMemo(() => currentPage * itemsPerPage, [currentPage, itemsPerPage]);
  const indexOfFirstItem = useMemo(() => indexOfLastItem - itemsPerPage, [indexOfLastItem, itemsPerPage]);

  const currentItems = useMemo(
    () => filteredData.slice(indexOfFirstItem, indexOfLastItem),
    [filteredData, indexOfFirstItem, indexOfLastItem]
  );

  const handlePageChange = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
  }, []);

  const handleView = useCallback((item) => {
    setSelectedItem(item);
  }, []);

  const handleClosePopup = useCallback(() => {
    setSelectedItem(null);
  }, []);

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

  const handleEdit = useCallback((item) => {
    navigate(`/manage-order/edit-self-order/${item._id}`, { state: { orderData: item } });
  }, [navigate]);

  const rows = useMemo(
    () =>
      currentItems.map((item) => [
        item.saudaNo,
        item.poNumber,
        item.buyer,
        item.buyerCompany,
        item.consignee,
        item.commodity,
        item.quantity,
        `₹${item.rate}`,
        item.state,
        item.location,
        item.agentName,
        item.buyerEmails?.join(", ") || "N/A",
        item.sellerEmails?.join(", ") || "N/A",
        <div className="flex space-x-2" key={item._id}>
          <Actions
            onView={() => handleView(item)}
            onEdit={() => handleEdit(item)}
            onDelete={() => toast.error(`Deleting PO Number: ${item.poNumber}`)}
          />
          <DownloadSauda
            data={item}
            button={
              <button
                className="text-blue-500 hover:text-blue-700"
                title="Download Sauda PDF"
              >
                <FaDownload size={20} />
              </button>
            }
          />
        </div>,
      ]),
    [currentItems, handleView, handleEdit]
  );

  const handleSearch = useCallback((searchTerm) => {
    if (!searchTerm || searchTerm.trim() === "") {
      setFilteredData(data);
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      const filtered = data.filter((order) => 
        (order.buyer && order.buyer.toLowerCase().includes(lowerSearch)) ||
        (order.saudaNo && order.saudaNo.toLowerCase().includes(lowerSearch)) ||
        (order.poNumber && order.poNumber.toLowerCase().includes(lowerSearch))
      );
      setFilteredData(filtered);
    }
    setCurrentPage(1);
  }, [data]);

  return (
    <Suspense fallback={<Loading />}>
      <div className="p-4 max-w-screen-lg mx-auto space-y-6 bg-gray-50 rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold text-blue-500 text-center">
          Self Order List
        </h1>
        <div className="flex justify-center">
          <div
            className="flex items-center bg-white/90 border border-gray-200 rounded-2xl p-2 w-full max-w-md shadow-sm transition focus-within:ring-2 focus-within:ring-blue-300"
            role="search"
          >
            <span className="text-blue-600 mx-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
            <input
              type="text"
              placeholder="Search by Buyer, Sauda No, or PO Number..."
              className="w-full px-2 py-2 bg-transparent focus:outline-none text-gray-900 placeholder-gray-500"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        <Tables headers={headers} rows={rows} />
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
            title={`Sauda Details: ${selectedItem.saudaNo}`}
          >
            <OrderDetails item={selectedItem} />
          </PopupBox>
        )}
        <ToastContainer />
      </div>
    </Suspense>
  );
};

export default SelfOrderList;
