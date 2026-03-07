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
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);

  const CONSIGNEE_API_URL = "/consignees";
  const SUPPLIER_API_URL = "/seller-company";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const consigneeResponse = await axios.get(CONSIGNEE_API_URL);
        const supplierResponse = await axios.get(SUPPLIER_API_URL);

        const cData = Array.isArray(consigneeResponse.data)
          ? consigneeResponse.data
          : consigneeResponse.data?.data || [];
        const sData = Array.isArray(supplierResponse.data)
          ? supplierResponse.data
          : supplierResponse.data?.data || [];

        setConsigneeData(cData);
        setSupplierData(sData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const matchingConsignee = consigneeData.find(
    (consignee) => consignee.name.toLowerCase() === data?.consignee?.toLowerCase()
  );

  const matchingSupplier = supplierData.find(
    (supplier) =>
      supplier.companyName.toLowerCase() === data.supplierCompany.toLowerCase()
  );

  let transformedData = {
    ...data,
    consigneeDetails: matchingConsignee || null,
    supplierDetails: matchingSupplier || null,
  };

  if (data.billTo === "consignee") {
    transformedData = {
      ...transformedData,
      buyer: data.consignee,
      buyerCompany: data.consignee,
      
    };
  }

  const handleSendEmail = async () => {
  try {
    const emails = [];

    if (data.sendPOToBuyer === "yes" && data.buyerEmails?.length) {
      emails.push(...data.buyerEmails.filter(e => e?.trim()));
    }

    if (data.sendPOToSupplier === "yes" && data.sellerEmails?.length) {
      emails.push(...data.sellerEmails.filter(e => e?.trim()));
    }

    const uniqueEmails = [...new Set(emails)];

    if (uniqueEmails.length === 0) {
      toast.warning("No recipient emails found.");
      return;
    }

    setSendingEmail(true);

    const blob = await pdf(<SaudaPDF data={transformedData} />).toBlob();

    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64data = reader.result.split(",")[1];

      try {
        await axios.post("/self-order/send-email", {
          email: uniqueEmails.join(","),
          pdfBase64: base64data,
          saudaNo: data.saudaNo,
          poNumber: data.poNumber,
        });

        toast.success("Email sent successfully!");
      } catch (error) {
        console.error("Email error:", error);
        toast.error("Failed to send email.");
      } finally {
        setSendingEmail(false);
      }
    };
  } catch (error) {
    console.error("Email error:", error);
    toast.error("Failed to send email.");
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
            onClick={handleSendEmail}
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
    </div>
  );
};

DownloadSauda.propTypes = {
  data: PropTypes.object.isRequired,
};

export default DownloadSauda;
