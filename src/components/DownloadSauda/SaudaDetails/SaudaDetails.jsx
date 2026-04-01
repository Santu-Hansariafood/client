import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  section: {
    marginBottom: 10,
    backgroundColor: "#ffffff",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "0.5pt solid #e5e7eb",
    paddingBottom: 6,
    marginBottom: 8,
  },

  headerItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  label: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#374151",
    marginRight: 4,
  },

  value: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#111827",
  },
  nameValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#111827",
    lineHeight: 1.1,
  },

  saudaValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#dc2626",
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
  addressDetails: {
    fontSize: 8,
    color: "#4B5563",
    lineHeight: 1.4,
  },
});

const SaudaDetails = ({ data }) => {
  const renderBuyerDetails = () => {
    if (!data.buyerDetails) return null;
    const { address, district, state, pinNo, panNo, gstNo } = data.buyerDetails;

    let parts = [];
    if (address || district || state || pinNo) {
      parts.push(
        `${address || ""}${address && (district || state || pinNo) ? ", " : ""}${
          district || ""
        }${district && (state || pinNo) ? ", " : ""}${state || ""}${
          state && pinNo ? " - " : ""
        }${pinNo || ""}`,
      );
    }
    if (panNo) parts.push(`PAN No: ${panNo}`);
    if (gstNo) parts.push(`GST: ${gstNo}`);

    if (parts.length === 0) return null;

    return <Text style={styles.addressDetails}>{"\n" + parts.join("\n")}</Text>;
  };

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.headerItem}>
          <Text style={styles.label}>SAUDA NO</Text>
          <Text style={styles.saudaValue}>{data.saudaNo}</Text>
        </View>

        <View style={styles.headerItem}>
          <Text style={styles.label}>BUYER PO NO</Text>
          <Text style={styles.value}>{data.poNumber || "N/A"}</Text>
        </View>

        <View style={styles.headerItem}>
          <Text style={styles.label}>DATE</Text>
          <Text style={styles.value}>
            {new Date(data.poDate)
              .toLocaleDateString("en-GB")
              .replace(/\//g, "-")}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Buyer Name</Text>
          <Text style={styles.nameValue}>
            {data.buyerCompany || data.buyer}
          </Text>
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
        <View style={[styles.gridItem, { borderRight: "none" }]}>
          <Text style={styles.label}>Ship To (Consignee)</Text>
          <Text style={styles.nameValue}>{data.consignee}</Text>
          {data.consigneeDetails && (
            <Text style={styles.addressDetails}>
              {`\n${data.consigneeDetails.location || ""}, ${data.consigneeDetails.district || ""}, ${data.consigneeDetails.state || ""} - ${data.consigneeDetails.pin || ""}\nPAN No : ${data.consigneeDetails.pan || ""}\nGST: ${data.consigneeDetails.gst || ""}`}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default SaudaDetails;
