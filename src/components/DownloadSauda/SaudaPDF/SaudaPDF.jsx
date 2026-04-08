import { Page, Document, StyleSheet, View, Text } from "@react-pdf/renderer";
import SaudaHeader from "../SaudaHeader/SaudaHeader";
import SaudaDetails from "../SaudaDetails/SaudaDetails";
import CommodityTable from "../CommodityTable/CommodityTable";
import AdditionalDetails from "../AdditionalDetails/AdditionalDetails";
import TermsPage from "../TermsPage/TermsPage";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 25,
    lineHeight: 1.2,
    color: "#1F2937",
    backgroundColor: "#ffffff",
  },

  pageBorder: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderWidth: 1,
    borderColor: "#1F7A3E",
    borderStyle: "solid",
  },

  innerBorder: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    borderStyle: "solid",
  },

  section: {
    marginTop: 8,
  },

  bold: {
    fontWeight: "bold",
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 6,
  },

  footer: {
    position: "absolute",
    bottom: 15,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 6,
    color: "#6B7280",
  },

  footerLine: {
    height: 0.5,
    backgroundColor: "#E5E7EB",
    marginBottom: 4,
  },

  footerText: {
    fontSize: 6,
    color: "#6B7280",
  },

  watermark: {
    position: "absolute",
    top: "40%",
    left: "20%",
    fontSize: 60,
    color: "#F3F4F6",
    transform: [{ rotate: "-25deg" }],
    opacity: 0.3,
  },
});

const SaudaPDF = ({ data }) => (
  <Document>
    <Page style={styles.page} size="A4">
      <View style={styles.pageBorder} fixed />
      <View style={styles.innerBorder} fixed />

      <Text style={styles.watermark} fixed>
        HANSARIA
      </Text>

      <SaudaHeader />

      <View style={styles.divider} />
      <View style={styles.section}>
        <SaudaDetails data={data} />
      </View>
      <View style={styles.section}>
        <CommodityTable data={data} />
      </View>
      <View style={styles.section}>
        <AdditionalDetails data={data} />
      </View>
      <View style={styles.footer} fixed>
        <View style={styles.footerLine} />

        <Text style={styles.footerText}>
          <Text style={styles.bold}>Register Office: </Text>
          207, Maharshi Debendra Road, 6th Floor, Room No. 111, Kolkata - 700007
        </Text>

        <Text style={styles.footerText}>
          <Text style={styles.bold}>Contact: </Text>
          +91 98304 33535 / 93304 33535 | Email: info@hansariafood.com |
          Website: www.hansariafood.com
        </Text>
      </View>
    </Page>
    <Page style={styles.page} size="A4">
      <View style={styles.pageBorder} fixed />
      <View style={styles.innerBorder} fixed />

      <SaudaHeader />

      <View style={styles.section}>
        <TermsPage />
      </View>
      <View style={styles.footer} fixed>
        <View style={styles.footerLine} />

        <Text style={styles.footerText}>
          <Text style={styles.bold}>Register Office: </Text>
          207, Maharshi Debendra Road, 6th Floor, Room No. 111, Kolkata - 700007
        </Text>

        <Text style={styles.footerText}>
          <Text style={styles.bold}>Contact: </Text>
          +91 98304 33535 / 93304 33535 | Email: info@hansariafood.com |
          Website: www.hansariafood.com
        </Text>
      </View>
    </Page>
  </Document>
);

export default SaudaPDF;
