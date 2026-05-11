import {
  Page,
  Document,
  StyleSheet,
  View,
  Text,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingTop: 20,
    paddingBottom: 70,
    paddingHorizontal: 25,
    lineHeight: 1.2,
    color: "#000000",
    backgroundColor: "#ffffff",
  },

  pageBorder: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderWidth: 1,
    borderColor: "#000000",
    borderStyle: "solid",
  },

  innerBorder: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    borderWidth: 0.5,
    borderColor: "#000000",
    borderStyle: "solid",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },

  sellerInfo: {
    flex: 2,
    paddingRight: 10,
  },

  logoContainer: {
    flex: 1,
    alignItems: "flex-end",
  },

  logo: {
    width: 80,
    height: 80,
  },

  sellerName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },

  sellerAddress: {
    fontSize: 8,
    color: "#000000",
    lineHeight: 1.4,
  },

  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    width: "100%",
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 6,
    textDecoration: "underline",
  },

  section: {
    marginBottom: 8,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 0.5,
    borderBottomColor: "#000000",
    paddingBottom: 6,
    marginBottom: 8,
  },

  headerRowNoBorder: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 0,
    marginBottom: 0,
    borderBottomWidth: 0,
  },

  headerRowNoBorderMarginTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 0,
    marginBottom: 0,
    borderBottomWidth: 0,
    marginTop: 8,
  },

  headerItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 5,
  },

  label: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#000000",
    marginRight: 4,
  },

  value: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000000",
    flexWrap: "wrap",
  },

  nameValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#000000",
    lineHeight: 1.3,
    flexWrap: "wrap",
  },

  saudaValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#000000",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "nowrap",
    borderWidth: 0.5,
    borderColor: "#000000",
    borderRadius: 4,
    backgroundColor: "#ffffff",
    alignItems: "stretch",
  },

  gridItem: {
    flex: 1,
    padding: 6,
    borderRightWidth: 0.5,
    borderRightColor: "#000000",
  },

  gridItemNoBorder: {
    flex: 1,
    padding: 6,
    borderRightWidth: 0,
  },

  addressDetails: {
    fontSize: 8,
    color: "#000000",
    lineHeight: 1.4,
    marginTop: 2,
  },

  table: {
    width: "100%",
    marginTop: 10,
    borderWidth: 0.5,
    borderColor: "#000000",
  },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#000000",
  },

  tableHeader: {
    backgroundColor: "#ffffff",
  },

  tableHeaderText: {
    fontWeight: "bold",
    fontSize: 9,
  },

  tableCell: {
    padding: 6,
    borderRightWidth: 0.5,
    borderRightColor: "#000000",
    textAlign: "center",
  },

  tableCellNoBorder: {
    padding: 6,
    borderRightWidth: 0,
    textAlign: "center",
  },

  signatureSection: {
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  signatureBox: {
    width: "30%",
    textAlign: "center",
  },

  watermark: {
    position: "absolute",
    top: "42%",
    left: "18%",
    opacity: 0.08,
  },

  footer: {
    position: "absolute",
    bottom: 15,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 6,
    color: "#000000",
  },

  footerLine: {
    height: 0.5,
    backgroundColor: "#000000",
    marginBottom: 4,
  },

  footerText: {
    fontSize: 6,
    color: "#000000",
    lineHeight: 1.3,
  },

  divider: {
    height: 1,
    backgroundColor: "#000000",
    marginVertical: 6,
  },

  // Bill specific styles
  billHeader: {
    textAlign: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 10,
  },
  billTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  billSubTitle: {
    fontSize: 10,
    marginBottom: 2,
  },
  billingGrid: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#000000",
    marginBottom: 10,
  },
  billingColumn: {
    flex: 1,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#000000",
  },
  billingColumnLast: {
    flex: 1,
    padding: 8,
  },
  billTable: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#000000",
    marginTop: 10,
  },
  billTableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    fontWeight: "bold",
  },
  billTableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    minHeight: 25,
    alignItems: "center",
  },
  billTableCell: {
    padding: 5,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: "#000000",
    textAlign: "center",
  },
  billTableCellLast: {
    padding: 5,
    fontSize: 9,
    textAlign: "right",
    flex: 1,
  },
  billSummary: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  billSummaryLabel: {
    width: "150pt",
    textAlign: "right",
    paddingRight: 10,
    fontWeight: "bold",
  },
  billSummaryValue: {
    width: "80pt",
    textAlign: "right",
    fontWeight: "bold",
  },
  amountInWords: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: "#000000",
    fontSize: 10,
    fontStyle: "italic",
  },
  bankDetails: {
    marginTop: 20,
    fontSize: 8,
  },
  authSignatory: {
    marginTop: 40,
    textAlign: "right",
    paddingRight: 20,
  },
});

const formatDate = (date) => {
  if (!date) return "N/A";

  const d = new Date(date);

  if (isNaN(d.getTime())) return "N/A";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
};

const formatAmount = (value) => {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

  const makeWords = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + " " + a[n % 10];
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] + "Hundred " + (n % 100 !== 0 ? makeWords(n % 100) : "")
      );
    if (n < 100000)
      return (
        makeWords(Math.floor(n / 1000)) +
        "Thousand " +
        (n % 1000 !== 0 ? makeWords(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        makeWords(Math.floor(n / 100000)) +
        "Lakh " +
        (n % 100000 !== 0 ? makeWords(n % 100000) : "")
      );
    return (
      makeWords(Math.floor(n / 10000000)) +
      "Crore " +
      (n % 10000000 !== 0 ? makeWords(n % 10000000) : "")
    );
  };

  const integer = Math.floor(num);
  const fraction = Math.round((num - integer) * 100);

  let words = makeWords(integer) + "Rupees ";
  if (fraction > 0) {
    words += "and " + makeWords(fraction) + "Paise ";
  }
  return words + "Only";
};

const renderAddressDetails = (details) => {
  if (!details) return null;

  const {
    address,
    district,
    state,
    pinNo,
    pin,
    panNo,
    pan,
    gstNo,
    gst,
    phone,
    mobile,
    phoneNumber,
  } = details;

  const parts = [];

  const finalPin = pinNo || pin;

  if (address || district || state || finalPin) {
    parts.push(
      `${address || ""}${
        address && (district || state || finalPin) ? ", " : ""
      }${district || ""}${
        district && (state || finalPin) ? ", " : ""
      }${state || ""}${state && finalPin ? " - " : ""}${finalPin || ""}`,
    );
  }

  const finalPan = panNo || pan;
  if (finalPan) {
    parts.push(`PAN No: ${finalPan}`);
  }

  const finalGst = gstNo || gst;
  if (finalGst) {
    parts.push(`GST: ${finalGst}`);
  }

  const contactNumber = phone || mobile || phoneNumber;

  if (contactNumber) {
    parts.push(`Phone: ${contactNumber}`);
  }

  if (parts.length === 0) return null;

  return <Text style={styles.addressDetails}>{parts.join("\n")}</Text>;
};

const LorryChallanPDF = ({ data = {}, logoUrl }) => {
  const isConsigneeAsBuyer = data.billTo === "consignee";

  const normalizedConsignee = String(data.consignee || "").toLowerCase();

  const isSelfOrder = normalizedConsignee.includes("self order");

  const isPOConsignee =
    normalizedConsignee.includes("purchase order") ||
    normalizedConsignee.includes("send purchase order") ||
    normalizedConsignee.includes("send purchase") ||
    (normalizedConsignee.includes("po") && normalizedConsignee.length <= 10);

  const fromState =
    data.loadingFrom || data.supplierDetails?.state || "West Bengal";

  const buyerAccountName = data.buyerCompany || data.buyer || "N/A";
  const buyerAccountDetails = data.buyerDetails;

  const consigneeNameForShipTo = data.consignee || "N/A";
  const consigneeDetailsForShipTo = data.consigneeDetails;

  const toState = consigneeDetailsForShipTo?.state || "N/A";

  const billNo = String(data.billNumber || "").trim();
  const shouldPrintBill = billNo !== "0" && billNo !== "";

  // Calculations for Bill
  const weight = Number(data.loadingWeight || 0);
  const rate = Number(data.rate || 0);
  const subtotal = weight * rate;
  const gstPercent = Number(data.gst || 0);
  const gstAmount = subtotal * (gstPercent / 100);
  const totalBillAmount = subtotal + gstAmount;

  return (
    <Document>
      <Page style={styles.page} size="A4">
        <View style={styles.pageBorder} fixed />
        <View style={styles.innerBorder} fixed />

        <View style={styles.watermark} fixed>
          <Text
            style={{
              fontSize: 60,
              color: "#000000",
              transform: "rotate(-25deg)",
            }}
          >
            HANSARIA
          </Text>
        </View>

        <View style={styles.header}>
          <View style={styles.sellerInfo}>
            <Text style={styles.sellerName}>
              {data.supplierCompany || "Hansaria Food Private Limited"}
            </Text>

            <Text style={styles.sellerAddress}>
              {data.supplierDetails?.address || "207 MAHARSHI DEBENDRA ROAD"}

              {data.supplierDetails?.address &&
              (data.supplierDetails?.district || data.supplierDetails?.state)
                ? ", "
                : ""}

              {data.supplierDetails?.district || ""}

              {data.supplierDetails?.district && data.supplierDetails?.state
                ? ", "
                : ""}

              {data.supplierDetails?.state || "West Bengal"}

              {data.supplierDetails?.pinNo
                ? ` - ${data.supplierDetails.pinNo}`
                : ""}
            </Text>

            <Text style={styles.sellerAddress}>
              {data.supplierDetails?.gstNo
                ? `GST: ${data.supplierDetails.gstNo}`
                : "GST: 10BOSPK6679G1ZJ"}

              {data.supplierDetails?.panNo
                ? `  |  PAN: ${data.supplierDetails.panNo}`
                : ""}
            </Text>
          </View>

          <View style={styles.logoContainer}>
            {logoUrl && <Image src={logoUrl} style={styles.logo} />}
          </View>
        </View>

        <View
          style={{
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
          }}
        >
          <Text style={styles.title}>LORRY CHALLAN</Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <View style={styles.headerRowNoBorder}>
              <View style={styles.headerItem}>
                <Text style={styles.label}>SAUDA NO</Text>

                <Text style={styles.saudaValue}>{data.saudaNo || "N/A"}</Text>
              </View>

              <View style={styles.headerItem}>
                <Text style={styles.label}>BILL NO :</Text>

                <Text style={styles.value}>{data.billNumber || "N/A"}</Text>
              </View>

              <View style={styles.headerItem}>
                <Text style={styles.label}>DATE :</Text>

                <Text style={styles.value}>{formatDate(data.dateOfIssue)}</Text>
              </View>
            </View>

            <View style={styles.headerRowNoBorderMarginTop}>
              <View style={styles.headerItem}>
                <Text style={styles.label}>LOADING DATE :</Text>

                <Text style={styles.value}>{formatDate(data.loadingDate)}</Text>
              </View>

              <View style={styles.headerItem}>
                <Text style={styles.label}>COMMODITY :</Text>

                <Text style={styles.value}>{data.commodity || "N/A"}</Text>
              </View>

              <View style={styles.headerItem}>
                <Text style={styles.label}>BUYER PO NO :</Text>

                <Text style={styles.value}>{data.poNumber || "N/A"}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.grid}>
          <View style={styles.gridItemNoBorder}>
            <Text style={styles.label}>BUYER ACCOUNT</Text>

            <Text style={styles.nameValue}>{buyerAccountName}</Text>

            {renderAddressDetails(buyerAccountDetails)}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.grid}>
          <View style={styles.gridItemNoBorder}>
            <Text style={styles.label}>SHIP TO (CONSIGNEE)</Text>

            <Text style={styles.nameValue}>{consigneeNameForShipTo}</Text>

            {renderAddressDetails(consigneeDetailsForShipTo)}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>ROUTE & VEHICLE DETAILS</Text>

          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>FROM</Text>

              <Text style={styles.nameValue}>{fromState}</Text>
            </View>

            <View style={styles.gridItemNoBorder}>
              <Text style={styles.label}>TO</Text>

              <Text style={styles.nameValue}>{toState}</Text>
            </View>
          </View>

          <View style={{ marginTop: 8 }}>
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Lorry Number</Text>

                <Text style={styles.value}>{data.lorryNumber || "N/A"}</Text>

                <Text style={styles.addressDetails}>
                  Transporter: {data.addedTransport || "N/A"}
                </Text>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.label}>Driver Name</Text>

                <Text style={styles.value}>{data.driverName || "N/A"}</Text>

                <Text style={styles.addressDetails}>
                  Phone: {data.driverPhoneNumber || "N/A"}
                </Text>
              </View>

              <View style={styles.gridItemNoBorder}>
                <Text style={styles.label}>Vehicle Type</Text>

                <Text style={styles.value}>{data.vehicleType || "N/A"}</Text>

                <Text style={styles.addressDetails}>
                  Capacity: {data.vehicleCapacity || "N/A"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>FREIGHT DETAILS</Text>

          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text
                style={[
                  styles.tableCell,
                  styles.tableHeaderText,
                  { width: "25%" },
                ]}
              >
                Loading Weight
              </Text>

              <Text
                style={[
                  styles.tableCell,
                  styles.tableHeaderText,
                  { width: "25%" },
                ]}
              >
                Unloading Weight
              </Text>

              <Text
                style={[
                  styles.tableCell,
                  styles.tableHeaderText,
                  { width: "25%" },
                ]}
              >
                Freight Rate
              </Text>

              <Text
                style={[
                  styles.tableCellNoBorder,
                  styles.tableHeaderText,
                  { width: "25%" },
                ]}
              >
                Total Freight
              </Text>
            </View>

            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.tableCell, { width: "25%" }]}>
                {data.loadingWeight || "0"} Tons
              </Text>

              <Text style={[styles.tableCell, { width: "25%" }]}>
                {data.unloadingWeight || "0"} Tons
              </Text>

              <Text style={[styles.tableCell, { width: "25%" }]}>
                Rs. {formatAmount(data.freightRate)}
              </Text>

              <Text style={[styles.tableCellNoBorder, { width: "25%" }]}>
                Rs. {formatAmount(data.totalFreight)}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 8 }}>
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Advance</Text>

                <Text style={styles.value}>
                  Rs. {formatAmount(data.advance)}
                </Text>
              </View>

              <View style={styles.gridItemNoBorder}>
                <Text style={styles.label}>Balance</Text>

                <Text style={styles.value}>
                  Rs. {formatAmount(data.balance)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.signatureSection} wrap={false}>
          <View style={styles.signatureBox}>
            <Text>____________________</Text>

            <Text style={styles.label}>Seller&apos;s Signature</Text>
          </View>

          <View style={styles.signatureBox}>
            <Text>____________________</Text>

            <Text style={styles.label}>Driver&apos;s Signature</Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <View style={styles.footerLine} />

          <Text style={styles.footerText}>
            *Any shortage or damage shall be deducted from the freight amount.
          </Text>

          <Text style={styles.footerText}>
            *This is a computer-generated challan issued by Hansaria Food
            Private Limited. It is for informational purposes only and shall not
            be considered as a legal document or proof of delivery.
          </Text>
        </View>
      </Page>

      {shouldPrintBill && (
        <Page style={styles.page} size="A4">
          <View style={styles.pageBorder} fixed />
          <View style={styles.innerBorder} fixed />

          <View style={styles.billHeader}>
            <Text style={styles.billTitle}>TAX INVOICE</Text>
            <Text style={styles.billSubTitle}>
              {data.supplierCompany || "Hansaria Food Private Limited"}
            </Text>
            <Text style={styles.sellerAddress}>
              {data.supplierDetails?.address || "207 MAHARSHI DEBENDRA ROAD"}
              {data.supplierDetails?.district ? `, ${data.supplierDetails.district}` : ""}, 
              {data.supplierDetails?.state || "West Bengal"}
              {data.supplierDetails?.pinNo ? ` - ${data.supplierDetails.pinNo}` : ""}
            </Text>
            <Text style={styles.sellerAddress}>
              GST: {data.supplierDetails?.gstNo || "10BOSPK6679G1ZJ"} | PAN: {data.supplierDetails?.panNo || "N/A"}
            </Text>
          </View>

          <View style={styles.billingGrid}>
            <View style={styles.billingColumn}>
              <Text style={styles.label}>Billed To:</Text>
              <Text style={styles.nameValue}>{buyerAccountName}</Text>
              {renderAddressDetails(buyerAccountDetails)}
            </View>
            <View style={styles.billingColumnLast}>
              <View style={{ marginBottom: 5 }}>
                <Text style={styles.label}>Invoice No:</Text>
                <Text style={styles.value}>{data.billNumber}</Text>
              </View>
              <View style={{ marginBottom: 5 }}>
                <Text style={styles.label}>Invoice Date:</Text>
                <Text style={styles.value}>{formatDate(data.dateOfIssue)}</Text>
              </View>
              <View style={{ marginBottom: 5 }}>
                <Text style={styles.label}>Sauda No:</Text>
                <Text style={styles.value}>{data.saudaNo}</Text>
              </View>
              <View>
                <Text style={styles.label}>Lorry No:</Text>
                <Text style={styles.value}>{data.lorryNumber}</Text>
              </View>
            </View>
          </View>

          <View style={styles.billTable}>
            <View style={styles.billTableHeader}>
              <Text style={[styles.billTableCell, { width: "10%" }]}>S.No</Text>
              <Text style={[styles.billTableCell, { width: "40%" }]}>Description of Goods</Text>
              <Text style={[styles.billTableCell, { width: "15%" }]}>Weight (Tons)</Text>
              <Text style={[styles.billTableCell, { width: "15%" }]}>Rate (Rs)</Text>
              <Text style={[styles.billTableCellLast, { width: "20%" }]}>Amount (Rs)</Text>
            </View>
            <View style={styles.billTableRow}>
              <Text style={[styles.billTableCell, { width: "10%" }]}>1</Text>
              <Text style={[styles.billTableCell, { width: "40%" }]}>{data.commodity || "N/A"}</Text>
              <Text style={[styles.billTableCell, { width: "15%" }]}>{weight.toFixed(3)}</Text>
              <Text style={[styles.billTableCell, { width: "15%" }]}>{formatAmount(rate)}</Text>
              <Text style={[styles.billTableCellLast, { width: "20%" }]}>{formatAmount(subtotal)}</Text>
            </View>
          </View>

          <View style={styles.billSummary}>
            <View>
              <View style={{ flexDirection: "row", marginBottom: 2 }}>
                <Text style={styles.billSummaryLabel}>Sub Total:</Text>
                <Text style={styles.billSummaryValue}>{formatAmount(subtotal)}</Text>
              </View>
              {gstPercent > 0 && (
                <View style={{ flexDirection: "row", marginBottom: 2 }}>
                  <Text style={styles.billSummaryLabel}>GST ({gstPercent}%):</Text>
                  <Text style={styles.billSummaryValue}>{formatAmount(gstAmount)}</Text>
                </View>
              )}
              <View style={{ flexDirection: "row", borderTopWidth: 1, paddingTop: 2 }}>
                <Text style={styles.billSummaryLabel}>Total Amount:</Text>
                <Text style={styles.billSummaryValue}>{formatAmount(totalBillAmount)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.amountInWords}>
            <Text style={{ fontWeight: "bold", marginBottom: 2 }}>Amount in Words:</Text>
            <Text>{numberToWords(totalBillAmount)}</Text>
          </View>

          <View style={styles.bankDetails}>
            <Text style={{ fontWeight: "bold", marginBottom: 2 }}>Bank Details:</Text>
            <Text>A/C Name: Hansaria Food Private Limited</Text>
            <Text>Bank: HDFC Bank Ltd</Text>
            <Text>A/C No: 50200056473829</Text>
            <Text>IFSC: HDFC0000008</Text>
          </View>

          <View style={styles.authSignatory}>
            <Text style={{ fontSize: 10, fontWeight: "bold" }}>For {data.supplierCompany || "Hansaria Food Private Limited"}</Text>
            <View style={{ height: 40 }} />
            <Text style={styles.label}>Authorized Signatory</Text>
          </View>

          <View style={styles.footer} fixed>
            <View style={styles.footerLine} />
            <Text style={styles.footerText}>
              * Goods once sold will not be taken back.
            </Text>
            <Text style={styles.footerText}>
              * Subject to Kolkata Jurisdiction.
            </Text>
          </View>
        </Page>
      )}
    </Document>
  );
};

export default LorryChallanPDF;
