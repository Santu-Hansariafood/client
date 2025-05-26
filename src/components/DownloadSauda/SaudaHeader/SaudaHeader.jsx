import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import logo from "../../../assets/Hans.jpg";

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#27ae60",
    color: "#f7ca18",
    borderRadius: 10,
    boxShadow: "0 2px 8px rgba(39,174,96,0.10)",
  },
  logo: {
    width: 110, // Increased width for zoom effect
    height: 70, // Increased height for zoom effect
    marginRight: 15,
    objectFit: "cover", // Ensures the image is zoomed/cropped
    backgroundColor: "transparent", // Removes any background
    borderRadius: 8,
  },
  textContainer: {
    flex: 1,
    textAlign: "center",
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f7ca18",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 10,
    marginTop: 4,
    color: "#ffffff",
    letterSpacing: 0.5,
  },
});

const SaudaHeader = () => (
  <View style={styles.header}>
    <Image src={logo} style={styles.logo} />
    <View style={styles.textContainer}>
      <Text style={styles.mainTitle}>HANSARIA FOOD PVT. LTD.</Text>
      <Text style={styles.subtitle}>BROKER AND COMMISSION AGENT</Text>
      <Text style={styles.subtitle}>
        MAIZE | SOYABEAN D.O.C | M.D.O.C | D.ORB | WHEAT | RICE
      </Text>
    </View>
  </View>
);

export default SaudaHeader;
