import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import logo from "../../../assets/Hans.jpg";

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottom: "1.5pt solid #1a365d",
  },
  logoContainer: {
    width: "25%",
  },
  logo: {
    width: 80,
    height: 50,
    objectFit: "contain",
  },
  textContainer: {
    width: "70%",
    textAlign: "right",
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a365d",
    letterSpacing: 1,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 8,
    color: "#4a5568",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  address: {
    fontSize: 7,
    color: "#718096",
    marginTop: 2,
    lineHeight: 1.2,
  },
  tagline: {
    fontSize: 7,
    color: "#1a365d",
    marginTop: 4,
    fontStyle: "italic",
    fontWeight: "bold",
  },
});

const SaudaHeader = () => (
  <View style={styles.header}>
    <View style={styles.logoContainer}>
      <Image src={logo} style={styles.logo} />
    </View>
    <View style={styles.textContainer}>
      <Text style={styles.mainTitle}>HANSARIA FOOD PVT. LTD.</Text>
      <Text style={styles.subtitle}>Broker and Commission Agent</Text>
      <Text style={styles.address}>
        Primarc Square, Plot No.1, Salt Lake Bypass, LA Block, Sector: 3, Bidhannagar, Kolkata, West Bengal 700106
      </Text>
      <Text style={styles.tagline}>
        MAIZE | SOYABEAN D.O.C | M.D.O.C | D.ORB | WHEAT | RICE
      </Text>
    </View>
  </View>
);

export default SaudaHeader;
