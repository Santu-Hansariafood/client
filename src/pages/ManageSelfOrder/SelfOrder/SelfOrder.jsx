import { lazy, Suspense, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";
import { fetchAllPages } from "../../../utils/apiClient/fetchAllPages";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { FaClipboardList } from "react-icons/fa";
import regexPatterns from "../../../utils/regexPatterns/regexPatterns";
import { sendSaudaOrderEmails } from "../../../utils/saudaPdf/sendSaudaOrderEmails";
import { pdf } from "@react-pdf/renderer";
import SaudaPDF from "../../../components/DownloadSauda/SaudaPDF/SaudaPDF";
import { buildSaudaPdfData } from "../../../utils/saudaPdf/buildSaudaPdfData";
import { extractUploadUrl } from "../../../utils/saudaPdf/resolveUploadUrl";

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
  gst: 0,
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
  const [buyerOptions, setBuyerOptions] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [sellerOptions, setSellerOptions] = useState([]);
  const [consigneeOptions, setConsigneeOptions] = useState([]);
  const [sellerCompanies, setSellerCompanies] = useState([]);
  const [allCommodities, setAllCommodities] = useState([]);
  const [_buyerBrokerageMap, setBuyerBrokerageMap] = useState({});
  const [qualityParameterData, setQualityParameterData] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [
          sellersData,
          companiesData,
          buyersData,
          sellerCompaniesData,
          consigneesData,
          commoditiesData,
          qualityParamsData,
        ] = await Promise.all([
          fetchAllPages("/sellers"),
          fetchAllPages("/companies"),
          fetchAllPages("/buyers"),
          fetchAllPages("/seller-company"),
          fetchAllPages("/consignees"),
          fetchAllPages("/commodities", { limit: 500 }),
          fetchAllPages("/quality-parameters", { limit: 200 }).catch(() => []),
        ]);

        setSellerOptions(
          sellersData
            .map((seller) => ({
              ...seller,
              label: seller.sellerName,
              value: seller._id,
            }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        );

        setCompanyOptions(
          companiesData
            .map((c) => ({ ...c, label: c.companyName, value: c._id }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        );

        setBuyerOptions(
          buyersData
            .map((b) => ({ ...b, label: b.name, value: b._id }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        );

        setSupplierOptions(
          sellerCompaniesData
            .map((sc) => ({ ...sc, label: sc.companyName, value: sc._id }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        );

        setSellerCompanies(sellerCompaniesData);
        setConsigneeOptions(consigneesData);
        setAllCommodities(commoditiesData);
        setQualityParameterData(qualityParamsData);
      } catch (error) {
        toast.error("Failed to fetch initial data.");
      }
    };

    fetchInitialData();
  }, []);

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
      const supplierCommodities = formData.supplierBrokerage || [];

      const buyerHasCommodity = buyerCommodities.some(
        (c) =>
          (typeof c === "string" ? c : c.name)?.trim().toLowerCase() ===
          formData.commodity.trim().toLowerCase(),
      );
      const supplierHasCommodity = supplierCommodities.some(
        (c) =>
          (typeof c === "string" ? c : c.name)?.trim().toLowerCase() ===
          formData.commodity.trim().toLowerCase(),
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

  const handleSubmit = async () => {
    if (!validateFormData()) return;

    setIsLoading(true);

    try {
      const quantity = Number(formData.quantity) || 0;
      const pendingQuantity =
        formData.pendingQuantity !== ""
          ? Number(formData.pendingQuantity)
          : quantity;

      const payload = {
        ...formData,
        quantity: quantity,
        pendingQuantity: pendingQuantity,
        status: "active",
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

      const response = await api.post(API_BASE_URL, payload);
      clearApiCache();
      const createdOrder = response?.data || payload;

      Promise.resolve().then(async () => {
        try {
          await sendSaudaOrderEmails(createdOrder);
        } catch (emailError) {
          console.error("Auto email error:", emailError);
        }

        let fileUrl = null;
        try {
          const getConsigneeDisplay = (item) => {
            const c = item.consignee;
            if (typeof c === "object" && c?.name) return c.name;
            if (typeof c === "object" && c?.label) return c.label;
            if (c && typeof c === "string") return c;
            return c || "N/A";
          };

          const [
            freshConsigneeData,
            freshSupplierData,
            freshBuyerData,
            freshCompanyData,
            freshSellerProfileData,
            freshCommodityData,
            freshQualityParameterData,
          ] = await Promise.all([
            fetchAllPages("/consignees", { limit: 200 }),
            fetchAllPages("/seller-company", { limit: 200 }),
            fetchAllPages("/buyers", { limit: 200 }),
            fetchAllPages("/companies", { limit: 200 }),
            fetchAllPages("/sellers", { limit: 200 }),
            fetchAllPages("/commodities", { limit: 200 }),
            fetchAllPages("/quality-parameters", { limit: 200 }),
          ]);

          const pdfData = buildSaudaPdfData({
            item: createdOrder,
            consigneeData: freshConsigneeData,
            supplierData: freshSupplierData,
            buyerData: freshBuyerData,
            companyData: freshCompanyData,
            commodityData: freshCommodityData,
            qualityParameterData: freshQualityParameterData,
            sellerProfileData: freshSellerProfileData,
            getConsigneeDisplay,
          });

          const blob = await pdf(<SaudaPDF data={pdfData} />).toBlob();
          console.log("[SelfOrder WhatsApp] PDF blob:", {
            size: blob?.size,
            type: blob?.type,
            valid: blob && blob.size > 0,
          });
          if (blob && blob.size > 0) {
            const fileName = `Sauda-${createdOrder.saudaNo || "N/A"}.pdf`;
            const formData = new FormData();
            formData.append("file", blob, fileName);
            formData.append("saudaNo", createdOrder.saudaNo || "N/A");

            console.log("[SelfOrder WhatsApp] Uploading PDF to ImageKit:", {
              saudaNo: createdOrder.saudaNo,
              fileName,
              blobSize: blob.size,
            });

            const uploadRes = await api.post("/uploads/whatsapp", formData);
            console.log("[SelfOrder WhatsApp] Upload response:", uploadRes);
            console.log("[SelfOrder WhatsApp] uploadRes.data:", uploadRes?.data);

            const raw = uploadRes?.data ?? {};
            fileUrl = extractUploadUrl(raw);

            console.log("[SelfOrder WhatsApp] Resolved fileUrl:", fileUrl);

            if (!fileUrl) {
              console.warn(
                "[SelfOrder WhatsApp] Could not find URL in upload response. Keys:",
                Object.keys(raw),
              );
            }
          } else {
            console.error("[SelfOrder WhatsApp] PDF blob was empty, skipping upload");
          }
        } catch (pdfErr) {
          console.error(
            "[SelfOrder WhatsApp] PDF generation/upload failed:",
            pdfErr?.message || pdfErr,
          );
        }

        const sendWhatsApp = async (mobileValue) => {
          if (!mobileValue) return;
          const cleanMobile = String(mobileValue).replace(/\D/g, "");
          if (!cleanMobile || cleanMobile.length < 10) return;
          let finalMobile = cleanMobile;
          if (finalMobile.length === 10) {
            finalMobile = `91${finalMobile}`;
          }
          finalMobile = finalMobile.replace(/^0+/, "");

          const formattedSaudaDate = createdOrder.poDate
            ? new Date(createdOrder.poDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : createdOrder.createdAt
              ? new Date(createdOrder.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "N/A";

          const finalMessage = `*HANSARIA FOOD PRIVATE LIMITED*

*SAUDA CONFIRMATION*

*Date:* -  _${formattedSaudaDate}_
*Sauda No:* -  _${createdOrder.saudaNo || "N/A"}_
*PO Number:* -  _${createdOrder.poNumber || "N/A"}_
*Buyer Company:* -  _${createdOrder.buyerCompany || createdOrder.buyer || "N/A"}_
*Supplier Company:* -  _${createdOrder.supplierCompany || createdOrder.supplier || "N/A"}_
*Delivery Address:* -  _${createdOrder.consignee || "N/A"}_
*Commodity:* -  _${createdOrder.commodity || "N/A"}_
*Quantity:* -  _${createdOrder.quantity || "0"} Tons_
*Rate:* -  _₹${createdOrder.rate || "0"}${
            Number(createdOrder.gst) > 0 ? ` + ${createdOrder.gst}% GST` : ""
          }_
${
  createdOrder.cd && createdOrder.cd !== "0" && createdOrder.cd !== 0 && createdOrder.cd !== "N/A"
    ? `*CD:* -  _${createdOrder.cd}_`
    : ""
}
*Payment Terms:* -  _${createdOrder.paymentTerms || "N/A"} Days_

For complete details, please check your email.

*View / Download Sauda PDF:*
${fileUrl ? fileUrl : "PDF Link Not Available"}

*Thank You,*
*Hansaria Food Private Limited*

*https://bid.hansariafood.in*`;

          try {
            const apiUrl = `http://wapp.nkinfo.in/wapp/v2/api/send?apikey=a44983c9243e434f9466158a2eca54d8&mobile=${finalMobile}&msg=${encodeURIComponent(finalMessage)}`;
            await fetch(apiUrl);
          } catch (apiErr) {
            console.warn("Automatic WhatsApp API call failed", apiErr);
          }
        };

        await sendWhatsApp(createdOrder.buyerMobile);
        await sendWhatsApp(createdOrder.sellerMobile);
      });

      resetForm();

      toast.success("Order created successfully!", {
        position: "top-right",
      });
      navigate("/manage-order/list-self-order");
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
            <BuyerInformation
              formData={formData}
              handleChange={handleChange}
              buyers={buyerOptions}
              consignees={consigneeOptions}
              companies={companyOptions}
              allCommodities={allCommodities}
            />
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
              supplierOptions={supplierOptions}
              sellerOptions={sellerOptions}
              sellerCompanies={sellerCompanies}
              allCommodities={allCommodities}
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
