import { useCallback, useEffect, useMemo, useState, lazy, Suspense } from "react";
import { FaCheckCircle, FaTrash, FaUniversity } from "react-icons/fa";
import { toast } from "react-toastify";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";
import { fetchAllPages } from "../../../utils/apiClient/fetchAllPages";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import Loading from "../../../common/Loading/Loading";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";
import Buttons from "../../../common/Buttons/Buttons";

const Tables = lazy(() => import("../../../common/Tables/Tables"));

const getFinancerKey = (buyerId, companyId) => `${buyerId}:${companyId}`;
const getSellerFinancerKey = (sellerId, sellerCompany) => `${sellerId}:${sellerCompany}`;

const AddFinancer = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [buyerCompanies, setBuyerCompanies] = useState([]);
  const [selectedBuyerCompany, setSelectedBuyerCompany] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [sellerCompanies, setSellerCompanies] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [selectedSellerCompany, setSelectedSellerCompany] = useState(null);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [financers, setFinancers] = useState([]);
  const [loadingFinancers, setLoadingFinancers] = useState(true);
  const [removingId, setRemovingId] = useState("");
  const [pendingKey, setPendingKey] = useState("");

  const groupOptions = useMemo(
    () =>
      groups.map((group) => ({
        value: String(group._id),
        label: group.groupName,
      })),
    [groups],
  );

  const loadFinancers = useCallback(async () => {
    try {
      setLoadingFinancers(true);
      const response = await api.get("/financers", { params: { page: 1, limit: 100 } });
      setFinancers(response.data?.data || []);
    } catch (error) {
      setFinancers([]);
      toast.error(error.response?.data?.message || "Failed to load financers");
    } finally {
      setLoadingFinancers(false);
    }
  }, []);

  useEffect(() => {
    loadFinancers();
  }, [loadFinancers]);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoadingGroups(true);
        const data = await fetchAllPages("/groups");
        setGroups(data);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load groups");
      } finally {
        setLoadingGroups(false);
      }
    };
    loadGroups();
  }, []);

  useEffect(() => {
    const loadOptions = async () => {
      if (!selectedGroup?.value) {
        setBuyerCompanies([]);
        return;
      }
      try {
        setLoadingOptions(true);
        const response = await api.get("/financers/options", {
          params: { groupId: selectedGroup.value },
        });
        setBuyerCompanies(response.data || []);
      } catch (error) {
        setBuyerCompanies([]);
        toast.error(error.response?.data?.message || "Failed to load buyer companies");
      } finally {
        setLoadingOptions(false);
      }
    };
    loadOptions();
  }, [selectedGroup]);

  useEffect(() => {
    const loadSellerOptions = async () => {
      try {
        const response = await api.get("/financers/seller-options");
        setSellers(response.data?.sellers || []);
        setSellerCompanies(response.data?.sellerCompanies || []);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load sellers");
      }
    };
    loadSellerOptions();
  }, []);

  const handleGroupChange = (group) => {
    setSelectedGroup(group);
    setSelectedBuyerCompany(null);
  };

  const sellerCompanyOptions = useMemo(
    () => sellerCompanies.map((company) => ({ value: company, label: company })),
    [sellerCompanies],
  );

  const handleSellerFinancerChange = async (checked) => {
    if (!selectedGroup?.value || !selectedSeller?.value || !selectedSellerCompany?.value) return;
    const key = getSellerFinancerKey(selectedSeller.value, selectedSellerCompany.value);
    setPendingKey(key);
    try {
      const existing = financers.find(
        (item) =>
          item.financerType === "Seller" &&
          String(item.sellerId?._id || item.sellerId) === String(selectedSeller.value) &&
          item.sellerCompany === selectedSellerCompany.value,
      );
      if (checked) {
        await api.post("/financers", {
          groupId: selectedGroup.value,
          financerType: "Seller",
          sellerId: selectedSeller.value,
          sellerCompany: selectedSellerCompany.value,
        });
        toast.success("Seller financer added successfully");
      } else if (existing?._id) {
        await api.delete(`/financers/${existing._id}`);
        toast.success("Seller financer removed successfully");
      }
      clearApiCache();
      await loadFinancers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update seller financer");
    } finally {
      setPendingKey("");
    }
  };

  const buyerCompanyOptions = useMemo(
    () =>
      buyerCompanies.map((item) => ({
        value: `${item.buyerId}:${item.companyId}`,
        label: `${item.buyerName || "Unnamed buyer"} - ${item.companyName || "Unnamed company"}`,
        buyerId: item.buyerId,
        companyId: item.companyId,
      })),
    [buyerCompanies],
  );

  const selectedBuyerCompanyData = useMemo(
    () =>
      buyerCompanies.find(
        (item) =>
          `${item.buyerId}:${item.companyId}` ===
          String(selectedBuyerCompany?.value),
      ) || null,
    [buyerCompanies, selectedBuyerCompany],
  );

  const handleFinancerChange = async (item, checked) => {
    if (!selectedGroup?.value) return;
    const key = getFinancerKey(item.buyerId, item.companyId);
    setPendingKey(key);
    try {
      if (checked) {
        const response = await api.post("/financers", {
          groupId: selectedGroup.value,
          buyerId: item.buyerId,
          companyId: item.companyId,
        });
        setBuyerCompanies((previous) =>
          previous.map((item) =>
            getFinancerKey(item.buyerId, item.companyId) === key
              ? { ...item, financerId: response.data?._id || null }
              : item,
          ),
        );
        toast.success("Financer added successfully");
      } else {
        if (item.financerId) await api.delete(`/financers/${item.financerId}`);
        setBuyerCompanies((previous) =>
          previous.map((item) =>
            getFinancerKey(item.buyerId, item.companyId) === key
              ? { ...item, financerId: null }
              : item,
          ),
        );
        toast.success("Financer removed successfully");
      }
      clearApiCache();
      await loadFinancers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update financer");
    } finally {
      setPendingKey("");
    }
  };

  const handleRemove = async (item) => {
    try {
      setRemovingId(item._id);
      await api.delete(`/financers/${item._id}`);
      clearApiCache();
      await loadFinancers();
      toast.success("Financer removed successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove financer");
    } finally {
      setRemovingId("");
    }
  };

  const selectionRows = selectedBuyerCompanyData
    ? [[
        selectedBuyerCompanyData.buyerName || "-",
        selectedBuyerCompanyData.companyName || "-",
        <label
          key={getFinancerKey(
            selectedBuyerCompanyData.buyerId,
            selectedBuyerCompanyData.companyId,
          )}
          className="inline-flex items-center gap-2 font-semibold text-emerald-700"
        >
          <input
            type="checkbox"
            checked={Boolean(selectedBuyerCompanyData.financerId)}
            disabled={
              pendingKey ===
              getFinancerKey(
                selectedBuyerCompanyData.buyerId,
                selectedBuyerCompanyData.companyId,
              )
            }
            onChange={(event) =>
              handleFinancerChange(selectedBuyerCompanyData, event.target.checked)
            }
            className="h-4 w-4 accent-emerald-600"
          />
          <span>
            {selectedBuyerCompanyData.financerId
              ? "Added"
              : "Add Financer"}
          </span>
        </label>,
      ]]
    : [];

  const financerRows = financers.map((item, index) => [
    index + 1,
    item.groupId?.groupName || "-",
    item.financerType === "Seller" ? item.sellerId?.sellerName || "-" : item.buyerId?.name || "-",
    item.financerType === "Seller" ? item.sellerCompany || "-" : item.companyId?.companyName || "-",
    <Buttons
      key={item._id}
      label={removingId === item._id ? "Removing..." : "Remove"}
      onClick={() => handleRemove(item)}
      disabled={removingId === item._id}
      variant="danger"
      size="sm"
      icon={<FaTrash />}
    />,
  ]);

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Add Financer"
        subtitle="Assign buyer companies from a group to the financer list"
        icon={FaUniversity}
        noContentCard
      >
        <div className="space-y-6">
          <section className="rounded-2xl border border-emerald-200/60 bg-white p-4 sm:p-6 shadow-lg">
            <div className="max-w-xl">
              <DataDropdown
                label="Select Group"
                options={groupOptions}
                selectedOptions={selectedGroup}
                onChange={handleGroupChange}
                placeholder={loadingGroups ? "Loading groups..." : "Select a buyer group"}
                isDisabled={loadingGroups}
                required
              />
            </div>

            {selectedGroup && (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <span className="font-bold text-slate-800">Selected group:</span>{" "}
                  {selectedGroup.label}
                </div>
                <DataDropdown
                  label="Select Buyer Company"
                  options={buyerCompanyOptions}
                  selectedOptions={selectedBuyerCompany}
                  onChange={setSelectedBuyerCompany}
                  placeholder={loadingOptions ? "Loading buyer companies..." : "Select a buyer company"}
                  isDisabled={loadingOptions || buyerCompanyOptions.length === 0}
                  required
                />
              </div>
            )}
          </section>

          {selectedGroup && (
            <section className="rounded-2xl border border-emerald-200/60 bg-white p-4 sm:p-6 shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <FaCheckCircle className="text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-800">Add Financer Seller</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DataDropdown
                  label="Select Seller"
                  options={sellers}
                  selectedOptions={selectedSeller}
                  onChange={(seller) => {
                    setSelectedSeller(seller);
                    setSelectedSellerCompany(null);
                  }}
                  placeholder="Select a seller"
                  isClearable
                />
                <DataDropdown
                  label="Select Seller Company"
                  options={sellerCompanyOptions}
                  selectedOptions={selectedSellerCompany}
                  onChange={setSelectedSellerCompany}
                  placeholder="Select a seller company"
                  isDisabled={!selectedSeller || sellerCompanyOptions.length === 0}
                  isClearable
                />
              </div>
              {selectedSeller && selectedSellerCompany && (
                <div className="mt-2 overflow-x-auto">
                  <Tables
                    headers={["Seller", "Seller Company", "Financer"]}
                    rows={[[
                      selectedSeller.label || "-",
                      selectedSellerCompany.label || "-",
                      <label key={getSellerFinancerKey(selectedSeller.value, selectedSellerCompany.value)} className="inline-flex items-center gap-2 font-semibold text-emerald-700">
                        <input
                          type="checkbox"
                          checked={financers.some(
                            (item) =>
                              item.financerType === "Seller" &&
                              String(item.sellerId?._id || item.sellerId) === String(selectedSeller.value) &&
                              item.sellerCompany === selectedSellerCompany.value,
                          )}
                          disabled={pendingKey === getSellerFinancerKey(selectedSeller.value, selectedSellerCompany.value)}
                          onChange={(event) => handleSellerFinancerChange(event.target.checked)}
                          className="h-4 w-4 accent-emerald-600"
                        />
                        <span> {financers.some((item) => item.financerType === "Seller" && String(item.sellerId?._id || item.sellerId) === String(selectedSeller.value) && item.sellerCompany === selectedSellerCompany.value) ? "Added" : "Add Financer"}</span>
                      </label>,
                    ]]}
                  />
                </div>
              )}
            </section>
          )}

          {selectedGroup && selectedBuyerCompany && (
            <section className="rounded-2xl border border-emerald-200/60 bg-white p-4 sm:p-6 shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <FaCheckCircle className="text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-800">Buyer Companies</h2>
              </div>
              {loadingOptions ? (
                <Loading />
              ) : (
                <div className="overflow-x-auto">
                  <Tables
                    headers={["Buyer", "Buyer Company", "Financer"]}
                    rows={selectionRows}
                  />
                </div>
              )}
            </section>
          )}

          <section className="rounded-2xl border border-emerald-200/60 bg-white p-4 shadow-lg sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Added Financers(Buyer Companies)</h2>
                <p className="text-sm text-slate-500">All saved financer mappings</p>
              </div>
              <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                {financers.length} Added
              </span>
            </div>
            {loadingFinancers ? (
              <Loading />
            ) : (
              <div className="overflow-x-auto">
                <Tables
                  headers={["Sl No", "Group", "Buyer", "Buyer Company", "Actions"]}
                  rows={financerRows}
                />
              </div>
            )}
          </section>

        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default AddFinancer;
