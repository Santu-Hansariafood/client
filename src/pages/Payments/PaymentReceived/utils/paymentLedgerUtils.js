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
  const buyer = payment.buyerCompany || "";
  const seller = payment.supplierCompany || "";
  const pairLabel =
    buyer && seller ? `${buyer} → ${seller}` : buyer || seller || "";

  const mappings = payment.mappings || [];
  if (mappings.length === 0) {
    const pairHint =
      buyer && seller ? `${buyer} → ${seller}` : buyer || seller || "";
    const base = (
      payment.paymentType === "Advance"
        ? payment.remarks ||
          (pairHint
            ? `Advance (Cr.) from buyer · ${pairHint} · for seller lorries`
            : "Advance (Cr.) from buyer · for seller lorries")
        : payment.paymentType === "Adjustment"
          ? payment.remarks || "Dr. from Cr. advance · lorry allocation"
          : payment.remarks || "On account"
    ).toUpperCase();
    return pairLabel ? `${pairLabel} | ${base}` : base;
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
      debit: balance > 0 ? balance : 0,
      credit: balance < 0 ? Math.abs(balance) : 0,
      balance,
      isOpening: true,
    });
  }

  sorted.forEach((payment) => {
    const mappedTotal = (payment.mappings || []).reduce(
      (sum, m) => sum + (Number(m.allocatedAmount) || 0),
      0,
    );
    const amount = Number(payment.amount) || mappedTotal || 0;
    const isBuyer = payment.ledgerType === "Buyer";
    const paymentType = payment.paymentType || "";

    let debit = 0;
    let credit = 0;
    if (isBuyer) {
      // Payment Received logic (Buyer Ledger):
      // Payment Entry (Advance/Fresh) = Credit (reduces receivable)
      // Lorry Adjustment/Bill = Debit (increases/records debt)
      if (paymentType === "Advance") {
        credit = amount;
      } else if (paymentType === "Adjustment") {
        debit = amount;
      } else {
        // Default to Credit for standard receipts
        credit = amount;
      }
    } else {
      // Seller logic (Payment Sent):
      // Payment Sent = Debit (reduces payable)
      debit = amount;
    }
    balance = balance + debit - credit;

    const sellerFromMapping =
      payment.mappings?.[0]?.loadingEntryId?.supplierCompany || "";
    const buyerFromMapping =
      payment.mappings?.[0]?.loadingEntryId?.buyerCompany || "";

    rows.push({
      id: payment._id,
      date: payment.date,
      particulars: buildPaymentParticulars(payment),
      vchType: payment.paymentType || payment.paymentMode || "—",
      buyerCompany: payment.buyerCompany || buyerFromMapping || "",
      supplierCompany:
        payment.supplierCompany || sellerFromMapping || "",
      debit,
      credit,
      balance,
      raw: payment,
    });
  });

  return rows;
};

/** Outstanding sauda lines: Dr = due, Cr = paid + allocation (Cr. posting). */
export const buildTallyOutstandingRows = (entries, calculateTallyDetails) =>
  entries.map((entry) => {
    const details = calculateTallyDetails(entry);
    const paid = Number(entry.paidAmount) || 0;
    const alloc = Number(entry.allocatedAmount) || 0;
    const creditPosted = paid + alloc;

    return {
      id: entry.uiKey || entry._id,
      date: entry.loadingDate,
      particulars: `${entry.saudaNo} | ${entry.lorryNumber}${entry.billNumber ? ` | Bill ${entry.billNumber}` : ""} | ${entry.commodity || ""}`,
      vchType: entry.paymentStatus === "done" ? "Settled" : "Pending",
      buyerCompany: entry.buyerCompany || "—",
      supplierCompany: entry.supplierCompany || "—",
      debit: details.dueAmount,
      credit: creditPosted,
      balance: Math.max(0, details.netAmount - creditPosted),
      entry,
      details,
    };
  });

export const formatLedgerAmount = (n) =>
  `₹ ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Top summary by mode:
 * - Payment Received: receipt (Cr.) − adjusted lorry-wise (Dr.) = unallocated (Cr.)
 * - From Advance: Cr. advance − Dr. to seller = Cr. left
 */
export const computeBuyerSellerLedgerSummary = ({
  allocationSource = "fresh",
  formAmount = 0,
  ledgerBalance = {},
  fullCompanyMapping = false,
  creditPendingInForm = 0,
  creditTableTotal = 0,
}) => {
  const pendingDr = Number(creditPendingInForm) || 0;
  const tableDr = Number(creditTableTotal) || 0;
  const postedDr = fullCompanyMapping
    ? Number(ledgerBalance.creditToSeller) || 0
    : Number(ledgerBalance.totalCreditToSeller) || 0;

  const entryCr = Number(formAmount) || 0;

  let creditEntryTotal = 0;
  if (allocationSource === "advance") {
    creditEntryTotal = fullCompanyMapping
      ? Number(ledgerBalance.advanceTotalDr) ||
        Number(ledgerBalance.advanceBalance) + postedDr
      : Number(ledgerBalance.totalAdvanceTotalDr) ||
        Number(ledgerBalance.totalAdvanceBalance) + postedDr;
    // Use entry amount when user typed a new advance in the form
    if (entryCr > 0) {
      creditEntryTotal = entryCr;
    }
  } else {
    // Payment Received: entry = amount received from buyer (Credit)
    creditEntryTotal = entryCr;
  }

  // Payment Received: adjusted = lorry-wise allocations (Debit)
  // Advance: Dr. posted to seller + current table
  const debitToSeller =
    allocationSource === "advance" ? postedDr + tableDr : tableDr;

  const creditBalanceRemaining = Math.max(0, creditEntryTotal - debitToSeller);

  return {
    creditEntryTotal,
    debitPostedToSeller: postedDr,
    debitPendingInForm: pendingDr,
    debitToSeller,
    creditBalanceRemaining,
  };
};

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
  { pendingOnly = false, unadjustedOnly = false, excludeFullyPaid = false } = {},
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
    if (excludeFullyPaid && calculateDue) {
      const due = calculateDue(item);
      if (item.paymentStatus === "done" && due <= 0.01) return false;
    }
    if (unadjustedOnly && calculateDue) {
      const due = calculateDue(item);
      return due > 0.01;
    }
    return true;
  });

/** Due amount from enriched loading row (self-order rate on API). */
export const calculateEntryDueAmount = (item) => {
  const weight =
    (item.unloadingWeight || 0) > 0
      ? item.unloadingWeight
      : item.loadingWeight || 0;
  const rate = item.actualRate || 0;
  const gross = weight * rate;
  const cd = gross * ((item.cd || 0) / 100);
  const taxable = gross - cd;
  const gst = taxable * ((item.gst || 0) / 100);
  const net = taxable + gst;
  return Math.max(0, net - (item.paidAmount || 0));
};

export const hasAllocationTableScope = (ledgerType, companyPair) => {
  if (ledgerType === "Seller") {
    return Boolean(companyPair?.supplierCompany);
  }
  return Boolean(companyPair?.buyerCompany);
};
