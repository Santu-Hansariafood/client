import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  lazy,
  Suspense,
} from "react";
import PropTypes from "prop-types";
import Loading from "../../common/Loading/Loading";
const DataDropdown = lazy(() =>
  import("../../common/DataDropdown/DataDropdown")
);
const DataInput = lazy(() => import("../../common/DataInput/DataInput"));
const DateSelector = lazy(() =>
  import("../../common/DateSelector/DateSelector")
);

const SupplierInformation = ({ handleChange, formData }) => {
  const [sellers, setSellers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await fetch(
          "http://88.222.215.234:5000/api/sellers"
        );
        const data = await response.json();
        setSellers(data);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      }
    };

    fetchSuppliers();
  }, []);

  const suppliers = useMemo(
    () =>
      sellers.map((seller) => ({
        value: seller._id,
        label: seller.sellerName,
      })),
    [sellers]
  );

  const companies = useMemo(() => {
    if (selectedSupplier) {
      const supplier = sellers.find(
        (seller) => seller._id === selectedSupplier
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
      handleChange(
        "sellerEmails",
        selected?.emails.map((email) => email.value) || []
      );

      if (selected) {
        const commoditiesBrokerage = selected.commodities.map((commodity) => ({
          name: commodity.name,
          brokerage: commodity.brokerage,
        }));
        console.log("Supplier Brokerage Details:", commoditiesBrokerage);
        handleChange("supplierBrokerageDetails", commoditiesBrokerage);
      }
    },
    [sellers, handleChange]
  );

  return (
    <Suspense fallback={<Loading />}>
      <label className="block mb-2 text-lg font-semibold text-gray-700">
        Supplier Information
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Select Supplier
          </label>
          <DataDropdown
            placeholder="Select Supplier"
            options={suppliers}
            onChange={(selectedOption) =>
              handleSupplierChange(selectedOption.value)
            }
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Supplier Company
          </label>
          <DataDropdown
            placeholder="Select Supplier Company"
            options={companies}
            onChange={(selectedOption) =>
              handleChange("supplierCompany", selectedOption.value)
            }
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">
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
          <label className="block text-sm text-gray-600 mb-1">
            Delivery Date
          </label>
          <DateSelector
            selectedDate={formData.deliveryDate}
            onChange={(date) => handleChange("deliveryDate", date)}
            defaultToToday={false}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">
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
  formData: PropTypes.shape({
    supplier: PropTypes.string,
    supplierCompany: PropTypes.string,
    paymentTerms: PropTypes.string,
    deliveryDate: PropTypes.instanceOf(Date),
    loadingDate: PropTypes.instanceOf(Date),
  }).isRequired,
};

export default SupplierInformation;
