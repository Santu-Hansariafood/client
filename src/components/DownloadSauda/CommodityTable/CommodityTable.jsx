import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  table: {
    marginVertical: 12,
    borderRadius: 10,
    overflow: "hidden",
    border: "1px solid #27ae60",
  },
  tableHeader: {
    backgroundColor: "#27ae60",
    color: "#f7ca18",
    flexDirection: "row",
    padding: 6,
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "#fffde7",
  },
  tableRowAlt: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
  },
  tableCell: {
    padding: 6,
    fontSize: 9,
    flex: 1,
    border: "1px solid #f7ca18",
    textAlign: "center",
  },
  fullWidthRow: {
    flexDirection: "row",
    width: "100%",
  },
  parameterCell: {
    padding: 6,
    fontSize: 9,
    flex: 1,
    border: "1px solid #f7ca18",
    textAlign: "center",
  },
  bold: {
    fontWeight: "bold",
  },
});

const CommodityTable = ({ data }) => {
  const filteredParameters = data.parameters.filter(
    (param) => param.value !== "0"
  );

  const columnCount = 3;
  const parameterRows = [];
  for (let i = 0; i < filteredParameters.length; i += columnCount) {
    parameterRows.push(filteredParameters.slice(i, i + columnCount));
  }

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
          <Text style={[styles.tableCell, styles.bold]}>
            Quality Parameters
          </Text>
        </View>

        {parameterRows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.fullWidthRow}>
            {row.map((param) => (
              <Text
                key={param._id}
                style={[styles.parameterCell, rowIndex % 2 === 0 ? styles.tableRow : styles.tableRowAlt]}
              >
                {param.parameter}: {param.value} %
              </Text>
            ))}
            {row.length < columnCount &&
              Array.from({ length: columnCount - row.length }).map((_, index) => (
                <Text
                  key={`empty-${rowIndex}-${index}`}
                  style={styles.parameterCell}
                >
                  {" "}
                </Text>
              ))}
          </View>
        ))}
      </View>
    </View>
  );
};

export default CommodityTable;
