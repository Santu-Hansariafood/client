import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Svg,
  Path,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 0,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  cardContainer: {
    width: 243,
    height: 153,
    backgroundColor: "#ffffff",
    overflow: "hidden",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    border: "0.5pt solid #e2e8f0",
  },

  header: {
    height: 45,
    backgroundColor: "#059669",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderBottom: "3pt solid #facc15",
  },
  logoContainer: {
    width: 30,
    height: 30,
    backgroundColor: "#ffffff",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  logo: {
    width: 24,
    height: 24,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  companyTagline: {
    color: "#facc15",
    fontSize: 5,
    marginTop: 1,
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    padding: 8,
    flexDirection: "row",
    gap: 10,
  },
  photoSection: {
    alignItems: "center",
    gap: 4,
  },
  photoPlaceholder: {
    width: 60,
    height: 70,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    border: "1.5pt solid #facc15",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  personIcon: {
    width: 40,
    height: 40,
    opacity: 0.2,
  },
  idBadge: {
    backgroundColor: "#059669",
    color: "#ffffff",
    fontSize: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    fontWeight: "bold",
  },
  infoSection: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#059669",
    marginBottom: 1,
  },
  role: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  detailLabel: {
    fontSize: 5.5,
    fontWeight: "bold",
    color: "#94a3b8",
    width: 45,
  },
  detailValue: {
    fontSize: 6,
    fontWeight: "bold",
    color: "#1e293b",
    flex: 1,
  },
  backContent: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  addressBox: {
    marginBottom: 8,
    alignItems: "center",
  },
  addressTitle: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#059669",
    marginBottom: 3,
    textTransform: "uppercase",
  },
  addressText: {
    fontSize: 6,
    color: "#475569",
    lineHeight: 1.4,
    maxWidth: 180,
  },
  qrSection: {
    marginTop: 4,
    alignItems: "center",
    gap: 4,
  },
  qrContainer: {
    width: 45,
    height: 45,
    padding: 2,
    backgroundColor: "#ffffff",
    border: "0.5pt solid #facc15",
    borderRadius: 4,
  },
  qrImage: {
    width: "100%",
    height: "100%",
  },
  qrLabel: {
    fontSize: 4,
    color: "#94a3b8",
    fontWeight: "bold",
  },
  contactFooter: {
    marginTop: 8,
    borderTop: "0.5pt solid #e2e8f0",
    paddingTop: 6,
    width: "100%",
  },
  contactText: {
    fontSize: 5.5,
    color: "#059669",
    fontWeight: "bold",
  },
  footer: {
    height: 6,
    backgroundColor: "#facc15",
    flexDirection: "row",
  },
  footerSegment: {
    flex: 1,
    backgroundColor: "#059669",
    marginRight: 20,
  },
});

const PersonIcon = () => (
  <Svg viewBox="0 0 24 24" style={styles.personIcon}>
    <Path
      d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
      fill="#059669"
    />
  </Svg>
);

const EmployeeIDCardPDF = ({
  user,
  qrCodeData,
  logoUrl,
  role = "Employee",
}) => {
  const normalizedRole = (user?.role || role || "").toLowerCase();

  const verificationStatus =
    normalizedRole === "seller"
      ? "VERIFIED SELLER"
      : normalizedRole === "buyer"
        ? "VERIFIED BUYER"
        : "VERIFIED EMPLOYEE";

  const partnerId =
    user?.employeeId || user?._id?.substring(18).toUpperCase() || "N/A";

  return (
    <Document title={`ID Card - ${user?.name || role}`}>
      <Page size={[243, 153]} style={styles.page}>
        <View style={styles.cardContainer}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              {logoUrl ? (
                <Image src={logoUrl} style={styles.logo} />
              ) : (
                <View
                  style={[
                    styles.logo,
                    { backgroundColor: "#059669", borderRadius: 4 },
                  ]}
                />
              )}
            </View>
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>HANSARIA FOOD PVT LTD</Text>
              <Text style={styles.companyTagline}>GROWING TOGETHER</Text>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.photoSection}>
              <View style={styles.photoPlaceholder}>
                <PersonIcon />
              </View>
              <Text style={styles.idBadge}>{partnerId}</Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.name}>{user?.name?.toUpperCase()}</Text>
              <Text style={styles.role}>
                {user?.role || role.toUpperCase()}
              </Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>MOBILE</Text>
                <Text style={styles.detailValue}>{user?.mobile || "N/A"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>EMAIL</Text>
                <Text style={styles.detailValue}>
                  {user?.email?.toLowerCase() || "N/A"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>VALIDITY</Text>
                <Text style={styles.detailValue}>PERMANENT</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>STATUS</Text>
                <Text style={[styles.detailValue, { color: "#059669" }]}>
                  {verificationStatus}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.footerSegment} />
          </View>
        </View>
      </Page>

      <Page size={[243, 153]} style={styles.page}>
        <View style={styles.cardContainer}>
          <View style={styles.header}>
            <Text
              style={[styles.companyName, { textAlign: "center", flex: 1 }]}
            >
              OFFICIAL IDENTITY CARD
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              flexDirection: "row",
              padding: 10,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{
                width: 65,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View style={styles.qrContainer}>
                {qrCodeData ? (
                  <Image src={qrCodeData} style={styles.qrImage} />
                ) : (
                  <View
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: "#f1f5f9",
                    }}
                  />
                )}
              </View>

              <Text
                style={{
                  fontSize: 4,
                  color: "#94a3b8",
                  marginTop: 3,
                  textAlign: "center",
                }}
              >
                SCAN FOR VERIFICATION
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                marginLeft: 10,
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 7,
                  fontWeight: "bold",
                  color: "#059669",
                  marginBottom: 4,
                }}
              >
                CORPORATE OFFICE
              </Text>

              <Text
                style={{
                  fontSize: 6,
                  color: "#475569",
                  lineHeight: 1.4,
                }}
              >
                Primarc Square, Plot No.1, Salt Lake Bypass,{"\n"}
                LA Block, Sector: 3, Bidhannagar,{"\n"}
                Kolkata, West Bengal 700106
              </Text>

              <Text
                style={{
                  marginTop: 6,
                  fontSize: 6,
                  fontWeight: "bold",
                  color: "#059669",
                }}
              >
                {verificationStatus}
              </Text>

              <Text
                style={{
                  marginTop: 4,
                  fontSize: 5.5,
                  color: "#64748b",
                }}
              >
                www.hansariafood.com
              </Text>

              <Text
                style={{
                  fontSize: 5.5,
                  color: "#64748b",
                }}
              >
                info@hansariafood.com
              </Text>
            </View>
          </View>
          <View style={styles.footer}>
            <View style={styles.footerSegment} />
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default EmployeeIDCardPDF;
