import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  section: {
    marginTop: 7,
    padding: 10,
    backgroundColor: "#f7f9fc",
    borderRadius: 10,
    border: "1px solid #27ae60",
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#27ae60",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  tableContainer: {
    marginVertical: 7,
    border: "1px solid #27ae60",
    borderRadius: 7,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    padding: 4,
    backgroundColor: "#fffde7",
  },
  tableCell: {
    flex: 1,
    padding: 4,
    fontSize: 9,
    textAlign: "center",
    color: "#555555",
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#f7ca18",
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    padding: 6,
    borderTop: "1px solid #27ae60",
  },
  signatureText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#27ae60",
    textAlign: "center",
    flex: 1,
  },
  brokerInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 7,
    paddingHorizontal: 4,
  },
  brokerInfo: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#27ae60",
    flex: 1,
    textAlign: "center",
  },
  footerNote: {
    marginTop: 7,
    textAlign: "center",
    fontSize: 8,
    color: "#f7ca18",
  },
  notesSection: {
    marginTop: 7,
    padding: 10,
    backgroundColor: "#fffde7",
    borderRadius: 7,
    border: "1px solid #f7ca18",
  },
  notesText: {
    fontSize: 9,
    color: "#555555",
    marginBottom: 4,
  },
  bankDetails: {
    marginVertical: 7,
    padding: 10,
    backgroundColor: "#fffde7",
    borderRadius: 7,
    border: "1px solid #f7ca18",
    fontSize: 9,
    color: "#555555",
    textAlign: "center",
  },
});

const AdditionalDetails = ({ data }) => (
  <View>
    <View style={styles.section}>
      <Text style={styles.title}>Additional Details</Text>
      <View style={styles.tableContainer}>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>
            Weight: {"\n"}
            {data.weight}
          </Text>
          <Text style={styles.tableCell}>
            Delivery Date: {"\n"}
            {new Date(data.deliveryDate)
              .toLocaleDateString("en-GB")
              .replace(/\//g, "-")}
          </Text>
          <Text style={styles.tableCell}>
            Loading Date: {"\n"}
            {new Date(data.loadingDate)
              .toLocaleDateString("en-GB")
              .replace(/\//g, "-")}
          </Text>
          <Text style={styles.tableCell}>
            Payment Terms: {"\n"}
            {data.paymentTerms} Days
          </Text>
          <Text style={styles.tableCell}>
            Loading Station: {"\n"}
            {data.state}
          </Text>
          <Text style={styles.tableCell}>
            Location: {"\n"}
            {data.location}
          </Text>
        </View>
      </View>
      {data.notes && data.notes.length > 0 && (
        <View style={styles.notesSection}>
          <Text style={styles.title}>Notes</Text>
          {data.notes.map((note, index) => (
            <Text key={index} style={styles.notesText}>
              {index + 1}. {note}
            </Text>
          ))}
        </View>
      )}
      <View style={styles.bankDetails}>
        <Text style={styles.title}>Bank Account Details</Text>
        {data.supplierDetails?.bankDetails?.[0] ? (
          <Text>
            Account Holder:{" "}
            {data.supplierDetails.bankDetails[0].accountHolderName}
            {"\n"}Account No:{" "}
            {data.supplierDetails.bankDetails[0].accountNumber}
            {"\n"}IFSC: {data.supplierDetails.bankDetails[0].ifscCode}
            {"\n"}Branch: {data.supplierDetails.bankDetails[0].branchName}
          </Text>
        ) : (
          <Text>Bank details not available</Text>
        )}
      </View>
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, styles.tableHeaderCell]}>
            Buyer Brokerage
          </Text>
          <Text style={[styles.tableCell, styles.tableHeaderCell]}>
            Supplier Brokerage
          </Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>
            Buyer Brokerage{"\n"} Rs. {data.buyerBrokerage.brokerageBuyer} / TON
          </Text>
          <Text style={styles.tableCell}>
            Supplier Brokerage{"\n"} Rs.{" "}
            {data.supplierBrokerage[0]?.brokerage || "N/A"} / TON
          </Text>
        </View>
      </View>
      <View style={styles.brokerInfoContainer}>
        <Text style={styles.brokerInfo}>
          Broker: HANSARIA FOOD PRIVATE LIMITED
        </Text>
        <Text style={styles.brokerInfo}>Agent Name: {data.agentName}</Text>
      </View>
      <View style={styles.signatureRow}>
        <Text style={styles.signatureText}>Seller Signature</Text>
        <Text style={styles.signatureText}>Buyer Signature</Text>
        <Text style={styles.signatureText}>Brokerage Signature</Text>
      </View>
    </View>
    <Text style={styles.footerNote}>
      *This is a system-generated file. No signature required.
    </Text>
  </View>
);

export default AdditionalDetails;
