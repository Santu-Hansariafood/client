import { View, Text, StyleSheet, Image } from "@react-pdf/renderer";
import qr from "../../../assets/feedbackQR.png"; // your QR image

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },

  titleBox: {
    backgroundColor: "#E8F5E9",
    borderLeft: "6pt solid #1F7A3E",
    padding: 10,
    marginBottom: 12,
  },

  title: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1F7A3E",
    letterSpacing: 1,
  },

  section: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: "#FAFAFA",
    border: "0.5pt solid #E5E7EB",
  },

  mainPointRow: {
    flexDirection: "row",
    marginBottom: 5,
  },

  mainBulletBox: {
    width: 8,
    height: 8,
    backgroundColor: "#1F7A3E",
    marginRight: 6,
    marginTop: 3,
  },

  mainText: {
    flex: 1,
    fontSize: 9.5,
    fontWeight: "bold",
    color: "#1F2937",
  },

  subPointRow: {
    flexDirection: "row",
    marginLeft: 14,
    marginBottom: 3,
  },

  subBulletBox: {
    width: 5,
    height: 5,
    backgroundColor: "#F4B400",
    marginRight: 6,
    marginTop: 4,
  },

  subText: {
    flex: 1,
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.4,
  },

  feedbackSection: {
    marginTop: 20,
    paddingTop: 10,
    borderTop: "1pt solid #D1D5DB",
    alignItems: "center",
  },

  feedbackTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#1F2937",
  },

  qr: {
    width: 70,
    height: 70,
  },

  feedbackText: {
    marginTop: 4,
    fontSize: 8,
    color: "#6B7280",
  },
});

const TermsPage = () => (
  <View style={styles.container}>

    {/* TITLE */}
    <View style={styles.titleBox}>
      <Text style={styles.title}>TERMS & CONDITIONS</Text>
    </View>

    {/* Late Delivery */}
    <View style={styles.section}>
      <View style={styles.mainPointRow}>
        <View style={styles.mainBulletBox}/>
        <Text style={styles.mainText}>Late Delivery Condition</Text>
      </View>

      <View style={styles.subPointRow}>
        <View style={styles.subBulletBox}/>
        <Text style={styles.subText}>
          Buyer must confirm with broker before unloading goods if delivery is late.
        </Text>
      </View>

      <View style={styles.subPointRow}>
        <View style={styles.subBulletBox}/>
        <Text style={styles.subText}>
          If unloading is done without confirmation, late delivery charges cannot be deducted.
        </Text>
      </View>
    </View>

    {/* Detention */}
    <View style={styles.section}>
      <View style={styles.mainPointRow}>
        <View style={styles.mainBulletBox}/>
        <Text style={styles.mainText}>Detention Condition</Text>
      </View>

      <View style={styles.subPointRow}>
        <View style={styles.subBulletBox}/>
        <Text style={styles.subText}>
          Detention charges will be mutually decided between buyer and seller with broker confirmation.
        </Text>
      </View>
    </View>

    {/* FEEDBACK QR */}
    <View style={styles.feedbackSection}>
      <Text style={styles.feedbackTitle}>
        Scan QR Code to Give Feedback
      </Text>

      <Image src={qr} style={styles.qr} />

      <Text style={styles.feedbackText}>
        https://yourwebsite.com/feedback
      </Text>
    </View>

  </View>
);

export default TermsPage;