import { lazy, Suspense, useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Loading from "../../../common/Loading/Loading";

const BuyerInformation = lazy(() =>
  import("../../../components/BuyerInformation/BuyerInformation")
);
const CommodityInformation = lazy(() =>
  import("../../../components/CommodityInformation/CommodityInformation")
);
const PODetails = lazy(() => import("../../../components/PODetails/PODetails"));
const QuantityAndPricing = lazy(() =>
  import("../../../components/QuantityPricing/QuantityPricing")
);
const SupplierInformation = lazy(() =>
  import("../../../components/SupplierInformation/SupplierInformation")
);
const BrokerInformation = lazy(() =>
  import("../../../components/BrokerInformation/BrokerInformation")
);
const NotesSection = lazy(() =>
  import("../../../components/NotesSection/NotesSection")
);
const AdditionalInformation = lazy(() =>
  import("../../../components/AdditionalInformation/AdditionalInformation")
);
const LoadingStation = lazy(() =>
  import("../../../components/LoadingStation/LoadingStation")
);
const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));

const INITIAL_FORM_DATA = {
  buyer: "",
  buyerCompany: "",
  consignee: "",
  buyerEmail: "",
  buyerCommodity: [],
  buyerBrokerage: { brokerageBuyer: 0, brokerageSupplier: 0 },
  commodity: "",
  parameters: [],
  poNumber: "",
  poDate: new Date(),
  state: "",
  location: "",
  quantity: "",
  pendingQuantity: "",
  rate: "",
  gst: "",
  cd: "",
  weight: "",
  supplier: "",
  supplierCompany: "",
  paymentTerms: "",
  deliveryDate: new Date(),
  loadingDate: new Date(),
  notes: [""],
  broker: "",
  agentName: "",
  buyerEmails: [""],
  sellerEmails: [""],
  sendPOToBuyer: "yes",
  sendPOToSupplier: "yes",
  billTo: "none",
  saudaNo: "",
};

const EditSelfOrder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const API_BASE_URL = "/self-order";

  useEffect(() => {
    if (location.state?.orderData) {
      setFormData({
        ...INITIAL_FORM_DATA,
        ...location.state.orderData,
        poDate: location.state.orderData.poDate ? new Date(location.state.orderData.poDate) : new Date(),
        deliveryDate: location.state.orderData.deliveryDate ? new Date(location.state.orderData.deliveryDate) : new Date(),
        loadingDate: location.state.orderData.loadingDate ? new Date(location.state.orderData.loadingDate) : new Date(),
      });
    } else if (id) {
      const fetchOrder = async () => {
        setIsFetching(true);
        try {
          const { data } = await axios.get(`${API_BASE_URL}/${id}`);
          setFormData({
            ...INITIAL_FORM_DATA,
            ...data,
            poDate: data.poDate ? new Date(data.poDate) : new Date(),
            deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : new Date(),
            loadingDate: data.loadingDate ? new Date(data.loadingDate) : new Date(),
          });
        } catch (error) {
          console.error("Error fetching order:", error);
          toast.error("Failed to fetch order details.");
        } finally {
          setIsFetching(false);
        }
      };
      fetchOrder();
    }
  }, [id, location.state]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      if (typeof field === "object" && field.nested) {
        const { key, subKey } = field;
        return {
          ...prev,
          [key]: {
            ...prev[key],
            [subKey]: value,
          },
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const validateFormData = () => {
    const errors = [];
    if (!formData.buyer) errors.push("Buyer name is required.");
    if (!formData.poNumber) errors.push("PO Number is required.");
    if (!formData.saudaNo) errors.push("Sauda No is required.");

    if (errors.length > 0) {
      errors.forEach((err) =>
        toast.error(err, { position: "top-right" })
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateFormData()) return;

    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        quantity: Number(formData.quantity) || 0,
        pendingQuantity: Number(formData.pendingQuantity) || 0,
        rate: Number(formData.rate) || 0,
        gst: Number(formData.gst) || 0,
        cd: Number(formData.cd) || 0,
        weight: Number(formData.weight) || 0,
        buyerBrokerage: {
          brokerageBuyer: Number(
            formData.buyerBrokerage?.brokerageBuyer ?? 0
          ) || 0,
          brokerageSupplier: Number(
            formData.buyerBrokerage?.brokerageSupplier ?? 0
          ) || 0,
        },
      };

      await axios.put(`${API_BASE_URL}/${id}`, payload);

      toast.success("Order updated successfully! Redirecting...", {
        position: "top-right",
      });

      setTimeout(() => navigate("/manage-order/list-self-order"), 2000);
    } catch (error) {
      console.error("Update Order API Error:", error.response?.data || error.message);
      toast.error(`Failed to update order: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) return <Loading />;

  return (
    <Suspense fallback={<Loading />}>
      <div className="p-4 max-w-screen-lg mx-auto space-y-6 bg-gray-50 rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold text-blue-500 text-center">
          Edit Self Order: {formData.saudaNo}
        </h1>
        <BuyerInformation formData={formData} handleChange={handleChange} />
        <CommodityInformation
          handleChange={handleChange}
          selectedCompany={formData.buyerCompany}
          buyerCommodity={formData.buyerCommodity}
          brokerage={formData.buyerBrokerage}
          formData={formData}
        />
        <PODetails formData={formData} handleChange={handleChange} />
        <LoadingStation formData={formData} handleChange={handleChange} />
        <QuantityAndPricing formData={formData} handleChange={handleChange} />
        <SupplierInformation formData={formData} handleChange={handleChange} />
        <BrokerInformation
          formData={formData}
          handleChange={(key, value) => {
            if (key === "buyerBrokerage") {
              setFormData((prev) => ({
                ...prev,
                buyerBrokerage: { ...prev.buyerBrokerage, ...value },
              }));
            } else {
              handleChange(key, value);
            }
          }}
        />
        <NotesSection
          notes={formData.notes}
          setNotes={(updatedNotes) => handleChange("notes", updatedNotes)}
        />
        <AdditionalInformation formData={formData} handleChange={handleChange} />

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Sauda Number</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <DataInput
                placeholder="Enter Sauda No"
                value={formData.saudaNo}
                onChange={(e) => handleChange("saudaNo", e.target.value)}
                name="saudaNo"
                inputType="text"
                size="md"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => navigate("/manage-order/list-self-order")}
            className="flex-1 py-2 bg-gray-500 text-white font-semibold rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-2 py-2 bg-blue-500 text-white font-semibold rounded-lg"
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Update Order"}
          </button>
        </div>

        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          style={{ zIndex: 9999 }}
        />
      </div>
    </Suspense>
  );
};

export default EditSelfOrder;
