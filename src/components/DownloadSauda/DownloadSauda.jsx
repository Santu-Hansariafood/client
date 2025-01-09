import PropTypes from "prop-types";
import { PDFDownloadLink } from "@react-pdf/renderer";
import SaudaPDF from "./SaudaPDF/SaudaPDF";
import { FaDownload } from "react-icons/fa";

const DownloadSauda = ({ data }) => (
  <div className="flex items-center justify-center bg-white rounded-lg shadow-md p-2">
    <PDFDownloadLink
      document={<SaudaPDF data={data} />}
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
  </div>
);

DownloadSauda.propTypes = {
  data: PropTypes.object.isRequired,
};

export default DownloadSauda;
