import React from "react";
import { Page, Document, StyleSheet } from "@react-pdf/renderer";
import SaudaHeader from "../SaudaHeader/SaudaHeader";
import SaudaDetails from "../SaudaDetails/SaudaDetails";
import CommodityTable from "../CommodityTable/CommodityTable";
import AdditionalDetails from "../AdditionalDetails/AdditionalDetails";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 12,
    padding: 30,
  },
});

const SaudaPDF = ({ data }) => (
  <Document>
    <Page style={styles.page}>
      <SaudaHeader />
      <SaudaDetails data={data} />
      <CommodityTable data={data} />
      <AdditionalDetails data={data} />
    </Page>
  </Document>
);

export default SaudaPDF;
