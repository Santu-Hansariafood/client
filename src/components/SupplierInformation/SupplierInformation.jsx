import { useEffect, useState, useMemo } from "react";
import DataDropdown from "../../common/DataDropdown/DataDropdown";
import DataInput from "../../common/DataInput/DataInput";
import DateSelector from "../../common/DateSelector/DateSelector";

const SupplierInformation = ({ handleChange, formData }) => {
  const [sellers, setSellers] = useState([]);

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

  const companies = useMemo(
    () =>
      sellers.flatMap((seller) =>
        seller.buyers.map((buyer) => ({
          value: buyer._id,
          label: buyer.name,
        }))
      ),
    [sellers]
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
            onChange={(value) => {
              // console.log("Supplier selected:", value);
              handleChange("supplier", value);
            }}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Supplier Company
          </label>
          <DataDropdown
            placeholder="Select Supplier Company"
            options={companies}
            onChange={(value) => {
              // console.log("Company selected:", value);
              handleChange("supplierCompany", value);
            }}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Payment Terms (in days)
          </label>
          <DataInput
            placeholder="Payment Terms"
            inputType="number"
            onChange={(e) => {
              // console.log("Payment terms input:", e.target.value);
              handleChange("paymentTerms", e.target.value);
            }}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Delivery Date
          </label>
          <DateSelector
            selectedDate={formData.deliveryDate}
            onChange={(date) => {
              // console.log("Delivery date selected:", date);
              handleChange("deliveryDate", date);
            }}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Loading Date
          </label>
          <DateSelector
            selectedDate={formData.loadingDate}
            onChange={(date) => {
              // console.log("Loading date selected:", date);
              handleChange("loadingDate", date);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SupplierInformation;
