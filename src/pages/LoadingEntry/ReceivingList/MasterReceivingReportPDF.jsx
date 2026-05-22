import React from "react";
import {
  Page,
  Document,
  StyleSheet,
  View,
  Text,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
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
    paddingVertical: 5,
  },
  billTypeTitle: {
    fontSize: 20,
    fontWeight: "heavy",
    color: "#000000",
    textTransform: "uppercase",
  },
  billHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
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
    marginBottom: 12,
    gap: 12,
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
    marginBottom: 12,
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
    marginBottom: 12,
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
    minHeight: 28,
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
    gap: 12,
  },
  qrSection: {
    width: "90pt",
    padding: 6,
    borderWidth: 0.5,
    borderColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  qrLabel: {
    fontSize: 7,
    fontWeight: "bold",
    marginTop: 4,
    textAlign: "center",
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
    borderBottomWidth: 0.5,
    borderBottomColor: "#000000",
  },
  grandTotalLabel: {
    fontSize: 10,
    fontWeight: "bold",
  },
  grandTotalValue: {
    fontSize: 10,
    fontWeight: "bold",
  },
  amountInWordsRow: {
    padding: 6,
    paddingHorizontal: 8,
    backgroundColor: "#ffffff",
  },
  amountInWordsLabel: {
    fontSize: 6.5,
    fontWeight: "bold",
    color: "#333333",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  amountInWordsValue: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#000000",
  },
  bankSection: {
    marginTop: 12,
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
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingRight: 10,
  },
  signatoryBox: {
    alignItems: "center",
    width: "180pt",
  },
  signatoryCompany: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 30,
    textTransform: "uppercase",
    textAlign: "center",
  },
  signatoryLabel: {
    fontSize: 8,
    fontWeight: "bold",
    borderTopWidth: 0.5,
    borderTopColor: "#000000",
    paddingTop: 4,
    width: "100%",
    textAlign: "center",
  },
  docPage: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
  },
  docImage: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
  },
  docTitle: {
    position: "absolute",
    top: 10,
    left: 20,
    fontSize: 10,
    fontWeight: "bold",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  addressDetails: {
    fontSize: 8,
    color: "#000000",
    lineHeight: 1.4,
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    bottom: 25,
    left: 40,
    right: 40,
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
  disclaimerText: {
    fontSize: 6,
    color: "#6b7280",
    marginBottom: 2,
  },
  officialRecordText: {
    fontSize: 6,
    color: "#374151",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  summaryPage: {
    padding: 40,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  summaryHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 15,
    marginBottom: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000000",
    textTransform: "uppercase",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    borderColor: "#000000",
    marginBottom: 20,
  },
  summaryItem: {
    width: "50%",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    borderRightWidth: 1,
    borderRightColor: "#000000",
  },
  summaryItemFull: {
    width: "100%",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
  },
  summaryLabel: {
    fontSize: 9,
    color: "#4b5563",
    fontWeight: "bold",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 11,
    color: "#000000",
    fontWeight: "bold",
  },
  
  challanPage: {
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingTop: 20,
    paddingBottom: 70,
    paddingHorizontal: 25,
    lineHeight: 1.2,
    color: "#000000",
    backgroundColor: "#ffffff",
  },
  challanTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    width: "100%",
    marginBottom: 10,
  },
  challanSection: {
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: "#000000",
    padding: 8,
    borderRadius: 4,
  },
  challanRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  challanLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#000000",
  },
  challanValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000000",
  },
});

const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "N/A";
  return `${String(d.getDate()).padStart(2, "0")}-${String(
    d.getMonth() + 1,
  ).padStart(2, "0")}-${d.getFullYear()}`;
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
  if (fraction > 0) words += "and " + makeWords(fraction) + "Paise ";
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
      `${address || ""}${address && (district || state || finalPin) ? ", " : ""}${district || ""}${district && (state || finalPin) ? ", " : ""}${state || ""}${state && finalPin ? " - " : ""}${finalPin || ""}`,
    );
  }
  const finalPan = panNo || pan;
  if (finalPan) parts.push(`PAN No: ${finalPan}`);
  const finalGst = gstNo || gst;
  if (finalGst) parts.push(`GST: ${finalGst}`);
  const contactNumber = phone || mobile || phoneNumber;
  if (contactNumber) parts.push(`Phone: ${contactNumber}`);
  if (parts.length === 0) return null;
  return <Text style={styles.addressDetails}>{parts.join("\n")}</Text>;
};

const MasterReceivingReportPDF = ({ entries = [], logoUrl }) => {
  return (
    <Document title="Master Receiving Report">
      {entries.map((data, index) => {
        const rate = Number(data.actualRate || data.rate || 0);
        const weight = Number(data.loadingWeight || 0);
        const baseAmount = weight * rate;

        const cdPercent = Number(data.cd || 0);
        const cdAmount = baseAmount * (cdPercent / 100);
        const subtotal = baseAmount - cdAmount;

        const gstPercent = Number(data.gst || 0);
        const gstAmount = subtotal * (gstPercent / 100);
        const totalBillAmount = subtotal + gstAmount;
        const commodityStr = String(data.commodity || "").toLowerCase();
        const isExempted =
          commodityStr.includes("maize") || commodityStr.includes("rice");
        const billTitle = isExempted ? "BILL OF SUPPLY" : "TAX INVOICE";
        const bankDetails = data.supplierDetails?.bankDetails?.[0] || {};

        const supplierState = String(data.supplierDetails?.state || "")
          .toLowerCase()
          .trim();
        const consigneeState = String(data.consigneeDetails?.state || "")
          .toLowerCase()
          .trim();
        const isInterState =
          supplierState !== consigneeState &&
          consigneeState !== "n/a" &&
          consigneeState !== "";

        const documents = data.documents || {};
        const docUrls = [
          { url: documents.kantaSlip, label: "Kanta Slip" },
          { url: documents.unloadingChallan, label: "Unloading Challan" },
          { url: documents.partyBillCopy, label: "Party Bill Copy" },
          { url: data.documentUrl, label: "Attachment" },
        ].filter(
          (d) =>
            d.url &&
            typeof d.url === "string" &&
            d.url.trim() !== "" &&
            !d.url.endsWith(".pdf"),
        );

        const receivingBaseAmount =
          (data.unloadingWeight || 0) * (data.actualRate || 0);
        const receivingCDAmount = receivingBaseAmount * (cdPercent / 100);
        const totalAmount = receivingBaseAmount - receivingCDAmount;
        const amountInWords = numberToWords(totalAmount);

        const billNo = String(data.billNumber || "").trim();
        const shouldPrintBill = !/^0+$/.test(billNo) && billNo !== "";

        return (
          <React.Fragment key={index}>
            <Page style={styles.summaryPage} size="A4">
              <View style={styles.summaryHeader}>
                <View>
                  <Text style={styles.summaryTitle}>Receiving Entry</Text>
                </View>
                {logoUrl && (
                  <Image src={logoUrl} style={{ width: 60, height: 60 }} />
                )}
              </View>

              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Sauda Number</Text>
                  <Text style={styles.summaryValue}>
                    {data.saudaNo || "N/A"}
                  </Text>
                </View>
                <View style={[styles.summaryItem, { borderRightWidth: 0 }]}>
                  <Text style={styles.summaryLabel}>INVOICE NO.</Text>
                  <Text style={styles.summaryValue}>
                    {data.billNumber || "N/A"}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Lorry Number</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { textTransform: "uppercase" },
                    ]}
                  >
                    {data.lorryNumber || "N/A"}
                  </Text>
                </View>
                <View style={[styles.summaryItem, { borderRightWidth: 0 }]}>
                  <Text style={styles.summaryLabel}>Commodity</Text>
                  <Text style={styles.summaryValue}>
                    {data.commodity || "N/A"}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Loading Weight</Text>
                  <Text style={styles.summaryValue}>
                    {data.loadingWeight || 0} Tons
                  </Text>
                </View>
                <View style={[styles.summaryItem, { borderRightWidth: 0 }]}>
                  <Text style={styles.summaryLabel}>Unloading Weight</Text>
                  <Text style={styles.summaryValue}>
                    {data.unloadingWeight || 0} Tons
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Loading Date</Text>
                  <Text style={styles.summaryValue}>
                    {formatDate(data.loadingDate)}
                  </Text>
                </View>
                <View style={[styles.summaryItem, { borderRightWidth: 0 }]}>
                  <Text style={styles.summaryLabel}>Unloading Date</Text>
                  <Text style={styles.summaryValue}>
                    {formatDate(data.unloadingDate)}
                  </Text>
                </View>
                <View style={[styles.summaryItem, { borderRightWidth: 0 }]}>
                  <Text style={styles.summaryLabel}>Rate</Text>
                  <Text style={styles.summaryValue}>
                    Rs. {formatAmount(rate)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Gross Amount</Text>
                  <Text style={styles.summaryValue}>
                    Rs. {formatAmount(receivingBaseAmount)}
                  </Text>
                </View>
                {cdPercent > 0 && (
                  <View
                    style={[
                      styles.summaryItem,
                      {
                        borderRightWidth: 0,
                        backgroundColor: "#f5f5f5",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.summaryLabel,
                        {
                          color: "#000000",
                        },
                      ]}
                    >
                      Cash Discount ({cdPercent}%)
                    </Text>

                    <Text
                      style={[
                        styles.summaryValue,
                        {
                          color: "#000000",
                        },
                      ]}
                    >
                      - Rs. {formatAmount(receivingCDAmount)}
                    </Text>
                  </View>
                )}
                <View
                  style={[
                    styles.summaryItemFull,
                    { backgroundColor: "#f1f5f9" },
                  ]}
                >
                  <Text style={styles.summaryLabel}>Total Payable Amount</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { fontSize: 14, color: "#1e293b" },
                    ]}
                  >
                    Rs. {formatAmount(totalAmount)}
                  </Text>
                </View>
                <View style={styles.summaryItemFull}>
                  <Text style={styles.summaryLabel}>Seller Company</Text>
                  <Text style={styles.summaryValue}>
                    {data.supplierCompany || "N/A"}
                  </Text>
                </View>
                <View
                  style={[styles.summaryItemFull, { borderBottomWidth: 0 }]}
                >
                  <Text style={styles.summaryLabel}>Buyer Company</Text>
                  <Text style={styles.summaryValue}>
                    {data.buyerCompany || "N/A"}
                  </Text>
                </View>
              </View>

              <View style={styles.footer} fixed>
                <Text style={styles.disclaimerText}>System generated file</Text>
                <Text style={styles.officialRecordText}>
                  Official Receiving Record & Documentation as per information
                  only
                </Text>
              </View>
            </Page>

            {docUrls.map((doc, docIdx) => (
              <Page
                key={`doc-${index}-${docIdx}`}
                style={styles.docPage}
                size="A4"
              >
                <Text style={styles.docTitle}>
                  {doc.label} - {data.lorryNumber}
                </Text>
                <Image src={doc.url} style={styles.docImage} />
                <View style={styles.footer} fixed>
                  <Text style={styles.disclaimerText}>
                    System generated file
                  </Text>
                  <Text style={styles.officialRecordText}>
                    Official Receiving Record & Documentation as per information
                    only
                  </Text>
                </View>
              </Page>
            ))}

            {shouldPrintBill ? (
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
                  {logoUrl && (
                    <Image src={logoUrl} style={{ width: 60, height: 60 }} />
                  )}
                </View>

                <View style={styles.partiesContainer}>
                  <View style={styles.partyBox}>
                    <Text style={styles.partyLabel}>Bill To</Text>
                    <Text style={styles.partyName}>
                      {data.buyerCompany || data.buyer || "N/A"}
                    </Text>
                    {renderAddressDetails(data.buyerDetails)}
                  </View>
                  <View style={styles.partyBox}>
                    <Text style={styles.partyLabel}>Shipped To</Text>
                    <Text style={styles.partyName}>
                      {data.consignee || "N/A"}
                    </Text>
                    {renderAddressDetails(data.consigneeDetails)}
                  </View>
                </View>

                <View style={styles.metaContainer}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Date</Text>
                    <Text style={styles.metaValue}>
                      {formatDate(data.dateOfIssue)}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Invoice No</Text>
                    <Text style={styles.metaValue}>
                      {data.billNumber || ""}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Sauda No</Text>
                    <Text style={styles.metaValue}>{data.saudaNo || ""}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Lorry No</Text>
                    <Text style={styles.metaValue}>
                      {data.lorryNumber || ""}
                    </Text>
                  </View>
                </View>

                <View style={styles.modernTable}>
                  <View style={styles.modernTableHeader}>
                    <Text style={styles.col1}>#</Text>
                    <Text style={styles.col2}>Description of Goods</Text>
                    <Text style={styles.col3}>HSN</Text>
                    <Text style={styles.col4}>Qty (Tons)</Text>
                    <Text style={styles.col5}>Rate (Rs)</Text>
                    <Text style={styles.col6}>Amount</Text>
                  </View>
                  <View style={styles.modernTableRow}>
                    <Text style={styles.col1}>1</Text>
                    <Text style={styles.col2}>{data.commodity || "N/A"}</Text>
                    <Text style={styles.col3}>{data.hsnCode || ""}</Text>
                    <Text style={styles.col4}>
                      {Number(data.loadingWeight || 0).toFixed(3)}
                    </Text>
                    <Text style={styles.col5}>{formatAmount(rate)}</Text>
                    <Text style={styles.col6}>{formatAmount(baseAmount)}</Text>
                  </View>
                </View>

                <View style={styles.summarySection}>
                  <View style={styles.qrSection}>
                    <Text
                      style={{
                        fontSize: 7,
                        fontWeight: "bold",
                        marginBottom: 5,
                      }}
                    >
                      SCAN DETAILS
                    </Text>
                    {data.qrCodeUrl && (
                      <Image
                        src={data.qrCodeUrl}
                        style={{ width: 50, height: 50 }}
                      />
                    )}
                  </View>
                  <View style={styles.totalSection}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.label}>Gross Amount:</Text>
                      <Text style={styles.value}>
                        {formatAmount(baseAmount)}
                      </Text>
                    </View>
                    {cdPercent > 0 && (
                      <View style={[styles.summaryRow]}>
                        <Text style={styles.label}>
                          Less: Cash Discount ({cdPercent}%):
                        </Text>
                        <Text style={styles.value}>
                          - {formatAmount(cdAmount)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.summaryRow}>
                      <Text style={styles.label}>Taxable Value:</Text>
                      <Text style={styles.value}>{formatAmount(subtotal)}</Text>
                    </View>
                    {gstPercent > 0 && (
                      <View style={styles.summaryRow}>
                        <Text style={styles.label}>
                          {isInterState ? "IGST" : "CGST/SGST"} ({gstPercent}%):
                        </Text>
                        <Text style={styles.value}>
                          {formatAmount(gstAmount)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.grandTotalRow}>
                      <Text style={styles.grandTotalLabel}>Grand Total:</Text>
                      <Text style={styles.grandTotalValue}>
                        Rs. {formatAmount(totalBillAmount)}
                      </Text>
                    </View>
                    <View style={styles.amountInWordsRow}>
                      <Text style={styles.amountInWordsLabel}>
                        Amount in Words
                      </Text>
                      <Text style={styles.amountInWordsValue}>
                        {numberToWords(totalBillAmount)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.bankSection}>
                  <Text style={styles.bankTitle}>Bank Account Details</Text>
                  <View style={styles.bankGrid}>
                    <View style={styles.bankItem}>
                      <Text style={styles.bankLabel}>Beneficiary Name</Text>
                      <Text style={styles.bankValue}>
                        {bankDetails.accountHolderName ||
                          data.supplierCompany ||
                          ""}
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
                      <Text style={styles.bankLabel}>Bank Branch</Text>
                      <Text style={styles.bankValue}>
                        {bankDetails.branchName || ""}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.signatorySection}>
                  <View style={styles.signatoryBox}>
                    <Text style={styles.signatoryCompany}>
                      For {data.supplierCompany || ""}
                    </Text>
                    <Text style={styles.signatoryLabel}>
                      Authority Signature
                    </Text>
                  </View>
                </View>

                <View style={styles.footer} fixed>
                  <Text style={styles.disclaimerText}>
                    * Certified that the particulars given above are true and
                    correct.
                  </Text>
                  <Text style={styles.officialRecordText}>
                    * This bill is generated for knowledge and reference
                    purposes only. Final original invoice will be shared after
                    unloading and final quantity verification.
                  </Text>
                </View>
              </Page>
            ) : (
              <Page style={styles.challanPage} size="A4">
                <View style={styles.billPageBorder} fixed />
                <View style={styles.billInnerBorder} fixed />

                <Text style={styles.challanTitle}>LORRY CHALLAN</Text>

                <View style={styles.challanSection}>
                  <View style={styles.challanRow}>
                    <Text style={styles.challanLabel}>Sauda No:</Text>
                    <Text style={styles.challanValue}>{data.saudaNo}</Text>
                  </View>
                  <View style={styles.challanRow}>
                    <Text style={styles.challanLabel}>Lorry No:</Text>
                    <Text style={styles.challanValue}>{data.lorryNumber}</Text>
                  </View>
                  <View style={styles.challanRow}>
                    <Text style={styles.challanLabel}>Commodity:</Text>
                    <Text style={styles.challanValue}>{data.commodity}</Text>
                  </View>
                </View>

                <View style={styles.challanSection}>
                  <View style={styles.challanRow}>
                    <Text style={styles.challanLabel}>Supplier:</Text>
                    <Text style={styles.challanValue}>
                      {data.supplierCompany}
                    </Text>
                  </View>
                  <View style={styles.challanRow}>
                    <Text style={styles.challanLabel}>Buyer:</Text>
                    <Text style={styles.challanValue}>{data.buyerCompany}</Text>
                  </View>
                </View>

                <View style={styles.challanSection}>
                  <View style={styles.challanRow}>
                    <Text style={styles.challanLabel}>Loading Weight:</Text>
                    <Text style={styles.challanValue}>
                      {data.loadingWeight} Tons
                    </Text>
                  </View>
                  <View style={styles.challanRow}>
                    <Text style={styles.challanLabel}>Unloading Weight:</Text>
                    <Text style={styles.challanValue}>
                      {data.unloadingWeight} Tons
                    </Text>
                  </View>
                </View>

                <View style={styles.footer} fixed>
                  <Text style={styles.disclaimerText}>
                    System generated file
                  </Text>
                  <Text style={styles.officialRecordText}>
                    Official Receiving Record & Documentation as per information
                    only
                  </Text>
                </View>
              </Page>
            )}
          </React.Fragment>
        );
      })}
    </Document>
  );
};

export default MasterReceivingReportPDF;
