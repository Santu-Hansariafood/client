import { useEffect, useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";
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
        clearApiCache();
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
      clearApiCache();
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
        <span key={item._id} className="font-mono font-bold text-lux-emerald bg-lux-emerald/10 px-2 py-1 rounded">
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
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="lux-card flex flex-col justify-between gap-4 p-4 sm:p-6 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1 max-w-md">
            {/* Search can be added here if needed */}
          </div>
          <button
            onClick={() => navigate("/vendor-code/add")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-lux-emerald to-lux-deep px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-lux-emerald/20 transition-all hover:brightness-110 active:scale-95"
          >
            <FaPlus /> Create New
          </button>
        </div>

        <div className="lux-card w-full overflow-hidden">
          <Suspense fallback={<Loading />}>
            <Tables headers={headers} rows={rows} />
          </Suspense>
          
          <div className="border-t border-[#ece4d2] p-4 sm:p-6">
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
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lux-muted">Group</p>
                  <p className="font-semibold text-lux-ink">{selectedItem.group?.groupName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lux-muted">Buyer</p>
                  <p className="font-semibold text-lux-ink">{selectedItem.buyer?.companyName}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lux-muted">Seller</p>
                  <p className="font-semibold text-lux-ink">{selectedItem.seller?.sellerName}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#ece4d2]">
                <DataInput
                  label="Vendor Code"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  placeholder="Enter new vendor code"
                  required
                />
              </div>

              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl border border-[#e2d9c5] px-6 py-2 font-semibold text-lux-ink transition hover:bg-[#f5f0e4]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isSaving}
                  className="rounded-xl bg-gradient-to-r from-lux-emerald to-lux-deep px-6 py-2 font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-95 disabled:opacity-60"
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
