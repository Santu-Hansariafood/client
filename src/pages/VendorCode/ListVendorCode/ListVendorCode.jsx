import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";
import { fetchAllPages } from "../../../utils/apiClient/fetchAllPages";
import { toast } from "react-toastify";
import { FaPlus, FaAddressCard } from "react-icons/fa";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Pagination = lazy(() => import("../../../common/Paginations/Paginations"));
const Actions = lazy(() => import("../../../common/Actions/Actions"));
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));
const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));

const getSellerLabel = (seller) =>
  seller?.companies?.[0] || seller?.sellerName || "N/A";

const ListVendorCode = () => {
  const navigate = useNavigate();
  const [vendorCodes, setVendorCodes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [editForm, setEditForm] = useState({
    group: null,
    buyer: null,
    seller: null,
    vendorCode: "",
  });
  const [fetchingBuyers, setFetchingBuyers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchVendorCodes = useCallback(async () => {
    try {
      const res = await api.get("/vendor-codes", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
        },
      });
      setVendorCodes(res.data.data);
      setTotalItems(res.data.total);
    } catch {
      toast.error("Failed to fetch vendor codes");
    }
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    fetchVendorCodes();
  }, [fetchVendorCodes]);

  useEffect(() => {
    const fetchEditOptions = async () => {
      try {
        const response = await api.get("/groups", { params: { limit: 0 } });
        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        setGroups(
          data.map((group) => ({
            value: group._id,
            label: group.groupName,
          })),
        );
      } catch {
        toast.error("Failed to load groups");
      }

      try {
        const data = await fetchAllPages("/sellers");
        setSellers(
          data.map((seller) => ({
            value: seller._id,
            label: getSellerLabel(seller),
          })),
        );
      } catch {
        toast.error("Failed to load seller companies");
      }
    };

    fetchEditOptions();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this vendor code?")) {
      try {
        await api.delete(`/vendor-codes/${id}`);
        clearApiCache();
        toast.success("Vendor code deleted successfully");
        fetchVendorCodes();
      } catch {
        toast.error("Failed to delete vendor code");
      }
    }
  };

  const fetchBuyers = async (groupId) => {
    setFetchingBuyers(true);
    try {
      const data = await fetchAllPages("/companies", {
        params: { groupId },
      });
      setBuyers(
        data.map((company) => ({
          value: company._id,
          label: company.companyName,
        })),
      );
    } catch {
      toast.error("Failed to load buyer companies");
    } finally {
      setFetchingBuyers(false);
    }
  };

  const handleViewClick = (item) => {
    setSelectedItem(item);
    setIsViewing(true);
  };

  const handleEditClick = (item) => {
    const group = item.group
      ? { value: item.group._id, label: item.group.groupName }
      : null;
    setSelectedItem(item);
    setEditForm({
      group,
      buyer: item.buyer
        ? { value: item.buyer._id, label: item.buyer.companyName }
        : null,
      seller: item.seller
        ? { value: item.seller._id, label: getSellerLabel(item.seller) }
        : null,
      vendorCode: item.vendorCode || "",
    });
    setBuyers([]);
    setIsEditing(true);
    if (group?.value) fetchBuyers(group.value);
  };

  const handleEditFieldChange = (field, value) => {
    setEditForm((previous) => ({
      ...previous,
      [field]: value,
      ...(field === "group" ? { buyer: null } : {}),
    }));

    if (field === "group") {
      setBuyers([]);
      if (value?.value) fetchBuyers(value.value);
    }
  };

  const handleUpdate = async () => {
    if (
      !editForm.group ||
      !editForm.buyer ||
      !editForm.seller ||
      !editForm.vendorCode.trim()
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSaving(true);
    try {
      await api.put(`/vendor-codes/${selectedItem._id}`, {
        group: editForm.group.value,
        buyer: editForm.buyer.value,
        seller: editForm.seller.value,
        vendorCode: editForm.vendorCode,
      });
      clearApiCache();
      toast.success("Vendor code updated successfully");
      setIsEditing(false);
      setSelectedItem(null);
      fetchVendorCodes();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update vendor code",
      );
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

  const rows = vendorCodes.map((item, index) => [
    (currentPage - 1) * itemsPerPage + index + 1,
    item.group?.groupName || "N/A",
    item.buyer?.companyName || "N/A",
    getSellerLabel(item.seller),
    <span key={item._id} className="font-mono font-bold text-lux-emerald bg-lux-emerald/10 px-2 py-1 rounded">
      {item.vendorCode}
    </span>,
    new Date(item.createdAt).toLocaleDateString("en-GB"),
    <Actions
      key={`actions-${item._id}`}
      onView={() => handleViewClick(item)}
      onEdit={() => handleEditClick(item)}
      onDelete={() => handleDelete(item._id)}
    />,
  ]);

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

      {isViewing && selectedItem && (
        <Suspense fallback={null}>
          <PopupBox
            isOpen={isViewing}
            onClose={() => setIsViewing(false)}
            title="Vendor Code Details"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                ["Group", selectedItem.group?.groupName],
                ["Buyer Company", selectedItem.buyer?.companyName],
                ["Seller Company", getSellerLabel(selectedItem.seller)],
                ["Vendor Code", selectedItem.vendorCode],
                [
                  "Created At",
                  selectedItem.createdAt
                    ? new Date(selectedItem.createdAt).toLocaleDateString("en-GB")
                    : "N/A",
                ],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-[#ece4d2] bg-lux-ivory p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lux-muted">
                    {label}
                  </p>
                  <p className="mt-1 break-words font-semibold text-lux-ink">
                    {value || "N/A"}
                  </p>
                </div>
              ))}
            </div>
          </PopupBox>
        </Suspense>
      )}

      {isEditing && selectedItem && (
        <Suspense fallback={null}>
          <PopupBox
            isOpen={isEditing}
            onClose={() => setIsEditing(false)}
            title="Edit Vendor Code"
          >
            <div className="space-y-5 p-2">
              <DataDropdown
                label="Group"
                options={groups}
                selectedOptions={editForm.group}
                onChange={(value) => handleEditFieldChange("group", value)}
                required
              />
              <DataDropdown
                label="Buyer Company"
                options={buyers}
                selectedOptions={editForm.buyer}
                onChange={(value) => handleEditFieldChange("buyer", value)}
                isDisabled={!editForm.group || fetchingBuyers}
                required
              />
              <DataDropdown
                label="Seller Company"
                options={sellers}
                selectedOptions={editForm.seller}
                onChange={(value) => handleEditFieldChange("seller", value)}
                required
              />
              <div className="border-t border-[#ece4d2] pt-4">
                <DataInput
                  label="Vendor Code"
                  value={editForm.vendorCode}
                  onChange={(e) =>
                    setEditForm((previous) => ({
                      ...previous,
                      vendorCode: e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, ""),
                    }))
                  }
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
                  disabled={
                    isSaving ||
                    fetchingBuyers ||
                    !editForm.group ||
                    !editForm.buyer ||
                    !editForm.seller ||
                    !editForm.vendorCode
                  }
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
