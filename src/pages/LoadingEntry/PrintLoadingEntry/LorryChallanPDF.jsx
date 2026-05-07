import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    paddingTop: 20,
    paddingBottom: 25,
    paddingHorizontal: 25,
    fontFamily: "Helvetica",
    fontSize: 8,
    color: "#000",
    lineHeight: 1.2,
  },

  title: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },

  line: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginVertical: 4,
  },

  sectionLine: {
    borderBottomWidth: 0.6,
    borderBottomColor: "#000",
    marginTop: 6,
    marginBottom: 4,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },

  row: {
    flexDirection: "row",
    marginBottom: 2,
    flexWrap: "wrap",
  },

  label: {
    width: "28%",
    fontWeight: "bold",
  },

  value: {
    width: "72%",
  },

  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
    marginTop: 2,
  },

  twoColumn: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  column: {
    width: "48%",
  },

  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
    paddingHorizontal: 20,
  },

  signatureBox: {
    alignItems: "center",
    width: "40%",
  },

  signatureLine: {
    width: "100%",
    borderBottomWidth: 0.8,
    borderBottomColor: "#000",
    marginBottom: 4,
  },

  footer: {
    marginTop: 20,
    fontSize: 7,
    textAlign: "left",
  },

  smallText: {
    fontSize: 7,
    marginBottom: 2,
  },

  bold: {
    fontWeight: "bold",
  },
});

const formatDate = (date) => {
  if (!date) return "N/A";

  return new Date(date)
    .toLocaleDateString("en-GB")
    .replace(/\//g, "/");
};

const LorryChallanPDF = ({ data }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.title}>LORRY CHALLAN</Text>

        <View style={styles.line} />

        {/* Top Details */}
        <View style={styles.rowBetween}>
          <Text>
            <Text style={styles.bold}>HFPL Sauda No: </Text>
            {data.saudaNo || "N/A"}
          </Text>

          <Text>
            <Text style={styles.bold}>Buyer PO No: </Text>
            {data.buyerPoNo || "N/A"}
          </Text>
        </View>

        <View style={styles.rowBetween}>
          <Text>
            <Text style={styles.bold}>Challan No: </Text>
            {data.billNumber || "N/A"}
          </Text>

          <Text>
            <Text style={styles.bold}>Date: </Text>
            {formatDate(data.dateOfIssue)}
          </Text>
        </View>

        <View style={{ marginTop: 4 }}>
          <Text>
            <Text style={styles.bold}>Broker: </Text>
            Hansaria Food Private Limited
          </Text>
        </View>

        {/* Consignee */}
        <View style={styles.sectionLine} />

        <Text style={styles.sectionTitle}>SHIP TO (CONSIGNEE)</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Consignee:</Text>
          <Text style={styles.value}>
            {data.consignee || "N/A"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>
            {data.consigneeDetails?.address || "N/A"}
            {data.consigneeDetails?.district
              ? `, ${data.consigneeDetails.district}`
              : ""}
            {data.consigneeDetails?.state
              ? `, ${data.consigneeDetails.state}`
              : ""}
            {data.consigneeDetails?.pinNo
              ? ` - ${data.consigneeDetails.pinNo}`
              : ""}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Mobile:</Text>
          <Text style={styles.value}>
            {data.consigneeDetails?.mobile || "N/A"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>GST:</Text>
          <Text style={styles.value}>
            {data.consigneeDetails?.gstNo || "N/A"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>PAN No:</Text>
          <Text style={styles.value}>
            {data.consigneeDetails?.panNo || "N/A"}
          </Text>
        </View>

        {/* Buyer */}
        <View style={styles.sectionLine} />

        <Text style={styles.sectionTitle}>BUYER ACCOUNT</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Buyer Company:</Text>
          <Text style={styles.value}>
            {data.buyerCompany || data.buyer || "N/A"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Address:</Text>
          <Text style={styles.value}>
            {data.buyerDetails?.address || "N/A"}
          </Text>
        </View>

        {/* Goods */}
        <View style={styles.sectionLine} />

        <Text style={styles.sectionTitle}>
          DESCRIPTION OF GOODS
        </Text>

        <View style={styles.row}>
          <Text style={styles.label}>Item:</Text>
          <Text style={styles.value}>
            {data.commodity || "N/A"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Bags:</Text>
          <Text style={styles.value}>
            {data.bags || "1"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Weight:</Text>
          <Text style={styles.value}>
            {data.loadingWeight || "0"} Tons
          </Text>
        </View>

        {/* Route */}
        <View style={styles.sectionLine} />

        <Text style={styles.sectionTitle}>
          ROUTE & VEHICLE DETAILS
        </Text>

        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Text>
              <Text style={styles.bold}>From: </Text>
              {data.loadingPlace || "N/A"}
            </Text>
          </View>

          <View style={styles.column}>
            <Text>
              <Text style={styles.bold}>To: </Text>
              {data.unloadingPlace || "N/A"}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 5 }}>
          <View style={styles.row}>
            <Text style={styles.label}>Transporter:</Text>
            <Text style={styles.value}>
              {data.addedTransport || "N/A"}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Lorry No:</Text>
            <Text style={styles.value}>
              {data.lorryNumber || "N/A"}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Driver:</Text>
            <Text style={styles.value}>
              {data.driverName || "N/A"}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Mob:</Text>
            <Text style={styles.value}>
              {data.driverPhoneNumber || "N/A"}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>
              Transporter Address:
            </Text>
            <Text style={styles.value}>
              {data.transporterAddress || "N/A"}
            </Text>
          </View>
        </View>

        {/* Freight */}
        <View style={styles.sectionLine} />

        <Text style={styles.sectionTitle}>
          FREIGHT DETAILS
        </Text>

        <View style={styles.row}>
          <Text style={styles.label}>Total Freight:</Text>
          <Text style={styles.value}>
            Rs. {data.totalFreight || "0"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Advance:</Text>
          <Text style={styles.value}>
            Rs. {data.advance || "0"}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>To Pay:</Text>
          <Text style={styles.value}>
            Rs. {data.balance || "0"}
          </Text>
        </View>

        {/* Signature */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text>Driver Signature</Text>
          </View>

          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text>Authorized Signature</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.smallText}>
            *Any shortage or damage shall be deducted
            from the freight amount.
          </Text>

          <Text style={styles.smallText}>
            *This is a computer-generated challan
            issued by Hansaria Food Private Limited.
            It is for informational purposes only and
            shall not be considered as a legal document
            or proof of delivery.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default LorryChallanPDF;
