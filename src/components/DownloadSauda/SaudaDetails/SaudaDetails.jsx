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
    if (!data.buyerDetails) {
      // Fallback to top-level data if details object is missing
      let fallbackParts = [];
      if (data.buyerMobile) fallbackParts.push(`Mobile: ${data.buyerMobile}`);
      if (Array.isArray(data.buyerEmails) && data.buyerEmails.length > 0) {
        fallbackParts.push(`Email: ${data.buyerEmails.filter(Boolean).join(", ")}`);
      }
      return fallbackParts.length > 0 ? (
        <Text style={styles.addressDetails}>{"\n" + fallbackParts.join("\n")}</Text>
      ) : null;
    }

    const { address, district, state, pinNo, panNo, gstNo, phone, emails } = data.buyerDetails;

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
    
    // Prioritize specific order data for mobile/emails, fallback to profile data
    const finalMobile = data.buyerMobile || phone || "";
    const finalEmails = (Array.isArray(data.buyerEmails) && data.buyerEmails.length > 0) 
      ? data.buyerEmails.filter(Boolean).join(", ") 
      : (Array.isArray(emails) ? emails.map(e => e.value || e).join(", ") : "");

    if (finalMobile) parts.push(`Mobile: ${finalMobile}`);
    if (finalEmails) parts.push(`Email: ${finalEmails}`);
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
            {data.poDate 
              ? new Date(data.poDate).toLocaleDateString("en-GB").replace(/\//g, "-")
              : data.createdAt 
                ? new Date(data.createdAt).toLocaleDateString("en-GB").replace(/\//g, "-")
                : "N/A"}
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
          <Text style={styles.addressDetails}>
            {data.supplierDetails ? (
              `\n${data.supplierDetails.address || ""}, ${data.supplierDetails.district || ""}, ${data.supplierDetails.state || ""} - ${data.supplierDetails.pinNo || ""}\nMobile: ${data.sellerMobile || data.supplierDetails.phone || ""}\nEmail: ${Array.isArray(data.sellerEmails) ? data.sellerEmails.filter(Boolean).join(", ") : (data.supplierDetails.emails ? data.supplierDetails.emails.map(e => e.value || e).join(", ") : "")}\nPAN No: ${data.supplierDetails.panNo || ""}\nGST: ${data.supplierDetails.gstNo || ""}`
            ) : (
              `\nMobile: ${data.sellerMobile || ""}\nEmail: ${Array.isArray(data.sellerEmails) ? data.sellerEmails.filter(Boolean).join(", ") : ""}`
            )}
          </Text>
        </View>
        <View style={[styles.gridItem, { borderRight: "none" }]}>
          <Text style={styles.label}>Ship To (Consignee)</Text>
          <Text style={styles.nameValue}>{data.consignee}</Text>
          {data.consigneeDetails && (
            <Text style={styles.addressDetails}>
              {`\n${data.consigneeDetails.address || data.consigneeDetails.location || ""}, ${data.consigneeDetails.district || ""}, ${data.consigneeDetails.state || ""} - ${data.consigneeDetails.pin || data.consigneeDetails.pinNo || ""}\nMobile: ${data.consigneeDetails.phone || data.consigneeDetails.mobile || ""}\nPAN No : ${data.consigneeDetails.panNo || data.consigneeDetails.pan || ""}\nGST: ${data.consigneeDetails.gstNo || data.consigneeDetails.gst || ""}`}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default SaudaDetails;
