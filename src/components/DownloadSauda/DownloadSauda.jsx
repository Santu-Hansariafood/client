import { useState, useEffect, cloneElement } from "react";
import PropTypes from "prop-types";
import { pdf } from "@react-pdf/renderer";
import { downloadFile } from "../../utils/fileDownloader";
import SaudaPDF from "./SaudaPDF/SaudaPDF";
import { FaDownload, FaEnvelope } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import { fetchAllPages } from "../../utils/apiClient/fetchAllPages";
import { buildSaudaPdfData } from "../../utils/saudaPdf/buildSaudaPdfData";

const DownloadSauda = ({
  data,
  button,
  consigneeData: initialConsigneeData,
  supplierData: initialSupplierData,
  buyerData: initialBuyerData,
  sellerProfileData: initialSellerProfileData,
  autoEmail = false,
}) => {
  const [consigneeData, setConsigneeData] = useState(
    initialConsigneeData || [],
  );
  const [supplierData, setSupplierData] = useState(initialSupplierData || []);
  const [buyerData, setBuyerData] = useState(initialBuyerData || []);
  const [sellerProfileData, setSellerProfileData] = useState(
    initialSellerProfileData || [],
  );
  const [companyData, setCompanyData] = useState([]);
  const [loading, setLoading] = useState(
    !initialConsigneeData ||
      !initialSupplierData ||
      !initialBuyerData ||
      !initialSellerProfileData,
  );
  const [sendingEmail, setSendingEmail] = useState(false);

  const CONSIGNEE_API_URL = "/consignees";
  const SUPPLIER_API_URL = "/seller-company";
  const BUYER_API_URL = "/buyers";
  const COMPANY_API_URL = "/companies";
  const SELLER_PROFILE_API_URL = "/sellers";

  useEffect(() => {
    if (
      initialConsigneeData &&
      initialSupplierData &&
      initialBuyerData &&
      initialSellerProfileData
    ) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [cData, sData, bData, spData, companyRows] = await Promise.all([
          fetchAllPages(CONSIGNEE_API_URL, { limit: 200 }),
          fetchAllPages(SUPPLIER_API_URL, { limit: 200 }),
          fetchAllPages(BUYER_API_URL, { limit: 200 }),
          fetchAllPages(SELLER_PROFILE_API_URL, { limit: 200 }),
          fetchAllPages(COMPANY_API_URL, { limit: 200 }),
        ]);

        setConsigneeData(cData);
        setSupplierData(sData);
        setBuyerData(bData);
        setSellerProfileData(spData);
        setCompanyData(companyRows);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    initialConsigneeData,
    initialSupplierData,
    initialBuyerData,
    initialSellerProfileData,
  ]);

  const transformedData = buildSaudaPdfData({
    item: data,
    consigneeData,
    supplierData,
    buyerData,
    companyData,
    getConsigneeDisplay: (row) => {
      const c = row?.consignee;
      if (typeof c === "object" && c?.name) return c.name;
      if (typeof c === "object" && c?.label) return c.label;
      return String(c || "N/A");
    },
  });

  const matchingSellerProfile = sellerProfileData.find(
    (seller) => seller._id === data.supplier,
  );
  const rawBuyerKey = data?.buyerCompany ?? data?.buyer ?? "";
  const matchingBuyer =
    companyData.find(
      (c) =>
        (c?._id && String(c._id) === String(rawBuyerKey)) ||
        String(c?.companyName || "")
          .trim()
          .toLowerCase() ===
          String(rawBuyerKey || "")
            .trim()
            .toLowerCase(),
    ) ||
    buyerData.find(
      (b) =>
        (b?._id && String(b._id) === String(rawBuyerKey)) ||
        String(b?.companyName || "")
          .trim()
          .toLowerCase() ===
          String(rawBuyerKey || "")
            .trim()
            .toLowerCase(),
    );

  if (
    matchingBuyer &&
    (!transformedData.buyerBrokerage?.brokerageBuyer ||
      transformedData.buyerBrokerage.brokerageBuyer === 0)
  ) {
    const buyerProfileBrokerage =
      matchingBuyer.brokerageByName?.[data.commodity] ||
      matchingBuyer.brokerage?.[data.commodity];
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
    const supplierProfileBrokerage = matchingSellerProfile.commodities?.find(
      (c) => c.name === data.commodity,
    )?.brokerage;
    if (supplierProfileBrokerage !== undefined) {
      transformedData.buyerBrokerage = {
        ...transformedData.buyerBrokerage,
        brokerageSupplier: supplierProfileBrokerage,
      };
    }
  }

  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");

  const computeDefaultEmails = () => {
    const buyerEmails = Array.isArray(data?.buyerEmails)
      ? data.buyerEmails.filter(Boolean)
      : [];
    const sellerEmails = Array.isArray(data?.sellerEmails)
      ? data.sellerEmails.filter(Boolean)
      : [];
    const fromSingle = data?.buyerEmail ? [data.buyerEmail] : [];
    const allEmails = [
      ...new Set([...buyerEmails, ...sellerEmails, ...fromSingle]),
    ];
    return allEmails.join(", ");
  };

  useEffect(() => {
    if (!showEmailPopup) return;
    setRecipientEmail(computeDefaultEmails());
  }, [showEmailPopup, data]);

  const sendEmail = async (emailString) => {
    if (!emailString) {
      toast.warning("No recipient email addresses found.");
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
            email: emailString,
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

  const handleSendEmail = async () => {
    if (!recipientEmail) {
      toast.warning("Please enter a recipient email address.");
      return;
    }
    await sendEmail(recipientEmail);
  };

  const handleAutoEmail = async () => {
    const defaultEmails = computeDefaultEmails();
    await sendEmail(defaultEmails);
  };
  const [isGenerating, setIsGenerating] = useState(false);

  const handleManualDownload = async () => {
    setIsGenerating(true);
    try {
       const blob = await pdf(<SaudaPDF data={transformedData} />).toBlob();
       await downloadFile(blob, `HANS-2026-2027-${data.saudaNo}.pdf`);
       if (autoEmail) {
        await handleAutoEmail();
      }
    } catch (error) {
      console.error("PDF Download error:", error);
      toast.error("Failed to generate PDF.");
    } finally {
      setIsGenerating(false);
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
          {button ? (
            cloneElement(button, {
              onClick: async (e) => {
                if (button.props.onClick) {
                  button.props.onClick(e);
                }
                await handleManualDownload();
              },
              disabled: isGenerating,
            })
          ) : (
            <button
              onClick={handleManualDownload}
              className={`flex items-center justify-center py-2 px-4 rounded-lg focus:outline-none transition duration-300 ${
                isGenerating
                  ? "bg-gray-300 cursor-not-allowed text-gray-600"
                  : "bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:scale-105"
              }`}
              title={isGenerating ? "Generating document..." : "Download PDF"}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <span className="text-sm">Generating...</span>
              ) : (
                <>
                  <FaDownload size={15} className="mr-2 animate-bounce" />
                  <span className="text-sm font-medium">Download</span>
                </>
              )}
            </button>
          )}

          {!button && (
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
          )}
        </>
      )}
      {showEmailPopup && !autoEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold mb-4">Send PDF via Email</h3>
            <p className="text-xs text-slate-500 mb-2">
              Default email is picked from buyer emails. You can change it if
              needed.
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
  button: PropTypes.node,
  consigneeData: PropTypes.array,
  supplierData: PropTypes.array,
  buyerData: PropTypes.array,
  sellerProfileData: PropTypes.array,
  autoEmail: PropTypes.bool,
};

export default DownloadSauda;
