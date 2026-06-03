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
  const renderAddressDetails = (details) => {
    if (!details) return null;

    const {
      address,
      location,
      district,
      state,
      pin,
      pinNo,
      pinCode,
      panNo,
      pan,
      gstNo,
      gst,
      msmeNo,
      mandiLicense,
    } = details;

    let parts = [];
    const addr = address || location || "";
    const dist = district || "";
    const st = state || "";
    const p = pinNo || pinCode || pin || "";
    const msme = msmeNo || mandiLicense || "";
    const panVal = panNo || pan || "";
    const gstVal = gstNo || gst || "";

    if (addr || dist || st || p) {
      parts.push(
        `${addr}${addr && (dist || st || p) ? ", " : ""}${dist}${
          dist && (st || p) ? ", " : ""
        }${st}${st && p ? " - " : ""}${p}`,
      );
    }

    if (panVal) parts.push(`PAN No: ${panVal}`);
    if (gstVal) parts.push(`GST: ${gstVal}`);
    if (msme) parts.push(`MSME No: ${msme}`);

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
            {data.poDate
              ? new Date(data.poDate)
                  .toLocaleDateString("en-GB")
                  .replace(/\//g, "-")
              : data.createdAt
                ? new Date(data.createdAt)
                    .toLocaleDateString("en-GB")
                    .replace(/\//g, "-")
                : "N/A"}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Buyer Name</Text>
          <Text style={styles.nameValue}>{data.buyerCompany || data.buyer}</Text>
          {renderAddressDetails(data.buyerDetails)}
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Supplier Company</Text>
          <Text style={styles.value}>{data.supplierCompany}</Text>
          {renderAddressDetails(data.supplierDetails)}
        </View>
        <View style={[styles.gridItem, { borderRight: "none" }]}>
          <Text style={styles.label}>Ship To (Consignee)</Text>
          <Text style={styles.nameValue}>{data.consignee}</Text>
          {renderAddressDetails(data.consigneeDetails)}
        </View>
      </View>
    </View>
  );
};

export default SaudaDetails;
