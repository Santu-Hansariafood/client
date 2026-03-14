import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  table: {
    marginVertical: 10,
  },
    tableHeader: {
    backgroundColor: "#1F7A3E",
    flexDirection: "row",
    padding: 6,
  },

  headerCell: {
    fontSize: 9,
    flex: 1,
    textAlign: "center",
    color: "#ffffff",
    fontWeight: "bold",
  },

  tableRow: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #E5E7EB",
    padding: 6,
    backgroundColor: "#F9FAFB",
  },
  
  tableCell: {
    fontSize: 8,
    flex: 1,
    textAlign: "center",
    color: "#2d3748",
  },
  
  qualitySection: {
    marginTop: 10,
  },
  qualityTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#1a365d",
    marginBottom: 5,
    textTransform: "uppercase",
    borderBottom: "0.5pt solid #1a365d",
    paddingBottom: 2,
  },
  parameterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    border: "0.5pt solid #e2e8f0",
    borderRadius: 3,
  },
  parameterCell: {
    width: "33.33%",
    padding: 4,
    fontSize: 7,
    borderRight: "0.5pt solid #e2e8f0",
    borderBottom: "0.5pt solid #e2e8f0",
    color: "#4a5568",
  },
  bold: {
    fontWeight: "bold",
  },
});

const CommodityTable = ({ data }) => {
  const filteredParameters = data.parameters.filter(
    (param) => param.value !== "0" && param.value !== "" && param.value !== null && param.value !== undefined
  );

  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={styles.headerCell}>Product Name</Text>
        <Text style={styles.headerCell}>Qty</Text>
        <Text style={styles.headerCell}>Rate</Text>
        <Text style={styles.headerCell}>GST (%)</Text>
        <Text style={styles.headerCell}>CD (%)</Text>
      </View>

      <View style={styles.tableRow}>
        <Text style={styles.tableCell}>{data.commodity}</Text>
        <Text style={styles.tableCell}>{data.quantity} TON</Text>
        <Text style={styles.tableCell}>{data.rate} / TON</Text>
        <Text style={styles.tableCell}>{data.gst}%</Text>
        <Text style={styles.tableCell}>{data.cd}%</Text>
      </View>

      {filteredParameters.length > 0 && (
        <View style={styles.qualitySection}>
          <Text style={styles.qualityTitle}>Quality Parameters</Text>
          <View style={styles.parameterGrid}>
            {filteredParameters.map((param) => (
              <Text key={param._id} style={styles.parameterCell}>
                <Text style={styles.bold}>{param.parameter}:</Text> {param.value}%
              </Text>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

export default CommodityTable;
