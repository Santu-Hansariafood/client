import { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Tables from "../../../common/Tables/Tables";
import Pagination from "../../../common/Paginations/Paginations";
import Actions from "../../../common/Actions/Actions";
import PopupBox from "../../../common/PopupBox/PopupBox";
import OrderDetails from "./OrderDetails/OrderDetails";
import DownloadSauda from "../../../components/DownloadSauda/DownloadSauda";
import { FaDownload } from "react-icons/fa";

const SelfOrderList = () => {
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedItem, setSelectedItem] = useState(null);

  const API_URL = "https://api.hansariafood.shop/api/self-order";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(API_URL);
        setData(response.data.reverse());
      } catch (error) {
        toast.error("Failed to fetch data from the server.", error);
      }
    };

    fetchData();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleView = (item) => {
    setSelectedItem(item);
  };

  const handleClosePopup = () => {
    setSelectedItem(null);
  };

  const headers = [
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
  ];

  const rows = currentItems.map((item) => [
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
    <div className="flex space-x-2">
      <Actions
        key={item._id}
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
  ]);

  return (
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
  );
};

export default SelfOrderList;
