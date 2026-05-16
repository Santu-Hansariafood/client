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
    padding: 18,
    fontSize: 8,
    fontFamily: "Courier",
    color: "#000",
    backgroundColor: "#fff",
  },

  outerBorder: {
    borderWidth: 1,
    borderColor: "#000",
  },

  header: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
    padding: 6,
  },

  logo: {
    width: 55,
    height: 55,
  },

  companySection: {
    flex: 1,
    textAlign: "center",
    justifyContent: "center",
  },

  companyName: {
    fontSize: 14,
    fontWeight: "bold",
  },

  companyAddress: {
    fontSize: 7,
    marginTop: 2,
    lineHeight: 1.3,
  },

  title: {
    borderBottomWidth: 1,
    borderColor: "#000",
    textAlign: "center",
    padding: 5,
    fontSize: 11,
    fontWeight: "bold",
  },

  infoSection: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
  },

  infoBox: {
    flex: 1,
    padding: 6,
    minHeight: 70,
  },

  leftBox: {
    borderRightWidth: 1,
    borderColor: "#000",
  },

  label: {
    fontWeight: "bold",
  },

  line: {
    marginBottom: 3,
  },

  table: {},

  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
    backgroundColor: "#f3f3f3",
  },

  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
    minHeight: 22,
    alignItems: "center",
  },

  cell: {
    padding: 4,
    borderRightWidth: 1,
    borderColor: "#000",
    justifyContent: "center",
  },

  headerText: {
    fontWeight: "bold",
    fontSize: 7.5,
    textAlign: "center",
  },

  cellText: {
    fontSize: 7.5,
  },

  rightText: {
    textAlign: "right",
  },

  centerText: {
    textAlign: "center",
  },

  totalRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
    backgroundColor: "#f3f3f3",
    minHeight: 24,
    alignItems: "center",
  },

  amountWords: {
    padding: 6,
    borderBottomWidth: 1,
    borderColor: "#000",
    minHeight: 40,
  },

  bankSection: {
    flexDirection: "row",
    minHeight: 100,
  },

  bankLeft: {
    flex: 1,
    padding: 6,
    borderRightWidth: 1,
    borderColor: "#000",
  },

  bankRight: {
    flex: 1,
    padding: 6,
    textAlign: "right",
  },

  footer: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 7,
  },
});

const numberToWords = (amount) => {
  return `${amount.toLocaleString("en-IN")} Rupees Only`;
};

const ProformaInvoicePDF = ({ entries = [], company = {} }) => {
  const totalLoading = entries.reduce(
    (sum, e) => sum + (e.loadingWeight || 0),
    0,
  );

  const totalUnloading = entries.reduce(
    (sum, e) => sum + (e.unloadingWeight || 0),
    0,
  );

  const totalBrokerage = entries.reduce(
    (sum, e) => sum + (e.sellerBrokerage || 0),
    0,
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.outerBorder}>
          {/* HEADER */}
          <View style={styles.header}>
            <Image src={logo} style={styles.logo} />

            <View style={styles.companySection}>
              <Text style={styles.companyName}>
                HANSARIA FOOD PRIVATE LIMITED
              </Text>

              <Text style={styles.companyAddress}>
                207, Maharshi Debendra Road, Kolkata - 700007{"\n"}
                Phone: +91 33 2268 4567{"\n"}
                Email: info@hansariafood.com
              </Text>
            </View>
          </View>

          {/* TITLE */}
          <View style={styles.title}>
            <Text>PROFORMA INVOICE</Text>
          </View>

          {/* INFO SECTION */}
          <View style={styles.infoSection}>
            <View style={[styles.infoBox, styles.leftBox]}>
              <Text style={styles.line}>
                <Text style={styles.label}>Seller :</Text>{" "}
                {company.companyName || "-"}
              </Text>

              <Text style={styles.line}>
                <Text style={styles.label}>Address :</Text>{" "}
                {company.address || "-"}
              </Text>

              <Text style={styles.line}>
                <Text style={styles.label}>GSTIN :</Text> {company.gstNo || "-"}
              </Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.line}>
                <Text style={styles.label}>Invoice No :</Text> HF/
                {new Date().getFullYear()}/{Math.floor(Math.random() * 1000)}
              </Text>

              <Text style={styles.line}>
                <Text style={styles.label}>Date :</Text>{" "}
                {new Date().toLocaleDateString("en-IN")}
              </Text>
            </View>
          </View>

          {/* TABLE */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <View style={[styles.cell, { width: "5%" }]}>
                <Text style={styles.headerText}>#</Text>
              </View>

              <View style={[styles.cell, { width: "12%" }]}>
                <Text style={styles.headerText}>Sauda</Text>
              </View>

              <View style={[styles.cell, { width: "14%" }]}>
                <Text style={styles.headerText}>Lorry</Text>
              </View>

              <View style={[styles.cell, { width: "12%" }]}>
                <Text style={styles.headerText}>Load Qty</Text>
              </View>

              <View style={[styles.cell, { width: "12%" }]}>
                <Text style={styles.headerText}>Unload Qty</Text>
              </View>

              <View style={[styles.cell, { width: "20%" }]}>
                <Text style={styles.headerText}>Commodity</Text>
              </View>

              <View style={[styles.cell, { width: "10%" }]}>
                <Text style={styles.headerText}>Rate</Text>
              </View>

              <View
                style={[styles.cell, { width: "15%", borderRightWidth: 0 }]}
              >
                <Text style={styles.headerText}>Brokerage</Text>
              </View>
            </View>

            {entries.map((entry, index) => {
              const rate =
                entry.unloadingWeight > 0
                  ? (entry.sellerBrokerage / entry.unloadingWeight).toFixed(2)
                  : "0.00";

              return (
                <View style={styles.row} key={index}>
                  <View style={[styles.cell, { width: "5%" }]}>
                    <Text style={styles.cellText}>{index + 1}</Text>
                  </View>

                  <View style={[styles.cell, { width: "12%" }]}>
                    <Text style={styles.cellText}>{entry.saudaNo || "-"}</Text>
                  </View>

                  <View style={[styles.cell, { width: "14%" }]}>
                    <Text style={styles.cellText}>
                      {entry.lorryNumber || "-"}
                    </Text>
                  </View>

                  <View style={[styles.cell, { width: "12%" }]}>
                    <Text style={[styles.cellText, styles.rightText]}>
                      {entry.loadingWeight?.toFixed(2)}
                    </Text>
                  </View>

                  <View style={[styles.cell, { width: "12%" }]}>
                    <Text style={[styles.cellText, styles.rightText]}>
                      {entry.unloadingWeight?.toFixed(2)}
                    </Text>
                  </View>

                  <View style={[styles.cell, { width: "20%" }]}>
                    <Text style={styles.cellText}>{entry.commodity}</Text>
                  </View>

                  <View style={[styles.cell, { width: "10%" }]}>
                    <Text style={[styles.cellText, styles.rightText]}>
                      {rate}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.cell,
                      {
                        width: "15%",
                        borderRightWidth: 0,
                      },
                    ]}
                  >
                    <Text style={[styles.cellText, styles.rightText]}>
                      {entry.sellerBrokerage?.toFixed(2)}
                    </Text>
                  </View>
                </View>
              );
            })}

            {/* TOTAL ROW */}
            <View style={styles.totalRow}>
              <View style={[styles.cell, { width: "31%" }]}>
                <Text style={styles.headerText}>GRAND TOTAL</Text>
              </View>

              <View style={[styles.cell, { width: "12%" }]}>
                <Text style={styles.headerText}>{totalLoading.toFixed(2)}</Text>
              </View>

              <View style={[styles.cell, { width: "12%" }]}>
                <Text style={styles.headerText}>
                  {totalUnloading.toFixed(2)}
                </Text>
              </View>

              <View style={[styles.cell, { width: "20%" }]}>
                <Text></Text>
              </View>

              <View style={[styles.cell, { width: "10%" }]}>
                <Text></Text>
              </View>

              <View
                style={[
                  styles.cell,
                  {
                    width: "15%",
                    borderRightWidth: 0,
                  },
                ]}
              >
                <Text style={styles.headerText}>
                  ₹{totalBrokerage.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>

          {/* AMOUNT WORDS */}
          <View style={styles.amountWords}>
            <Text>
              <Text style={styles.label}>Amount in Words :</Text>{" "}
              {numberToWords(totalBrokerage)}
            </Text>
          </View>

          {/* BANK + SIGNATURE */}
          <View style={styles.bankSection}>
            <View style={styles.bankLeft}>
              <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
                Bank Details
              </Text>

              <Text>A/c Name : HANSARIA FOOD PRIVATE LIMITED</Text>
              <Text>A/c No. : XXXXXXXXXXXX</Text>
              <Text>Bank : XXXXXXXXXXXX</Text>
              <Text>IFSC : XXXXXXXX</Text>
            </View>

            <View style={styles.bankRight}>
              <Text style={{ fontWeight: "bold" }}>
                for HANSARIA FOOD PRIVATE LIMITED
              </Text>

              <View style={{ marginTop: 45 }}>
                <Text>Authorised Signatory</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>This is a Computer Generated Invoice</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ProformaInvoicePDF;
