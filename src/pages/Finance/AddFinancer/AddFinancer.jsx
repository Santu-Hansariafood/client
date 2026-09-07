import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { FaCheckCircle, FaUniversity } from "react-icons/fa";
import { toast } from "react-toastify";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";
import { fetchAllPages } from "../../../utils/apiClient/fetchAllPages";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import Loading from "../../../common/Loading/Loading";
import DataDropdown from "../../../common/DataDropdown/DataDropdown";

const Tables = lazy(() => import("../../../common/Tables/Tables"));

const getFinancerKey = (buyerId, companyId) => `${buyerId}:${companyId}`;

const AddFinancer = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [buyerCompanies, setBuyerCompanies] = useState([]);
  const [selectedBuyerCompany, setSelectedBuyerCompany] = useState(null);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [pendingKey, setPendingKey] = useState("");

  const groupOptions = useMemo(
    () =>
      groups.map((group) => ({
        value: String(group._id),
        label: group.groupName,
      })),
    [groups],
  );

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

  const handleGroupChange = (group) => {
    setSelectedGroup(group);
    setSelectedBuyerCompany(null);
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
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update financer");
    } finally {
      setPendingKey("");
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

        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default AddFinancer;
