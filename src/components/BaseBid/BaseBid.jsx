import { useState, useEffect, lazy, Suspense } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { ToastContainer } from "react-toastify";
import Loading from "../../common/Loading/Loading";
const DataInput = lazy(() => import("../../common/DataInput/DataInput"));
const DataDropdown = lazy(() =>
  import("../../common/DataDropdown/DataDropdown")
);
const DateSelector = lazy(() =>
  import("../../common/DateSelector/DateSelector")
);
const Buttons = lazy(() => import("../../common/Buttons/Buttons"));

const BaseBid = ({ type }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [company, setCompany] = useState(null);
  const [origin, setOrigin] = useState(null);
  const [commodity, setCommodity] = useState(null);
  const [parameters, setParameters] = useState([]);
  const [parameterValues, setParameterValues] = useState({});
  const [quantity, setQuantity] = useState("");
  // const [unit, setUnit] = useState("");
  const [rate, setRate] = useState("");
  const [bidDate, setBidDate] = useState(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [delivery, setDelivery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [originOptions, setOriginOptions] = useState([]);
  const [commodityOptions, setCommodityOptions] = useState([]);

  const apiBaseUrl = "http://localhost:5000/api";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const endpoints = [
          `${apiBaseUrl}/bid-locations`,
          `${apiBaseUrl}/commodities`,
          `${apiBaseUrl}${type === "buyer" ? "/buyers" : "/sellers"}`,
        ];

        const [originsRes, commoditiesRes, dropdownRes] = await Promise.all(
          endpoints.map((endpoint) => axios.get(endpoint))
        );

        setOriginOptions(
          originsRes.data.map((item) => ({ value: item._id, label: item.name }))
        );
        setCommodityOptions(
          commoditiesRes.data.map((item) => ({
            value: item._id,
            label: item.name,
          }))
        );
        setDropdownOptions(
          dropdownRes.data.map((item) => ({
            value: item._id,
            label: type === "buyer" ? item.name : item.sellerName,
          }))
        );
      } catch (error) {
        toast.error("Failed to fetch data. Please try again later.", error);
      }
    };

    fetchData();
  }, [type]);

  useEffect(() => {
    const fetchCompanyOptions = async () => {
      if (!selectedOption) {
        setCompanyOptions([]);
        return;
      }

      try {
        const endpoint = type === "buyer" ? "/buyers" : "/sellers";
        const response = await axios.get(
          `${apiBaseUrl}${endpoint}/${selectedOption.value}`
        );
        const options = (
          type === "buyer"
            ? response.data.consignee
            : response.data.selectedCompany || []
        ).map((company) => ({
          value: company.value || company.name,
          label: company.label || company.name,
        }));

        setCompanyOptions(options);
      } catch (error) {
        toast.error("Failed to fetch company/consignee options.", error);
      }
    };

    fetchCompanyOptions();
  }, [selectedOption, type]);

  useEffect(() => {
    const currentTime = new Date();
    const formattedTime = currentTime.toTimeString().slice(0, 5);
    setStartTime(formattedTime);
  }, []);

  const handleCommodityChange = async (selectedCommodity) => {
    setCommodity(selectedCommodity);
    if (!selectedCommodity) {
      setParameters([]);
      return;
    }

    try {
      const response = await axios.get(
        `${apiBaseUrl}/commodities/${selectedCommodity.value}`
      );
      setParameters(response.data.parameters || []);
    } catch (error) {
      toast.error("Failed to fetch commodity parameters.", error);
    }
  };

  const handleParameterChange = (parameterId, value) => {
    setParameterValues((prev) => ({
      ...prev,
      [parameterId]: value,
    }));
  };

  const handleSubmit = async () => {
    const bidData = {
      type,
      selectedOption: selectedOption?.value,
      company: company?.value,
      origin: origin?.value,
      commodity: commodity?.value,
      parameters: parameterValues,
      quantity: parseFloat(quantity),
      // unit,
      rate: parseFloat(rate),
      bidDate,
      startTime,
      endTime,
      paymentTerms,
      delivery,
    };

    setIsSubmitting(true);
    try {
      await axios.post(`${apiBaseUrl}/bids`, bidData);
      toast.success("Bid submitted successfully!");
      setSelectedOption(null);
      setCompany(null);
      setOrigin(null);
      setCommodity(null);
      setQuantity("");
      // setUnit("");
      setRate("");
      setBidDate(null);
      setStartTime("");
      setEndTime("");
      setPaymentTerms("");
      setDelivery("");
      setParameters([]);
      setParameterValues({});
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to submit bid. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const dropdownLabel = type === "buyer" ? "Select Buyer" : "Select Supplier";

  return (
    <Suspense fallback={<Loading />}>
      <div className="max-w-4xl mx-auto p-4 border rounded-md shadow-md bg-white">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          {type === "buyer" ? "Buyer Bid" : "Seller Bid"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {dropdownLabel}
            </label>
            <DataDropdown
              options={dropdownOptions}
              selectedOptions={selectedOption}
              onChange={(option) => setSelectedOption(option)}
              placeholder={dropdownLabel}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Select Consignee
            </label>
            <DataDropdown
              options={companyOptions}
              selectedOptions={company}
              onChange={(option) => setCompany(option)}
              placeholder="Select Consignee"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Select Origin
            </label>
            <DataDropdown
              options={originOptions}
              selectedOptions={origin}
              onChange={(option) => setOrigin(option)}
              placeholder="Select Origin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Select Commodity
            </label>
            <DataDropdown
              options={commodityOptions}
              selectedOptions={commodity}
              onChange={handleCommodityChange}
              placeholder="Select Commodity"
            />
          </div>
          {parameters.length > 0 && (
            <div className="bg-gray-100 p-4 rounded-md shadow-md mt-6">
              <h3 className="text-lg font-semibold mb-4 text-center">
                Quality Parameters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parameters.map((param) => (
                  <div key={param._id} className="flex flex-col">
                    <label className="block text-sm font-medium mb-1">
                      {param.parameter} %
                    </label>
                    <DataInput
                      placeholder={`Enter ${param.parameter}`}
                      value={parameterValues[param._id] || ""}
                      onChange={(e) =>
                        handleParameterChange(param._id, e.target.value)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">
              Enter Quantity (Tons)
            </label>
            <DataInput
              placeholder="Enter Quantity in Tons"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          {/* <div>
            <label className="block text-sm font-medium mb-1">
              Select Unit
            </label>
            <DataDropdown
              options={[
                { value: "kgs", label: "Kgs" },
                { value: "quintals", label: "Quintals" },
                { value: "tons", label: "Tons" },
              ]}
              selectedOptions={{
                value: unit,
                label: unit.charAt(0).toUpperCase() + unit.slice(1),
              }}
              onChange={(option) => setUnit(option.value)}
              placeholder="Select Unit"
            />
          </div> */}

          <div>
            <label className="block text-sm font-medium mb-1">
              Rate for Bid (Rs.)
            </label>
            <DataInput
              placeholder="Rate for Bid"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bid Date</label>
            <DateSelector
              selectedDate={bidDate}
              onChange={(date) => setBidDate(date)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Start Time (HH:MM)
            </label>
            <DataInput
              placeholder="Start Time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              inputType="time"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              End Time (HH:MM)
            </label>
            <DataInput
              placeholder="End Time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              inputType="time"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Payment Terms
            </label>
            <DataInput
              placeholder="Enter Payment Terms"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Delivery</label>
            <DataInput
              placeholder="Enter Delivery"
              value={delivery}
              onChange={(e) => setDelivery(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-6 text-center">
          <Buttons
            label={isSubmitting ? "Submitting..." : "Submit Bid"}
            onClick={handleSubmit}
            type="button"
            variant="primary"
            size="md"
            disabled={isSubmitting}
          />
        </div>
        <ToastContainer />
      </div>
    </Suspense>
  );
};

export default BaseBid;
