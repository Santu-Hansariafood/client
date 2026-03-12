import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import logo from "../../../assets/Hans.jpg";

const styles = StyleSheet.create({
  header: {
    borderBottom: "2pt solid #1F7A3E",
    paddingBottom: 8,
    marginBottom: 10,
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
    width: 80,
    height: 50,
    objectFit: "contain",
  },

  companySection: {
    flex: 1,
    paddingLeft: 10,
  },

  companyName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F7A3E",
    letterSpacing: 1,
    marginBottom: 2,
  },

  address: {
    fontSize: 8,
    color: "#4B5563",
    lineHeight: 1.2,
    marginBottom: 3,
  },

  productLine: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#1F2937",
    letterSpacing: 0.6,
  },

  saudaTitleBox: {
    marginTop: 6,
    backgroundColor: "#E8F5E9",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderLeft: "6pt solid #F4B400",
    borderRadius: 3,
  },

  saudaTitle: {
    fontSize: 13,
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