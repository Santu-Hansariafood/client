import {
  lazy,
  Suspense,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import axios from "axios";
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

const API_URL = "https://api.hansariafood.shop/api/self-order";

const SelfOrderList = () => {
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; // Prevent memory leaks

    const fetchData = async () => {
      try {
        const response = await axios.get(API_URL);
        if (isMounted) {
          setData(response.data.reverse());
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          toast.error("Failed to fetch data from the server.");
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const currentItems = useMemo(
    () => data.slice(indexOfFirstItem, indexOfLastItem),
    [data, currentPage, itemsPerPage]
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
      "Action",
    ],
    []
  );

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
        <div className="flex space-x-2" key={item._id}>
          <Actions
            onView={() => handleView(item)}
            onEdit={() => toast.success(`Editing PO Number: ${item.poNumber}`)}
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
    [currentItems, handleView]
  );

  if (loading) return <Loading />;

  return (
    <Suspense fallback={<Loading />}>
      <div className="p-4 max-w-screen-lg mx-auto space-y-6 bg-gray-50 rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold text-blue-500 text-center">
          Self Order List
        </h1>
        <Tables headers={headers} rows={rows} />
        <Pagination
          currentPage={currentPage}
          totalItems={data.length}
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
