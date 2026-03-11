import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1F7A3E",
    marginBottom: 8,
  },

  clauseTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 6,
  },

  clauseText: {
    fontSize: 9,
    lineHeight: 1.4,
    marginBottom: 4,
  },

  listItem: {
    fontSize: 9,
    marginBottom: 3,
    lineHeight: 1.4,
  }
});

const TermsPage = () => (
  <View>

    <Text style={styles.sectionTitle}>TERMS & CONDITIONS</Text>

    <Text style={styles.clauseTitle}>1. Late Delivery Condition</Text>
    <Text style={styles.clauseText}>
      In case of late delivery, the buyer must first obtain confirmation from the broker or the concerned party before unloading the goods.
    </Text>

    <Text style={styles.clauseTitle}>2. Detention Condition</Text>
    <Text style={styles.clauseText}>
      Detention charges, if applicable, shall be determined mutually between the buyer and seller with broker confirmation.
    </Text>

    <Text style={styles.clauseTitle}>3. Contract Terms</Text>

    <Text style={styles.listItem}>1. The Seller and Buyer shall not terminate this contract without prior notice.</Text>
    <Text style={styles.listItem}>2. Any dispute shall be resolved through mutual discussion.</Text>
    <Text style={styles.listItem}>3. If unresolved, disputes will follow the Indian Arbitration and Conciliation Act 1996.</Text>
    <Text style={styles.listItem}>4. This contract is subject to West Bengal jurisdiction.</Text>

    <Text style={styles.clauseTitle}>4. Special Clauses</Text>

    <Text style={styles.listItem}>1. Buyer and Seller shall not initiate legal action against the Broker.</Text>
    <Text style={styles.listItem}>2. Broker shall appear only as a witness in legal proceedings.</Text>
    <Text style={styles.listItem}>3. Payments to broker or third parties must not be withheld.</Text>
    <Text style={styles.listItem}>4. Third parties may take legal action if payments are withheld.</Text>
    <Text style={styles.listItem}>5. Signed contract must be returned within 24 hours.</Text>
    <Text style={styles.listItem}>6. Broker is not liable for financial losses.</Text>
    <Text style={styles.listItem}>7. Brokerage is applicable once the Sauda is finalized.</Text>

  </View>
);

export default TermsPage;