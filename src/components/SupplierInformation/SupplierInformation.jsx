import { useEffect, useState, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import DataDropdown from "../../common/DataDropdown/DataDropdown";
import DataInput from "../../common/DataInput/DataInput";
import DateSelector from "../../common/DateSelector/DateSelector";

const SupplierInformation = ({ handleChange, formData }) => {
  const [sellers, setSellers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/sellers");
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
      console.log("Selected Supplier ID:", supplierId);
  
      handleChange("supplier", supplierId);
      console.log("Selected Supplier Commodities:", selected?.commodities || []);
      handleChange("supplierBrokerage", selected?.commodities || []);
      console.log("Selected Supplier Name:", selected?.sellerName || "");
      handleChange("supplierName", selected?.sellerName || "");
  
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
    <div>
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
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Loading Date
          </label>
          <DateSelector
            selectedDate={formData.loadingDate}
            onChange={(date) => handleChange("loadingDate", date)}
          />
        </div>
      </div>
    </div>
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
