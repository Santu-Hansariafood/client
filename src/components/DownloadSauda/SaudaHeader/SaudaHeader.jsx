import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import logo from "../../../assets/Hans.jpg";

const styles = StyleSheet.create({
  header: {
    paddingBottom: 8,
    marginBottom: 10,
    borderBottom: "1.5pt solid #1F7A3E",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoBox: {
    width: 70,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  logo: {
    width: 60,
    height: 40,
    objectFit: "contain",
  },

  companyBox: {
    flex: 1,
    alignItems: "center",
    textAlign: "center",
  },

  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F7A3E",
    marginBottom: 6,
  },

  products: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 2,
  },

  address: {
    fontSize: 7,
    color: "#4B5563",
    marginTop: 1,
  },

  divider: {
    marginTop: 6,
    borderBottom: "0.5pt solid #D1D5DB",
  },

  saudaBox: {
    marginTop: 8,
    backgroundColor: "#E8F5E9",
    padding: 6,
  },

  saudaTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1F7A3E",
    letterSpacing: 1.5,
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
