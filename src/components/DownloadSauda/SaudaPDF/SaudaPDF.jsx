import { Page, Document, StyleSheet, View, Text } from "@react-pdf/renderer";
import SaudaHeader from "../SaudaHeader/SaudaHeader";
import SaudaDetails from "../SaudaDetails/SaudaDetails";
import CommodityTable from "../CommodityTable/CommodityTable";
import AdditionalDetails from "../AdditionalDetails/AdditionalDetails";
import TermsPage from "../TermsPage/TermsPage";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingTop: 35,
    paddingBottom: 35,
    paddingHorizontal: 30,
    lineHeight: 1.3,
    color: "#1F2937",
    backgroundColor: "#ffffff",
  },

  pageBorder: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    border: "1 solid #1F7A3E",
  },

  innerBorder: {
    position: "absolute",
    top: 18,
    left: 18,
    right: 18,
    bottom: 18,
    border: "0.5 solid #E5E7EB",
  },

  section: {
    marginTop: 12,
  },

  bold: {
  fontWeight: "bold",
},

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 10,
  },

  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 7,
    color: "#6B7280",
  },

  footerLine: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginBottom: 5,
  },

  footerText: {
    fontSize: 7,
    color: "#6B7280",
  },

  watermark: {
    position: "absolute",
    top: "40%",
    left: "20%",
    fontSize: 60,
    color: "#E8F5E9",
    transform: "rotate(-25deg)",
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
          +91 98304 33535 / 93304 33535 | Email: info@hansariafood.com | Website: www.hansariafood.com
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
          +91 98304 33535 / 93304 33535 | Email: info@hansariafood.com | Website: www.hansariafood.com
        </Text>
      </View>
  </Page>
  </Document>
);

export default SaudaPDF;