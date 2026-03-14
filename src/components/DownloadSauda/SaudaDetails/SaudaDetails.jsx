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
    gap: 10,
  },
  headerItem: {
    flex: 1,
  },

    grid: {
    flexDirection: "row",
    flexWrap: "nowrap",
    border: "0.5pt solid #E5E7EB",
    borderRadius: 4,
    backgroundColor: "#F9FAFB",
  },

  gridItem: {
    flex: 1,
    padding: 6,
    borderRight: "0.5pt solid #E5E7EB",
  },

  label: {
    fontSize: 7,
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 2,
  },

  value: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#1F2937",
  },

  saudaNumber: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#dc2626",
    letterSpacing: 1,
  },

  addressDetails: {
    fontSize: 7,
    color: "#4a5568",
    marginTop: 1,
    lineHeight: 1.1,
    fontWeight: "normal",
  },
});

const SaudaDetails = ({ data }) => {
  const renderBuyerDetails = () => {
    if (!data.buyerDetails) return null;
    const { address, district, state, pinNo, panNo, gstNo } = data.buyerDetails;
    
    let parts = [];
    if (address || district || state || pinNo) {
      parts.push(`${address || ""}${address && (district || state || pinNo) ? ", " : ""}${district || ""}${district && (state || pinNo) ? ", " : ""}${state || ""}${state && pinNo ? " - " : ""}${pinNo || ""}`);
    }
    if (panNo) parts.push(`PAN No: ${panNo}`);
    if (gstNo) parts.push(`GST: ${gstNo}`);
    
    if (parts.length === 0) return null;
    
    return (
      <Text style={styles.addressDetails}>
        {"\n" + parts.join("\n")}
      </Text>
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.headerItem}>
          <Text style={styles.label}>Sauda No</Text>
          <Text style={styles.saudaNumber}>{data.saudaNo}</Text>
        </View>
        <View style={styles.headerItem}>
          <Text style={styles.label}>Buyer PO No</Text>
          <Text style={styles.value}>{data.poNumber || "N/A"}</Text>
        </View>
        <View style={styles.headerItem}>
          <Text style={styles.label}>Loading Date</Text>
          <Text style={styles.value}>
            {data.loadingDate ? new Date(data.loadingDate).toLocaleDateString("en-GB").replace(/\//g, "-") : "N/A"}
          </Text>
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
          <Text style={styles.value}>{data.buyerCompany || data.buyer}</Text>
          {renderBuyerDetails()}
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Supplier Company</Text>
          <Text style={styles.value}>{data.supplierCompany}</Text>
          {data.supplierDetails ? (
            <Text style={styles.addressDetails}>
              {`\n${data.supplierDetails.address || ""}, ${data.supplierDetails.district || ""}, ${data.supplierDetails.state || ""} - ${data.supplierDetails.pinNo || ""}\n PAN No: ${data.supplierDetails.panNo || ""}\nGST: ${data.supplierDetails.gstNo || ""}`}
            </Text>
          ) : null}
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Ship To (Consignee)</Text>
          <Text style={styles.value}>{data.consignee}</Text>
          {data.consigneeDetails && (
            <Text style={styles.addressDetails}>
              {`\n${data.consigneeDetails.location || ""}, ${data.consigneeDetails.district || ""}, ${data.consigneeDetails.state || ""} - ${data.consigneeDetails.pin || ""}\nPAN No : ${data.consigneeDetails.pan || ""}\nGST: ${data.consigneeDetails.gst || ""}`}
            </Text>
          )}
        </View>
        <View style={[styles.gridItem, { borderRight: "none" }]}>
          <Text style={styles.label}>Location</Text>
          <Text style={styles.value}>{data.location || "N/A"}</Text>
        </View>
      </View>
    </View>
  );
};

export default SaudaDetails;
