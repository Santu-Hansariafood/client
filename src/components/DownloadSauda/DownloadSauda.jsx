import React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import SaudaPDF from "./SaudaPDF/SaudaPDF";

const DownloadSauda = ({ data }) => (
  <PDFDownloadLink
    document={<SaudaPDF data={data} />}
    fileName={`HANS-2025-${data.saudaNo}.pdf`}
  >
    {({ loading }) =>
      loading ? "Generating document..." : "Download Sauda PDF"
    }
  </PDFDownloadLink>
);

export default DownloadSauda;
