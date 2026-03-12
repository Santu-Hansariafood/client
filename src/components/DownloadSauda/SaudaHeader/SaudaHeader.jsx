import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import logo from "../../../assets/Hans.jpg";

const styles = StyleSheet.create({
  header: {
    borderBottom: "2pt solid #1F7A3E",
    paddingBottom: 10,
    marginBottom: 15,
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
    width: 90,
    height: 55,
    objectFit: "contain",
  },

  companySection: {
    flex: 1,
    paddingLeft: 12,
  },

  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F7A3E",
    marginBottom: 3,
    letterSpacing: 0.3,
  },

  address: {
    fontSize: 8.5,
    color: "#4B5563",
    lineHeight: 1.4,
    marginBottom: 4,
  },

  productLine: {
    fontSize: 8,
    color: "#1F2937",
    fontWeight: "bold",
    letterSpacing: 0.5,
  },

  saudaTitleBox: {
    marginTop: 8,
    backgroundColor: "#E8F5E9",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderLeft: "5pt solid #F4B400",
    borderRadius: 2,
  },

  saudaTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1F7A3E",
    letterSpacing: 1,
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
