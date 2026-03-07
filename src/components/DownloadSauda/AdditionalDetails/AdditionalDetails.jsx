import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  section: {
    marginTop: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    border: "0.5pt solid #e2e8f0",
    borderRadius: 3,
    marginBottom: 10,
  },
  gridItem: {
    width: "33.33%",
    padding: 6,
    borderRight: "0.5pt solid #e2e8f0",
    borderBottom: "0.5pt solid #e2e8f0",
  },
  label: {
    fontSize: 7,
    color: "#718096",
    textTransform: "uppercase",
    marginBottom: 1,
    fontWeight: "bold",
  },
  value: {
    fontSize: 8,
    color: "#2d3748",
  },
  notesSection: {
    backgroundColor: "#f7fafc",
    padding: 6,
    borderRadius: 3,
    marginBottom: 10,
  },
  notesTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 3,
    textTransform: "uppercase",
  },
  notesText: {
    fontSize: 7,
    color: "#4a5568",
    lineHeight: 1.3,
    marginBottom: 1,
  },
  bankSection: {
    border: "0.5pt solid #1a365d",
    padding: 6,
    borderRadius: 3,
    marginBottom: 10,
  },
  bankTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#1a365d",
    textAlign: "center",
    marginBottom: 3,
    textTransform: "uppercase",
  },
  bankText: {
    fontSize: 8,
    color: "#2d3748",
    textAlign: "center",
    lineHeight: 1.3,
  },
  brokerageSection: {
    flexDirection: "row",
    border: "0.5pt solid #e2e8f0",
    borderRadius: 3,
    marginBottom: 10,
  },
  brokerageItem: {
    flex: 1,
    padding: 6,
    textAlign: "center",
    borderRight: "0.5pt solid #e2e8f0",
  },
  brokerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    padding: 2,
  },
  brokerText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#1a365d",
  },
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  signatureBox: {
    width: "30%",
    borderTop: "0.5pt solid #2d3748",
    textAlign: "center",
    paddingTop: 3,
  },
  signatureLabel: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#2d3748",
    textTransform: "uppercase",
  },
  footer: {
    marginTop: 10,
    textAlign: "center",
  },
  footerNote: {
    fontSize: 6,
    color: "#718096",
    fontStyle: "italic",
  },
});

const AdditionalDetails = ({ data }) => (
  <View style={styles.section}>
    <View style={styles.grid}>
      <View style={styles.gridItem}>
        <Text style={styles.label}>Weight</Text>
        <Text style={styles.value}>{data.weight ?? "N/A"}</Text>
      </View>
      <View style={styles.gridItem}>
        <Text style={styles.label}>Delivery Date</Text>
        <Text style={styles.value}>
          {data.deliveryDate 
            ? new Date(data.deliveryDate).toLocaleDateString("en-GB").replace(/\//g, "-")
            : "N/A"}
        </Text>
      </View>
      <View style={styles.gridItem}>
        <Text style={styles.label}>Loading Date</Text>
        <Text style={styles.value}>
          {data.loadingDate 
            ? new Date(data.loadingDate).toLocaleDateString("en-GB").replace(/\//g, "-")
            : "N/A"}
        </Text>
      </View>
      <View style={styles.gridItem}>
        <Text style={styles.label}>Payment Terms</Text>
        <Text style={styles.value}>{data.paymentTerms ?? "N/A"} Days</Text>
      </View>
      <View style={styles.gridItem}>
        <Text style={styles.label}>Loading Station</Text>
        <Text style={styles.value}>{data.state ?? "N/A"}</Text>
      </View>
      <View style={styles.gridItem}>
        <Text style={styles.label}>Location</Text>
        <Text style={styles.value}>{data.location ?? "N/A"}</Text>
      </View>
    </View>

    {data.notes && data.notes.length > 0 && (
      <View style={styles.notesSection}>
        <Text style={styles.notesTitle}>Special Notes</Text>
        {data.notes.map((note, index) => (
          <Text key={index} style={styles.notesText}>
            {index + 1}. {note}
          </Text>
        ))}
      </View>
    )}

    <View style={styles.bankSection}>
      <Text style={styles.bankTitle}>Bank Account Details</Text>
      {data.supplierDetails?.bankDetails?.[0] ? (
        <Text style={styles.bankText}>
          {data.supplierDetails.bankDetails[0].accountHolderName} | 
          A/C: {data.supplierDetails.bankDetails[0].accountNumber} | 
          IFSC: {data.supplierDetails.bankDetails[0].ifscCode} | 
          Branch: {data.supplierDetails.bankDetails[0].branchName}
        </Text>
      ) : (
        <Text style={styles.bankText}>Bank details not available</Text>
      )}
    </View>

    <View style={styles.brokerageSection}>
      <View style={styles.brokerageItem}>
        <Text style={styles.label}>Buyer Brokerage</Text>
        <Text style={styles.value}>Rs. {data.buyerBrokerage?.brokerageBuyer ?? "N/A"} / TON</Text>
      </View>
      <View style={[styles.brokerageItem, { borderRight: "none" }]}>
        <Text style={styles.label}>Supplier Brokerage</Text>
        <Text style={styles.value}>Rs. {data.supplierBrokerage?.[0]?.brokerage ?? "N/A"} / TON</Text>
      </View>
    </View>

    <View style={styles.brokerInfo}>
      <Text style={styles.brokerText}>Broker: HANSARIA FOOD PRIVATE LIMITED</Text>
      <Text style={styles.brokerText}>Agent Name: {data.agentName || "N/A"}</Text>
    </View>

    <View style={styles.signatureSection}>
      <View style={styles.signatureBox}>
        <Text style={styles.signatureLabel}>Seller Signature</Text>
      </View>
      <View style={styles.signatureBox}>
        <Text style={styles.signatureLabel}>Buyer Signature</Text>
      </View>
      <View style={styles.signatureBox}>
        <Text style={styles.signatureLabel}>Broker Signature</Text>
      </View>
    </View>

    <View style={styles.footer}>
      <Text style={styles.footerNote}>
        * This is a system-generated file. No physical signature is required.
      </Text>
    </View>
  </View>
);

export default AdditionalDetails;
