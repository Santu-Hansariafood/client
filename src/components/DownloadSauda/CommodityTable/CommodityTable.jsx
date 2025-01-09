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
    fontSize: 8,
    flex: 1,
    border: "1px solid #cccccc",
    textAlign: "center",
  },
  fullWidthRow: {
    flexDirection: "row",
    width: "100%",
  },
  parameterCell: {
    padding: 5,
    fontSize: 8,
    flex: 1,
    border: "1px solid #cccccc",
    textAlign: "left",
  },
  bold: {
    fontWeight: "bold",
  },
});

const CommodityTable = ({ data }) => {
  const filteredParameters = data.parameters.filter(
    (param) => param.value !== "0"
  );

  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableCell, styles.bold]}>Product Name</Text>
        <Text style={[styles.tableCell, styles.bold]}>Qty</Text>
        <Text style={[styles.tableCell, styles.bold]}>Rate</Text>
        <Text style={[styles.tableCell, styles.bold]}>GST (%)</Text>
        <Text style={[styles.tableCell, styles.bold]}>CD (%)</Text>
      </View>

      <View style={styles.tableRow}>
        <Text style={styles.tableCell}>{data.commodity}</Text>
        <Text style={styles.tableCell}>{data.quantity} TON</Text>
        <Text style={styles.tableCell}>{data.rate} / TON</Text>
        <Text style={styles.tableCell}>{data.gst}%</Text>
        <Text style={styles.tableCell}>{data.cd}%</Text>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, styles.bold]}>Quality Parameters</Text>
        </View>
        {filteredParameters.map((param, index) => (
          <View
            key={param._id}
            style={[
              styles.fullWidthRow,
              index % 2 === 0 ? styles.tableRow : styles.tableRowAlt,
            ]}
          >
            <Text style={styles.parameterCell}>
              {param.parameter}: {param.value} %
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default CommodityTable;
