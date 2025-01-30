import { useState, useEffect, lazy, Suspense } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Loading from "../../common/Loading/Loading";

const GroupSelection = lazy(() => import("./GroupSelection"));
const ParameterInputs = lazy(() => import("./ParameterInputs"));
const AdditionalFields = lazy(() => import("./AdditionalFields"));
const SubmitButton = lazy(() => import("./SubmitButton"));

const apiBaseUrl = "https://phpserver-v77g.onrender.com/api";

const BaseBid = () => {
  const [state, setState] = useState({
    selectedGroup: null,
    selectedConsignee: null,
    origin: null,
    selectedCommodity: null,
    parameterValues: {},
    notes: "",
    quantity: "",
    rate: "",
    bidDate: "",
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
          value: c.group,
          label: c.group,
          consignees: c.consignee,
          commodities: c.commodities,
        })),
        originOptions: originsRes.data.map((o) => ({
          value: o.name,
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
          value: c.name,
          label: c.name,
          parameters: c.parameters,
        })) || [],
      selectedConsignee: null,
      selectedCommodity: null,
      parameters: [],
      parameterValues: {},
      notes: "",
    }));
  };

  const handleCommodityChange = (selectedCommodity) => {
    if (!selectedCommodity) {
      setState((prev) => ({
        ...prev,
        selectedCommodity: null,
        parameters: [],
        parameterValues: {},
        notes: "",
      }));
      return;
    }

    const commodity = state.commodityOptions.find(
      (c) => c.value === selectedCommodity.value
    );

    if (!commodity || !commodity.parameters) {
      setState((prev) => ({
        ...prev,
        selectedCommodity,
        parameters: [],
        parameterValues: {},
        notes: "",
      }));
      return;
    }

    const parameterValues = commodity.parameters.reduce((acc, param) => {
      acc[param._id] = param.value || "";
      return acc;
    }, {});

    setState((prev) => ({
      ...prev,
      selectedCommodity,
      parameters: commodity.parameters,
      parameterValues,
    }));
  };

  const handleSubmit = async () => {
    setState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const formattedParameters = state.parameters.reduce((acc, param) => {
        acc[param.parameter] = state.parameterValues[param._id] || "";
        return acc;
      }, {});

      await axios.post(`${apiBaseUrl}/bids`, {
        type: "buyer",
        group: state.selectedGroup?.value,
        consignee: state.selectedConsignee?.value,
        origin: state.origin?.value,
        commodity: state.selectedCommodity?.value,
        parameters: formattedParameters,
        notes: state.notes,
        quantity: state.quantity,
        rate: state.rate,
        bidDate: state.bidDate,
        startTime: state.startTime,
        endTime: state.endTime,
        paymentTerms: state.paymentTerms,
        delivery: state.delivery,
      });

      toast.success("Bid submitted successfully!");

      setState({
        selectedGroup: null,
        selectedConsignee: null,
        origin: null,
        selectedCommodity: null,
        parameterValues: {},
        notes: "",
        quantity: "",
        rate: "",
        bidDate: "",
        startTime: "",
        endTime: "",
        paymentTerms: "",
        delivery: "",
        isSubmitting: false,
        groupOptions: state.groupOptions,
        consigneeOptions: [],
        originOptions: state.originOptions,
        commodityOptions: [],
        parameters: [],
      });
    } catch (error) {
      toast.error("Failed to submit bid. Please try again.", error);
    } finally {
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="max-w-4xl mx-auto p-4 border rounded-md shadow-md bg-white">
        <h2 className="text-2xl font-semibold mb-6 text-center">Buyer Bid</h2>
        <GroupSelection
          state={state}
          handleGroupChange={handleGroupChange}
          handleChange={handleChange}
          handleCommodityChange={handleCommodityChange}
        />
        <ParameterInputs
          parameters={state.parameters}
          parameterValues={state.parameterValues}
          handleChange={handleChange}
          notes={state.notes}
        />
        <AdditionalFields state={state} handleChange={handleChange} />
        <SubmitButton
          isSubmitting={state.isSubmitting}
          handleSubmit={handleSubmit}
        />
        <ToastContainer />
      </div>
    </Suspense>
  );
};

export default BaseBid;
