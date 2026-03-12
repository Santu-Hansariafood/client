import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import logo from "../../../assets/Hans.jpg";

const styles = StyleSheet.create({
  header: {
    paddingBottom: 12,
    marginBottom: 15,
    borderBottom: "2pt solid #1F7A3E",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoBox: {
    width: 90,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  logo: {
    width: 80,
    height: 50,
    objectFit: "contain",
  },

  companyBox: {
    flex: 1,
    alignItems: "center",
    textAlign: "center",
  },

  companyName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F7A3E",
    marginBottom: 12,
  },

  products: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },

  address: {
    fontSize: 9,
    color: "#4B5563",
    marginTop: 2,
  },

  divider: {
    marginTop: 10,
    borderBottom: "1pt solid #D1D5DB",
  },

  saudaBox: {
    marginTop: 12,
    backgroundColor: "#E8F5E9",
    padding: 8,
  },

  saudaTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1F7A3E",
    letterSpacing: 2,
  },
});
const SaudaHeader = () => (
  <View style={styles.header} fixed>

    <View style={styles.row}>

      <View style={styles.logoBox}>
        <Image src={logo} style={styles.logo} />
      </View>

      <View style={styles.companyBox}>
        <Text style={styles.companyName}>
          HANSARIA FOOD PRIVATE LIMITED
        </Text>

        <Text style={styles.products}>
          MAIZE | SOYABEAN DOC | MDOC | DORB | WHEAT | RICE
        </Text>

        <Text style={styles.address}>
          Primarc Square, Plot No.1, Salt Lake Bypass, LA Block,
          Sector 3, Bidhannagar, Kolkata – 700106
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