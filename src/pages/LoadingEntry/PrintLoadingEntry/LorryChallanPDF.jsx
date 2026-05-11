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

  // Modern Bill styles
  billPage: {
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: 35,
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
  },
  billPageBorder: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderWidth: 1.5,
    borderColor: "#1a1a1a",
    borderStyle: "solid",
  },
  billInnerBorder: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    bottom: 14,
    borderWidth: 0.5,
    borderColor: "#1a1a1a",
    borderStyle: "solid",
  },
  billTitleContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
    paddingBottom: 5,
  },
  billTypeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  billHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  companyBrand: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  companyDetails: {
    fontSize: 8,
    color: "#333333",
    lineHeight: 1.3,
  },
  partiesContainer: {
    flexDirection: "row",
    marginBottom: 15,
    gap: 15,
  },
  partyBox: {
    flex: 1,
    padding: 8,
    borderWidth: 0.5,
    borderColor: "#000000",
  },
  partyLabel: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#000000",
    textTransform: "uppercase",
    marginBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#000000",
    paddingBottom: 2,
  },
  partyName: {
    fontSize: 9.5,
    fontWeight: "bold",
    marginBottom: 3,
  },
  metaContainer: {
    flexDirection: "row",
    marginBottom: 15,
    borderWidth: 0.5,
    borderColor: "#000000",
  },
  metaItem: {
    flex: 1,
    padding: 6,
    borderRightWidth: 0.5,
    borderRightColor: "#000000",
    alignItems: "center",
  },
  metaItemLast: {
    flex: 1,
    padding: 6,
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 6.5,
    color: "#333333",
    textTransform: "uppercase",
    marginBottom: 2,
    fontWeight: "bold",
  },
  metaValue: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#000000",
  },
  modernTable: {
    width: "100%",
    marginBottom: 15,
    borderWidth: 0.5,
    borderColor: "#000000",
  },
  modernTableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    color: "#000000",
    borderBottomWidth: 0.5,
    borderBottomColor: "#000000",
    padding: 6,
  },
  modernTableRow: {
    flexDirection: "row",
    padding: 6,
    minHeight: 30,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  col1: { width: "5%", textAlign: "center" },
  col2: { width: "40%", paddingLeft: 5 },
  col3: { width: "10%", textAlign: "center" },
  col4: { width: "15%", textAlign: "center" },
  col5: { width: "15%", textAlign: "center" },
  col6: { width: "15%", textAlign: "right", paddingRight: 5 },
  summarySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
    gap: 15,
  },
  qrSection: {
    width: "80pt",
    padding: 6,
    borderWidth: 0.5,
    borderColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  totalSection: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: "#000000",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#000000",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
  },
  grandTotalLabel: {
    fontSize: 10,
    fontWeight: "bold",
  },
  grandTotalValue: {
    fontSize: 10,
    fontWeight: "bold",
  },
  amountInWordsBox: {
    marginTop: 10,
    padding: 6,
    borderWidth: 0.5,
    borderColor: "#000000",
  },
  bankSection: {
    marginTop: 15,
    padding: 8,
    borderWidth: 0.5,
    borderColor: "#000000",
  },
  bankTitle: {
    fontSize: 8.5,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#000000",
    paddingBottom: 3,
  },
  bankGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  bankItem: {
    width: "33.33%",
    marginBottom: 4,
  },
  bankLabel: {
    fontSize: 6.5,
    color: "#333333",
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  bankValue: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#000000",
  },
  signatorySection: {
    marginTop: 25,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  signatoryBox: {
    width: "160pt",
    textAlign: "center",
  },
  signLine: {
    borderTopWidth: 0.5,
    borderTopColor: "#000000",
    marginTop: 35,
    paddingTop: 4,
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
        a[Math.floor(n / 100)] +
        "Hundred " +
        (n % 100 !== 0 ? makeWords(n % 100) : "")
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

const LorryChallanPDF = ({ data = {}, logoUrl, qrCodeUrl }) => {
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

  const isMaize = String(data.commodity || "")
    .toLowerCase()
    .includes("maize");
  const billTitle = "BILL OF SUPPLY";

  // GST logic based on state
  const supplierState = String(data.supplierDetails?.state || "")
    .toLowerCase()
    .trim();
  const buyerState = String(data.buyerDetails?.state || "")
    .toLowerCase()
    .trim();
  const consigneeState = String(data.consigneeDetails?.state || "")
    .toLowerCase()
    .trim();

  // Usually, GST is based on the place of supply (Consignee state)
  const isInterState =
    supplierState !== consigneeState &&
    consigneeState !== "n/a" &&
    consigneeState !== "";

  // Seller bank details from supplierDetails (SellerCompany)
  const bankDetails = data.supplierDetails?.bankDetails?.[0] || {};

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
        <Page style={styles.billPage} size="A4">
          <View style={styles.billPageBorder} fixed />
          <View style={styles.billInnerBorder} fixed />

          <View style={styles.billTitleContainer}>
            <Text style={styles.billTypeTitle}>{billTitle}</Text>
          </View>

          <View style={styles.billHeader}>
            <View style={styles.companyBrand}>
              <Text style={styles.companyName}>
                {data.supplierCompany || ""}
              </Text>
              <Text style={styles.companyDetails}>
                {data.supplierDetails?.address || ""}
                {data.supplierDetails?.district
                  ? `, ${data.supplierDetails.district}`
                  : ""}
                {data.supplierDetails?.state
                  ? `, ${data.supplierDetails.state}`
                  : ""}
                {data.supplierDetails?.pinNo
                  ? ` - ${data.supplierDetails.pinNo}`
                  : ""}
              </Text>
              <Text style={styles.companyDetails}>
                GSTIN: {data.supplierDetails?.gstNo || ""} | PAN:{" "}
                {data.supplierDetails?.panNo || ""}
              </Text>
            </View>
          </View>

          <View style={styles.partiesContainer}>
            <View style={styles.partyBox}>
              <Text style={styles.partyLabel}>Billed To</Text>
              <Text style={styles.partyName}>{buyerAccountName}</Text>
              {renderAddressDetails(buyerAccountDetails)}
            </View>
            <View style={styles.partyBox}>
              <Text style={styles.partyLabel}>Shipped To</Text>
              <Text style={styles.partyName}>{consigneeNameForShipTo}</Text>
              {renderAddressDetails(consigneeDetailsForShipTo)}
            </View>
          </View>

          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Invoice No</Text>
              <Text style={styles.metaValue}>{data.billNumber || ""}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>
                {formatDate(data.dateOfIssue)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Sauda No</Text>
              <Text style={styles.metaValue}>{data.saudaNo || ""}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Buyer Sauda</Text>
              <Text style={styles.metaValue}>
                {data.buyerSaudaNo || data.poNumber || ""}
              </Text>
            </View>
            <View style={styles.metaItemLast}>
              <Text style={styles.metaLabel}>Lorry No</Text>
              <Text style={styles.metaValue}>{data.lorryNumber || ""}</Text>
            </View>
          </View>

          <View style={styles.modernTable}>
            <View style={styles.modernTableHeader}>
              <Text style={[styles.col1, { fontWeight: "bold" }]}>#</Text>
              <Text style={[styles.col2, { fontWeight: "bold" }]}>
                Description of Goods
              </Text>
              <Text style={[styles.col3, { fontWeight: "bold" }]}>HSN</Text>
              <Text style={[styles.col4, { fontWeight: "bold" }]}>
                Qty (Tons)
              </Text>
              <Text style={[styles.col5, { fontWeight: "bold" }]}>
                Rate (Rs)
              </Text>
              <Text style={[styles.col6, { fontWeight: "bold" }]}>Amount</Text>
            </View>
            <View style={styles.modernTableRow}>
              <Text style={styles.col1}>1</Text>
              <Text style={styles.col2}>{data.commodity || "N/A"}</Text>
              <Text style={styles.col3}>{data.hsnCode || ""}</Text>
              <Text style={styles.col4}>{weight.toFixed(3)}</Text>
              <Text style={styles.col5}>{formatAmount(rate)}</Text>
              <Text style={styles.col6}>{formatAmount(subtotal)}</Text>
            </View>
          </View>

          <View style={styles.summarySection}>
            <View style={styles.qrSection}>
              <Text
                style={{ fontSize: 7, fontWeight: "bold", marginBottom: 5 }}
              >
                SCAN DETAILS
              </Text>
              {qrCodeUrl && (
                <Image src={qrCodeUrl} style={{ width: 60, height: 60 }} />
              )}
            </View>
            <View style={styles.totalSection}>
              <View style={styles.summaryRow}>
                <Text style={styles.label}>Taxable Value:</Text>
                <Text style={styles.value}>{formatAmount(subtotal)}</Text>
              </View>
              {gstPercent > 0 && (
                <>
                  {isInterState ? (
                    <View style={styles.summaryRow}>
                      <Text style={styles.label}>IGST ({gstPercent}%):</Text>
                      <Text style={styles.value}>
                        {formatAmount(gstAmount)}
                      </Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.summaryRow}>
                        <Text style={styles.label}>
                          CGST ({gstPercent / 2}%):
                        </Text>
                        <Text style={styles.value}>
                          {formatAmount(gstAmount / 2)}
                        </Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.label}>
                          SGST ({gstPercent / 2}%):
                        </Text>
                        <Text style={styles.value}>
                          {formatAmount(gstAmount / 2)}
                        </Text>
                      </View>
                    </>
                  )}
                </>
              )}
              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>Grand Total:</Text>
                <Text style={styles.grandTotalValue}>
                  Rs. {formatAmount(totalBillAmount)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.amountInWordsBox}>
            <Text
              style={{
                fontSize: 7,
                fontWeight: "bold",
                color: "#333",
                marginBottom: 4,
                textTransform: "uppercase",
              }}
            >
              Amount in Words
            </Text>
            <Text style={{ fontSize: 9, fontWeight: "bold", color: "#000" }}>
              {numberToWords(totalBillAmount)}
            </Text>
          </View>

          <View style={styles.bankSection}>
            <Text style={styles.bankTitle}>Bank Account Details</Text>
            <View style={styles.bankGrid}>
              <View style={styles.bankItem}>
                <Text style={styles.bankLabel}>Beneficiary Name</Text>
                <Text style={styles.bankValue}>
                  {bankDetails.accountHolderName || data.supplierCompany || ""}
                </Text>
              </View>
              <View style={styles.bankItem}>
                <Text style={styles.bankLabel}>Bank Name</Text>
                <Text style={styles.bankValue}>
                  {bankDetails.bankName || ""}
                </Text>
              </View>
              <View style={styles.bankItem}>
                <Text style={styles.bankLabel}>Account Number</Text>
                <Text style={styles.bankValue}>
                  {bankDetails.accountNumber || ""}
                </Text>
              </View>
              <View style={styles.bankItem}>
                <Text style={styles.bankLabel}>IFSC Code</Text>
                <Text style={styles.bankValue}>
                  {bankDetails.ifscCode || ""}
                </Text>
              </View>
              <View style={styles.bankItem}>
                <Text style={styles.bankLabel}>Branch</Text>
                <Text style={styles.bankValue}>
                  {bankDetails.branchName || ""}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.signatorySection}>
            <View style={styles.signatoryBox}>
              <Text style={{ fontSize: 9, fontWeight: "bold", color: "#000" }}>
                For {data.supplierCompany || ""}
              </Text>
              <View style={styles.signLine}>
                <Text
                  style={{
                    fontSize: 8,
                    fontWeight: "bold",
                    textTransform: "uppercase",
                  }}
                >
                  Authorized Signatory
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.footer} fixed>
            <View style={styles.footerLine} />
            <Text style={styles.footerText}>
              * Certified that the particulars given above are true and correct.
            </Text>
            <Text style={styles.footerText}>
              * This bill is generated for knowledge and reference purposes
              only. Final original invoice will be shared after unloading and
              final quantity verification.
            </Text>
          </View>
        </Page>
      )}
    </Document>
  );
};

export default LorryChallanPDF;
