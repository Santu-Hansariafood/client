import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import logo from "../../../assets/Hans.jpg";

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
    borderBottom: "2 solid #1F7A3E",
    paddingBottom: 10,
  },
  // Main branding container
  brandingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  logoContainer: {
    width: "25%",
  },
  logo: {
    width: 90,
    height: "auto",
  },
  companyDetails: {
    width: "75%",
    textAlign: "right",
  },
  companyName: {
    fontSize: 18,
    fontWeight: "heavy",
    color: "#1F7A3E",
    letterSpacing: 0.5,
  },
  address: {
    fontSize: 8,
    color: "#4B5563",
    marginTop: 2,
    lineHeight: 1.4,
  },
  productLine: {
    fontSize: 7,
    color: "#1F7A3E",
    fontWeight: "bold",
    marginTop: 4,
    textTransform: "uppercase",
  },
  // Document Title Bar
  titleBar: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderLeft: "4 solid #F4B400",
    padding: "6 10",
    marginTop: 5,
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#111827",
  },
  saudaMeta: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#374151",
  }
});

const SaudaHeader = ({ saudaNo = "1", date = "10-03-2026" }) => (
  <View style={styles.header} fixed>
    {/* Top Section: Logo and Company Info */}
    <View style={styles.brandingRow}>
      <View style={styles.logoContainer}>
        <Image src={logo} style={styles.logo} />
      </View>
      
      <View style={styles.companyDetails}>
        <Text style={styles.companyName}>HANSARIA FOOD PRIVATE LIMITED</Text>
        <Text style={styles.address}>
          Primarc Square, Plot No.1, Salt Lake Bypass, LA Block, Sector 3,{"\n"}
          Bidhannagar, Kolkata – 700106 [cite: 5]
        </Text>
        <Text style={styles.productLine}>
          MAIZE | SOYABEAN DOC | MDOC | DORB | WHEAT | RICE [cite: 6]
        </Text>
      </View>
    </View>

    {/* Secondary Section: Document Type and ID */}
    <View style={styles.titleBar}>
      <Text style={styles.titleText}>SAUDA AGREEMENT [cite: 2]</Text>
      <View style={{ flexDirection: 'row', gap: 15 }}>
        <Text style={styles.saudaMeta}>SAUDA NO: {saudaNo} </Text>
        <Text style={styles.saudaMeta}>DATE: {date} </Text>
      </View>
    </View>
  </View>
);

export default SaudaHeader;
