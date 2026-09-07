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
const Pagination = lazy(() => import("../../../common/Paginations/Paginations"));

const getFinancerKey = (sellerCompanyId) => String(sellerCompanyId);

const AddFinancer = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [sellerCompanies, setSellerCompanies] = useState([]);
  const [selectedSellerCompany, setSelectedSellerCompany] = useState(null);
  const [financers, setFinancers] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [pendingKey, setPendingKey] = useState("");
  const [removingId, setRemovingId] = useState("");
  const itemsPerPage = 10;

  const groupOptions = useMemo(
    () =>
      groups.map((group) => ({
        value: String(group._id),
        label: group.groupName,
      })),
    [groups],
  );

  const loadFinancers = useCallback(async () => {
    if (!selectedGroup?.value) {
      setFinancers([]);
      setTotal(0);
      return;
    }

    try {
      setLoadingList(true);
      const response = await api.get("/financers", {
        params: {
          groupId: selectedGroup.value,
          page,
          limit: itemsPerPage,
        },
      });
      setFinancers(response.data?.data || []);
      setTotal(Number(response.data?.total) || 0);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load financers");
    } finally {
      setLoadingList(false);
    }
  }, [page, selectedGroup]);

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
        setSellerCompanies([]);
        return;
      }
      try {
        setLoadingOptions(true);
        const response = await api.get("/financers/options", {
          params: { groupId: selectedGroup.value },
        });
        setSellerCompanies(response.data || []);
      } catch (error) {
        setSellerCompanies([]);
        toast.error(error.response?.data?.message || "Failed to load buyer companies");
      } finally {
        setLoadingOptions(false);
      }
    };
    loadOptions();
  }, [selectedGroup]);

  useEffect(() => {
    loadFinancers();
  }, [loadFinancers]);

  const handleGroupChange = (group) => {
    setSelectedGroup(group);
    setSelectedSellerCompany(null);
    setPage(1);
  };

  const sellerCompanyOptions = useMemo(
    () =>
      sellerCompanies.map((company) => ({
        value: String(company._id),
        label: company.companyName || "Unnamed seller company",
      })),
    [sellerCompanies],
  );

  const selectedSellerCompanyData = useMemo(
    () =>
      sellerCompanies.find(
        (company) => String(company._id) === String(selectedSellerCompany?.value),
      ) || null,
    [sellerCompanies, selectedSellerCompany],
  );

  const handleFinancerChange = async (company, checked) => {
    if (!selectedGroup?.value) return;
    const key = getFinancerKey(company._id);
    setPendingKey(key);
    try {
      if (checked) {
        const response = await api.post("/financers", {
          groupId: selectedGroup.value,
          sellerCompanyId: company._id,
        });
        setSellerCompanies((previous) =>
          previous.map((item) =>
            item._id === company._id
              ? { ...item, financerId: response.data?._id || null }
              : item,
          ),
        );
        toast.success("Financer added successfully");
      } else {
        const existing = financers.find(
          (item) => getFinancerKey(item.sellerCompanyId?._id) === key,
        );
        if (company.financerId) await api.delete(`/financers/${company.financerId}`);
        else if (existing?._id) await api.delete(`/financers/${existing._id}`);
        setSellerCompanies((previous) =>
          previous.map((item) =>
            item._id === company._id ? { ...item, financerId: null } : item,
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
      toast.success("Financer removed successfully");
      await loadFinancers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove financer");
    } finally {
      setRemovingId("");
    }
  };

  const selectionRows = selectedSellerCompanyData
    ? [[
        selectedSellerCompanyData.companyName || "-",
        selectedSellerCompanyData.email || "-",
        <label
          key={getFinancerKey(
            selectedSellerCompanyData._id,
          )}
          className="inline-flex items-center gap-2 font-semibold text-emerald-700"
        >
          <input
            type="checkbox"
            checked={Boolean(selectedSellerCompanyData.financerId)}
            disabled={
              pendingKey ===
              getFinancerKey(
                selectedSellerCompanyData._id,
              )
            }
            onChange={(event) =>
              handleFinancerChange(selectedSellerCompanyData, event.target.checked)
            }
            className="h-4 w-4 accent-emerald-600"
          />
          <span>
            {selectedSellerCompanyData.financerId
              ? "Added"
              : "Add Financer"}
          </span>
        </label>,
      ]]
    : [];

  const financerRows = financers.map((item, index) => [
    (page - 1) * itemsPerPage + index + 1,
    item.groupId?.groupName || selectedGroup?.label || "-",
    item.sellerCompanyId?.companyName || "-",
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
                  label="Select Seller Company"
                  options={sellerCompanyOptions}
                  selectedOptions={selectedSellerCompany}
                  onChange={setSelectedSellerCompany}
                  placeholder={loadingOptions ? "Loading seller companies..." : "Select a seller company"}
                  isDisabled={loadingOptions || sellerCompanyOptions.length === 0}
                  required
                />
              </div>
            )}
          </section>

          {selectedGroup && selectedSellerCompany && (
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
                    headers={["Seller Company", "Email", "Financer"]}
                    rows={selectionRows}
                  />
                </div>
              )}
            </section>
          )}

          <section className="rounded-2xl border border-emerald-200/60 bg-white p-4 sm:p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Added Financers</h2>
                <p className="text-sm text-slate-500">Saved buyer-company financer mappings</p>
              </div>
              <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                {total} Added
              </span>
            </div>
            {loadingList ? (
              <Loading />
            ) : (
              <Tables
                headers={["Sl No", "Group", "Seller Company", "Actions"]}
                rows={financerRows}
              />
            )}
            <Pagination
              currentPage={page}
              totalItems={total}
              itemsPerPage={itemsPerPage}
              onPageChange={setPage}
            />
          </section>
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default AddFinancer;
