import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import logo from "../../../assets/Hans.jpg";

const styles = StyleSheet.create({
  header: {
    borderBottom: "3 solid #1F7A3E",
    paddingBottom: 8,
    marginBottom: 12,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  logoContainer: {
    flex: 0.3,
    alignItems: "flex-start",
  },

  logo: {
    width: 95,
    height: 60,
  },

  companySection: {
    flex: 0.7,
    paddingLeft: 10,
  },

  companyName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1F7A3E",
    marginBottom: 2,
  },

  address: {
    fontSize: 8,
    color: "#4B5563",
    lineHeight: 1.3,
    marginBottom: 3,
    maxWidth: "100%",
  },

  productLine: {
    fontSize: 8,
    color: "#1F2937",
    fontWeight: "bold",
  },

  saudaTitleBox: {
    marginTop: 6,
    backgroundColor: "#E8F5E9",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderLeft: "4 solid #F4B400",
  },

  saudaTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1F7A3E",
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
