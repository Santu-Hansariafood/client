import { useState, useEffect } from "react";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaTruckMoving, FaTrash, FaEdit, FaEye } from "react-icons/fa";
import Tables from "../../../common/Tables/Tables";
import SearchBox from "../../../common/SearchBox/SearchBox";
import Pagination from "../../../common/Paginations/Paginations";
import EditTransporterPopup from "../EditTransporterPopup/EditTransporterPopup";

const ListTransporter = () => {
  const [transporters, setTransporters] = useState([]);
  const [filteredTransporters, setFilteredTransporters] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [selectedTransporter, setSelectedTransporter] = useState(null);

  useEffect(() => {
    fetchTransporters();
  }, [currentPage]);

  const fetchTransporters = async () => {
    try {
      const response = await api.get(
        `/transporters?page=${currentPage}&limit=${itemsPerPage}`,
      );
      const { data, total } = response.data;
      setTransporters(data);
      setFilteredTransporters(data);
      setTotalItems(total);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to fetch transporters");
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this transporter?")) {
      try {
        await api.delete(`/transporters/${id}`);
        clearApiCache();
        toast.success("Transporter deleted");
        fetchTransporters();
      } catch (error) {
        toast.error("Failed to delete transporter");
      }
    }
  };

  const handleEdit = (transporter) => {
    setSelectedTransporter(transporter);
    setIsEditPopupOpen(true);
  };

  const handleUpdate = (updatedTransporter) => {
    setTransporters((prev) =>
      prev.map((t) =>
        t._id === updatedTransporter._id ? updatedTransporter : t,
      ),
    );
    setFilteredTransporters((prev) =>
      prev.map((t) =>
        t._id === updatedTransporter._id ? updatedTransporter : t,
      ),
    );
  };

  const handleSearch = (filteredNames) => {
    if (filteredNames.length === 0) {
      setFilteredTransporters(transporters);
    } else {
      const results = transporters.filter((t) =>
        filteredNames.includes(t.name),
      );
      setFilteredTransporters(results);
    }
  };

  const headers = [
    "Sl No",
    "Name",
    "Mobile",
    "Vehicle No",
    "Driver",
    "License",
    "Status",
    "Actions",
  ];
  const rows = filteredTransporters.map((t, index) => [
    (currentPage - 1) * itemsPerPage + index + 1,
    t.name,
    t.mobile,
    t.vehicleDetails?.number || "N/A",
    t.driverDetails?.name || "N/A",
    t.driverDetails?.licenseNumber || "N/A",
    <span
      key={t._id}
      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${t.status === "Active" ? "border border-emerald-200 bg-emerald-100 text-emerald-700" : "border border-[#e6dcc4] bg-[#f2eee2] text-lux-muted"}`}
    >
      {t.status}
    </span>,
    <div key={`actions-${t._id}`} className="flex gap-2">
      <button
        onClick={() => handleEdit(t)}
        className="rounded-lg p-2 text-lux-emerald transition-colors hover:bg-lux-emerald/10"
      >
        <FaEdit />
      </button>
      <button
        onClick={() => handleDelete(t._id)}
        className="rounded-lg p-2 text-rose-600 transition-colors hover:bg-rose-50"
      >
        <FaTrash />
      </button>
    </div>,
  ]);

  return (
    <AdminPageShell title="Transporter List" icon={FaTruckMoving}>
      <div className="rounded-2xl border border-[#ece4d2] bg-lux-cream p-4 sm:p-6">
        <div className="mb-6">
          <SearchBox
            items={transporters.map((t) => t.name)}
            onSearch={handleSearch}
            placeholder="Search by transporter name..."
          />
        </div>
        <Tables headers={headers} rows={rows} />

        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      <EditTransporterPopup
        transporter={selectedTransporter}
        isOpen={isEditPopupOpen}
        onClose={() => setIsEditPopupOpen(false)}
        onUpdate={handleUpdate}
      />
    </AdminPageShell>
  );
};

export default ListTransporter;
