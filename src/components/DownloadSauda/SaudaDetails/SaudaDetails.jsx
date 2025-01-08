import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#ffffff",
  },
  headerBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f7f9fc",
    borderRadius: 5,
  },
  headerLeft: {
    color: "#FF0000",
    fontWeight: "bold",
    fontSize: 12,
  },
  headerRight: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#555555",
  },
  headerMiddle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#003366",
  },
  tableContainer: {
    marginTop: 10,
    border: "1px solid #003366",
    borderRadius: 5,
    overflow: "hidden",
  },
  tableHeader: {
    backgroundColor: "#003366",
    flexDirection: "row",
    padding: 5,
  },
  tableHeaderText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "#f7f9fc",
    padding: 5,
  },
  tableCell: {
    fontSize: 11,
    color: "#555555",
    flex: 1,
    textAlign: "center",
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderLeft: "1px solid #003366",
  },
  firstCell: {
    borderLeft: "none",
  },
});

const SaudaDetails = ({ data }) => (
  <View style={styles.section}>
    <View style={styles.headerBox}>
      <Text style={styles.headerLeft}>Sauda No: {data.saudaNo}</Text>
      <Text style={styles.headerMiddle}>Buyer PO No: {data.poNumber}</Text>
      <Text style={styles.headerRight}>
        Date: {new Date(data.poDate).toLocaleDateString()}
      </Text>
    </View>
    <View style={styles.tableContainer}>
      <View style={styles.tableHeader}>
        <Text style={styles.tableHeaderText}>Buyer Name (Debitor)</Text>
        <Text style={styles.tableHeaderText}>Supplier Company</Text>
        <Text style={styles.tableHeaderText}>Ship To (Consignee)</Text>
      </View>
      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, styles.firstCell]}>{data.buyer}</Text>
        <Text style={styles.tableCell}>{data.supplierCompany}</Text>
        <Text style={styles.tableCell}>{data.consignee}</Text>
      </View>
    </View>
  </View>
);

export default SaudaDetails;
