import { Page, Document, StyleSheet, View } from "@react-pdf/renderer";
import SaudaHeader from "../SaudaHeader/SaudaHeader";
import SaudaDetails from "../SaudaDetails/SaudaDetails";
import CommodityTable from "../CommodityTable/CommodityTable";
import AdditionalDetails from "../AdditionalDetails/AdditionalDetails";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: 30,
    lineHeight: 1.2,
    color: "#2d3748",
    backgroundColor: "#ffffff",
  },
  border: {
    position: "absolute",
    top: 15,
    left: 15,
    right: 15,
    bottom: 15,
    border: "0.5pt solid #1a365d",
    pointerEvents: "none",
  },
});

const SaudaPDF = ({ data }) => (
  <Document>
    <Page style={styles.page} size="A4">
      <View style={styles.border} />
      <SaudaHeader />
      <SaudaDetails data={data} />
      <CommodityTable data={data} />
      <AdditionalDetails data={data} />
    </Page>
  </Document>
);

export default SaudaPDF;
