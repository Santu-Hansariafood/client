import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import logo from "../../../assets/Hans.jpg";

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#003366",
    color: "#ffffff",
    borderRadius: 5,
  },
  logo: {
    width: 80,
    height: 50,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
    textAlign: "center",
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 10,
    marginTop: 4,
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
