import { lazy, Suspense, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaClipboardList } from "react-icons/fa";
import regexPatterns from "../../../utils/regexPatterns/regexPatterns";
import { pdf } from "@react-pdf/renderer";
import SaudaPDF from "../../../components/DownloadSauda/SaudaPDF/SaudaPDF";

const BuyerInformation = lazy(
  () => import("../../../components/BuyerInformation/BuyerInformation"),
);
const CommodityInformation = lazy(
  () => import("../../../components/CommodityInformation/CommodityInformation"),
);
const PODetails = lazy(() => import("../../../components/PODetails/PODetails"));
const QuantityAndPricing = lazy(
  () => import("../../../components/QuantityPricing/QuantityPricing"),
);
const SupplierInformation = lazy(
  () => import("../../../components/SupplierInformation/SupplierInformation"),
);
const BrokerInformation = lazy(
  () => import("../../../components/BrokerInformation/BrokerInformation"),
);
const NotesSection = lazy(
  () => import("../../../components/NotesSection/NotesSection"),
);
const AdditionalInformation = lazy(
  () =>
    import("../../../components/AdditionalInformation/AdditionalInformation"),
);
const LoadingStation = lazy(
  () => import("../../../components/LoadingStation/LoadingStation"),
);
const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));

const INITIAL_FORM_DATA = {
  buyer: "",
  companyId: null,
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
  billTo: "buyer",
  saudaNo: "",
  buyerMobile: "",
  sellerMobile: "",
};

const SelfOrder = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [_buyerBrokerageMap, setBuyerBrokerageMap] = useState({});

  useEffect(() => {
    if (formData.commodity) {
      const buyerBrokerageVal = _buyerBrokerageMap[formData.commodity] ?? 0;

      const supplierBrokerageItem = formData.supplierBrokerage?.find(
        (b) => b.name === formData.commodity,
      );
      const supplierBrokerageVal = supplierBrokerageItem?.brokerage ?? 0;

      if (
        formData.buyerBrokerage?.brokerageBuyer !== buyerBrokerageVal ||
        formData.buyerBrokerage?.brokerageSupplier !== supplierBrokerageVal
      ) {
        setFormData((prev) => ({
          ...prev,
          buyerBrokerage: {
            brokerageBuyer: buyerBrokerageVal,
            brokerageSupplier: supplierBrokerageVal,
          },
        }));
      }
    }
  }, [
    formData.commodity,
    _buyerBrokerageMap,
    formData.supplierBrokerage,
    formData.buyerBrokerage,
  ]);

  const API_BASE_URL = "/self-order";

  const handleChange = (field, value) => {
    if (field === "buyerBrokerageMap") {
      setBuyerBrokerageMap(value || {});
      return;
    }

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
    if (!formData.saudaNo) errors.push("Sauda No is required.");
    if (!formData.commodity) errors.push("Commodity is required.");
    if (!formData.supplier) errors.push("Supplier is required.");

    if (formData.commodity) {
      const buyerCommodities = formData.buyerCommodity || [];
      const supplierCommodities = formData.supplierBrokerage || []; // This comes from SupplierInformation.jsx

      const buyerHasCommodity = buyerCommodities.includes(formData.commodity);
      const supplierHasCommodity = supplierCommodities.some(
        (c) => c.name === formData.commodity,
      );

      if (!buyerHasCommodity) {
        errors.push(`Buyer does not deal in ${formData.commodity}.`);
      }
      if (!supplierHasCommodity) {
        errors.push(`Supplier does not deal in ${formData.commodity}.`);
      }
    }

    if (
      formData.buyerEmails?.some(
        (email) => email.trim() && !regexPatterns.email.test(email.trim()),
      )
    ) {
      errors.push("Invalid buyer email format.");
    }
    if (
      formData.sellerEmails?.some(
        (email) => email.trim() && !regexPatterns.email.test(email.trim()),
      )
    ) {
      errors.push("Invalid seller email format.");
    }

    if (errors.length > 0) {
      errors.forEach((err) => toast.error(err, { position: "top-right" }));
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
  };

  const sendOrderEmails = async (order) => {
    try {
      const buyerEmails = Array.isArray(order?.buyerEmails)
        ? order.buyerEmails.filter(Boolean)
        : [];

      const sellerEmails = Array.isArray(order?.sellerEmails)
        ? order.sellerEmails.filter(Boolean)
        : [];

      const buyerFromSingle = order?.buyerEmail ? [order.buyerEmail] : [];

      const buyerEmailsToSend = [
        ...buyerEmails,
        ...buyerFromSingle,
      ].filter((e) => String(e).trim());

      const sellerEmailsToSend = sellerEmails.filter((e) => String(e).trim());

      const shouldSendBuyer = order.sendPOToBuyer === "yes";
      const shouldSendSupplier = order.sendPOToSupplier === "yes";

      if (
        (!shouldSendBuyer || buyerEmailsToSend.length === 0) &&
        (!shouldSendSupplier || sellerEmailsToSend.length === 0)
      ) {
        return;
      }

      const details = {
        saudaNo: order.saudaNo,
        poNumber: order.poNumber || "",
        buyer: order.buyer || "",
        buyerCompany: order.buyerCompany || "",
        consignee: order.consignee || "",
        supplierCompany: order.supplierCompany || "",
        commodity: order.commodity || "",
        quantity: order.quantity ?? "",
        rate: order.rate ?? "",
      };

      const [
        consigneeResponse,
        supplierResponse,
        buyerResponse,
        sellerProfileResponse,
      ] = await Promise.all([
        axios.get("/consignees"),
        axios.get("/seller-company"),
        axios.get("/buyers"),
        axios.get("/sellers"),
      ]);

      const consigneeData = Array.isArray(consigneeResponse.data)
        ? consigneeResponse.data
        : consigneeResponse.data?.data || [];
      const supplierData = Array.isArray(supplierResponse.data)
        ? supplierResponse.data
        : supplierResponse.data?.data || [];
      const buyerData = Array.isArray(buyerResponse.data)
        ? buyerResponse.data
        : buyerResponse.data?.data || [];
      const sellerProfileData = Array.isArray(sellerProfileResponse.data)
        ? sellerProfileResponse.data
        : sellerProfileResponse.data?.data || [];

      const normalizedConsigneeKey = (() => {
        const c = order?.consignee;
        if (!c) return "";
        if (typeof c === "object")
          return (c.name || c.label || c.value || "").toString();
        return String(c);
      })();

      const matchingConsignee = consigneeData.find((consignee) => {
        const idMatch =
          consignee?._id &&
          normalizedConsigneeKey &&
          String(consignee._id) === String(normalizedConsigneeKey);
        if (idMatch) return true;
        const name = (consignee?.name || consignee?.label || "")
          .toString()
          .trim()
          .toLowerCase();
        const key = normalizedConsigneeKey.toString().trim().toLowerCase();
        return name && key && name === key;
      });

      const matchingSupplier = supplierData.find(
        (supplier) =>
          supplier.companyName?.toLowerCase() ===
          order.supplierCompany?.toLowerCase(),
      );

      const rawBuyerKey = order?.buyerCompany ?? order?.buyer ?? "";
      const normalizedBuyerKey = String(rawBuyerKey || "")
        .trim()
        .toLowerCase();

      const matchingBuyer =
        buyerData.find((buyer) => {
          const idMatch =
            buyer?._id && rawBuyerKey && String(buyer._id) === String(rawBuyerKey);
          const nameMatch =
            buyer?.companyName &&
            buyer.companyName.toLowerCase() === normalizedBuyerKey;
          return idMatch || nameMatch;
        }) ||
        supplierData.find((supplier) => {
          const idMatch =
            supplier?._id &&
            rawBuyerKey &&
            String(supplier._id) === String(rawBuyerKey);
          const nameMatch =
            supplier?.companyName &&
            supplier.companyName.toLowerCase() === normalizedBuyerKey;
          return idMatch || nameMatch;
        });

      const matchingSellerProfile = sellerProfileData.find(
        (seller) => seller._id === order.supplier,
      );

      let transformedData = {
        ...order,
        consigneeDetails: matchingConsignee || null,
        supplierDetails: matchingSupplier || null,
        buyerDetails:
          order.billTo === "consignee" ? matchingConsignee || null : matchingBuyer,
      };

      if (transformedData.buyerDetails) {
        const bd = transformedData.buyerDetails;
        transformedData.buyerDetails = {
          ...bd,
          address: bd.address || bd.location || "",
          gstNo: bd.gstNo || bd.gst || bd.gstNumber || "",
          panNo: bd.panNo || bd.pan || bd.panNumber || "",
          pinNo: bd.pinNo || bd.pin || bd.pinCode || "",
          district: bd.district || "",
          state: bd.state || "",
        };
      }

      if (
        matchingBuyer &&
        (!transformedData.buyerBrokerage?.brokerageBuyer ||
          transformedData.buyerBrokerage.brokerageBuyer === 0)
      ) {
        const buyerProfileBrokerage =
          matchingBuyer.brokerageByName?.[order.commodity] ||
          matchingBuyer.brokerage?.[order.commodity];
        if (buyerProfileBrokerage !== undefined) {
          transformedData.buyerBrokerage = {
            ...transformedData.buyerBrokerage,
            brokerageBuyer: buyerProfileBrokerage,
          };
        }
      }

      if (
        matchingSellerProfile &&
        (!transformedData.buyerBrokerage?.brokerageSupplier ||
          transformedData.buyerBrokerage.brokerageSupplier === 0)
      ) {
        const supplierProfileBrokerage =
          matchingSellerProfile.commodities?.find(
            (c) => c.name === order.commodity,
          )?.brokerage;
        if (supplierProfileBrokerage !== undefined) {
          transformedData.buyerBrokerage = {
            ...transformedData.buyerBrokerage,
            brokerageSupplier: supplierProfileBrokerage,
          };
        }
      }

      if (order.billTo === "consignee") {
        transformedData = {
          ...transformedData,
          buyer: order.consignee,
          buyerCompany: order.consignee,
        };
      } else {
        const buyerName =
          matchingBuyer?.companyName ||
          (typeof order?.buyerCompany === "string" ? order.buyerCompany : "") ||
          (typeof order?.buyer === "string" ? order.buyer : "");

        transformedData = {
          ...transformedData,
          buyer: buyerName,
          buyerCompany: buyerName,
        };
      }

      const blob = await pdf(<SaudaPDF data={transformedData} />).toBlob();

      const base64data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          try {
            const result = reader.result;
            const base64 = typeof result === "string" ? result.split(",")[1] : "";
            resolve(base64);
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = reject;
      });

      if (order.sendPOToBuyer === "yes" && buyerEmailsToSend.length > 0) {
        await axios.post("/api/email/send-pdf", {
          email: [...new Set(buyerEmailsToSend)].join(", "),
          pdf: base64data,
          ...details,
        });
      }

      if (
        order.sendPOToSupplier === "yes" &&
        sellerEmailsToSend.length > 0
      ) {
        await axios.post("/api/email/send-pdf", {
          email: [...new Set(sellerEmailsToSend)].join(", "),
          pdf: base64data,
          ...details,
        });
      }
    } catch (error) {
      console.error("Auto email error:", error);
    }
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
        weight: formData.weight || "",
        buyerBrokerage: {
          brokerageBuyer:
            Number(formData.buyerBrokerage?.brokerageBuyer ?? 0) || 0,
          brokerageSupplier:
            Number(formData.buyerBrokerage?.brokerageSupplier ?? 0) || 0,
        },
      };
      console.log(
        "Final Payload being sent to API:",
        JSON.stringify(payload, null, 2),
      );

      const response = await axios.post(API_BASE_URL, payload);
      const createdOrder = response?.data || payload;

      if (createdOrder.sendPOToBuyer === "yes" || createdOrder.sendPOToSupplier === "yes") {
        sendOrderEmails(createdOrder);
      }

      resetForm();

      setTimeout(() => {
        toast.success("Order created successfully! Redirecting...", {
          position: "top-right",
        });
      }, 500);

      setTimeout(() => navigate("/manage-order/list-self-order"), 2000);
    } catch (error) {
      console.error(
        "Self Order API Error:",
        error.response?.data || error.message,
      );
      toast.error(
        `Failed to create order: ${error.response?.data?.message || error.message}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const sectionClass =
    "rounded-2xl border border-emerald-100 bg-white p-5 sm:p-6 shadow-md shadow-emerald-900/5";
  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Add self order"
        subtitle="Fill in buyer, commodity, PO, and supplier details"
        icon={FaClipboardList}
        noContentCard
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <div className={sectionClass}>
            <BuyerInformation formData={formData} handleChange={handleChange} />
          </div>

          <div className={sectionClass}>
            <CommodityInformation
              handleChange={handleChange}
              selectedCompany={formData.buyerCompany}
              buyerCommodity={formData.buyerCommodity}
              brokerageMap={_buyerBrokerageMap}
              formData={formData}
            />
          </div>

          <div className={sectionClass}>
            <PODetails formData={formData} handleChange={handleChange} />
          </div>

          <div className={sectionClass}>
            <LoadingStation formData={formData} handleChange={handleChange} />
          </div>

          <div className={sectionClass}>
            <QuantityAndPricing
              formData={formData}
              handleChange={handleChange}
            />
          </div>

          <div className={sectionClass}>
            <SupplierInformation
              formData={formData}
              handleChange={handleChange}
            />
          </div>

          <div className={sectionClass}>
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
          </div>

          <div className={sectionClass}>
            <NotesSection
              notes={formData.notes}
              setNotes={(updatedNotes) => handleChange("notes", updatedNotes)}
            />
          </div>

          <div className={sectionClass}>
            <AdditionalInformation
              formData={formData}
              handleChange={handleChange}
            />
          </div>

          <div className={sectionClass}>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">
              Sauda Number
            </h3>
            <DataInput
              placeholder="Enter Sauda No"
              value={formData.saudaNo}
              onChange={(e) => handleChange("saudaNo", e.target.value)}
              name="saudaNo"
              inputType="text"
              size="md"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-3.5 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
            disabled={isLoading}
          >
            {isLoading ? "Submitting..." : "Submit Order"}
          </button>

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
      </AdminPageShell>
    </Suspense>
  );
};

export default SelfOrder;
