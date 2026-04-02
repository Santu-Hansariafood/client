import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaBook } from "react-icons/fa";
import generateExcel from "../../../common/GenerateExcel/GenerateExcel";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Pagination = lazy(
  () => import("../../../common/Paginations/Paginations"),
);

const ListSoudabook = () => {
  const navigate = useNavigate();
  const { userRole, user } = useAuth();
  const [saudaData, setSaudaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    const fetchSaudaData = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/self-order");
        let data = response.data?.data || response.data || [];

        if (userRole === "Buyer") {
          const buyerCompanyId = user?.companyId;
          const buyerCompanyName = user?.companyName;

          data = data.filter((item) => {
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

        setSaudaData(data);
      } catch (err) {
        setError("Failed to fetch Sauda book data.");
        toast.error("Could not load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchSaudaData();
  }, [userRole, user]);

  const sortedSaudaData = useMemo(() => {
    const copy = Array.isArray(saudaData) ? [...saudaData] : [];
    copy.sort((a, b) => {
      const as = Number(a?.saudaNo) || 0;
      const bs = Number(b?.saudaNo) || 0;
      if (as !== bs) return as - bs;
      const ad = new Date(a?.createdAt || 0).getTime();
      const bd = new Date(b?.createdAt || 0).getTime();
      return ad - bd;
    });
    return copy;
  }, [saudaData]);

  const headers = [
    "Date",
    "Sauda No",
    "PO Number",
    "Buyer",
    "Buyer Company",
    "Supplier Company",
    "Seller Name",
    "Consignee",
    "Commodity",
    "Quantity",
    "Rate",
    "Delivery Date",
    "Payment Time",
  ];

  const currentData = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return sortedSaudaData.slice(indexOfFirstItem, indexOfLastItem);
  }, [sortedSaudaData, currentPage, itemsPerPage]);

  const rows = useMemo(
    () =>
      currentData.map((item) => [
        item.poDate
          ? new Date(item.poDate).toLocaleDateString()
          : new Date(item.createdAt).toLocaleDateString(),
        item.saudaNo,
        item.poNumber || "",
        item.buyer || "",
        item.buyerCompany || "",
        item.supplierCompany || "",
        item.supplier?.sellerName || "",
        item.consignee || "",
        item.commodity || "",
        item.quantity ?? "",
        item.rate ?? "",
        item.deliveryDate
          ? new Date(item.deliveryDate).toLocaleDateString()
          : "",
        item.paymentTerms || "",
      ]),
    [currentData],
  );

  const exportExcel = () => {
    const data = sortedSaudaData.map((item) => ({
      Date: item.poDate
        ? new Date(item.poDate).toLocaleDateString()
        : new Date(item.createdAt).toLocaleDateString(),
      "Sauda No": item.saudaNo || "",
      "PO Number": item.poNumber || "",
      Buyer: item.buyer || "",
      "Buyer Company": item.buyerCompany || "",
      "Supplier Company": item.supplierCompany || "",
      "Seller Name": item.supplier?.sellerName || "",
      Consignee: item.consignee || "",
      Commodity: item.commodity || "",
      Quantity: item.quantity ?? "",
      Rate: item.rate ?? "",
      Tax: "",
      CD: item.cd || "",
      "Delivery Date": item.deliveryDate
        ? new Date(item.deliveryDate).toLocaleDateString()
        : "",
      "Payment Time": item.paymentTerms || "",
    }));
    generateExcel(data, "Sauda_List.xlsx");
  };

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Sauda Book"
        subtitle="Review your completed Saudas"
        icon={FaBook}
      >
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
          >
            Back
          </button>
          <button
            onClick={exportExcel}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
            title="Export to Excel"
          >
            Export Excel
          </button>
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="text-red-500 text-center p-4">{error}</div>
        ) : (
          <>
            <Tables headers={headers} rows={rows} />
            <Pagination
              currentPage={currentPage}
              totalItems={sortedSaudaData.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setItemsPerPage(size);
                setCurrentPage(1);
              }}
            />
          </>
        )}
      </AdminPageShell>
    </Suspense>
  );
};

export default ListSoudabook;
