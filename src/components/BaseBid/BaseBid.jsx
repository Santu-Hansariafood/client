import { useState, useEffect, lazy, Suspense } from "react";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Loading from "../../common/Loading/Loading";
import AdminPageShell from "../../common/AdminPageShell/AdminPageShell";
import { FaGavel } from "react-icons/fa";

import WhatsAppNotification from "../WhatsAppNotification/WhatsAppNotification"

const GroupSelection = lazy(() => import("./GroupSelection"));
const ParameterInputs = lazy(() => import("./ParameterInputs"));
const AdditionalFields = lazy(() => import("./AdditionalFields"));
const SubmitButton = lazy(() => import("./SubmitButton"));

const apiBaseUrl = "";

const BaseBid = () => {
  const navigate = useNavigate();
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
    status: "active",
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

      const companies = companiesRes.data?.data || companiesRes.data || [];
      const origins = originsRes.data?.data || originsRes.data || [];

      const formatName = (name) => {
        return name
          .split(" ")
          .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          )
          .join(" ");
      };

      const groupMap = new Map();

      companies.forEach((c) => {
        const formattedGroupName = formatName(c.group);
        if (groupMap.has(formattedGroupName)) {
          const existingGroup = groupMap.get(formattedGroupName);
          existingGroup.consignees = [
            ...new Set([
              ...existingGroup.consignees,
              ...c.consignee.map(formatName),
            ]),
          ];
          existingGroup.commodities = [
            ...existingGroup.commodities,
            ...c.commodities.map((commodity) => ({
              ...commodity,
              name: formatName(commodity.name),
            })),
          ];
        } else {
          groupMap.set(formattedGroupName, {
            value: formattedGroupName,
            label: formattedGroupName,
            consignees: c.consignee.map(formatName),
            commodities: c.commodities.map((commodity) => ({
              ...commodity,
              name: formatName(commodity.name),
            })),
          });
        }
      });

      const sortedGroupOptions = Array.from(groupMap.values()).sort((a, b) =>
        a.label.localeCompare(b.label)
      );

      setState((prev) => ({
        ...prev,
        groupOptions: sortedGroupOptions,
        originOptions: origins
          .map((o) => ({
            value: formatName(o.name),
            label: formatName(o.name),
          }))
          .sort((a, b) => a.label.localeCompare(b.label)),
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
        group?.consignees
          .map((c) => ({ value: c, label: c }))
          .sort((a, b) => a.label.localeCompare(b.label)) || [],
      commodityOptions:
        group?.commodities
          .map((c) => ({
            value: c.name,
            label: c.name,
            parameters: c.parameters,
          }))
          .sort((a, b) => a.label.localeCompare(b.label)) || [],
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

      const response = await axios.post(`${apiBaseUrl}/bids`, {
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
        status: state.status,
      });

      const bidId = response.data.bidId || response.data._id || "UNKNOWN_BID";

      const whatsappNotifier = await WhatsAppNotification({
        bidData: {
          group: state.selectedGroup?.value,
          consignee: state.selectedConsignee?.value,
          commodity: state.selectedCommodity?.value,
          quantity: state.quantity,
          rate: state.rate,
          endTime: state.endTime,
        },
        bidId,
      });

      await whatsappNotifier.notifyRelevantSellers();

      toast.success("Bid submitted successfully and notifications sent!");
      setTimeout(() => {
        navigate("/manage-bids/bid-list");
      }, 2000);

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
      toast.error(
        "Failed to submit bid or send notifications. Please try again."
      );
      console.error("Error:", error);
    } finally {
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Buyer Bid"
        subtitle="Create a bid with group, consignee, commodity, parameters, and timings"
        icon={FaGavel}
        noContentCard
      >
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="rounded-2xl border border-amber-200/60 bg-white shadow-lg p-4 sm:p-6 md:p-8">
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
          </div>
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default BaseBid;
