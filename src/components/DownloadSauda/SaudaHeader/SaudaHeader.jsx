import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import logo from "../../../assets/Hans.jpg";

const styles = StyleSheet.create({
  header: {
    borderBottom: "2pt solid #1F7A3E",
    paddingBottom: 12,
    marginBottom: 14,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoContainer: {
    width: 110,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  logo: {
    width: 95,
    height: 60,
    objectFit: "contain",
  },

  companySection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    paddingHorizontal: 10,
  },

  spacer: {
    width: 110,
  },

  companyName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F7A3E",
    letterSpacing: 3,
    marginBottom: 5,
  },

  productLine: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1F2937",
    letterSpacing: 1.2,
    marginBottom: 4,
  },

  address: {
    fontSize: 9,
    color: "#4B5563",
    lineHeight: 1.4,
  },

  divider: {
    marginTop: 8,
    borderBottom: "1pt solid #D1D5DB",
  },

  saudaTitleBox: {
    marginTop: 10,
    backgroundColor: "#E8F5E9",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderLeft: "6pt solid #F4B400",
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

    <View style={styles.topRow}>

      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image src={logo} style={styles.logo} />
      </View>

      {/* Center Company Info */}
      <View style={styles.companySection}>
        <Text style={styles.companyName}>
          HANSARIA FOOD PRIVATE LIMITED
        </Text>

        <Text style={styles.productLine}>
          MAIZE | SOYABEAN DOC | MDOC | DORB | WHEAT | RICE
        </Text>

        <Text style={styles.address}>
          Primarc Square, Plot No.1, Salt Lake Bypass, LA Block, Sector 3,
          Bidhannagar, Kolkata – 700106
        </Text>
      </View>

      {/* Spacer for Perfect Center */}
      <View style={styles.spacer} />

    </View>

    <View style={styles.divider} />

    <View style={styles.saudaTitleBox}>
      <Text style={styles.saudaTitle}>SAUDA AGREEMENT</Text>
    </View>

  </View>
);

export default SaudaHeader;