import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  section: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#f7f9fc",
    borderRadius: 10,
    border: "1px solid #27ae60",
    boxShadow: "0 1px 4px rgba(39,174,96,0.07)",
  },
  headerBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 6,
    backgroundColor: "#eafaf1",
    borderRadius: 7,
  },
  headerLeft: {
    color: "#27ae60",
    fontWeight: "bold",
    fontSize: 9,
  },
  headerRight: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#f7ca18",
  },
  headerMiddle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#27ae60",
  },
  tableContainer: {
    marginTop: 7,
    border: "1px solid #27ae60",
    borderRadius: 7,
    overflow: "hidden",
  },
  tableHeader: {
    backgroundColor: "#27ae60",
    flexDirection: "row",
    padding: 4,
  },
  tableHeaderText: {
    color: "#f7ca18",
    fontSize: 10,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "#fffde7",
    paddingVertical: 4,
    paddingHorizontal: 3,
  },
  tableCell: {
    fontSize: 9,
    color: "#555555",
    flex: 1,
    textAlign: "center",
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderLeft: "1px solid #f7ca18",
  },
  firstCell: {
    borderLeft: "none",
  },
  addressDetails: {
    fontSize: 8,
    color: "#27ae60",
    marginTop: 2,
    lineHeight: 1.1,
  },
});

const SaudaDetails = ({ data }) => (
  <View style={styles.section}>
    <View style={styles.headerBox}>
      <Text style={styles.headerLeft}>Sauda No: {data.saudaNo}</Text>
      <Text style={styles.headerMiddle}>Buyer PO No: {data.poNumber}</Text>
      <Text style={styles.headerRight}>
        Date:{" "}
        {new Date(data.poDate).toLocaleDateString("en-GB").replace(/\//g, "-")}
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
        <Text style={styles.tableCell}>
          {data.supplierCompany}
          {data.supplierDetails ? (
            <Text style={styles.addressDetails}>
              {`\n${data.supplierDetails.address}, ${data.supplierDetails.district}, ${data.supplierDetails.state} - ${data.supplierDetails.pinNo}\n PAN No: ${data.supplierDetails.panNo}\nGST: ${data.supplierDetails.gstNo}`}
            </Text>
          ) : (
            "\nDetails not available"
          )}
        </Text>
        <Text style={styles.tableCell}>
          {data.consignee}
          {data.consigneeDetails && (
            <Text style={styles.addressDetails}>
              {`\n${data.consigneeDetails.location}, ${data.consigneeDetails.district}, ${data.consigneeDetails.state} - ${data.consigneeDetails.pin}\nPAN No : ${data.consigneeDetails.pan}\nGST: ${data.consigneeDetails.gst}`}
            </Text>
          )}
        </Text>
      </View>
    </View>
  </View>
);

export default SaudaDetails;
