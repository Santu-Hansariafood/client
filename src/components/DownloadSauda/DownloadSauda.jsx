import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { PDFDownloadLink } from "@react-pdf/renderer";
import SaudaPDF from "./SaudaPDF/SaudaPDF";
import { FaDownload } from "react-icons/fa";
import axios from "axios";

const DownloadSauda = ({ data }) => {
  const [consigneeData, setConsigneeData] = useState([]);
  const [supplierData, setSupplierData] = useState([]);
  const [loading, setLoading] = useState(true);

  const CONSIGNEE_API_URL = "http://localhost:5000/api/consignees";
  const SUPPLIER_API_URL = "http://localhost:5000/api/seller-company";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const consigneeResponse = await axios.get(CONSIGNEE_API_URL);
        const supplierResponse = await axios.get(SUPPLIER_API_URL);

        setConsigneeData(consigneeResponse.data);
        setSupplierData(supplierResponse.data.data || []); // Extract `data` field
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Find matching consignee and supplier details
  const matchingConsignee = consigneeData.find(
    (consignee) =>
      consignee.name.toLowerCase() === data.consignee.toLowerCase()
  );

  const matchingSupplier = supplierData.find(
    (supplier) =>
      supplier.companyName.toLowerCase() === data.supplierCompany.toLowerCase()
  );

  // Merge matching details into the existing `data`
  const mergedData = {
    ...data,
    consigneeDetails: matchingConsignee || null,
    supplierDetails: matchingSupplier || null,
  };

  return (
    <div className="flex items-center justify-center bg-white rounded-lg shadow-md p-2">
      {loading ? (
        <button
          className="bg-gray-300 cursor-not-allowed text-gray-600 py-2 px-4 rounded-lg"
          disabled
        >
          Loading Data...
        </button>
      ) : (
        <PDFDownloadLink
          document={<SaudaPDF data={mergedData} />}
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
      )}
    </div>
  );
};

DownloadSauda.propTypes = {
  data: PropTypes.object.isRequired,
};

export default DownloadSauda;
