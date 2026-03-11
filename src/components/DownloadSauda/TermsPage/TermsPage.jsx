import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },

  titleBox: {
    backgroundColor: "#E8F5E9",
    borderLeft: "6 solid #1F7A3E",
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
    border: "0.5 solid #E5E7EB",
    borderRadius: 4,
  },

  mainPointRow: {
    flexDirection: "row",
    marginBottom: 4,
  },

  mainBullet: {
    width: 12,
    fontSize: 10,
    color: "#F4B400",
    fontWeight: "bold",
  },

  mainText: {
    flex: 1,
    fontSize: 9.5,
    fontWeight: "bold",
    color: "#1F2937",
  },

  subPointRow: {
    flexDirection: "row",
    marginLeft: 12,
    marginBottom: 2,
  },

  subBullet: {
    width: 10,
    fontSize: 9,
    color: "#1F7A3E",
  },

  subText: {
    flex: 1,
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.4,
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
        <Text style={styles.mainBullet}>◆</Text>
        <Text style={styles.mainText}>Late Delivery Condition</Text>
      </View>

      <View style={styles.subPointRow}>
        <Text style={styles.subBullet}>▸</Text>
        <Text style={styles.subText}>
          Buyer must confirm with broker or concerned party before unloading goods if delivery is late.
        </Text>
      </View>

      <View style={styles.subPointRow}>
        <Text style={styles.subBullet}>▸</Text>
        <Text style={styles.subText}>
          If unloading is done without confirmation, buyer cannot deduct late delivery charges.
        </Text>
      </View>
    </View>

    {/* Detention */}
    <View style={styles.section}>
      <View style={styles.mainPointRow}>
        <Text style={styles.mainBullet}>◆</Text>
        <Text style={styles.mainText}>Detention Condition</Text>
      </View>

      <View style={styles.subPointRow}>
        <Text style={styles.subBullet}>▸</Text>
        <Text style={styles.subText}>
          Detention charges will be mutually decided between buyer and seller with broker confirmation.
        </Text>
      </View>
    </View>

    {/* Contract Terms */}
    <View style={styles.section}>
      <View style={styles.mainPointRow}>
        <Text style={styles.mainBullet}>◆</Text>
        <Text style={styles.mainText}>Contract Terms</Text>
      </View>

      <View style={styles.subPointRow}>
        <Text style={styles.subBullet}>▸</Text>
        <Text style={styles.subText}>
          Seller and Buyer cannot terminate the contract without prior notice.
        </Text>
      </View>

      <View style={styles.subPointRow}>
        <Text style={styles.subBullet}>▸</Text>
        <Text style={styles.subText}>
          Any dispute should first be resolved through mutual discussion.
        </Text>
      </View>

      <View style={styles.subPointRow}>
        <Text style={styles.subBullet}>▸</Text>
        <Text style={styles.subText}>
          If unresolved, dispute will follow the Indian Arbitration and Conciliation Act 1996.
        </Text>
      </View>

      <View style={styles.subPointRow}>
        <Text style={styles.subBullet}>▸</Text>
        <Text style={styles.subText}>
          Contract is subject to West Bengal jurisdiction.
        </Text>
      </View>
    </View>

    {/* Special Clauses */}
    <View style={styles.section}>
      <View style={styles.mainPointRow}>
        <Text style={styles.mainBullet}>◆</Text>
        <Text style={styles.mainText}>Special Clauses</Text>
      </View>

      <View style={styles.subPointRow}>
        <Text style={styles.subBullet}>▸</Text>
        <Text style={styles.subText}>
          Buyer and Seller cannot initiate legal action against broker or brokerage firm.
        </Text>
      </View>

      <View style={styles.subPointRow}>
        <Text style={styles.subBullet}>▸</Text>
        <Text style={styles.subText}>
          Broker may appear in court only as a witness.
        </Text>
      </View>

      <View style={styles.subPointRow}>
        <Text style={styles.subBullet}>▸</Text>
        <Text style={styles.subText}>
          Payments to broker or third parties cannot be stopped during disputes.
        </Text>
      </View>

      <View style={styles.subPointRow}>
        <Text style={styles.subBullet}>▸</Text>
        <Text style={styles.subText}>
          Third parties may take legal action if payments are withheld.
        </Text>
      </View>

      <View style={styles.subPointRow}>
        <Text style={styles.subBullet}>▸</Text>
        <Text style={styles.subText}>
          Signed contract copy must be returned within 24 hours.
        </Text>
      </View>

      <View style={styles.subPointRow}>
        <Text style={styles.subBullet}>▸</Text>
        <Text style={styles.subText}>
          Broker will not be liable for monetary losses.
        </Text>
      </View>

      <View style={styles.subPointRow}>
        <Text style={styles.subBullet}>▸</Text>
        <Text style={styles.subText}>
          Brokerage applies once the Sauda agreement is finalized.
        </Text>
      </View>
    </View>

  </View>
);

export default TermsPage;