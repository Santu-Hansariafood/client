import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import logo from "../../../assets/Hans.jpg";

const styles = StyleSheet.create({
  header: {
    borderBottom: "3 solid #1F7A3E",
    paddingBottom: 12,
    marginBottom: 15,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logo: {
    width: 110,
    height: 70,
    objectFit: "contain",
  },

  companySection: {
    textAlign: "right",
  },

  companyName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F7A3E",
    letterSpacing: 1,
  },

  subtitle: {
    fontSize: 10,
    color: "#F4B400",
    fontWeight: "bold",
    marginTop: 2,
  },

  address: {
    fontSize: 8,
    color: "#4B5563",
    marginTop: 4,
    lineHeight: 1.3,
  },

  productLine: {
    marginTop: 6,
    fontSize: 8,
    color: "#1F2937",
    fontWeight: "bold",
  },

  saudaTitleBox: {
    marginTop: 10,
    backgroundColor: "#E8F5E9",
    padding: 6,
    borderLeft: "5 solid #F4B400",
  },

  saudaTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1F7A3E",
  },
});

const SaudaHeader = () => (
  <View style={styles.header} fixed>
    <View style={styles.topRow}>
      <Image src={logo} style={styles.logo} />

      <View style={styles.companySection}>
        <Text style={styles.companyName}>HANSARIA FOOD PVT. LTD.</Text>

        <Text style={styles.subtitle}>
          BROKER & COMMISSION AGENT
        </Text>

        <Text style={styles.address}>
          Primarc Square, Plot No.1, Salt Lake Bypass, LA Block, Sector 3,
          Bidhannagar, Kolkata – 700106
        </Text>

        <Text style={styles.productLine}>
          MAIZE | SOYABEAN DOC | MDOC | DORB | WHEAT | RICE
        </Text>
      </View>
    </View>

    <View style={styles.saudaTitleBox}>
      <Text style={styles.saudaTitle}>SAUDA AGREEMENT</Text>
    </View>
  </View>
);

export default SaudaHeader;
