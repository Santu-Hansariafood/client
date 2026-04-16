import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import logo from "../../../assets/Hans.jpg";

const styles = StyleSheet.create({
  header: {
    paddingBottom: 10,
    marginBottom: 12,
    borderBottom: "1.5pt solid #1F7A3E",
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  logoBox: {
    width: 80,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: 2,
  },

  logo: {
    width: 68,
    height: 46,
    objectFit: "contain",
  },

  companyBox: {
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
    textAlign: "center",
  },

  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1F7A3E",
    letterSpacing: 0.4,
    marginBottom: 4,
    lineHeight: 1.3,
  },

  products: {
    fontSize: 8.2,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
    lineHeight: 1.25,
  },

  address: {
    fontSize: 7.4,
    color: "#4B5563",
    lineHeight: 1.35,
    maxWidth: "95%",
  },

  divider: {
    marginTop: 8,
    borderBottom: "0.5pt solid #D1D5DB",
  },

  saudaBox: {
    marginTop: 9,
    backgroundColor: "#E8F5E9",
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: "center",
    borderRadius: 2,
  },

  saudaTitle: {
    fontSize: 11.5,
    fontWeight: "bold",
    color: "#1F7A3E",
    letterSpacing: 1.2,
  },
});
const SaudaHeader = () => (
  <View style={styles.header} fixed>
    <View style={styles.row}>
      <View style={styles.logoBox}>
        <Image src={logo} style={styles.logo} />
      </View>

      <View style={styles.companyBox}>
        <Text style={styles.companyName}>HANSARIA FOOD PRIVATE LIMITED</Text>

        <Text style={styles.products}>
          MAIZE | SOYABEAN DOC | MDOC | DDGS | DORB | RICE
        </Text>

        <Text style={styles.address}>
          Primarc Square, Plot No.1, Salt Lake Bypass, LA Block, Sector 3,
          Bidhannagar, Kolkata – 700106
        </Text>
      </View>
    </View>

    <View style={styles.divider} />

    <View style={styles.saudaBox}>
      <Text style={styles.saudaTitle}>SAUDA AGREEMENT</Text>
    </View>
  </View>
);

export default SaudaHeader;
