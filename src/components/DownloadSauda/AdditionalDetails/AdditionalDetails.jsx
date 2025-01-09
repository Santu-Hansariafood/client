import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  section: {
    marginTop: 5,
    padding: 8,
    backgroundColor: "#ffffff",
    borderRadius: 5,
    border: "1px solid #003366",
  },
  title: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#003366",
    textAlign: "center",
  },
  tableContainer: {
    marginVertical: 5,
    border: "1px solid #003366",
    borderRadius: 5,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    padding: 3,
    backgroundColor: "#f7f9fc",
  },
  tableCell: {
    flex: 1,
    padding: 3,
    fontSize: 8,
    textAlign: "center",
    color: "#555555",
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#ffffff",
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    padding: 5,
    borderTop: "1px solid #003366",
  },
  signatureText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#555555",
    textAlign: "center",
    flex: 1,
  },
  brokerInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 5,
    paddingHorizontal: 3,
  },
  brokerInfo: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#003366",
    flex: 1,
    textAlign: "center",
  },
  footerNote: {
    marginTop: 5,
    textAlign: "center",
    fontSize: 7,
    color: "#555555",
  },
  notesSection: {
    marginTop: 5,
    padding: 8,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
    border: "1px solid #003366",
  },
  notesText: {
    fontSize: 8,
    color: "#555555",
    marginBottom: 3,
  },
  bankDetails: {
    marginVertical: 5,
    padding: 8,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
    border: "1px solid #003366",
    fontSize: 8,
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
          <Text style={styles.tableCell}>Weight: `{data.weight}</Text>
          <Text style={styles.tableCell}>
            Delivery Date: {new Date(data.deliveryDate).toLocaleDateString()}
          </Text>
          <Text style={styles.tableCell}>
            Loading Date: {new Date(data.loadingDate).toLocaleDateString()}
          </Text>
          <Text style={styles.tableCell}>
            Payment Terms: {data.paymentTerms} Days
          </Text>
          <Text style={styles.tableCell}>
            Loading Station: {data.state}
          </Text>
          <Text style={styles.tableCell}>
            Location: {data.location}
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
            Account Holder: {data.supplierDetails.bankDetails[0].accountHolderName}
            {"\n"}Account No: {data.supplierDetails.bankDetails[0].accountNumber}
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
            Rs. {data.buyerBrokerage.brokerageBuyer} / TON
          </Text>
          <Text style={styles.tableCell}>
            Rs. {data.supplierBrokerage[0]?.brokerage || "N/A"} / TON
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
