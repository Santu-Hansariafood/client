import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

import logo from "../../assets/Hans.jpg";

const styles = StyleSheet.create({
  page: {
    paddingTop: 110,
    paddingBottom: 60,
    paddingHorizontal: 25,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#000",
    backgroundColor: "#fff",
  },

  header: {
    position: "absolute",
    top: 25,
    left: 25,
    right: 25,
    borderWidth: 1.5,
    borderColor: "#000",
    flexDirection: "row",
    padding: 10,
    alignItems: "center",
  },

  logo: {
    width: 60,
    height: 60,
    objectFit: "contain",
  },

  companySection: {
    flex: 1,
    textAlign: "center",
  },

  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    textTransform: "uppercase",
  },

  companyAddress: {
    fontSize: 8.5,
    lineHeight: 1.4,
  },

  titleSection: {
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: "#000",
    paddingVertical: 6,
    alignItems: "center",
  },

  title: {
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 2,
    textTransform: "uppercase",
    textDecoration: "underline",
  },

  infoWrapper: {
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: "#000",
    flexDirection: "row",
  },

  infoLeft: {
    flex: 1,
    borderRightWidth: 1.5,
    borderColor: "#000",
    padding: 8,
    minHeight: 85,
  },

  infoRight: {
    width: "38%",
    padding: 8,
  },

  line: {
    marginBottom: 5,
    lineHeight: 1.5,
  },

  bold: {
    fontWeight: "bold",
  },

  tableWrapper: {
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: "#000",
  },

  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderColor: "#000",
    backgroundColor: "#f2f2f2",
    minHeight: 28,
    alignItems: "center",
  },

  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
    minHeight: 25,
    alignItems: "center",
  },

  cell: {
    borderRightWidth: 1,
    borderColor: "#000",
    paddingHorizontal: 4,
    justifyContent: "center",
    height: "100%",
    paddingVertical: 5,
  },

  headerText: {
    fontSize: 8.5,
    fontWeight: "bold",
    textAlign: "center",
    textTransform: "uppercase",
  },

  cellText: {
    fontSize: 8.5,
  },

  right: {
    textAlign: "right",
  },

  center: {
    textAlign: "center",
  },

  totalRow: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    minHeight: 28,
    alignItems: "center",
  },

  amountSection: {
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: "#000",
    padding: 8,
    minHeight: 50,
    lineHeight: 1.6,
  },

  bankWrapper: {
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: "#000",
    flexDirection: "row",
    minHeight: 110,
  },

  bankLeft: {
    flex: 1,
    borderRightWidth: 1.5,
    borderColor: "#000",
    padding: 8,
  },

  bankRight: {
    width: "40%",
    padding: 8,
    justifyContent: "space-between",
    alignItems: "center",
  },

  paymentBox: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#000",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },

  paymentTitle: {
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 4,
    textTransform: "uppercase",
  },

  qrImage: {
    width: 70,
    height: 70,
    marginBottom: 4,
  },

  paymentMeta: {
    fontSize: 7,
    textAlign: "center",
    lineHeight: 1.3,
    marginTop: 1,
  },

  signatoryBox: {
    width: "100%",
    alignItems: "center",
  },

  footer: {
    position: "absolute",
    bottom: 30,
    left: 25,
    right: 25,
    textAlign: "center",
    fontSize: 8,
    color: "#666",
  },
});

const BuyerProformaInvoicePDF = ({
  entries = [],
  company = {},
  upiQrCodeUrl = "",
  upiId = "",
  upiAmount = 0,
}) => {
  const totalWeight = entries.reduce(
    (sum, entry) => sum + (Number(entry.unloadingWeight) || 0),
    0,
  );
  const totalBrokerage = entries.reduce(
    (sum, entry) => sum + (Number(entry.buyerBrokerage) || 0),
    0,
  );

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-GB");
  };

  const numberToWords = (num) => {
    const a = [
      "",
      "One ",
      "Two ",
      "Three ",
      "Four ",
      "Five ",
      "Six ",
      "Seven ",
      "Eight ",
      "Nine ",
      "Ten ",
      "Eleven ",
      "Twelve ",
      "Thirteen ",
      "Fourteen ",
      "Fifteen ",
      "Sixteen ",
      "Seventeen ",
      "Eighteen ",
      "Nineteen ",
    ];
    const b = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    const n = ("0000000" + Math.floor(num))
      .substr(-7)
      .match(/^(\d{2})(\d{2})(\d{2})(\d{1})$/);
    if (!n) return "";
    let str = "";
    str +=
      n[1] != 0
        ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + "Lakh "
        : "";
    str +=
      n[2] != 0
        ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + "Thousand "
        : "";
    str +=
      n[3] != 0
        ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + "Hundred "
        : "";
    str +=
      n[4] != 0
        ? (str != "" ? "and " : "") +
          (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]])
        : "";
    return str + "Only";
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={logo} style={styles.logo} />
          <View style={styles.companySection}>
            <Text style={styles.companyName}>
              Hansaria Food Private Limited
            </Text>
            <Text style={styles.companyAddress}>
              Address: Village- Bansirampur, Post- Galsi, Dist- Purba Bardhaman,
              WB - 713406{"\n"}
              Email: info@hansariafood.com | Contact: +91 97321 72771
            </Text>
          </View>
        </View>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Buyer Brokerage Report</Text>
        </View>
        <View style={styles.infoWrapper}>
          <View style={styles.infoLeft}>
            <Text style={[styles.bold, { marginBottom: 3 }]}>Bill To:</Text>
            <Text style={styles.bold}>{company.companyName || "N/A"}</Text>
            {company.address && <Text>{company.address}</Text>}
            {company.gstNumber && <Text>GSTIN: {company.gstNumber}</Text>}
          </View>
          <View style={styles.infoRight}>
            <Text style={styles.line}>
              <Text style={styles.bold}>Date: </Text>
              {formatDate(new Date())}
            </Text>
            <Text style={styles.line}>
              <Text style={styles.bold}>Report No: </Text>
              BRK/{new Date().getFullYear()}/{Math.floor(Math.random() * 1000)}
            </Text>
          </View>
        </View>
        <View style={styles.tableWrapper}>
          <View style={styles.tableHeader}>
            <View style={[styles.cell, { width: "10%" }]}>
              <Text style={styles.headerText}>Date</Text>
            </View>
            <View style={[styles.cell, { width: "15%" }]}>
              <Text style={styles.headerText}>Sauda No</Text>
            </View>
            <View style={[styles.cell, { width: "15%" }]}>
              <Text style={styles.headerText}>Lorry No</Text>
            </View>
            <View style={[styles.cell, { width: "20%" }]}>
              <Text style={styles.headerText}>Commodity</Text>
            </View>
            <View style={[styles.cell, { width: "15%" }]}>
              <Text style={styles.headerText}>Unload Wt</Text>
            </View>
            <View style={[styles.cell, { width: "25%", borderRightWidth: 0 }]}>
              <Text style={styles.headerText}>Brokerage</Text>
            </View>
          </View>

          {entries.map((entry, index) => (
            <View key={index} style={styles.row}>
              <View style={[styles.cell, { width: "10%" }]}>
                <Text style={[styles.cellText, styles.center]}>
                  {formatDate(entry.unloadingDate || entry.loadingDate)}
                </Text>
              </View>
              <View style={[styles.cell, { width: "15%" }]}>
                <Text style={[styles.cellText, styles.center]}>
                  {entry.saudaNo || "N/A"}
                </Text>
              </View>
              <View style={[styles.cell, { width: "15%" }]}>
                <Text style={[styles.cellText, styles.center]}>
                  {entry.lorryNumber || "N/A"}
                </Text>
              </View>
              <View style={[styles.cell, { width: "20%" }]}>
                <Text style={styles.cellText}>{entry.commodity || "N/A"}</Text>
              </View>
              <View style={[styles.cell, { width: "15%" }]}>
                <Text style={[styles.cellText, styles.right]}>
                  {Number(entry.unloadingWeight || 0).toFixed(2)} T
                </Text>
              </View>
              <View
                style={[styles.cell, { width: "25%", borderRightWidth: 0 }]}
              >
                <Text style={[styles.cellText, styles.right]}>
                  Rs.{" "}
                  {Number(entry.buyerBrokerage || 0).toLocaleString("en-IN")}
                </Text>
              </View>
            </View>
          ))}
          <View style={styles.totalRow}>
            <View style={[styles.cell, { width: "60%" }]}>
              <Text style={[styles.headerText, styles.right]}>
                Total Consolidated Weight & Brokerage:
              </Text>
            </View>
            <View style={[styles.cell, { width: "15%" }]}>
              <Text style={[styles.headerText, styles.right]}>
                {totalWeight.toFixed(2)} T
              </Text>
            </View>
            <View style={[styles.cell, { width: "25%", borderRightWidth: 0 }]}>
              <Text style={[styles.headerText, styles.right]}>
                Rs. {totalBrokerage.toLocaleString("en-IN")}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.amountSection}>
          <Text style={styles.bold}>Amount in words:</Text>
          <Text>Rupees {numberToWords(totalBrokerage)}</Text>
        </View>

        <View style={styles.bankWrapper}>
          <View style={styles.bankLeft}>
            <Text style={[styles.bold, { marginBottom: 5 }]}>
              Terms & Conditions:
            </Text>
            <Text style={{ fontSize: 7, lineHeight: 1.4 }}>
              1. This is a computer generated brokerage report.{"\n"}
              2. Please check all details and report discrepancies within 24
              hours.{"\n"}
              3. Payment should be made as per agreed terms.
            </Text>
          </View>
          <View style={styles.bankRight}>
            <View style={styles.paymentBox}>
              <Text style={styles.paymentTitle}>Scan & Pay via UPI</Text>
              {upiQrCodeUrl ? (
                <Image src={upiQrCodeUrl} style={styles.qrImage} />
              ) : (
                <Text style={styles.paymentMeta}>QR unavailable</Text>
              )}
              <Text style={styles.paymentMeta}>UPI: {upiId || "N/A"}</Text>
              <Text style={styles.paymentMeta}>
                Amount: Rs. {Number(upiAmount || totalBrokerage).toFixed(2)}
              </Text>
            </View>
            <View style={styles.signatoryBox}>
              <Text style={styles.bold}>For Hansaria Food Private Limited</Text>
              <View style={{ height: 18 }} />
              <Text style={[styles.bold, { borderTopWidth: 1, paddingTop: 4 }]}>
                Authorized Signatory
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          Thank you for your business! | Visit us at www.hansariafood.com
        </Text>
      </Page>
    </Document>
  );
};

export default BuyerProformaInvoicePDF;
