import { Page, Document, StyleSheet, View, Text, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 25,
    lineHeight: 1.2,
    color: "#1F2937",
    backgroundColor: "#ffffff",
  },
  pageBorder: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderWidth: 1,
    borderColor: "#1F7A3E",
    borderStyle: "solid",
  },
  innerBorder: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    borderStyle: "solid",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  sellerInfo: {
    flex: 2,
  },
  logoContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  logo: {
    width: 80,
    height: 80,
    objectFit: "contain",
  },
  sellerName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1F7A3E",
    marginBottom: 4,
  },
  sellerAddress: {
    fontSize: 8,
    color: "#4B5563",
    lineHeight: 1.4,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1F7A3E",
    textAlign: "center",
  },
  section: {
    marginBottom: 8,
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
  table: {
    width: "100%",
    marginTop: 10,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  tableHeader: {
    backgroundColor: "#F3F4F6",
  },
  tableCell: {
    padding: 6,
    borderRightWidth: 0.5,
    borderRightColor: "#E5E7EB",
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
  watermark: {
    position: "absolute",
    top: "40%",
    left: "20%",
    transform: "rotate(-25deg)",
    opacity: 0.1,
  },
  footer: {
    position: "absolute",
    bottom: 15,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 6,
    color: "#6B7280",
  },
  footerLine: {
    height: 0.5,
    backgroundColor: "#E5E7EB",
    marginBottom: 4,
  },
  footerText: {
    fontSize: 6,
    color: "#6B7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 6,
  },
});

const renderAddressDetails = (details) => {
  if (!details) return null;
  const { address, district, state, pinNo, panNo, gstNo } = details;
  
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

const LorryChallanPDF = ({ data, logoUrl }) => {
  const isConsigneeAsBuyer = data.billTo === "consignee";
  const buyerName = isConsigneeAsBuyer ? data.consignee : (data.buyerCompany || data.buyer);
  const buyerDetails = isConsigneeAsBuyer ? data.consigneeDetails : data.buyerDetails;
  
  const fromState = data.supplierDetails?.state || "West Bengal";
  const toState = isConsigneeAsBuyer 
    ? (data.consigneeDetails?.state || "N/A") 
    : (data.buyerDetails?.state || "N/A");

  return (
    <Document>
      <Page style={styles.page} size="A4">
        <View style={styles.pageBorder} fixed />
        <View style={styles.innerBorder} fixed />
        
        <View style={styles.watermark} fixed>
          <Text style={{ fontSize: 60, color: "#000000" }}>HANSARIA</Text>
        </View>

        {/* Header with Seller Info and Logo */}
        <View style={styles.header}>
          <View style={styles.sellerInfo}>
            <Text style={styles.sellerName}>{data.supplierCompany || "Hansaria Food Private Limited"}</Text>
            <Text style={styles.sellerAddress}>
              {data.supplierDetails?.address || "207 MAHARSHI DEBENDRA ROAD"}
              {data.supplierDetails?.address && (data.supplierDetails?.district || data.supplierDetails?.state) ? ", " : ""}
              {data.supplierDetails?.district || ""}
              {data.supplierDetails?.district && data.supplierDetails?.state ? ", " : ""}
              {data.supplierDetails?.state || "West Bengal"}
              {data.supplierDetails?.pinNo ? ` - ${data.supplierDetails.pinNo}` : ""}
            </Text>
            <Text style={styles.sellerAddress}>
              {data.supplierDetails?.gstNo ? `GST: ${data.supplierDetails.gstNo}` : "GST: 10BOSPK6679G1ZJ"}
              {data.supplierDetails?.panNo ? `  |  PAN: ${data.supplierDetails.panNo}` : ""}
            </Text>
          </View>
          <View style={styles.logoContainer}>
            {logoUrl && <Image src={logoUrl} style={styles.logo} />}
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>LORRY CHALLAN</Text>
        </View>

        <View style={styles.headerRow}>
          <View style={styles.headerItem}>
            <Text style={styles.label}>SAUDA NO</Text>
            <Text style={styles.saudaValue}>{data.saudaNo || "N/A"}</Text>
          </View>

          <View style={styles.headerItem}>
            <Text style={styles.label}>BILL NO</Text>
            <Text style={styles.value}>{data.billNumber || "N/A"}</Text>
          </View>

          <View style={styles.headerItem}>
            <Text style={styles.label}>DATE</Text>
            <Text style={styles.value}>
              {data.dateOfIssue 
                ? new Date(data.dateOfIssue).toLocaleDateString("en-GB").replace(/\//g, "-") 
                : "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.headerRow}>
            <View style={styles.headerItem}>
              <Text style={styles.label}>LOADING DATE</Text>
              <Text style={styles.value}>
                {data.loadingDate 
                  ? new Date(data.loadingDate).toLocaleDateString("en-GB").replace(/\//g, "-") 
                  : "N/A"}
              </Text>
            </View>
            <View style={styles.headerItem}>
              <Text style={styles.label}>COMMODITY</Text>
              <Text style={styles.value}>{data.commodity || "N/A"}</Text>
            </View>
          </View>
        </View>

        {/* FROM and TO Section */}
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.label}>FROM</Text>
            <Text style={styles.nameValue}>{fromState}</Text>
          </View>
          <View style={[styles.gridItem, { borderRight: "none" }]}>
            <Text style={styles.label}>TO</Text>
            <Text style={styles.nameValue}>{toState}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* SHIP TO (CONSIGNEE) Section */}
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.label}>SHIP TO (CONSIGNEE)</Text>
            <Text style={styles.nameValue}>
              {data.consignee || "N/A"}
            </Text>
            {renderAddressDetails(data.consigneeDetails)}
          </View>
        </View>

        <View style={styles.divider} />

        {/* BUYER ACCOUNT Section */}
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.label}>BUYER ACCOUNT</Text>
            <Text style={styles.nameValue}>
              {buyerName || "N/A"}
            </Text>
            {renderAddressDetails(buyerDetails)}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Lorry Number</Text>
            <Text style={styles.value}>{data.lorryNumber || "N/A"}</Text>
            <Text style={styles.addressDetails}>
              {"\n"}Transporter: {data.addedTransport || "N/A"}
            </Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.label}>Driver Name</Text>
            <Text style={styles.value}>{data.driverName || "N/A"}</Text>
            <Text style={styles.addressDetails}>
              {"\n"}Phone: {data.driverPhoneNumber || "N/A"}
            </Text>
          </View>
          <View style={[styles.gridItem, { borderRight: "none" }]}>
            <Text style={styles.label}>Vehicle Type</Text>
            <Text style={styles.value}>{data.vehicleType || "N/A"}</Text>
            <Text style={styles.addressDetails}>
              {"\n"}Capacity: {data.vehicleCapacity || "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, { width: "25%" }]}>Loading Weight</Text>
            <Text style={[styles.tableCell, { width: "25%" }]}>Unloading Weight</Text>
            <Text style={[styles.tableCell, { width: "25%" }]}>Freight Rate</Text>
            <Text style={[styles.tableCell, { width: "25%", borderRightWidth: 0 }]}>Total Freight</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: "25%" }]}>{data.loadingWeight || "0"} Tons</Text>
            <Text style={[styles.tableCell, { width: "25%" }]}>{data.unloadingWeight || "0"} Tons</Text>
            <Text style={[styles.tableCell, { width: "25%" }]}>Rs.  {data.freightRate || "0"}</Text>
            <Text style={[styles.tableCell, { width: "25%", borderRightWidth: 0 }]}>Rs.  {data.totalFreight || "0"}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Advance</Text>
              <Text style={styles.value}>Rs.  {data.advance || "0"}</Text>
            </View>
            <View style={[styles.gridItem, { borderRight: "none" }]}>
              <Text style={styles.label}>Balance</Text>
              <Text style={styles.value}>Rs.  {data.balance || "0"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text>____________________</Text>
            <Text style={styles.label}>Seller's Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>____________________</Text>
            <Text style={styles.label}>Driver's Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>____________________</Text>
            <Text style={styles.label}>Receiver's Signature</Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>
            <Text style={{ fontWeight: "bold" }}>Register Office: </Text>
            207, Maharshi Debendra Road, 6th Floor, Room No. 111, Kolkata - 700007
          </Text>
          <Text style={styles.footerText}>
            <Text style={{ fontWeight: "bold" }}>Contact: </Text>
            +91 98304 33535 / 93304 33535 | Email: info@hansariafood.com |
            Website: www.hansariafood.com
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default LorryChallanPDF;