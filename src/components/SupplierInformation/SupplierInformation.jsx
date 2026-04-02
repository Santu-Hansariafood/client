import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  lazy,
  Suspense,
} from "react";
import PropTypes from "prop-types";
import axios from "axios";
import Loading from "../../common/Loading/Loading";
const DataDropdown = lazy(
  () => import("../../common/DataDropdown/DataDropdown"),
);
const DataInput = lazy(() => import("../../common/DataInput/DataInput"));
const DateSelector = lazy(
  () => import("../../common/DateSelector/DateSelector"),
);

const SupplierInformation = ({ handleChange, formData, suppliers: initialSuppliers }) => {
  const [sellers, setSellers] = useState(initialSuppliers || []);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useEffect(() => {
    if (initialSuppliers) {
      setSellers(initialSuppliers);
    }
  }, [initialSuppliers]);

  useEffect(() => {
    if (sellers.length > 0 && formData.supplier && !selectedSupplier) {
      setSelectedSupplier(formData.supplier);
    }
  }, [sellers, formData.supplier, selectedSupplier]);

  const suppliers = useMemo(
    () =>
      sellers.map((seller) => ({
        value: seller._id,
        label: seller.sellerName,
      })),
    [sellers],
  );

  const companies = useMemo(() => {
    if (selectedSupplier) {
      const supplier = sellers.find(
        (seller) => seller._id === selectedSupplier,
      );
      return (
        supplier?.companies.map((company) => ({
          value: company,
          label: company,
        })) || []
      );
    }
    return [];
  }, [selectedSupplier, sellers]);

  const handleSupplierChange = useCallback(
    (supplierId) => {
      const selected = sellers.find((seller) => seller._id === supplierId);

      setSelectedSupplier(supplierId);
      handleChange("supplier", supplierId);
      handleChange("supplierBrokerage", selected?.commodities || []);
      handleChange("supplierName", selected?.sellerName || "");

      const rawEmails = selected?.emails || [];
      const sellerEmails = Array.isArray(rawEmails)
        ? rawEmails
            .map((e) =>
              typeof e === "string" ? e : (e?.value ?? e?.email ?? ""),
            )
            .filter(Boolean)
        : [];
      handleChange("sellerEmails", sellerEmails.length ? sellerEmails : [""]);

      const rawPhones = selected?.phoneNumbers || [];
      const sellerPhones = Array.isArray(rawPhones)
        ? rawPhones
            .map((p) =>
              typeof p === "string" ? p : (p?.value ?? p?.phone ?? ""),
            )
            .filter(Boolean)
        : [];
      const firstMobile = sellerPhones[0] || "";
      handleChange("sellerMobile", firstMobile);

      if (selected?.commodities?.length) {
        handleChange(
          "supplierBrokerageDetails",
          selected.commodities.map((c) => ({
            name: c.name,
            brokerage: c.brokerage,
          })),
        );
      }
    },
    [sellers, handleChange],
  );

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
            options={suppliers}
            selectedOptions={
              suppliers.find((s) => s.value === selectedSupplier) || null
            }
            onChange={(opt) => handleSupplierChange(opt?.value)}
            value={selectedSupplier}
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
              companies.find((c) => c.value === formData.supplierCompany) ||
              null
            }
            onChange={(opt) =>
              handleChange("supplierCompany", opt?.value || "")
            }
            value={formData.supplierCompany}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            Payment Terms (in days)
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
