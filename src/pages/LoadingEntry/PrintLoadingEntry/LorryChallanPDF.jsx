import { Page, Document, StyleSheet, View, Text } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 20,
    backgroundColor: "#ffffff",
  },
  header: {
    textAlign: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textDecoration: "underline",
    marginBottom: 5,
  },
  section: {
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: "35%",
    fontWeight: "bold",
  },
  value: {
    width: "65%",
  },
  table: {
    width: "100%",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#000",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  tableHeader: {
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
  },
  tableCell: {
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: "#000",
    textAlign: "center",
  },
  signatureSection: {
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: "30%",
    textAlign: "center",
  },
});

const LorryChallanPDF = ({ data }) => {
  return (
    <Document>
      <Page style={styles.page} size="A4">
        <View style={styles.header}>
          <Text style={styles.title}>LORRY CHALLAN</Text>
          <Text>Bill No: {data.billNumber || "N/A"}</Text>
          <Text>Date: {data.dateOfIssue ? new Date(data.dateOfIssue).toLocaleDateString("en-IN") : "N/A"}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Sauda No:</Text>
            <Text style={styles.value}>{data.saudaNo || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Loading Date:</Text>
            <Text style={styles.value}>{data.loadingDate ? new Date(data.loadingDate).toLocaleDateString("en-IN") : "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Commodity:</Text>
            <Text style={styles.value}>{data.commodity || "N/A"}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ fontWeight: "bold", marginBottom: 5 }}>Seller Details:</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{data.seller?.sellerName || data.supplierCompany || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{data.seller?.address || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>GST No:</Text>
            <Text style={styles.value}>{data.seller?.gstNo || "N/A"}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ fontWeight: "bold", marginBottom: 5 }}>Buyer Details:</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{data.buyer?.buyerCompany || data.buyerCompany || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{data.buyer?.address || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>GST No:</Text>
            <Text style={styles.value}>{data.buyer?.gstNo || "N/A"}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ fontWeight: "bold", marginBottom: 5 }}>Consignee Details:</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{data.consignee?.name || data.consignee || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{data.consignee?.address || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>GST No:</Text>
            <Text style={styles.value}>{data.consignee?.gstNo || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{data.consignee?.phone || "N/A"}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ fontWeight: "bold", marginBottom: 5 }}>Transport Details:</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Lorry Number:</Text>
            <Text style={styles.value}>{data.lorryNumber || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Transporter:</Text>
            <Text style={styles.value}>{data.transporterName || data.addedTransport || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Driver Name:</Text>
            <Text style={styles.value}>{data.driverName || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Driver Phone:</Text>
            <Text style={styles.value}>{data.driverPhoneNumber || "N/A"}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, { width: "33%" }]}>Loading Weight</Text>
            <Text style={[styles.tableCell, { width: "33%" }]}>Unloading Weight</Text>
            <Text style={[styles.tableCell, { width: "34%", borderRightWidth: 0 }]}>Total Freight</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: "33%" }]}>{data.loadingWeight || "0"} Tons</Text>
            <Text style={[styles.tableCell, { width: "33%" }]}>{data.unloadingWeight || "0"} Tons</Text>
            <Text style={[styles.tableCell, { width: "34%", borderRightWidth: 0 }]}>₹ {data.totalFreight || "0"}</Text>
          </View>
        </View>

        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text>____________________</Text>
            <Text>Seller's Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>____________________</Text>
            <Text>Driver's Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>____________________</Text>
            <Text>Receiver's Signature</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default LorryChallanPDF;
