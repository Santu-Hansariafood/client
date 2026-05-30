import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

// Register standard fonts
Font.register({
  family: "Inter",
  fonts: [
    { src: "https://cdnjs.cloudflare.com/ajax/libs/inter-ui/3.19.3/Inter%20UI/Inter-Regular.ttf", fontWeight: 400 },
    { src: "https://cdnjs.cloudflare.com/ajax/libs/inter-ui/3.19.3/Inter%20UI/Inter-Bold.ttf", fontWeight: 700 },
    { src: "https://cdnjs.cloudflare.com/ajax/libs/inter-ui/3.19.3/Inter%20UI/Inter-Black.ttf", fontWeight: 900 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 0,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica", // Use built-in font for maximum compatibility
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  // Standard ID Card Size (CR80): 3.375" x 2.125" -> ~243pt x 153pt
  cardContainer: {
    width: 243,
    height: 153,
    backgroundColor: "#ffffff",
    overflow: "hidden",
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },
  // Front Side Header
  header: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  headerEmployee: {
    backgroundColor: "#4f46e5", // Indigo-600
  },
  headerBuyer: {
    backgroundColor: "#2563eb", // Blue-600
  },
  headerSeller: {
    backgroundColor: "#059669", // Emerald-600
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
    fontWeight: "bold",
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
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 2,
  },
  role: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  roleEmployee: {
    color: "#4f46e5",
  },
  roleBuyer: {
    color: "#2563eb",
  },
  roleSeller: {
    color: "#059669",
  },
  detailRow: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 6,
    fontWeight: "bold",
    color: "#64748b",
    width: 40,
  },
  detailValue: {
    fontSize: 6.5,
    fontWeight: "bold",
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
    fontWeight: "bold",
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
    fontWeight: "bold",
    marginTop: 4,
  },
  contactInfoEmployee: {
    color: "#4f46e5",
  },
  contactInfoBuyer: {
    color: "#2563eb",
  },
  contactInfoSeller: {
    color: "#059669",
  },
  terms: {
    fontSize: 5,
    color: "#94a3b8",
    marginTop: 10,
    fontStyle: "italic",
  },
  footer: {
    height: 4,
  },
  footerEmployee: {
    backgroundColor: "#4f46e5",
  },
  footerBuyer: {
    backgroundColor: "#2563eb",
  },
  footerSeller: {
    backgroundColor: "#059669",
  },
});

const EmployeeIDCardPDF = ({ user, qrCodeData, logoUrl, role = "Employee" }) => {
  const isEmployee = role === "Employee";
  const isBuyer = role === "Buyer";
  const isSeller = role === "Seller";

  // Handle logoUrl if it's an object (Vite/Webpack asset)
  const resolvedLogoUrl = typeof logoUrl === 'object' && logoUrl?.default ? logoUrl.default : logoUrl;

  const headerStyle = [
    styles.header,
    isEmployee && styles.headerEmployee,
    isBuyer && styles.headerBuyer,
    isSeller && styles.headerSeller,
  ].filter(Boolean);

  const roleTextStyle = [
    styles.role,
    isEmployee && styles.roleEmployee,
    isBuyer && styles.roleBuyer,
    isSeller && styles.roleSeller,
  ].filter(Boolean);

  const contactTextStyle = [
    styles.contactInfo,
    isEmployee && styles.contactInfoEmployee,
    isBuyer && styles.contactInfoBuyer,
    isSeller && styles.contactInfoSeller,
  ].filter(Boolean);

  const footerStyle = [
    styles.footer,
    isEmployee && styles.footerEmployee,
    isBuyer && styles.footerBuyer,
    isSeller && styles.footerSeller,
  ].filter(Boolean);

  const themeColor = isEmployee ? "#4f46e5" : isBuyer ? "#2563eb" : "#059669";

  return (
    <Document title={`ID Card - ${user?.name || role}`}>
      <Page size={[243, 153]} style={styles.page}>
        {/* FRONT SIDE */}
        <View style={styles.cardContainer}>
          <View style={headerStyle}>
            {resolvedLogoUrl ? (
              <Image src={resolvedLogoUrl} style={styles.logo} />
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
              <Text style={roleTextStyle}>{user?.role || role.toUpperCase()}</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  {isEmployee ? "EMP ID:" : "PARTNER ID:"}
                </Text>
                <Text style={styles.detailValue}>
                  {user?.employeeId || user?._id?.substring(18).toUpperCase() || "N/A"}
                </Text>
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
          <View style={footerStyle} />
        </View>
      </Page>

      {/* BACK SIDE */}
      <Page size={[243, 153]} style={styles.page}>
        <View style={styles.cardContainer}>
          <View style={headerStyle}>
            <Text style={[styles.companyName, { textAlign: "center", flex: 1 }]}>
              OFFICIAL IDENTITY CARD
            </Text>
          </View>

          <View style={styles.backContent}>
            <Text style={styles.backTitle}>HANSARIA FOOD PVT LTD</Text>
            <View
              style={{
                width: 30,
                height: 1,
                backgroundColor: themeColor,
                marginBottom: 4,
              }}
            />
            <Text style={styles.address}>
              Head Office: 123 Business Hub, MG Road,{"\n"}
              New Delhi, India - 110001
            </Text>
            <Text style={contactTextStyle}>
              Tel: +91 98765 43210 | info@hansariafood.com
            </Text>
            <Text style={contactTextStyle}>www.hansariafood.com</Text>

            <Text style={styles.terms}>
              If found, please return to the above address. This card is the
              property of Hansaria Food Pvt Ltd.
            </Text>
          </View>
          <View style={footerStyle} />
        </View>
      </Page>
    </Document>
  );
};

export default EmployeeIDCardPDF;
