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

  // ================= HEADER =================

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

  // ================= TITLE =================

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

  // ================= INFO SECTION =================

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

  // ================= TABLE =================

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

  // ================= TOTAL =================

  totalRow: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
    minHeight: 28,
    alignItems: "center",
  },

  // ================= AMOUNT WORDS =================

  amountSection: {
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: "#000",
    padding: 8,
    minHeight: 50,
    lineHeight: 1.6,
  },

  // ================= BANK =================

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
    flex: 1,
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

  // ================= FOOTER =================

  footer: {
    position: "absolute",
    bottom: 25,
    left: 25,
    right: 25,
    borderTopWidth: 1.5,
    borderColor: "#000",
    paddingTop: 8,
    textAlign: "center",
    fontSize: 7.5,
    color: "#555",
  },
});

// ================= NUMBER TO WORDS =================

const numberToWords = (amount) => {
  if (amount === 0) return "Zero Rupees Only";

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const convert = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + convert(n % 100000) : "");
    return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + convert(n % 10000000) : "");
  };

  const wholeNumber = Math.floor(amount);
  const decimalPart = Math.round((amount - wholeNumber) * 100);

  let result = convert(wholeNumber) + " Rupees";
  if (decimalPart > 0) {
    result += " and " + convert(decimalPart) + " Paise";
  }
  return result + " Only";
};

// ================= COMPONENT =================

const ProformaInvoicePDF = ({
  entries = [],
  company = {},
  upiQrCodeUrl = "",
  upiId = "",
  upiAmount = 0,
}) => {
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
              <Text style={styles.bold}>
                {company.gstNo ? "GSTIN : " : "PAN : "}
              </Text>
              {company.gstNo || company.panNo || "-"}
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
            const brokerage = entry.sellerBrokerage || 0;
            const weight = entry.unloadingWeight || 0;
            const rate = weight > 0 ? (brokerage / weight).toFixed(2) : "0.00";

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
                    {brokerage > 0
                      ? brokerage.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "0.00"}
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
              <Text style={[styles.headerText, styles.right]}>
                {totalLoading.toFixed(2)}
              </Text>
            </View>

            <View style={[styles.cell, { width: "12%" }]}>
              <Text style={[styles.headerText, styles.right]}>
                {totalUnloading.toFixed(2)}
              </Text>
            </View>

            <View style={[styles.cell, { width: "20%" }]}></View>

            <View style={[styles.cell, { width: "10%" }]}></View>

            <View
              style={[
                styles.cell,
                {
                  width: "15%",
                  borderRightWidth: 0,
                },
              ]}
            >
              <Text style={[styles.headerText, styles.right]}>
                Rs.{" "}
                {totalBrokerage.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
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

            <Text>A/c No. : [PROVIDE ACCOUNT NO]</Text>

            <Text>Bank Name : [PROVIDE BANK NAME]</Text>

            <Text>IFSC Code : [PROVIDE IFSC]</Text>
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
              <Text style={{ fontWeight: "bold" }}>
                for HANSARIA FOOD PRIVATE LIMITED
              </Text>
              <View style={{ marginTop: 18 }}>
                <Text>Authorised Signatory</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default ProformaInvoicePDF;
