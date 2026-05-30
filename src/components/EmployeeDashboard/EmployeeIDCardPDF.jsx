import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

// Register standard font for better look
Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.woff2", fontWeight: 700 },
    { src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuNYZ9hiA.woff2", fontWeight: 900 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 20,
    backgroundColor: "#f8fafc",
    fontFamily: "Inter",
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
  },
  // Standard ID Card Size (CR80): 3.375" x 2.125" -> ~243pt x 153pt
  cardContainer: {
    width: 243,
    height: 153,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    border: "1pt solid #e2e8f0",
    overflow: "hidden",
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },
  // Front Side Header
  header: {
    height: 40,
    backgroundColor: "#4f46e5", // Indigo-600
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  logo: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#ffffff",
  },
  companyName: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 0.5,
  },
  // Body Content
  content: {
    flex: 1,
    padding: 10,
    flexDirection: "row",
    gap: 12,
  },
  photoPlaceholder: {
    width: 60,
    height: 75,
    backgroundColor: "#f1f5f9",
    borderRadius: 6,
    border: "0.5pt solid #cbd5e1",
    justifyContent: "center",
    alignItems: "center",
  },
  photoIcon: {
    fontSize: 8,
    color: "#94a3b8",
  },
  infoSection: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 12,
    fontWeight: 900,
    color: "#1e293b",
    marginBottom: 2,
  },
  role: {
    fontSize: 8,
    fontWeight: 700,
    color: "#4f46e5",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 6,
    fontWeight: 700,
    color: "#64748b",
    width: 40,
  },
  detailValue: {
    fontSize: 6.5,
    fontWeight: 700,
    color: "#334155",
  },
  // QR Code Section
  qrContainer: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 40,
    height: 40,
    border: "0.5pt solid #e2e8f0",
    borderRadius: 4,
    padding: 2,
  },
  qrImage: {
    width: "100%",
    height: "100%",
  },
  // Back Side Specifics
  backContent: {
    flex: 1,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    gap: 6,
  },
  backTitle: {
    fontSize: 9,
    fontWeight: 900,
    color: "#1e293b",
    marginBottom: 4,
  },
  address: {
    fontSize: 7,
    color: "#64748b",
    lineHeight: 1.4,
  },
  contactInfo: {
    fontSize: 7,
    fontWeight: 700,
    color: "#4f46e5",
    marginTop: 4,
  },
  terms: {
    fontSize: 5,
    color: "#94a3b8",
    marginTop: 10,
    fontStyle: "italic",
  },
  footer: {
    height: 4,
    backgroundColor: "#4f46e5",
  },
});

const EmployeeIDCardPDF = ({ user, qrCodeData, logoUrl }) => (
  <Document title={`ID Card - ${user?.name || "Employee"}`}>
    <Page size="A4" style={styles.page}>
      {/* FRONT SIDE */}
      <View style={styles.cardContainer}>
        <View style={styles.header}>
          {logoUrl ? (
            <Image src={logoUrl} style={styles.styles.logo} />
          ) : (
            <View style={styles.logo} />
          )}
          <Text style={styles.companyName}>HANSARIA FOOD PVT LTD</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoIcon}>PHOTO</Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.name}>{user?.name?.toUpperCase()}</Text>
            <Text style={styles.role}>{user?.role || "EMPLOYEE"}</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>EMP ID:</Text>
              <Text style={styles.detailValue}>{user?.employeeId || "N/A"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>MOBILE:</Text>
              <Text style={styles.detailValue}>{user?.mobile || "N/A"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>EMAIL:</Text>
              <Text style={styles.detailValue}>{user?.email || "N/A"}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>STATUS:</Text>
              <Text style={styles.detailValue}>VERIFIED</Text>
            </View>
          </View>
        </View>

        <View style={styles.qrContainer}>
          {qrCodeData && <Image src={qrCodeData} style={styles.qrImage} />}
        </View>
        <View style={styles.footer} />
      </View>

      {/* BACK SIDE */}
      <View style={styles.cardContainer}>
        <View style={styles.header}>
          <Text style={[styles.companyName, { textAlign: "center", flex: 1 }]}>
            OFFICIAL IDENTITY CARD
          </Text>
        </View>

        <View style={styles.backContent}>
          <Text style={styles.backTitle}>HANSARIA FOOD PVT LTD</Text>
          <Text style={styles.address}>
            Head Office: 123 Business Hub, MG Road,{"\n"}
            New Delhi, India - 110001
          </Text>
          <Text style={styles.contactInfo}>
            Tel: +91 98765 43210 | info@hansariafood.com
          </Text>
          <Text style={styles.contactInfo}>www.hansariafood.com</Text>

          <Text style={styles.terms}>
            If found, please return to the above address. This card is the property of Hansaria Food Pvt Ltd.
          </Text>
        </View>
        <View style={styles.footer} />
      </View>
    </Page>
  </Document>
);

export default EmployeeIDCardPDF;
