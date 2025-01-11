import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  section: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#ffffff",
  },
  headerBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 5,
    backgroundColor: "#f7f9fc",
    borderRadius: 5,
  },
  headerLeft: {
    color: "#FF0000",
    fontWeight: "bold",
    fontSize: 8,
  },
  headerRight: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#555555",
  },
  headerMiddle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#003366",
  },
  tableContainer: {
    marginTop: 5,
    border: "1px solid #003366",
    borderRadius: 5,
    overflow: "hidden",
  },
  tableHeader: {
    backgroundColor: "#003366",
    flexDirection: "row",
    padding: 3,
  },
  tableHeaderText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "#f7f9fc",
    paddingVertical: 3,
    paddingHorizontal: 2,
  },
  tableCell: {
    fontSize: 8,
    color: "#555555",
    flex: 1,
    textAlign: "center",
    paddingVertical: 2,
    paddingHorizontal: 3,
    borderLeft: "1px solid #003366",
  },
  firstCell: {
    borderLeft: "none",
  },
  addressDetails: {
    fontSize: 7,
    color: "#555555",
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
