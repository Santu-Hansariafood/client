import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { PDFDownloadLink, pdf } from "@react-pdf/renderer";
import SaudaPDF from "./SaudaPDF/SaudaPDF";
import { FaDownload, FaEnvelope } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";

const DownloadSauda = ({ data }) => {
  const [consigneeData, setConsigneeData] = useState([]);
  const [supplierData, setSupplierData] = useState([]);
  const [buyerData, setBuyerData] = useState([]);
  const [sellerProfileData, setSellerProfileData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);

  const CONSIGNEE_API_URL = "/consignees";
  const SUPPLIER_API_URL = "/seller-company";
  const BUYER_API_URL = "/buyers";
  const SELLER_PROFILE_API_URL = "/sellers";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [consigneeResponse, supplierResponse, buyerResponse, sellerProfileResponse] = await Promise.all([
          axios.get(CONSIGNEE_API_URL),
          axios.get(SUPPLIER_API_URL),
          axios.get(BUYER_API_URL),
          axios.get(SELLER_PROFILE_API_URL)
        ]);

        const cData = Array.isArray(consigneeResponse.data)
          ? consigneeResponse.data
          : consigneeResponse.data?.data || [];
        const sData = Array.isArray(supplierResponse.data)
          ? supplierResponse.data
          : supplierResponse.data?.data || [];
        const bData = Array.isArray(buyerResponse.data)
          ? buyerResponse.data
          : buyerResponse.data?.data || [];
        const spData = Array.isArray(sellerProfileResponse.data)
          ? sellerProfileResponse.data
          : sellerProfileResponse.data?.data || [];

        setConsigneeData(cData);
        setSupplierData(sData);
        setBuyerData(bData);
        setSellerProfileData(spData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const normalizedConsigneeKey = (() => {
    const c = data?.consignee;
    if (!c) return "";
    if (typeof c === "object") return (c.name || c.label || c.value || "").toString();
    return String(c);
  })();

  const matchingConsignee = consigneeData.find((consignee) => {
    const idMatch =
      consignee?._id && normalizedConsigneeKey && String(consignee._id) === String(normalizedConsigneeKey);
    if (idMatch) return true;
    const name = (consignee?.name || consignee?.label || "").toString().trim().toLowerCase();
    const key = normalizedConsigneeKey.toString().trim().toLowerCase();
    return name && key && name === key;
  });

  const matchingSupplier = supplierData.find(
    (supplier) =>
      supplier.companyName.toLowerCase() === data.supplierCompany.toLowerCase()
  );

  const matchingBuyer = buyerData.find(
    (buyer) =>
      buyer.companyName.toLowerCase() === data.buyerCompany.toLowerCase()
  );

  const matchingSellerProfile = sellerProfileData.find(
    (seller) => seller._id === data.supplier
  );

  let transformedData = {
    ...data,
    consigneeDetails: matchingConsignee || null,
    supplierDetails: matchingSupplier || null,
    buyerDetails: matchingBuyer || null,
  };

  // Ensure brokerage is fetched from buyer/seller profile if it's 0 or missing in order data
  if (matchingBuyer && (!transformedData.buyerBrokerage?.brokerageBuyer || transformedData.buyerBrokerage.brokerageBuyer === 0)) {
    const buyerProfileBrokerage = matchingBuyer.brokerage?.[data.commodity];
    if (buyerProfileBrokerage !== undefined) {
      transformedData.buyerBrokerage = {
        ...transformedData.buyerBrokerage,
        brokerageBuyer: buyerProfileBrokerage,
      };
    }
  }

  if (matchingSellerProfile && (!transformedData.buyerBrokerage?.brokerageSupplier || transformedData.buyerBrokerage.brokerageSupplier === 0)) {
    const supplierProfileBrokerage = matchingSellerProfile.commodities?.find(
      (c) => c.name === data.commodity
    )?.brokerage;
    if (supplierProfileBrokerage !== undefined) {
      transformedData.buyerBrokerage = {
        ...transformedData.buyerBrokerage,
        brokerageSupplier: supplierProfileBrokerage,
      };
    }
  }

  if (data.billTo === "consignee") {
    transformedData = {
      ...transformedData,
      buyer: data.consignee,
      buyerCompany: data.consignee,
      
    };
  }

  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");

  useEffect(() => {
    if (!showEmailPopup) return;
    const fromArray = Array.isArray(data?.buyerEmails)
      ? data.buyerEmails.filter(Boolean)
      : [];
    const fromSingle = data?.buyerEmail ? [data.buyerEmail] : [];
    const defaultEmail = [...fromArray, ...fromSingle][0] || "";
    setRecipientEmail((prev) => prev || defaultEmail);
  }, [showEmailPopup, data]);

  const handleSendEmail = async () => {
    if (!recipientEmail) {
      toast.warning("Please enter a recipient email address.");
      return;
    }

    setSendingEmail(true);

    try {
      const blob = await pdf(<SaudaPDF data={transformedData} />).toBlob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result.split(",")[1];

        try {
          await axios.post("/api/email/send-pdf", {
            email: recipientEmail,
            pdf: base64data,
            saudaNo: data.saudaNo,
          });

          toast.success("Email sent successfully!");
          setShowEmailPopup(false);
          setRecipientEmail("");
        } catch (error) {
          console.error("Email error:", error);
          toast.error("Failed to send email.");
        } finally {
          setSendingEmail(false);
        }
      };
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF for email.");
      setSendingEmail(false);
    }
  };
  return (
    <div className="flex items-center justify-center bg-white rounded-lg shadow-md p-2 gap-2">
      {loading ? (
        <button
          className="bg-gray-300 cursor-not-allowed text-gray-600 py-2 px-4 rounded-lg"
          disabled
        >
          Loading Data...
        </button>
      ) : (
        <>
          <PDFDownloadLink
            document={<SaudaPDF data={transformedData} />}
            fileName={`HANS-2025-${data.saudaNo}.pdf`}
          >
            {({ loading }) => (
              <button
                className={`flex items-center justify-center py-2 px-4 rounded-lg focus:outline-none transition duration-300 ${
                  loading
                    ? "bg-gray-300 cursor-not-allowed text-gray-600"
                    : "bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:scale-105"
                }`}
                title={loading ? "Generating document..." : "Download PDF"}
                disabled={loading}
              >
                {loading ? (
                  <span className="text-sm">Generating...</span>
                ) : (
                  <>
                    <FaDownload size={15} className="mr-2 animate-bounce" />
                    <span className="text-sm font-medium">Download</span>
                  </>
                )}
              </button>
            )}
          </PDFDownloadLink>
          
          <button
            onClick={() => setShowEmailPopup(true)}
            className={`flex items-center justify-center py-2 px-4 rounded-lg focus:outline-none transition duration-300 ${
              sendingEmail
                ? "bg-gray-300 cursor-not-allowed text-gray-600"
                : "bg-gradient-to-r from-green-500 to-green-700 text-white hover:scale-105"
            }`}
            title={sendingEmail ? "Sending email..." : "Send via Email"}
            disabled={sendingEmail}
          >
            {sendingEmail ? (
              <span className="text-sm">Sending...</span>
            ) : (
              <>
                <FaEnvelope size={15} className="mr-2" />
                <span className="text-sm font-medium">Email</span>
              </>
            )}
          </button>
        </>
      )}
      {showEmailPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold mb-4">Send PDF via Email</h3>
            <p className="text-xs text-slate-500 mb-2">
              Default email is picked from buyer emails. You can change it if needed.
            </p>
            <input
              type="email"
              placeholder="Enter recipient's email"
              className="w-full p-2 border rounded mb-4"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowEmailPopup(false)}
                className="py-2 px-4 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                className="py-2 px-4 rounded bg-green-500 text-white hover:bg-green-600"
                disabled={sendingEmail}
              >
                {sendingEmail ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

DownloadSauda.propTypes = {
  data: PropTypes.object.isRequired,
};

export default DownloadSauda;
