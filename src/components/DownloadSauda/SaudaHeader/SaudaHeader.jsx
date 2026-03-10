import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import logo from "../../../assets/Hans.jpg";

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
    paddingBottom: 10,
    borderBottom: "2 solid #1a365d",
  },

  logoContainer: {
    width: "35%",
  },

  logo: {
    width: 120,
    height: 80,
    objectFit: "contain",
  },

  textContainer: {
    width: "65%",
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
    fontSize: 10,
    fontWeight: "bold",
    color: "#2b6cb0",
    marginBottom: 4,
  },

  address: {
    fontSize: 8,
    color: "#4a5568",
    lineHeight: 1.3,
    marginBottom: 4,
  },

  tagline: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#2d3748",
  },
});

const SaudaHeader = () => (
  <View style={styles.header} fixed>
    <View style={styles.logoContainer}>
      <Image src={logo} style={styles.logo} />
    </View>

    <View style={styles.textContainer}>
      <Text style={styles.mainTitle}>HANSARIA FOOD PVT. LTD.</Text>
      <Text style={styles.subtitle}>BROKER & COMMISSION AGENT</Text>

      <Text style={styles.address}>
        Primarc Square, Plot No.1, Salt Lake Bypass, LA Block, Sector: 3,
        Bidhannagar, Kolkata, West Bengal 700106
      </Text>

      <Text style={styles.tagline}>
        MAIZE | SOYABEAN D.O.C | M.D.O.C | D.ORB | WHEAT | RICE
      </Text>
    </View>
  </View>
);

export default SaudaHeader;
