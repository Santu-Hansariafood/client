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
    paddingTop: 120,
    paddingBottom: 70,
    paddingHorizontal: 18,
    fontSize: 8,
    fontFamily: "Courier",
    color: "#000",
    backgroundColor: "#fff",
  },

  // ================= HEADER =================

  header: {
    position: "absolute",
    top: 18,
    left: 18,
    right: 18,
    borderWidth: 1,
    borderColor: "#000",
    flexDirection: "row",
    padding: 8,
    alignItems: "center",
  },

  logo: {
    width: 55,
    height: 55,
    objectFit: "contain",
  },

  companySection: {
    flex: 1,
    textAlign: "center",
  },

  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 3,
  },

  companyAddress: {
    fontSize: 7.5,
    lineHeight: 1.3,
  },

  // ================= TITLE =================

  titleSection: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#000",
    paddingVertical: 5,
    alignItems: "center",
    marginBottom: 0,
  },

  title: {
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
  },

  // ================= INFO SECTION =================

  infoWrapper: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#000",
    flexDirection: "row",
  },

  infoLeft: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: "#000",
    padding: 6,
    minHeight: 75,
  },

  infoRight: {
    width: "35%",
    padding: 6,
  },

  line: {
    marginBottom: 4,
    lineHeight: 1.4,
  },

  bold: {
    fontWeight: "bold",
  },

  // ================= TABLE =================

  tableWrapper: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
  },

  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
    backgroundColor: "#f2f2f2",
    minHeight: 24,
    alignItems: "center",
  },

  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
    minHeight: 22,
    alignItems: "center",
  },

  cell: {
    borderRightWidth: 1,
    borderColor: "#000",
    paddingHorizontal: 3,
    justifyContent: "center",
    height: "100%",
    paddingVertical: 4,
  },

  headerText: {
    fontSize: 7.5,
    fontWeight: "bold",
    textAlign: "center",
  },

  cellText: {
    fontSize: 7.5,
  },

  right: {
    textAlign: "right",
  },

  center: {
    textAlign: "center",
  },

  // ================= TOTAL =================

  totalRow: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    minHeight: 24,
    alignItems: "center",
  },

  // ================= AMOUNT WORDS =================

  amountSection: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#000",
    padding: 6,
    minHeight: 45,
    lineHeight: 1.5,
  },

  // ================= BANK =================

  bankWrapper: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#000",
    flexDirection: "row",
    minHeight: 100,
  },

  bankLeft: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: "#000",
    padding: 6,
  },

  bankRight: {
    flex: 1,
    padding: 6,
    textAlign: "right",
    justifyContent: "space-between",
  },

  // ================= FOOTER =================

  footer: {
    position: "absolute",
    bottom: 18,
    left: 18,
    right: 18,
    borderTopWidth: 1,
    borderColor: "#000",
    paddingTop: 5,
    textAlign: "center",
    fontSize: 7,
  },
});

// ================= NUMBER TO WORDS =================

const numberToWords = (amount) => {
  return `${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  })} Rupees Only`;
};

// ================= COMPONENT =================

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
      <Page size="A4" style={styles.page} wrap>
        {/* ================= HEADER ================= */}

        <View fixed style={styles.header}>
          <Image src={logo} style={styles.logo} />

          <View style={styles.companySection}>
            <Text style={styles.companyName}>
              HANSARIA FOOD PRIVATE LIMITED
            </Text>

            <Text style={styles.companyAddress}>
              207, Maharshi Debendra Road, Kolkata - 700007
            </Text>

            <Text style={styles.companyAddress}>Phone: +91 33 2268 4567</Text>

            <Text style={styles.companyAddress}>
              Email: info@hansariafood.com
            </Text>
          </View>
        </View>

        {/* ================= FOOTER ================= */}

        <View fixed style={styles.footer}>
          <Text>This is a Computer Generated Invoice</Text>

          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>

        {/* ================= TITLE ================= */}

        <View style={styles.titleSection}>
          <Text style={styles.title}>PROFORMA INVOICE</Text>
        </View>

        {/* ================= INFO ================= */}

        <View style={styles.infoWrapper}>
          <View style={styles.infoLeft}>
            <Text style={styles.line}>
              <Text style={styles.bold}>Seller Name : </Text>
              {company.companyName || "-"}
            </Text>

            <Text style={styles.line}>
              <Text style={styles.bold}>Address : </Text>
              {company.address || "-"}
            </Text>

            <Text style={styles.line}>
              <Text style={styles.bold}>District : </Text>
              {company.district || "-"}
            </Text>

            <Text style={styles.line}>
              <Text style={styles.bold}>State : </Text>
              {company.state || "-"}
            </Text>

            <Text style={styles.line}>
              <Text style={styles.bold}>GSTIN : </Text>
              {company.gstNo || "-"}
            </Text>
          </View>

          <View style={styles.infoRight}>
            <Text style={styles.line}>
              <Text style={styles.bold}>Invoice No : </Text>
              HF/{new Date().getFullYear()}/{Math.floor(Math.random() * 1000)}
            </Text>

            <Text style={styles.line}>
              <Text style={styles.bold}>Date : </Text>
              {new Date().toLocaleDateString("en-IN")}
            </Text>

            <Text style={styles.line}>
              <Text style={styles.bold}>Total Entries : </Text>
              {entries.length}
            </Text>
          </View>
        </View>

        {/* ================= TABLE ================= */}

        <View style={styles.tableWrapper}>
          {/* TABLE HEADER */}

          <View fixed style={styles.tableHeader}>
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
              style={[
                styles.cell,
                {
                  width: "15%",
                  borderRightWidth: 0,
                },
              ]}
            >
              <Text style={styles.headerText}>Brokerage</Text>
            </View>
          </View>

          {/* TABLE ROWS */}

          {entries.map((entry, index) => {
            const rate =
              entry.unloadingWeight > 0
                ? (entry.sellerBrokerage / entry.unloadingWeight).toFixed(2)
                : "0.00";

            return (
              <View style={styles.row} key={index} wrap={false}>
                <View style={[styles.cell, { width: "5%" }]}>
                  <Text style={[styles.cellText, styles.center]}>
                    {index + 1}
                  </Text>
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
                  <Text style={[styles.cellText, styles.right]}>
                    {entry.loadingWeight?.toFixed(2) || "0.00"}
                  </Text>
                </View>

                <View style={[styles.cell, { width: "12%" }]}>
                  <Text style={[styles.cellText, styles.right]}>
                    {entry.unloadingWeight?.toFixed(2) || "0.00"}
                  </Text>
                </View>

                <View style={[styles.cell, { width: "20%" }]}>
                  <Text style={styles.cellText}>{entry.commodity || "-"}</Text>
                </View>

                <View style={[styles.cell, { width: "10%" }]}>
                  <Text style={[styles.cellText, styles.right]}>{rate}</Text>
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
                  <Text style={[styles.cellText, styles.right]}>
                    {entry.sellerBrokerage?.toFixed(2) || "0.00"}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* ================= TOTAL ================= */}

          <View style={styles.totalRow}>
            <View style={[styles.cell, { width: "31%" }]}>
              <Text style={styles.headerText}>GRAND TOTAL</Text>
            </View>

            <View style={[styles.cell, { width: "12%" }]}>
              <Text style={styles.headerText}>{totalLoading.toFixed(2)}</Text>
            </View>

            <View style={[styles.cell, { width: "12%" }]}>
              <Text style={styles.headerText}>{totalUnloading.toFixed(2)}</Text>
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

        {/* ================= AMOUNT ================= */}

        <View style={styles.amountSection}>
          <Text>
            <Text style={styles.bold}>Amount in Words :</Text>{" "}
            {numberToWords(totalBrokerage)}
          </Text>
        </View>

        {/* ================= BANK ================= */}

        <View style={styles.bankWrapper}>
          <View style={styles.bankLeft}>
            <Text
              style={{
                fontWeight: "bold",
                marginBottom: 5,
              }}
            >
              Bank Details
            </Text>

            <Text>A/c Name : HANSARIA FOOD PRIVATE LIMITED</Text>

            <Text>A/c No. : XXXXXXXXXXXX</Text>

            <Text>Bank Name : XXXXXXXXXXXX</Text>

            <Text>IFSC Code : XXXXXXXX</Text>
          </View>

          <View style={styles.bankRight}>
            <Text style={{ fontWeight: "bold" }}>
              for HANSARIA FOOD PRIVATE LIMITED
            </Text>

            <View style={{ marginTop: 50 }}>
              <Text>Authorised Signatory</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default ProformaInvoicePDF;
