import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const columns = [
  { label: "ADJUSTMENT", width: "9%" },
  { label: "BUYER SAUDA", width: "18%" },
  { label: "SELLER SAUDA MAPPING", width: "17%" },
  { label: "SELLER / CONSIGNEE", width: "18%" },
  { label: "QUANTITIES (TONS)", width: "16%" },
  { label: "RATE / CD / GST", width: "11%" },
  { label: "DELIVERY / TERMS", width: "11%" },
];

const styles = StyleSheet.create({
  page: {
    paddingTop: 62,
    paddingBottom: 34,
    paddingHorizontal: 24,
    fontFamily: "Helvetica",
    fontSize: 7,
    color: "#1e293b",
    backgroundColor: "#ffffff",
  },
  header: {
    position: "absolute",
    top: 20,
    left: 24,
    right: 24,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
  },
  heading: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "bold",
    color: "#1a3a5f",
  },
  filterLine: {
    marginTop: 5,
    textAlign: "center",
    fontSize: 8,
    color: "#64748b",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1a3a5f",
    borderWidth: 0.5,
    borderColor: "#1a3a5f",
  },
  headerCell: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    color: "#ffffff",
    fontSize: 6.5,
    fontWeight: "bold",
    textAlign: "center",
    borderRightWidth: 0.5,
    borderRightColor: "#64748b",
  },
  row: {
    flexDirection: "row",
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: "#cbd5e1",
  },
  alternateRow: {
    backgroundColor: "#f8fafc",
  },
  cell: {
    paddingVertical: 5,
    paddingHorizontal: 4,
    fontSize: 6.5,
    lineHeight: 1.35,
    borderRightWidth: 0.5,
    borderRightColor: "#cbd5e1",
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 24,
    right: 24,
    textAlign: "right",
    color: "#64748b",
    fontSize: 7,
  },
});

const SaudaMappingPdf = ({ rows, from, to, consignee }) => (
  <Document title="Sauda Mapping Report">
    <Page size="A3" orientation="landscape" style={styles.page} wrap>
      <View style={styles.header} fixed>
        <Text style={styles.heading}>SAUDA MAPPING REPORT</Text>
        <Text style={styles.filterLine}>
          {`Date: ${from} to ${to}  |  Consignee: ${consignee || "All"}`}
        </Text>
      </View>

      <View style={styles.tableHeader} fixed>
        {columns.map((column) => (
          <Text
            key={column.label}
            style={[styles.headerCell, { width: column.width }]}
          >
            {column.label}
          </Text>
        ))}
      </View>

      {rows.map((row, index) => (
        <View
          key={`${row["Adjustment Date"]}-${row["Seller Sauda"]}-${index}`}
          style={[styles.row, index % 2 ? styles.alternateRow : {}]}
          wrap={false}
        >
          <Text style={[styles.cell, { width: columns[0].width }]}>
            {row["Adjustment Date"]}
          </Text>
          <Text style={[styles.cell, { width: columns[1].width }]}>
            {`Sauda: ${row["Buyer Sauda"]}\nCompany: ${row["Buyer Company"]}\nPO Date: ${row["Buyer PO Date"]}\nQuantity: ${row["Buyer Quantity (Tons)"]} T\nAdjusted: ${row["Buyer Adjusted Total (Tons)"]} T\nPending: ${row["Buyer Pending (Tons)"]} T`}
          </Text>
          <Text style={[styles.cell, { width: columns[2].width }]}>
            {`Seller Sauda: ${row["Seller Sauda"]}\nMapped Saudas: ${row["All Mapped Seller Saudas"]}\nPO Date: ${row["Seller PO Date"]}`}
          </Text>
          <Text style={[styles.cell, { width: columns[3].width }]}>
            {`Name: ${row["Seller Name"]}\nCompany: ${row["Seller Company"]}\nConsignee: ${row.Consignee}\nCommodity: ${row.Commodity}`}
          </Text>
          <Text style={[styles.cell, { width: columns[4].width }]}>
            {`Seller: ${row["Seller Quantity (Tons)"]} T\nAdjusted: ${row["Adjusted Quantity (Tons)"]} T\nPending: ${row["Seller Pending (Tons)"]} T`}
          </Text>
          <Text style={[styles.cell, { width: columns[5].width }]}>
            {`Rate: ${row.Rate}\nCD: ${row.CD}\nGST: ${row.GST}`}
          </Text>
          <Text style={[styles.cell, { width: columns[6].width }]}>
            {`Delivery: ${row["Delivery Date"]}\nTerms: ${row["Payment Terms"]}`}
          </Text>
        </View>
      ))}

      <Text
        style={styles.footer}
        fixed
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </Page>
  </Document>
);

export default SaudaMappingPdf;