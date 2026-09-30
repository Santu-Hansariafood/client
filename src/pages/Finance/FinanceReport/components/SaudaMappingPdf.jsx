import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  Image,
  Svg,
  Rect,
  Line,
  Defs,
  LinearGradient,
  Stop,
  Circle,
} from "@react-pdf/renderer";
import logo from "../../../../assets/Hans.png";

const columns = [
  { label: "ADJUSTMENT", width: "8.5%" },
  { label: "BUYER SAUDA", width: "17%" },
  { label: "SELLER SAUDA MAPPING", width: "16%" },
  { label: "SELLER / CONSIGNEE", width: "17%" },
  { label: "QUANTITIES (TONS)", width: "16%" },
  { label: "RATE / CD / GST", width: "11%" },
  { label: "DELIVERY / TERMS", width: "14.5%" },
];

const BRAND_PRIMARY = "#065f46";
const BRAND_SECONDARY = "#047857";
const BRAND_ACCENT = "#fbbf24";
const BRAND_LIGHT = "#ecfdf5";
const BRAND_BORDER = "#a7f3d0";
const TEXT_DARK = "#0f172a";
const TEXT_MUTED = "#64748b";
const ROW_ALT = "#f8fafc";

const styles = StyleSheet.create({
  page: {
    paddingTop: 110,
    paddingBottom: 80,
    paddingHorizontal: 28,
    fontFamily: "Helvetica",
    fontSize: 7,
    color: TEXT_DARK,
    backgroundColor: "#ffffff",
  },
  pageOuterBorder: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderWidth: 2,
    borderColor: BRAND_PRIMARY,
    borderRadius: 2,
  },
  pageInnerBorder: {
    position: "absolute",
    top: 13,
    left: 13,
    right: 13,
    bottom: 13,
    borderWidth: 0.5,
    borderColor: BRAND_SECONDARY,
    borderRadius: 1,
  },
  cornerMark: {
    position: "absolute",
    width: 14,
    height: 14,
    borderColor: BRAND_ACCENT,
  },
  headerWrapper: {
    position: "absolute",
    top: 18,
    left: 28,
    right: 28,
  },
  headerAccentBar: {
    height: 3,
    flexDirection: "row",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 10,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  logoBox: {
    width: 82,
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 14,
    borderRightWidth: 1.5,
    borderRightColor: BRAND_BORDER,
  },
  logo: {
    width: 68,
    height: 52,
    objectFit: "contain",
  },
  logoBadge: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    backgroundColor: BRAND_PRIMARY,
    borderRadius: 10,
  },
  logoBadgeText: {
    color: BRAND_ACCENT,
    fontSize: 5,
    fontWeight: "bold",
    letterSpacing: 1.2,
    textAlign: "center",
  },
  companyText: {
    flex: 1,
    paddingLeft: 14,
  },
  companyName: {
    fontSize: 17,
    fontWeight: "bold",
    color: BRAND_PRIMARY,
    letterSpacing: 0.4,
  },
  companyTagline: {
    fontSize: 7.5,
    color: BRAND_SECONDARY,
    fontWeight: "bold",
    letterSpacing: 2.5,
    marginTop: 3,
    textTransform: "uppercase",
  },
  companyAddress: {
    fontSize: 6.5,
    color: TEXT_MUTED,
    lineHeight: 1.5,
    marginTop: 4,
  },
  contactRow: {
    flexDirection: "row",
    marginTop: 3,
    gap: 10,
  },
  contactItem: {
    fontSize: 6,
    color: TEXT_MUTED,
    fontWeight: "bold",
  },
  reportBadgeBox: {
    alignItems: "flex-end",
    justifyContent: "center",
    paddingLeft: 12,
    borderLeftWidth: 1.5,
    borderLeftColor: BRAND_BORDER,
    marginLeft: 4,
  },
  reportBadge: {
    backgroundColor: BRAND_PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderBottomWidth: 3,
    borderBottomColor: BRAND_ACCENT,
    shadowColor: BRAND_PRIMARY,
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  reportBadgeTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 1.5,
    textAlign: "center",
  },
  reportBadgeSub: {
    fontSize: 5,
    color: BRAND_ACCENT,
    fontWeight: "bold",
    letterSpacing: 2,
    marginTop: 2,
    textAlign: "center",
  },
  filterBar: {
    flexDirection: "row",
    backgroundColor: BRAND_LIGHT,
    borderWidth: 1,
    borderColor: BRAND_BORDER,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  filterDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: BRAND_ACCENT,
  },
  filterLabel: {
    fontSize: 5.5,
    fontWeight: "bold",
    color: TEXT_MUTED,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  filterValue: {
    fontSize: 6.5,
    fontWeight: "bold",
    color: BRAND_PRIMARY,
    marginLeft: 3,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: BRAND_PRIMARY,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BRAND_PRIMARY,
  },
  headerCell: {
    paddingVertical: 8,
    paddingHorizontal: 5,
    color: "#ffffff",
    fontSize: 6,
    fontWeight: "bold",
    textAlign: "center",
    borderRightWidth: 0.5,
    borderRightColor: "rgba(255,255,255,0.2)",
    letterSpacing: 0.5,
  },
  headerCellLast: {
    borderRightWidth: 0,
  },
  row: {
    flexDirection: "row",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 0.75,
    borderColor: BRAND_BORDER,
  },
  alternateRow: {
    backgroundColor: ROW_ALT,
  },
  lastRow: {
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: "hidden",
    borderBottomWidth: 1,
  },
  cell: {
    paddingVertical: 6,
    paddingHorizontal: 5,
    fontSize: 6,
    lineHeight: 1.45,
    borderRightWidth: 0.5,
    borderRightColor: BRAND_BORDER,
    color: TEXT_DARK,
  },
  cellLast: {
    borderRightWidth: 0,
  },
  labelInCell: {
    fontSize: 5,
    fontWeight: "bold",
    color: BRAND_SECONDARY,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  valueInCell: {
    fontSize: 6,
    fontWeight: "bold",
    color: TEXT_DARK,
    marginTop: 1,
  },
  footerWrapper: {
    position: "absolute",
    bottom: 22,
    left: 28,
    right: 28,
  },
  footerDivider: {
    height: 1.5,
    flexDirection: "row",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 8,
  },
  footerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  footerSection: {
    flex: 1,
  },
  footerSectionTitle: {
    fontSize: 5.5,
    fontWeight: "bold",
    color: BRAND_SECONDARY,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  signLine: {
    width: 120,
    height: 0.5,
    backgroundColor: TEXT_MUTED,
    marginTop: 28,
    marginBottom: 4,
  },
  signLabel: {
    fontSize: 6,
    color: TEXT_MUTED,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  signSub: {
    fontSize: 5,
    color: TEXT_MUTED,
    opacity: 0.8,
    marginTop: 1,
  },
  centerFooter: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  companySeal: {
    width: 70,
    height: 70,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: BRAND_SECONDARY,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    marginBottom: 4,
    opacity: 0.6,
  },
  sealTextOuter: {
    fontSize: 4,
    color: BRAND_SECONDARY,
    fontWeight: "bold",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  sealTextInner: {
    fontSize: 7,
    fontWeight: "bold",
    color: BRAND_PRIMARY,
    letterSpacing: 0.5,
  },
  rightFooter: {
    alignItems: "flex-end",
  },
  pageIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BRAND_PRIMARY,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pageIndicatorText: {
    fontSize: 6,
    color: "#ffffff",
    fontWeight: "bold",
    letterSpacing: 1,
  },
  bottomBand: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: BRAND_BORDER,
  },
  slogan: {
    fontSize: 5.5,
    fontWeight: "bold",
    color: BRAND_SECONDARY,
    letterSpacing: 2,
  },
  metaText: {
    fontSize: 5,
    color: TEXT_MUTED,
    fontWeight: "bold",
  },
});

const ReportHeader = ({ from, to, consignee, logoUrl }) => {
  const filterChips = [
    { label: "From", value: from },
    { label: "To", value: to },
    { label: "Consignee", value: consignee || "All Consignees" },
    { label: "Generated", value: new Date().toLocaleDateString("en-IN") },
  ];

  return (
    <View style={styles.headerWrapper} fixed>
      <View style={styles.headerAccentBar}>
        <Svg style={{ width: "35%", height: "100%" }}>
          <Defs>
            <LinearGradient id="accentLeft" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={BRAND_ACCENT} stopOpacity="1" />
              <Stop offset="100%" stopColor={BRAND_SECONDARY} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#accentLeft)" />
        </Svg>
        <Svg style={{ width: "30%", height: "100%" }}>
          <Defs>
            <LinearGradient id="accentMid" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={BRAND_SECONDARY} stopOpacity="1" />
              <Stop offset="100%" stopColor={BRAND_PRIMARY} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#accentMid)" />
        </Svg>
        <Svg style={{ width: "35%", height: "100%" }}>
          <Defs>
            <LinearGradient id="accentRight" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={BRAND_PRIMARY} stopOpacity="1" />
              <Stop offset="100%" stopColor={BRAND_ACCENT} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#accentRight)" />
        </Svg>
      </View>

      <View style={styles.headerTopRow}>
        <View style={styles.logoBox}>
          {logoUrl ? (
            <Image src={logoUrl} style={styles.logo} />
          ) : (
            <Image src={logo} style={styles.logo} />
          )}
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>HANSARIA</Text>
          </View>
        </View>

        <View style={styles.companyText}>
          <Text style={styles.companyName}>HANSARIA FOOD PRIVATE LIMITED</Text>
          <Text style={styles.companyTagline}>— Growing Together —</Text>
          <Text style={styles.companyAddress}>
            Primarc Square, Plot No.1, Salt Lake Bypass, LA Block, Sector 3, Bidhannagar, Kolkata, West Bengal 700106
          </Text>
          <View style={styles.contactRow}>
            <Text style={styles.contactItem}>📧 info@hansariafood.com</Text>
            <Text style={styles.contactItem}>🌐 www.hansariafood.com</Text>
            <Text style={styles.contactItem}>📞 +91-XXXXXXXXXX</Text>
            <Text style={styles.contactItem}>GSTIN: XXXXXXXXXXXXXX</Text>
          </View>
        </View>

        <View style={styles.reportBadgeBox}>
          <View style={styles.reportBadge}>
            <Text style={styles.reportBadgeTitle}>FINANCE</Text>
            <Text style={styles.reportBadgeSub}>SAUDA MAPPING</Text>
          </View>
          <Text
            style={{
              fontSize: 5,
              color: TEXT_MUTED,
              fontWeight: "bold",
              letterSpacing: 1.5,
              marginTop: 5,
              textAlign: "right",
            }}
          >
            VERIFIED DOCUMENT
          </Text>
        </View>
      </View>

      <View style={styles.filterBar}>
        {filterChips.map((chip, i) => (
          <View key={i} style={styles.filterChip}>
            <View style={styles.filterDot} />
            <Text style={styles.filterLabel}>{chip.label}:</Text>
            <Text style={styles.filterValue}>{chip.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const ReportFooter = () => (
  <View style={styles.footerWrapper} fixed>
    <View style={styles.footerDivider}>
      <Svg style={{ width: "100%", height: "100%" }}>
        <Defs>
          <LinearGradient id="footerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={BRAND_ACCENT} stopOpacity="0" />
            <Stop offset="20%" stopColor={BRAND_SECONDARY} stopOpacity="1" />
            <Stop offset="50%" stopColor={BRAND_PRIMARY} stopOpacity="1" />
            <Stop offset="80%" stopColor={BRAND_SECONDARY} stopOpacity="1" />
            <Stop offset="100%" stopColor={BRAND_ACCENT} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#footerGrad)" />
      </Svg>
    </View>

    <View style={styles.footerTop}>
      <View style={styles.footerSection}>
        <Text style={styles.footerSectionTitle}>Prepared By</Text>
        <View style={styles.signLine} />
        <Text style={styles.signLabel}>Authorized Signatory</Text>
        <Text style={styles.signSub}>Finance Department</Text>
      </View>

      <View style={[styles.footerSection, styles.centerFooter]}>
        <View style={styles.companySeal}>
          <Text style={styles.sealTextOuter}>COMMON SEAL</Text>
          <Text style={styles.sealTextInner}>HFPL</Text>
          <Text style={styles.sealTextOuter}>HANSARIA FOOD</Text>
        </View>
        <Text style={styles.signSub}>Not valid without seal & signature</Text>
      </View>

      <View style={[styles.footerSection, styles.rightFooter]}>
        <Text style={[styles.footerSectionTitle, { textAlign: "right" }]}>Approved By</Text>
        <View style={[styles.signLine, { marginLeft: "auto" }]} />
        <Text style={[styles.signLabel, { textAlign: "right" }]}>Director / Partner</Text>
        <Text style={[styles.signSub, { textAlign: "right" }]}>Hansaria Food Pvt. Ltd.</Text>
      </View>
    </View>

    <View style={styles.bottomBand}>
      <Text style={styles.slogan}>"QUALITY • TRUST • TRANSPARENCY"</Text>
      <Text
        style={styles.pageIndicatorText}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
      <Text style={styles.metaText}>
        Generated on {new Date().toLocaleDateString("en-IN")} at {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
      </Text>
    </View>
  </View>
);

const formatCellValue = (prefix, value, unit = "") => {
  if (!value && value !== 0 && value !== "0") return `${prefix}: -`;
  return `${prefix}: ${value}${unit}`;
};

const SaudaMappingPdf = ({ rows, from, to, consignee, logoUrl }) => {
  const totalRows = rows.length;

  return (
    <Document title="Sauda Mapping Report - Hansaria Food">
      <Page size="A3" orientation="landscape" style={styles.page} wrap>
        <View style={styles.pageOuterBorder} fixed />
        <View style={styles.pageInnerBorder} fixed />
        <Svg
          style={{ position: "absolute", top: 18, left: 18, width: 14, height: 14 }}
          viewBox="0 0 14 14"
        >
          <Line x1="0" y1="14" x2="0" y2="0" stroke={BRAND_ACCENT} strokeWidth="2" />
          <Line x1="0" y1="0" x2="14" y2="0" stroke={BRAND_ACCENT} strokeWidth="2" />
        </Svg>
        <Svg
          style={{ position: "absolute", top: 18, right: 18, width: 14, height: 14 }}
          viewBox="0 0 14 14"
        >
          <Line x1="14" y1="14" x2="14" y2="0" stroke={BRAND_ACCENT} strokeWidth="2" />
          <Line x1="14" y1="0" x2="0" y2="0" stroke={BRAND_ACCENT} strokeWidth="2" />
        </Svg>
        <Svg
          style={{ position: "absolute", bottom: 18, left: 18, width: 14, height: 14 }}
          viewBox="0 0 14 14"
        >
          <Line x1="0" y1="0" x2="0" y2="14" stroke={BRAND_ACCENT} strokeWidth="2" />
          <Line x1="0" y1="14" x2="14" y2="14" stroke={BRAND_ACCENT} strokeWidth="2" />
        </Svg>
        <Svg
          style={{ position: "absolute", bottom: 18, right: 18, width: 14, height: 14 }}
          viewBox="0 0 14 14"
        >
          <Line x1="14" y1="0" x2="14" y2="14" stroke={BRAND_ACCENT} strokeWidth="2" />
          <Line x1="14" y1="14" x2="0" y2="14" stroke={BRAND_ACCENT} strokeWidth="2" />
        </Svg>

        <ReportHeader from={from} to={to} consignee={consignee} logoUrl={logoUrl} />

        <View style={styles.tableHeader} fixed>
          {columns.map((column, idx) => (
            <Text
              key={column.label}
              style={[
                styles.headerCell,
                { width: column.width },
                idx === columns.length - 1 && styles.headerCellLast,
              ]}
            >
              {column.label}
            </Text>
          ))}
        </View>

        {rows.map((row, index) => {
          const isLast = index === totalRows - 1;
          return (
            <View
              key={`${row["Adjustment Date"]}-${row["Seller Sauda"]}-${index}`}
              style={[
                styles.row,
                index % 2 ? styles.alternateRow : {},
                isLast && styles.lastRow,
              ]}
              wrap={false}
            >
              <Text style={[styles.cell, { width: columns[0].width }]}>
                <Text style={styles.labelInCell}>Date</Text>
                {"\n"}
                <Text style={styles.valueInCell}>{row["Adjustment Date"] || "-"}</Text>
                {"\n\n"}
                <Text style={styles.labelInCell}>Row</Text>
                {"\n"}
                <Text style={styles.valueInCell}>#{String(index + 1).padStart(3, "0")}</Text>
              </Text>

              <Text style={[styles.cell, { width: columns[1].width }]}>
                <Text style={styles.labelInCell}>Sauda No.</Text>
                {"\n"}
                <Text style={styles.valueInCell}>{row["Buyer Sauda"] || "-"}</Text>
                {"\n"}
                {formatCellValue("Company", row["Buyer Company"])}
                {"\n"}
                {formatCellValue("PO Date", row["Buyer PO Date"])}
                {"\n"}
                {formatCellValue("Qty", row["Buyer Quantity (Tons)"], " T")}
                {"\n"}
                {formatCellValue("Adjusted", row["Buyer Adjusted Total (Tons)"], " T")}
                {"\n"}
                {formatCellValue("Pending", row["Buyer Pending (Tons)"], " T")}
              </Text>

              <Text style={[styles.cell, { width: columns[2].width }]}>
                <Text style={styles.labelInCell}>Seller Sauda</Text>
                {"\n"}
                <Text style={styles.valueInCell}>{row["Seller Sauda"] || "-"}</Text>
                {"\n"}
                {formatCellValue("Mapped", row["All Mapped Seller Saudas"])}
                {"\n"}
                {formatCellValue("PO Date", row["Seller PO Date"])}
              </Text>

              <Text style={[styles.cell, { width: columns[3].width }]}>
                <Text style={styles.labelInCell}>Seller</Text>
                {"\n"}
                <Text style={styles.valueInCell}>{row["Seller Name"] || "-"}</Text>
                {"\n"}
                {formatCellValue("Company", row["Seller Company"])}
                {"\n"}
                {formatCellValue("Consignee", row.Consignee)}
                {"\n"}
                {formatCellValue("Commodity", row.Commodity)}
              </Text>

              <Text style={[styles.cell, { width: columns[4].width }]}>
                <Text style={styles.labelInCell}>Seller Qty</Text>
                {"\n"}
                <Text style={styles.valueInCell}>
                  {row["Seller Quantity (Tons)"] || "-"} T
                </Text>
                {"\n"}
                {formatCellValue("Adjusted", row["Adjusted Quantity (Tons)"], " T")}
                {"\n"}
                {formatCellValue("Pending", row["Seller Pending (Tons)"], " T")}
              </Text>

              <Text style={[styles.cell, { width: columns[5].width }]}>
                <Text style={styles.labelInCell}>Rate</Text>
                {"\n"}
                <Text style={styles.valueInCell}>₹{row.Rate || "-"}</Text>
                {"\n"}
                {formatCellValue("CD", row.CD)}
                {"\n"}
                {formatCellValue("GST", row.GST)}
              </Text>

              <Text
                style={[
                  styles.cell,
                  styles.cellLast,
                  { width: columns[6].width },
                ]}
              >
                <Text style={styles.labelInCell}>Delivery</Text>
                {"\n"}
                <Text style={styles.valueInCell}>{row["Delivery Date"] || "-"}</Text>
                {"\n"}
                {formatCellValue("Terms", row["Payment Terms"])}
              </Text>
            </View>
          );
        })}

        {totalRows === 0 && (
          <View
            style={{
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderBottomWidth: 1,
              borderColor: BRAND_BORDER,
              borderBottomLeftRadius: 8,
              borderBottomRightRadius: 8,
              paddingVertical: 40,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 54,
                height: 54,
                borderRadius: 54,
                backgroundColor: BRAND_LIGHT,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              <Svg viewBox="0 0 24 24" style={{ width: 28, height: 28 }}>
                <Circle cx="12" cy="12" r="10" fill="none" stroke={BRAND_SECONDARY} strokeWidth="1.5" />
                <Line x1="8" y1="12" x2="16" y2="12" stroke={BRAND_SECONDARY} strokeWidth="1.5" strokeLinecap="round" />
              </Svg>
            </View>
            <Text
              style={{
                fontSize: 9,
                fontWeight: "bold",
                color: BRAND_PRIMARY,
                letterSpacing: 1.5,
                marginBottom: 3,
              }}
            >
              NO RECORDS FOUND
            </Text>
            <Text
              style={{
                fontSize: 6,
                color: TEXT_MUTED,
                fontWeight: "bold",
              }}
            >
              No sauda mapping records found for the selected date range and filters
            </Text>
          </View>
        )}

        <ReportFooter />
      </Page>
    </Document>
  );
};

export default SaudaMappingPdf;
