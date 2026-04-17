import { useEffect, useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import { FaPlus, FaEdit, FaAddressCard, FaTrash, FaRegEye } from "react-icons/fa";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Pagination = lazy(() => import("../../../common/Paginations/Paginations"));
const Actions = lazy(() => import("../../../common/Actions/Actions"));
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));
const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));

const ListVendorCode = () => {
  const navigate = useNavigate();
  const [vendorCodes, setVendorCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchVendorCodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/vendor-codes", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
        },
      });
      setVendorCodes(res.data.data);
      setTotalItems(res.data.total);
    } catch (error) {
      toast.error("Failed to fetch vendor codes");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    fetchVendorCodes();
  }, [fetchVendorCodes]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this vendor code?")) {
      try {
        await api.delete(`/vendor-codes/${id}`);
        toast.success("Vendor code deleted successfully");
        fetchVendorCodes();
      } catch (error) {
        toast.error("Failed to delete vendor code");
      }
    }
  };

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setEditValue(item.vendorCode);
    setIsEditing(true);
  };

  const handleUpdate = async () => {
    if (!editValue.trim()) {
      toast.error("Vendor code cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      await api.put(`/vendor-codes/${selectedItem._id}`, {
        vendorCode: editValue.toUpperCase(),
      });
      toast.success("Vendor code updated successfully");
      setIsEditing(false);
      setSelectedItem(null);
      fetchVendorCodes();
    } catch (error) {
      toast.error("Failed to update vendor code");
    } finally {
      setIsSaving(false);
    }
  };

  const headers = [
    "Sl No",
    "Group",
    "Buyer Company",
    "Seller Company",
    "Vendor Code",
    "Created At",
    "Actions",
  ];

  const rows = useMemo(
    () =>
      vendorCodes.map((item, index) => [
        (currentPage - 1) * itemsPerPage + index + 1,
        item.group?.groupName || "N/A",
        item.buyer?.companyName || "N/A",
        item.seller?.sellerName || "N/A",
        <span key={item._id} className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
          {item.vendorCode}
        </span>,
        new Date(item.createdAt).toLocaleDateString("en-GB"),
        <Actions
          key={`actions-${item._id}`}
          onEdit={() => handleEditClick(item)}
          onDelete={() => handleDelete(item._id)}
        />,
      ]),
    [vendorCodes, currentPage, itemsPerPage]
  );

  return (
    <AdminPageShell
      title="Vendor Codes"
      subtitle="Manage unique vendor codes for buyer-seller combinations"
      icon={FaAddressCard}
      noContentCard
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex-1 max-w-md">
            {/* Search can be added here if needed */}
          </div>
          <button
            onClick={() => navigate("/vendor-code/add")}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all"
          >
            <FaPlus /> Create New
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <Suspense fallback={<Loading />}>
            <Tables headers={headers} rows={rows} />
          </Suspense>
          
          <div className="p-6 border-t border-slate-50">
            <Suspense fallback={null}>
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </Suspense>
          </div>
        </div>
      </div>

      {isEditing && (
        <Suspense fallback={null}>
          <PopupBox
            isOpen={isEditing}
            onClose={() => setIsEditing(false)}
            title="Edit Vendor Code"
          >
            <div className="space-y-6 p-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400 uppercase text-xs font-bold tracking-wider">Group</p>
                  <p className="font-semibold text-slate-700">{selectedItem.group?.groupName}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase text-xs font-bold tracking-wider">Buyer</p>
                  <p className="font-semibold text-slate-700">{selectedItem.buyer?.companyName}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400 uppercase text-xs font-bold tracking-wider">Seller</p>
                  <p className="font-semibold text-slate-700">{selectedItem.seller?.sellerName}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <DataInput
                  label="Vendor Code"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  placeholder="Enter new vendor code"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isSaving}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:bg-emerald-700 active:scale-95 disabled:bg-slate-300"
                >
                  {isSaving ? "Saving..." : "Update Code"}
                </button>
              </div>
            </div>
          </PopupBox>
        </Suspense>
      )}
    </AdminPageShell>
  );
};

export default ListVendorCode;
