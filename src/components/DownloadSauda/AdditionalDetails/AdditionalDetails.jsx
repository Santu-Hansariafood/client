import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  section: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#ffffff",
    borderRadius: 5,
    border: "1px solid #003366",
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#003366",
    textAlign: "center",
  },
  tableContainer: {
    marginVertical: 10,
    border: "1px solid #003366",
    borderRadius: 5,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    padding: 5,
    backgroundColor: "#f7f9fc",
  },
  tableHeader: {
    backgroundColor: "#003366",
    flexDirection: "row",
    padding: 5,
  },
  tableCell: {
    flex: 1,
    padding: 5,
    fontSize: 8,
    textAlign: "center",
    color: "#555555",
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffffff",
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    padding: 10,
    borderTop: "1px solid #003366",
  },
  signatureText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#555555",
    textAlign: "center",
    flex: 1,
  },
  brokerInfo: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 8,
    fontWeight: "bold",
    color: "#003366",
  },
  footerNote: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 8,
    color: "#555555",
  },
  notesSection: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
    border: "1px solid #003366",
  },
  notesText: {
    fontSize: 8,
    color: "#555555",
    marginBottom: 5,
  },
});

const AdditionalDetails = ({ data }) => (
  <View>
    <View style={styles.section}>
      <Text style={styles.title}>Additional Details</Text>
      <View style={styles.tableContainer}>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>Weight: {data.weight} TON</Text>
          <Text style={styles.tableCell}>
            Delivery Date: {new Date(data.deliveryDate).toLocaleDateString()}
          </Text>
          <Text style={styles.tableCell}>
            Loading Date: {new Date(data.loadingDate).toLocaleDateString()}
          </Text>
          <Text style={styles.tableCell}>
            Payment Terms: {data.paymentTerms} Days
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
      <Text style={styles.brokerInfo}>
        Broker: HANSARIA FOOD PRIVATE LIMITED
      </Text>
      <Text style={styles.brokerInfo}>Agent Name: {data.agentName}</Text>
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
