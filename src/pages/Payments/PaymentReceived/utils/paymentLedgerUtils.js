/** Company pair + Tally-style ledger row builders for Payment Received. */

export const getCompanyPairFromForm = (
  formData,
  selectedCompanyOption,
  selectedOpposingCompanyOption,
) => {
  if (formData.ledgerType === "Buyer") {
    return {
      buyerCompany: selectedCompanyOption?.label || "",
      supplierCompany: selectedOpposingCompanyOption?.label || "",
    };
  }
  if (formData.ledgerType === "Seller") {
    return {
      buyerCompany: selectedOpposingCompanyOption?.label || "",
      supplierCompany: selectedCompanyOption?.label || "",
    };
  }
  return {
    buyerCompany: selectedCompanyOption?.label || "",
    supplierCompany: selectedOpposingCompanyOption?.label || "",
  };
};

/** Resolve buyer/seller names from primary + opposing dropdowns (company _id or seller name). */
export const resolveCompanyPair = (
  formData,
  selectedCompanyOption,
  selectedOpposingCompanyOption,
  allCompanies = [],
) => {
  if (formData.ledgerType) {
    return getCompanyPairFromForm(
      formData,
      selectedCompanyOption,
      selectedOpposingCompanyOption,
    );
  }

  const primary = selectedCompanyOption?.label || "";
  const opposing = selectedOpposingCompanyOption?.label || "";
  const primaryId = formData.companyId || "";
  const opposingId = formData.opposingCompanyId || "";

  const idIsBuyerCompany = (id) =>
    id && allCompanies.some((c) => String(c._id) === String(id));

  if (idIsBuyerCompany(primaryId)) {
    return { buyerCompany: primary, supplierCompany: opposing };
  }
  if (idIsBuyerCompany(opposingId)) {
    return { buyerCompany: opposing, supplierCompany: primary };
  }
  if (primary && !opposing) {
    return { buyerCompany: primary, supplierCompany: "" };
  }
  return { buyerCompany: opposing, supplierCompany: primary };
};

export const buildPaymentParticulars = (payment) => {
  const mappings = payment.mappings || [];
  if (mappings.length === 0) {
    return (payment.remarks || "Advance / On Account").toUpperCase();
  }

  return mappings
    .map((m) => {
      const lorry = m.loadingEntryId?.lorryNumber || "—";
      const bill = m.loadingEntryId?.billNumber
        ? ` Bill ${m.loadingEntryId.billNumber}`
        : "";
      const seller = m.loadingEntryId?.supplierCompany || "";
      const buyer = m.loadingEntryId?.buyerCompany || "";
      return `Sauda ${m.saudaNo} | Lorry ${lorry}${bill} | ${buyer} → ${seller} | Rs. ${Number(m.allocatedAmount || 0).toLocaleString("en-IN")}`;
    })
    .join(" · ");
};

/** Tally voucher rows: Date | Particulars | Vch Type | Debit | Credit | Balance */
export const buildTallyVoucherRows = (payments, openingBalance = 0) => {
  const sorted = [...payments].sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    if (da !== db) return da - db;
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  });

  let balance = Number(openingBalance) || 0;
  const rows = [];

  if (balance !== 0) {
    rows.push({
      id: "opening",
      date: null,
      particulars: "Opening Balance b/f",
      vchType: "—",
      debit: balance < 0 ? Math.abs(balance) : 0,
      credit: balance > 0 ? balance : 0,
      balance,
      isOpening: true,
    });
  }

  sorted.forEach((payment) => {
    const amount = Number(payment.amount) || 0;
    const isReceipt = payment.ledgerType === "Buyer";
    const credit = isReceipt ? amount : 0;
    const debit = !isReceipt ? amount : 0;
    balance = balance + credit - debit;

    rows.push({
      id: payment._id,
      date: payment.date,
      particulars: buildPaymentParticulars(payment),
      vchType: payment.paymentType || payment.paymentMode || "—",
      buyerCompany: payment.buyerCompany || "",
      supplierCompany: payment.supplierCompany || "",
      debit,
      credit,
      balance,
      raw: payment,
    });
  });

  return rows;
};

/** Outstanding sauda lines for allocation (Dr = due, Cr = paid on row). */
export const buildTallyOutstandingRows = (entries, calculateTallyDetails) =>
  entries.map((entry) => {
    const details = calculateTallyDetails(entry);
    const paid = Number(entry.paidAmount) || 0;
    const alloc = Number(entry.allocatedAmount) || 0;

    return {
      id: entry.uiKey || entry._id,
      date: entry.loadingDate,
      particulars: `${entry.saudaNo} | ${entry.lorryNumber}${entry.billNumber ? ` | Bill ${entry.billNumber}` : ""} | ${entry.commodity || ""}`,
      vchType: entry.paymentStatus === "done" ? "Settled" : "Pending",
      buyerCompany: entry.buyerCompany || "—",
      supplierCompany: entry.supplierCompany || "—",
      debit: details.dueAmount,
      credit: paid,
      balance: details.netAmount,
      entry,
      details,
    };
  });

export const formatLedgerAmount = (n) =>
  `₹ ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const hasFullCompanyMapping = (companyPair) =>
  Boolean(companyPair?.buyerCompany && companyPair?.supplierCompany);

export const matchCompanyName = (value, filterName) => {
  if (!filterName) return true;
  return (
    String(value || "")
      .trim()
      .toLowerCase() === String(filterName).trim().toLowerCase()
  );
};

/** Keep loading rows that match selected buyer / seller filters. */
export const filterEntriesForCompanyScope = (
  items,
  companyPair,
  { pendingOnly = false, unadjustedOnly = false } = {},
  calculateDue,
) =>
  items.filter((item) => {
    if (companyPair?.buyerCompany) {
      const matchesBuyer =
        matchCompanyName(item.buyerCompany, companyPair.buyerCompany) ||
        matchCompanyName(item.consignee, companyPair.buyerCompany);
      if (!matchesBuyer) return false;
    }
    if (
      companyPair?.supplierCompany &&
      !matchCompanyName(item.supplierCompany, companyPair.supplierCompany)
    ) {
      return false;
    }
    if (pendingOnly && item.paymentStatus === "done") {
      return false;
    }
    if (unadjustedOnly && calculateDue) {
      const due = calculateDue(item);
      return due > 0.01;
    }
    return true;
  });

export const hasAllocationTableScope = (ledgerType, companyPair) => {
  if (ledgerType === "Seller") {
    return Boolean(companyPair?.supplierCompany);
  }
  return Boolean(companyPair?.buyerCompany);
};
