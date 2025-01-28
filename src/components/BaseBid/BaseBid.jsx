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

const apiBaseUrl = "https://phpserver-v77g.onrender.com/api";

const BaseBid = () => {
  const [state, setState] = useState({
    selectedGroup: null,
    selectedConsignee: null,
    origin: null,
    selectedCommodity: null,
    parameterValues: {},
    quantity: "",
    rate: "",
    bidDate: null,
    startTime: "",
    endTime: "",
    paymentTerms: "",
    delivery: "",
    isSubmitting: false,
    groupOptions: [],
    consigneeOptions: [],
    originOptions: [],
    commodityOptions: [],
    parameters: [],
  });

  const fetchData = async () => {
    try {
      const [companiesRes, originsRes] = await Promise.all([
        axios.get(`${apiBaseUrl}/companies`),
        axios.get(`${apiBaseUrl}/bid-locations`),
      ]);

      setState((prev) => ({
        ...prev,
        groupOptions: companiesRes.data.map((c) => ({
          value: c._id,
          label: c.group,
          consignees: c.consignee,
          commodities: c.commodities,
        })),
        originOptions: originsRes.data.map((o) => ({
          value: o._id,
          label: o.name,
        })),
      }));
    } catch (error) {
      toast.error("Failed to fetch data. Please try again later.", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (field, value) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  const handleGroupChange = (selectedGroup) => {
    const group = state.groupOptions.find(
      (g) => g.value === selectedGroup.value
    );

    setState((prev) => ({
      ...prev,
      selectedGroup,
      consigneeOptions:
        group?.consignees.map((c) => ({ value: c, label: c })) || [],
      commodityOptions:
        group?.commodities.map((c) => ({
          value: c._id,
          label: c.name,
          parameters: c.parameters,
        })) || [],
      selectedConsignee: null,
      selectedCommodity: null,
      parameters: [],
      parameterValues: {},
    }));
  };

  const handleCommodityChange = (selectedCommodity) => {
    const parameters = selectedCommodity?.parameters || [];
    const parameterValues = parameters.reduce((acc, param) => {
      acc[param._id] = param.value || "";
      return acc;
    }, {});

    console.log("Quality Parameters and Values:", parameters);

    setState((prev) => ({
      ...prev,
      selectedCommodity,
      parameters,
      parameterValues,
    }));
  };

  const handleSubmit = async () => {
    const bidData = {
      type: "buyer",
      group: state.selectedGroup?.label,
      consignee: state.selectedConsignee?.value,
      origin: state.origin?.value,
      commodity: state.selectedCommodity?.value,
      parameters: state.parameterValues,
      quantity: parseFloat(state.quantity),
      rate: parseFloat(state.rate),
      bidDate: state.bidDate,
      startTime: state.startTime,
      endTime: state.endTime,
      paymentTerms: state.paymentTerms,
      delivery: state.delivery,
    };

    setState((prev) => ({ ...prev, isSubmitting: true }));
    try {
      await axios.post(`${apiBaseUrl}/bids`, bidData);
      toast.success("Bid submitted successfully!");
      setState((prev) => ({
        ...prev,
        selectedGroup: null,
        selectedConsignee: null,
        origin: null,
        selectedCommodity: null,
        parameters: [],
        parameterValues: {},
        quantity: "",
        rate: "",
        bidDate: null,
        startTime: "",
        endTime: "",
        paymentTerms: "",
        delivery: "",
        isSubmitting: false,
      }));
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to submit bid. Please try again."
      );
    } finally {
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="max-w-4xl mx-auto p-4 border rounded-md shadow-md bg-white">
        <h2 className="text-2xl font-semibold mb-6 text-center">Buyer Bid</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            {
              label: "Select Group",
              options: state.groupOptions,
              value: state.selectedGroup,
              onChange: handleGroupChange,
            },
            {
              label: "Select Consignee",
              options: state.consigneeOptions,
              value: state.selectedConsignee,
              onChange: (opt) => handleChange("selectedConsignee", opt),
            },
            {
              label: "Select Origin",
              options: state.originOptions,
              value: state.origin,
              onChange: (opt) => handleChange("origin", opt),
            },
            {
              label: "Select Commodity",
              options: state.commodityOptions,
              value: state.selectedCommodity,
              onChange: handleCommodityChange,
            },
          ].map(({ label, options, value, onChange }, index) => (
            <div key={index}>
              <label className="block text-sm font-medium mb-2">{label}</label>
              <DataDropdown
                options={options}
                selectedOptions={value}
                onChange={onChange}
                placeholder={label}
              />
            </div>
          ))}
        </div>

        {state.parameters?.map((param) => (
          <div key={param._id}>
            <label className="block text-sm font-medium mb-1">
              {param.parameter}: {param.value}
            </label>
            <DataInput
              placeholder={`Enter ${param.parameter}`}
              value={state.parameterValues[param._id] || ""}
              onChange={(e) =>
                handleChange("parameterValues", {
                  ...state.parameterValues,
                  [param._id]: e.target.value,
                })
              }
            />
          </div>
        ))}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
          {[
            { label: "Enter Quantity (Tons)", field: "quantity", type: "text" },
            { label: "Rate for Bid (Rs.)", field: "rate", type: "text" },
            { label: "Bid Date", field: "bidDate", type: "date" },
            { label: "Start Time (HH:MM)", field: "startTime", type: "time" },
            { label: "End Time (HH:MM)", field: "endTime", type: "time" },
            { label: "Payment Terms", field: "paymentTerms", type: "text" },
            { label: "Delivery", field: "delivery", type: "text" },
          ].map(({ label, field, type }, index) => (
            <div key={index}>
              <label className="block text-sm font-medium mb-1">{label}</label>
              {type === "date" ? (
                <DateSelector
                  selectedDate={state[field]}
                  onChange={(date) => handleChange(field, date)}
                />
              ) : (
                <DataInput
                  placeholder={label}
                  value={state[field] || ""}
                  onChange={(e) => handleChange(field, e.target.value)}
                  inputType={type}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Buttons
            label={state.isSubmitting ? "Submitting..." : "Submit Bid"}
            onClick={handleSubmit}
            type="button"
            variant="primary"
            size="md"
            disabled={state.isSubmitting}
          />
        </div>

        <ToastContainer />
      </div>
    </Suspense>
  );
};

export default BaseBid;
