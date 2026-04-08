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

const SupplierInformation = ({
  handleChange,
  formData,
  supplierOptions,
  sellerOptions,
  sellerCompanies,
}) => {
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useEffect(() => {
    if (formData.supplier) {
      const supplierId =
        typeof formData.supplier === "object"
          ? formData.supplier._id
          : formData.supplier;
      if (supplierId !== selectedSupplier) {
        setSelectedSupplier(supplierId);
      }
    }
  }, [formData.supplier, selectedSupplier]);

  const companies = useMemo(() => {
    if (selectedSupplier) {
      const supplier = sellerOptions.find(
        (seller) => seller.value === selectedSupplier,
      );
      if (supplier && Array.isArray(supplier.companies)) {
        return supplier.companies.map((company) => ({
          value: company,
          label: company,
        }));
      }
    }
    return [];
  }, [selectedSupplier, sellerOptions]);

  const handleSupplierChange = useCallback(
    (supplierId) => {
      const selected = sellerOptions.find(
        (seller) => seller.value === supplierId,
      );

      setSelectedSupplier(supplierId);
      handleChange("supplier", supplierId);
      handleChange("supplierBrokerage", selected?.commodities || []);
      handleChange("supplierName", selected?.label || "");

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
    [sellerOptions, handleChange],
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
            options={sellerOptions}
            selectedOptions={
              sellerOptions.find((s) => s.value === selectedSupplier) || null
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
