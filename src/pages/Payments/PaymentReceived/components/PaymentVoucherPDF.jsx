import {
  Page,
  Document,
  StyleSheet,
  View,
  Text,
  Image,
} from "@react-pdf/renderer";
import QRCode from "qrcode";
import logo from "../../../../../src/assets/Hans.png";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingTop: 35,
    paddingBottom: 40,
    paddingLeft: 35,
    paddingRight: 35,
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
  },
  pageBorder: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    bottom: 30,
    borderWidth: 1.5,
    borderColor: "#1a1a1a",
    borderStyle: "solid",
  },
  innerBorder: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    bottom: 34,
    borderWidth: 0.5,
    borderColor: "#1a1a1a",
    borderStyle: "solid",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  companySection: {
    flex: 1,
  },
  logoSection: {
    width: 80,
    alignItems: "flex-end",
  },
  logo: {
    width: 70,
    height: 50,
    objectFit: "contain",
  },
  titleContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 5,
  },
  typeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    textTransform: "uppercase",
  },
  titleDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#000000",
    marginTop: 10,
  },
  introText: {
    fontSize: 10,
    marginBottom: 15,
    textAlign: "left",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  companyBrand: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  companyDetails: {
    fontSize: 8.5,
    color: "#333333",
    lineHeight: 1.4,
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
  addressDetails: {
    fontSize: 7,
    color: "#000000",
    lineHeight: 1.4,
    marginTop: 2,
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
  claimsTable: {
    width: "100%",
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#000000",
  },
  claimsTableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    color: "#000000",
    borderBottomWidth: 0.5,
    borderBottomColor: "#000000",
    padding: 6,
  },
  claimsTableRow: {
    flexDirection: "row",
    padding: 6,
    minHeight: 28,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  col1: { width: "40%", paddingLeft: 5 },
  col2: { width: "15%", textAlign: "center" },
  col3: { width: "15%", textAlign: "center" },
  col4: { width: "30%", textAlign: "right", paddingRight: 5 },
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
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  signatoryBox: {
    width: "150pt",
    textAlign: "center",
  },
  signLine: {
    borderTopWidth: 0.5,
    borderTopColor: "#000000",
    marginTop: 30,
    paddingTop: 4,
  },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 35,
    right: 35,
    textAlign: "center",
  },
  footerLine: {
    height: 0.5,
    backgroundColor: "#000000",
    marginBottom: 2,
  },
  footerText: {
    fontSize: 5,
    color: "#000000",
    lineHeight: 1.5,
  },
});

const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
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
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ",
    "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ",
    "Seventeen ", "Eighteen ", "Nineteen ",
  ];
  const b = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  const makeWords = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + " " + a[n % 10];
    if (n < 1000)
      return a[Math.floor(n / 100)] + "Hundred " + (n % 100 !== 0 ? makeWords(n % 100) : "");
    if (n < 100000)
      return makeWords(Math.floor(n / 1000)) + "Thousand " + (n % 1000 !== 0 ? makeWords(n % 1000) : "");
    if (n < 10000000)
      return makeWords(Math.floor(n / 100000)) + "Lakh " + (n % 100000 !== 0 ? makeWords(n % 100000) : "");
    return makeWords(Math.floor(n / 10000000)) + "Crore " + (n % 10000000 !== 0 ? makeWords(n % 10000000) : "");
  };

  const integer = Math.floor(num);
  const fraction = Math.round((num - integer) * 100);

  let words = makeWords(integer) + "Rupees ";
  if (fraction > 0) {
    words += "and " + makeWords(fraction) + "Paise ";
  }
  return words + "Only";
};

const renderAddressDetails = (details, type = "buyer") => {
  if (!details) return null;

  const {
    address,
    location,
    district,
    city,
    state,
    stateName,
    pinNo,
    pin,
    pinCode,
    pincode,
    postalCode,
    gstNo,
    gst,
    gstin,
    gstNumber,
  } = details;

  const parts = [];

  const finalPin = pinNo || pin || pinCode || pincode || postalCode;
  const finalAddress = address || location;
  const finalDistrict = district || city;
  const finalState = state || stateName;

  if (finalAddress || finalDistrict || finalState || finalPin) {
    parts.push(
      `${finalAddress || ""}${
        finalAddress && (finalDistrict || finalState || finalPin) ? ", " : ""
      }${finalDistrict || ""}${
        finalDistrict && (finalState || finalPin) ? ", " : ""
      }${finalState || ""}${finalState && finalPin ? " - " : ""}${finalPin || ""}`,
    );
  }

  const finalGst = gstNo || gst || gstin || gstNumber;
  if (finalGst) {
    parts.push(`GSTIN: ${finalGst}`);
  }

  if (parts.length === 0) return null;

  return <Text style={styles.addressDetails}>{parts.join("\n")}</Text>;
};

const PaymentVoucherPDF = ({ row, buyerCompany, sellerCompany, qrCodeUrl, voucherNumber }) => {
  const hasClaims =
    row.raw?.qualityClaims &&
    row.raw.qualityClaims.filter(c => Number(c.claimAmount) > 0).length > 0;

  const totalAmount = Math.max(Number(row.debit || 0), Number(row.credit || 0));
  let totalClaims = 0;
  if (hasClaims) {
    totalClaims = row.raw.qualityClaims
      .filter(c => Number(c.claimAmount) > 0)
      .reduce((sum, c) => sum + Number(c.claimAmount), 0);
  }
  const paymentClaim = Number(row.raw?.claim || 0);
  const paymentTDS = Number(row.raw?.tds || 0);
  const finalAmount = totalAmount - (totalClaims + paymentClaim + paymentTDS);

  // Calculate breakdown from either first mapping's loading entry OR if row is an entry itself
  let breakdown = null;
  let loadingEntry = null;
  // Check if row is an entry (uiType === entry)
  if (row.uiType === 'entry' || (row.raw && !row.raw.mappings && row.raw.loadingWeight)) {
    loadingEntry = row.raw;
  } else {
    // Otherwise check mappings
    const firstMapping = row.raw?.mappings?.[0];
    loadingEntry = firstMapping?.loadingEntryId;
  }
  
  if (loadingEntry) {
    const weight = (loadingEntry.unloadingWeight || 0) > 0 ? loadingEntry.unloadingWeight : loadingEntry.loadingWeight || 0;
    const rate = loadingEntry.actualRate || 0;
    const cdPercent = loadingEntry.cd || 0;
    const gstPercent = loadingEntry.gst || 0;
    const bankCharges = Number(loadingEntry.bankCharges) || 0;

    const grossAmount = weight * rate;
    const cdAmount = grossAmount * (cdPercent / 100);
    const amountAfterCd = grossAmount - cdAmount;
    const amountAfterBankCharges = amountAfterCd - bankCharges;
    const taxableAmount = amountAfterBankCharges;
    const gstAmount = taxableAmount * (gstPercent / 100);
    const netAmount = taxableAmount + gstAmount;

    breakdown = {
      grossAmount,
      cdAmount,
      cdPercent,
      bankCharges,
      amountAfterCd,
      amountAfterBankCharges,
      taxableAmount,
      gstAmount,
      gstPercent,
      netAmount
    };
  }
  
  // Get payment mode from raw data
  const paymentMode = row.raw?.paymentMode || "—";

  const bankDetails = sellerCompany?.bankDetails?.[0] || {};

  // Helper to get non-N/A values
  const getValue = (...candidates) => {
    for (const value of candidates) {
      if (value && String(value).trim() !== "" && String(value).trim() !== "N/A") {
        return String(value).trim();
      }
    }
    return "-";
  };

  // Try to extract from mappings first (for Payment Received)
  let firstMapping = null;
  if (!(row.uiType === 'entry' || (row.raw && !row.raw.mappings && row.raw.loadingWeight))) {
    firstMapping = row.raw?.mappings?.[0];
  }
  
  const billNo = getValue(
    loadingEntry?.billNumber,
    row.raw?.billNo,
    row.raw?.billNumber,
    row.billNo
  );
  const saudaNo = getValue(
    firstMapping?.saudaNo,
    loadingEntry?.saudaNo,
    row.raw?.saudaNo,
    row.saudaNo
  );
  const lorryNo = getValue(
    loadingEntry?.lorryNumber,
    row.raw?.lorryNumber,
    row.lorryNo
  );

  // Generate detailed QR code content
  const generateQRContent = () => {
    const details = [];
    details.push("HANSARIA FOOD PRIVATE LIMITED");
    details.push(`Date: ${formatDate(row.date)}`);
    details.push(`Voucher No: ${voucherNumber || "-"}`);
    details.push(`Buyer: ${row.buyerCompany || "-"}`);
    details.push(`Seller: ${row.supplierCompany || "-"}`);
    details.push(`Sauda No: ${saudaNo}`);
    details.push(`Lorry No: ${lorryNo}`);
    details.push(`Bill No: ${billNo}`);
    details.push(`Total Amount: ${totalAmount}`);
    details.push(`Net Payable: ${finalAmount}`);
    return details.join("\n");
  };

  return (
    <Document>
      <Page style={styles.page} size="A4">
        <View style={styles.pageBorder} fixed />
        <View style={styles.innerBorder} fixed />

        {/* Header with company info and logo 
        <View style={styles.headerRow}>
          <View style={styles.companySection}>
            <Text style={styles.companyName}>
              HANSARIA FOOD PRIVATE LIMITED
            </Text>
            <Text style={styles.companyDetails}>
              Primarc Square, Plot No.1, Salt Lake Bypass, LA Block, Sector: 3
            </Text>
            <Text style={styles.companyDetails}>
              Bidhannagar, Kolkata, West Bengal - 700106
            </Text>
          </View>
          <View style={styles.logoSection}>
            <Image src={logo} style={styles.logo} />
          </View>
        </View>
        */}

        <View style={styles.titleContainer}>
          <Text style={styles.typeTitle}>PAYMENT DETAILS</Text>
          <View style={styles.titleDivider} />
        </View>

        <View>
          <Text style={styles.introText}>
            Please find the below payment details
          </Text>
        </View>

        <View style={styles.partiesContainer}>
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>FROM (BUYER)</Text>
            <Text style={styles.partyName}>{row.buyerCompany || "-"}</Text>
            {renderAddressDetails(buyerCompany, "buyer")}
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>TO (SELLER)</Text>
            <Text style={styles.partyName}>{row.supplierCompany || "-"}</Text>
            {renderAddressDetails(sellerCompany, "seller")}
          </View>
        </View>

        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>{formatDate(row.date)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Ref. No</Text>
            <Text style={styles.metaValue}>{voucherNumber || "-"}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Bill No</Text>
            <Text style={styles.metaValue}>{billNo}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Sauda No</Text>
            <Text style={styles.metaValue}>{saudaNo}</Text>
          </View>
          <View style={styles.metaItemLast}>
            <Text style={styles.metaLabel}>Lorry No</Text>
            <Text style={styles.metaValue}>{lorryNo}</Text>
          </View>
        </View>

        {/* Bill Breakdown */}
        {breakdown && (
          <View style={styles.claimsTable}>
            <View style={styles.claimsTableHeader}>
              <Text style={[styles.col1, { fontWeight: "bold" }]}>
                Particulars
              </Text>
              <Text style={[styles.col4, { fontWeight: "bold" }]}>
                Amount (Rs)
              </Text>
            </View>
            <View style={styles.claimsTableRow}>
              <Text style={styles.col1}>Gross Amount</Text>
              <Text style={styles.col4}>{formatAmount(breakdown.grossAmount)}</Text>
            </View>
            <View style={styles.claimsTableRow}>
              <Text style={styles.col1}>Less: CD ({breakdown.cdPercent}%)</Text>
              <Text style={styles.col4}>- {formatAmount(breakdown.cdAmount)}</Text>
            </View>
            <View style={styles.claimsTableRow}>
              <Text style={styles.col1}>Less: Bank Charges</Text>
              <Text style={styles.col4}>- {formatAmount(breakdown.bankCharges)}</Text>
            </View>
            <View style={styles.claimsTableRow}>
              <Text style={styles.col1}>Taxable Amount</Text>
              <Text style={styles.col4}>{formatAmount(breakdown.taxableAmount)}</Text>
            </View>
            <View style={styles.claimsTableRow}>
              <Text style={styles.col1}>Add: GST ({breakdown.gstPercent}%)</Text>
              <Text style={styles.col4}>+ {formatAmount(breakdown.gstAmount)}</Text>
            </View>
            <View style={[styles.claimsTableRow, { backgroundColor: "#f5f5f5" }]}>
              <Text style={[styles.col1, { fontWeight: "bold" }]}>Claim Amount</Text>
              <Text style={[styles.col4, { fontWeight: "bold" }]}>{formatAmount(breakdown.netAmount)}</Text>
            </View>
          </View>
        )}

        {hasClaims && (
          <View style={styles.claimsTable}>
            <View style={styles.claimsTableHeader}>
              <Text style={[styles.col1, { fontWeight: "bold" }]}>
                Parameter
              </Text>
              <Text style={[styles.col2, { fontWeight: "bold" }]}>
                Standard
              </Text>
              <Text style={[styles.col3, { fontWeight: "bold" }]}>
                Actual
              </Text>
              <Text style={[styles.col4, { fontWeight: "bold" }]}>
                Amount (Rs)
              </Text>
            </View>
            {row.raw.qualityClaims
              .filter((c) => Number(c.claimAmount) > 0)
              .map((claim, index) => (
                <View key={index} style={styles.claimsTableRow}>
                  <Text style={styles.col1}>
                    {claim.parameterName || "Unnamed"}
                  </Text>
                  <Text style={styles.col2}>
                    {Number(claim.standardValue || 0).toFixed(2)}%
                  </Text>
                  <Text style={styles.col3}>
                    {Number(claim.actualValue || 0).toFixed(2)}%
                  </Text>
                  <Text style={styles.col4}>
                    {formatAmount(claim.claimAmount)}
                  </Text>
                </View>
              ))}
          </View>
        )}

        <View style={styles.summarySection}>
          <View style={styles.qrSection}>
            <Text
              style={{ fontSize: 7, fontWeight: "bold", marginBottom: 5 }}
            >
              SCAN & VERIFY
            </Text>
            {qrCodeUrl && (
              <Image src={qrCodeUrl} style={{ width: 55, height: 55 }} />
            )}
            <Text style={styles.qrLabel}>
              Voucher: {voucherNumber || "-"}
            </Text>
          </View>
          <View style={styles.totalSection}>
            {/* TDS and Claim from payment */}
            {Number(row.raw?.claim || 0) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.metaLabel}>Claim:</Text>
                <Text style={styles.metaValue}>{formatAmount(row.raw.claim)}</Text>
              </View>
            )}
            {Number(row.raw?.tds || 0) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.metaLabel}>TDS:</Text>
                <Text style={styles.metaValue}>{formatAmount(row.raw.tds)}</Text>
              </View>
            )}
            {/* Quality claims */}
            {hasClaims && (
              <View style={styles.summaryRow}>
                <Text style={styles.metaLabel}>Total Quality Claims:</Text>
                <Text style={styles.metaValue}>
                  {formatAmount(totalClaims)}
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.metaLabel}>Payment Amount:</Text>
              <Text style={styles.metaValue}>{formatAmount(row.raw?.amount || totalAmount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.metaLabel}>Payment Mode:</Text>
              <Text style={styles.metaValue}>{paymentMode}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total:</Text>
              <Text style={styles.grandTotalValue}>
                Rs. {formatAmount(finalAmount)}
              </Text>
            </View>
            <View style={styles.amountInWordsRow}>
              <Text style={styles.amountInWordsLabel}>Amount in Words</Text>
              <Text style={styles.amountInWordsValue}>
                {numberToWords(finalAmount)}
              </Text>
            </View>
          </View>
        </View>

        {sellerCompany?.bankDetails &&
          sellerCompany.bankDetails.length > 0 && (
            <View style={styles.bankSection}>
              <Text style={styles.bankTitle}>Bank Account Details</Text>
              <View style={styles.bankGrid}>
                <View style={styles.bankItem}>
                  <Text style={styles.bankLabel}>Beneficiary Name</Text>
                  <Text style={styles.bankValue}>
                    {bankDetails.accountHolderName ||
                      row.supplierCompany ||
                      "-"}
                  </Text>
                </View>
                <View style={styles.bankItem}>
                  <Text style={styles.bankLabel}>Bank Name</Text>
                  <Text style={styles.bankValue}>
                    {bankDetails.bankName || "-"}
                  </Text>
                </View>
                <View style={styles.bankItem}>
                  <Text style={styles.bankLabel}>Account Number</Text>
                  <Text style={styles.bankValue}>
                    {bankDetails.accountNumber || "-"}
                  </Text>
                </View>
                <View style={styles.bankItem}>
                  <Text style={styles.bankLabel}>IFSC Code</Text>
                  <Text style={styles.bankValue}>
                    {bankDetails.ifscCode || "-"}
                  </Text>
                </View>
                <View style={styles.bankItem}>
                  <Text style={styles.bankLabel}>Branch</Text>
                  <Text style={styles.bankValue}>
                    {bankDetails.branchName || "-"}
                  </Text>
                </View>
              </View>
            </View>
          )}

        <View style={styles.signatorySection}>
          <View style={styles.signatoryBox}>
            <Text style={{ fontSize: 9, fontWeight: "bold", color: "#000" }}>
              For {row.buyerCompany || "HANSARIA FOOD PRIVATE LIMITED"}
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
This document is generated automatically based on information provided by Either Buyer or Seller and is intended solely for informational and record-keeping purposes. {"\n"}
Hansaria Food Private Limited does not verify or guarantee the accuracy, completeness, or authenticity of the information and shall not be liable for any errors, omissions, disputes, claims, losses, or legal consequences arising from the underlying transaction. {"\n"}
This document does not constitute a legal contract, proof of payment, tax invoice, financial instrument, or acknowledgment of liability.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default PaymentVoucherPDF;
