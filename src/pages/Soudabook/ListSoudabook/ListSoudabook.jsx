import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaBook } from "react-icons/fa";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Pagination = lazy(() => import("../../../common/Paginations/Paginations"));

const ListSoudabook = () => {
  const navigate = useNavigate();
  const { userRole, user } = useAuth();
  const [saudaData, setSaudaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchSaudaData = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/self-order");
        let data = response.data?.data || response.data || [];

        if (userRole === "Buyer" && user?.companyId) {
          data = data.filter(item => String(item.companyId) === String(user.companyId));
        }

        setSaudaData(data.reverse());
      } catch (err) {
        setError("Failed to fetch Sauda book data.");
        toast.error("Could not load data.");
      } finally {
        setLoading(false);
      }
    };

    fetchSaudaData();
  }, [userRole, user]);

  const headers = [
    "Sauda No",
    "PO Number",
    "Buyer Company",
    "Commodity",
    "Quantity",
    "Rate",
    "Date",
  ];

  const currentData = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return saudaData.slice(indexOfFirstItem, indexOfLastItem);
  }, [saudaData, currentPage, itemsPerPage]);

  const rows = useMemo(
    () =>
      currentData.map((item) => [
        item.saudaNo,
        item.poNumber,
        item.buyerCompany,
        item.commodity,
        item.quantity,
        `₹${item.rate}`,
        new Date(item.createdAt).toLocaleDateString(),
      ]),
    [currentData]
  );

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Sauda Book"
        subtitle="Review your completed Saudas"
        icon={FaBook}
      >
        <div className="flex justify-start mb-4">
          <button 
            onClick={() => navigate(-1)} 
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
          >
            Back
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
              totalItems={saudaData.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </AdminPageShell>
    </Suspense>
  );
};

export default ListSoudabook;
