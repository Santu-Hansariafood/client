import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import logo from "../../../assets/Hans.jpg";

const styles = StyleSheet.create({
  header: {
    borderBottom: "2pt solid #1F7A3E",
    paddingBottom: 10,
    marginBottom: 12,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoContainer: {
    width: 95,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  logo: {
    width: 85,
    height: 55,
    objectFit: "contain",
  },

  companySection: {
    flex: 1,
    paddingLeft: 10,
  },

  companyName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F7A3E",
    letterSpacing: 2,
    marginBottom: 4,
  },

  productLine: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#1F2937",
    letterSpacing: 1,
    marginBottom: 3,
  },

  address: {
    fontSize: 8,
    color: "#4B5563",
    lineHeight: 1.3,
  },

  divider: {
    marginTop: 6,
    borderBottom: "1pt solid #D1D5DB",
  },

  saudaTitleBox: {
    marginTop: 8,
    backgroundColor: "#E8F5E9",
    paddingVertical: 6,
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

      <View style={styles.logoContainer}>
        <Image src={logo} style={styles.logo} />
      </View>

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

    </View>

    <View style={styles.divider} />

    <View style={styles.saudaTitleBox}>
      <Text style={styles.saudaTitle}>SAUDA AGREEMENT</Text>
    </View>

  </View>
);

export default SaudaHeader;