import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import logo from "../../../assets/Hans.jpg";

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderBottom: "2pt solid #1F7A3E",
    zIndex: 1000,
  },

  topBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "#1F7A3E",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoBox: {
    width: 80,
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    width: 65,
    height: 45,
    objectFit: "contain",
  },

  companyBox: {
    flex: 1,
    alignItems: "center",
    textAlign: "center",
  },

  companyName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#166534",
    letterSpacing: 1,
  },

  products: {
    fontSize: 9,
    color: "#374151",
    marginTop: 3,
    letterSpacing: 0.5,
  },

  address: {
    fontSize: 8,
    color: "#6B7280",
    marginTop: 2,
  },

  divider: {
    marginTop: 8,
    borderBottom: "0.5pt solid #D1D5DB",
  },

  saudaBox: {
    marginTop: 10,
    backgroundColor: "#E6F4EA",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderLeft: "4pt solid #1F7A3E",
  },

  saudaTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#14532D",
    letterSpacing: 2,
  },
});

const SaudaHeader = () => (
  <View style={styles.header} fixed>
    <View style={styles.topBorder} />

    <View style={styles.row}>
      <View style={styles.logoBox}>
        <Image src={logo} style={styles.logo} />
      </View>

      <View style={styles.companyBox}>
        <Text style={styles.companyName}>
          HANSARIA FOOD PRIVATE LIMITED
        </Text>

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
