import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  table: {
    marginVertical: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  tableHeader: {
    backgroundColor: "#003366",
    color: "#ffffff",
    flexDirection: "row",
    padding: 5,
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
  },
  tableRowAlt: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
  },
  tableCell: {
    padding: 5,
    fontSize: 10,
    flex: 1,
    border: "1px solid #cccccc",
    textAlign: "center",
  },
  bold: {
    fontWeight: "bold",
  },
});

const CommodityTable = ({ data }) => (
  <View style={styles.table}>
    {/* Table Header */}
    <View style={styles.tableHeader}>
      <Text style={[styles.tableCell, styles.bold]}>Product Name</Text>
      <Text style={[styles.tableCell, styles.bold]}>Qty</Text>
      <Text style={[styles.tableCell, styles.bold]}>Rate</Text>
      <Text style={[styles.tableCell, styles.bold]}>GST (%)</Text>
      <Text style={[styles.tableCell, styles.bold]}>CD (%)</Text>
      <Text style={[styles.tableCell, styles.bold]}>Quality Parameters</Text>
    </View>

    {/* Table Row */}
    <View style={styles.tableRow}>
      <Text style={styles.tableCell}>{data.commodity}</Text>
      <Text style={styles.tableCell}>{data.quantity} TON</Text>
      <Text style={styles.tableCell}>{data.rate} / TON</Text>
      <Text style={styles.tableCell}>{data.gst}%</Text>
      <Text style={styles.tableCell}>{data.cd}%</Text>
      <Text style={styles.tableCell}>{data.qualityParameters || "N/A"}</Text>
    </View>
  </View>
);

export default CommodityTable;
