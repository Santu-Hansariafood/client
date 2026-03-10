import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import logo from "../../../assets/Hans.jpg";

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: "2pt solid #1a365d",
  },
  logoContainer: {
    width: "30%",
  },
  logo: {
    width: 90,
    height: 60,
    objectFit: "contain",
  },
  textContainer: {
    width: "65%",
    textAlign: "right",
    flexDirection: "column",
    gap: 3,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a365d",
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 10,
    color: "#2b6cb0",
    letterSpacing: 1,
    textTransform: "uppercase",
    fontWeight: "bold",
    marginTop: 2,
    marginBottom: 4,
    borderTop: "0.5pt solid #e2e8f0",
    paddingTop: 2,
  },
  address: {
    fontSize: 8,
    color: "#4a5568",
    lineHeight: 1.4,
  },
  tagline: {
    fontSize: 8,
    color: "#2d3748",
    marginTop: 5,
    fontWeight: "bold",
    backgroundColor: "#f7fafc",
    padding: "2 5",
    borderRadius: 2,
  },
});

const SaudaHeader = () => (
  <View style={styles.header}>
    <View style={styles.logoContainer}>
      <Image src={logo} style={styles.logo} />
    </View>
    <View style={styles.textContainer}>
      <Text style={styles.mainTitle}>HANSARIA FOOD PVT. LTD.</Text>
      <Text style={styles.subtitle}>Broker & Commission Agent</Text>
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
