import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  section: {
    marginBottom: 10,
    padding: 0,
    backgroundColor: "#ffffff",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    borderBottom: "0.5pt solid #e2e8f0",
    paddingBottom: 5,
  },
  headerItem: {
    flex: 1,
  },
  label: {
    fontSize: 7,
    color: "#718096",
    textTransform: "uppercase",
    marginBottom: 1,
    fontWeight: "bold",
  },
  value: {
    fontSize: 9,
    color: "#2d3748",
    fontWeight: "bold",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 0,
  },
  gridItem: {
    width: "33.33%",
    padding: 2,
    marginBottom: 5,
  },
  addressDetails: {
    fontSize: 7,
    color: "#4a5568",
    marginTop: 1,
    lineHeight: 1.1,
    fontWeight: "normal",
  },
});

const SaudaDetails = ({ data }) => (
  <View style={styles.section}>
    <View style={styles.headerRow}>
      <View style={styles.headerItem}>
        <Text style={styles.label}>Sauda No</Text>
        <Text style={styles.value}>{data.saudaNo}</Text>
      </View>
      <View style={styles.headerItem}>
        <Text style={styles.label}>Buyer PO No</Text>
        <Text style={styles.value}>{data.poNumber || "N/A"}</Text>
      </View>
      <View style={[styles.headerItem, { textAlign: "right" }]}>
        <Text style={styles.label}>Date</Text>
        <Text style={styles.value}>
          {new Date(data.poDate).toLocaleDateString("en-GB").replace(/\//g, "-")}
        </Text>
      </View>
    </View>

    <View style={styles.grid}>
      <View style={styles.gridItem}>
        <Text style={styles.label}>Buyer Name (Debitor)</Text>
        <Text style={styles.value}>{data.buyer}</Text>
      </View>
      <View style={styles.gridItem}>
        <Text style={styles.label}>Supplier Company</Text>
        <Text style={styles.value}>{data.supplierCompany}</Text>
        {data.supplierDetails ? (
          <Text style={styles.addressDetails}>
            {`\n${data.supplierDetails.address}, ${data.supplierDetails.district}, ${data.supplierDetails.state} - ${data.supplierDetails.pinNo}\n PAN No: ${data.supplierDetails.panNo}\nGST: ${data.supplierDetails.gstNo}`}
          </Text>
        ) : (
          <Text style={styles.addressDetails}>{"\nDetails not available"}</Text>
        )}
      </View>
      <View style={styles.gridItem}>
        <Text style={styles.label}>Ship To (Consignee)</Text>
        <Text style={styles.value}>{data.consignee}</Text>
        {data.consigneeDetails && (
          <Text style={styles.addressDetails}>
            {`\n${data.consigneeDetails.location}, ${data.consigneeDetails.district}, ${data.consigneeDetails.state} - ${data.consigneeDetails.pin}\nPAN No : ${data.consigneeDetails.pan}\nGST: ${data.consigneeDetails.gst}`}
          </Text>
        )}
      </View>
    </View>
  </View>
);

export default SaudaDetails;
