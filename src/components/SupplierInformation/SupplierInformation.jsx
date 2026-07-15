import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  lazy,
  Suspense,
  useRef,
} from "react";
import PropTypes from "prop-types";
import Loading from "../../common/Loading/Loading";
const DataDropdown = lazy(
  () => import("../../common/DataDropdown/DataDropdown"),
);
const DataInput = lazy(() => import("../../common/DataInput/DataInput"));
const DateSelector = lazy(
  () => import("../../common/DateSelector/DateSelector"),
);

const SupplierInformation = ({
  handleChange,
  formData,
  supplierOptions,
  sellerOptions,
  sellerCompanies,
  allCommodities = [],
}) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState("");
  const isInitialMatchDone = useRef(false);

  const getBrokerageList = useCallback((sellerData) => {
    if (!sellerData || !Array.isArray(sellerData.commodities)) return [];

    return sellerData.commodities.map((c) => ({
      name: c.name,
      brokerage: c.brokerage,
    }));
  }, []);

  useEffect(() => {
    if (isInitialMatchDone.current || !sellerOptions.length) return;

    const supplierId = formData.supplier?._id || formData.supplier;
    if (supplierId) {
      setSelectedSupplierId(supplierId);
      const supplierCompany = formData.supplierCompany;
      if (supplierCompany) {
        setSelectedCompany(supplierCompany);
      }
      isInitialMatchDone.current = true;
    }
  }, [formData.supplier, formData.supplierCompany, sellerOptions]);

  const onSupplierChange = (option) => {
    const supplierId = option?.value || null;
    setSelectedSupplierId(supplierId);
    handleChange("supplier", supplierId);

    const selected = sellerOptions.find((s) => s.value === supplierId);
    if (selected) {
      handleChange("supplierBrokerage", getBrokerageList(selected));
      handleChange("supplierName", selected.label || "");

      const rawEmails = selected.emails || [];
      const sellerEmails = Array.isArray(rawEmails)
        ? rawEmails
            .map((e) =>
              typeof e === "string" ? e : (e?.value ?? e?.email ?? ""),
            )
            .filter(Boolean)
        : [];
      handleChange("sellerEmails", sellerEmails.length ? sellerEmails : [""]);

      const rawPhones = selected.phoneNumbers || [];
      const sellerPhones = Array.isArray(rawPhones)
        ? rawPhones
            .map((p) =>
              typeof p === "string" ? p : (p?.value ?? p?.phone ?? ""),
            )
            .filter(Boolean)
        : [];
      const firstMobile = sellerPhones[0] || "";
      handleChange("sellerMobile", firstMobile);

      if (selected.commodities?.length) {
        handleChange(
          "supplierBrokerageDetails",
          selected.commodities.map((c) => ({
            name: c.name,
            brokerage: c.brokerage,
          })),
        );
      }
    } else {
      handleChange("supplierBrokerage", []);
      handleChange("supplierName", "");
      handleChange("sellerEmails", [""]);
      handleChange("sellerMobile", "");
      handleChange("supplierBrokerageDetails", []);
    }

    handleChange("supplierCompany", "");
    setSelectedCompany("");
  };

  const onCompanyChange = (option) => {
    const companyName = option?.label || "";
    setSelectedCompany(companyName);
    handleChange("supplierCompany", companyName);

    const selected = sellerOptions.find((s) => s.value === selectedSupplierId);
    if (selected) {
      handleChange("supplierBrokerage", getBrokerageList(selected));
    }
  };

  const companies = useMemo(() => {
    if (selectedSupplierId) {
      const supplier = sellerOptions.find(
        (seller) => seller.value === selectedSupplierId,
      );
      if (supplier && Array.isArray(supplier.companies)) {
        return supplier.companies.map((company) => ({
          value: company,
          label: company,
        }));
      }
    }
    return [];
  }, [selectedSupplierId, sellerOptions]);

  return (
    <Suspense fallback={<Loading />}>
      <label className="block mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">
        Supplier Information
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            Select Supplier
          </label>
          <DataDropdown
            placeholder="Select Supplier"
            options={sellerOptions}
            selectedOptions={
              sellerOptions.find((s) => s.value === selectedSupplierId) || null
            }
            onChange={onSupplierChange}
            value={selectedSupplierId}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            Supplier Company
          </label>
          <DataDropdown
            placeholder="Select Supplier Company"
            options={companies}
            selectedOptions={
              companies.find((c) => c.value === selectedCompany) || null
            }
            onChange={onCompanyChange}
            value={selectedCompany}
            disabled={!selectedSupplierId}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            Payment Terms (in Days)
          </label>
          <DataInput
            placeholder="Payment Terms"
            inputType="text"
            value={formData.paymentTerms || ""}
            onChange={(e) => handleChange("paymentTerms", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            Delivery Date
          </label>
          <DateSelector
            selectedDate={formData.deliveryDate}
            onChange={(date) => handleChange("deliveryDate", date)}
            defaultToToday={false}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            Loading Date
          </label>
          <DateSelector
            selectedDate={formData.loadingDate}
            onChange={(date) => handleChange("loadingDate", date)}
            defaultToToday={false}
          />
        </div>
      </div>
    </Suspense>
  );
};

SupplierInformation.propTypes = {
  handleChange: PropTypes.func.isRequired,
  formData: PropTypes.object.isRequired,
  suppliers: PropTypes.array,
};

export default SupplierInformation;
