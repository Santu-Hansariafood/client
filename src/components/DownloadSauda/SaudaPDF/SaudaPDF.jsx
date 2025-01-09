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
    lineHeight: 0,
  },
  componentSpacing: {
    marginBottom: 0,
  },
});

const SaudaPDF = ({ data }) => (
  <Document>
    <Page style={styles.page}>
      <SaudaHeader style={{ marginBottom: 0 }} />
      <SaudaDetails data={data} style={styles.componentSpacing} />
      <CommodityTable data={data} style={styles.componentSpacing} />
      <AdditionalDetails data={data} />
    </Page>
  </Document>
);

export default SaudaPDF;
