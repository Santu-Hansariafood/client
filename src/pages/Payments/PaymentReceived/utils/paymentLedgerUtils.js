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
export const buildTallyVoucherRows = (payments, openingBalance = 0, entries = []) => {
  const allItems = [
    ...payments.map(p => ({ ...p, uiType: 'payment' })),
    ...entries.map(e => ({ ...e, uiType: 'entry' }))
  ];

  const sorted = allItems.sort((a, b) => {
    const da = new Date(a.date || a.loadingDate).getTime();
    const db = new Date(b.date || b.loadingDate).getTime();
    if (da !== db) return da - db;
    
    // Sort payments after entries on the same day if they are related
    if (a.uiType !== b.uiType) {
      return a.uiType === 'entry' ? -1 : 1;
    }
    
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

  sorted.forEach((item) => {
    let debit = 0;
    let credit = 0;
    let particulars = "";
    let vchType = "";
    let buyerCompany = "";
    let supplierCompany = "";
    let date = "";
    let id = "";

    if (item.uiType === 'entry') {
      // It's a bill (Loading Entry) -> Debit for Buyer
      const weight = item.unloadingWeight || item.loadingWeight || 0;
      const rate = item.actualRate || item.rate || 0;
      const netAmount = weight * rate; // Simplified for ledger view, actual math is complex
      
      debit = item.netAmount || netAmount;
      credit = 0;
      particulars = `Bill: ${item.saudaNo} | Lorry: ${item.lorryNumber}${item.billNumber ? ` | Inv: ${item.billNumber}` : ""}`;
      vchType = "Bill";
      buyerCompany = item.buyerCompany || "";
      supplierCompany = item.supplierCompany || "";
      date = item.loadingDate;
      id = `entry-${item._id}`;
    } else {
      // It's a payment
      const payment = item;
      const mappedTotal = (payment.mappings || []).reduce(
        (sum, m) => sum + (Number(m.allocatedAmount) || 0),
        0,
      );
      const amount = Number(payment.amount) || mappedTotal || 0;
      const isBuyer = payment.ledgerType === "Buyer";
      const paymentType = payment.paymentType || "";

      if (isBuyer) {
        if (paymentType === "Advance") {
          credit = amount;
        } else if (paymentType === "Adjustment") {
          debit = amount;
        } else {
          credit = amount;
        }
      } else {
        debit = amount;
      }
      
      particulars = buildPaymentParticulars(payment);
      vchType = payment.paymentType || payment.paymentMode || "—";
      
      const sellerFromMapping =
        payment.mappings?.[0]?.loadingEntryId?.supplierCompany || "";
      const buyerFromMapping =
        payment.mappings?.[0]?.loadingEntryId?.buyerCompany || "";
      
      buyerCompany = payment.buyerCompany || buyerFromMapping || "";
      supplierCompany = payment.supplierCompany || sellerFromMapping || "";
      date = payment.date;
      id = payment._id;
    }

    balance = balance + debit - credit;

    rows.push({
      id,
      date,
      particulars,
      vchType,
      buyerCompany,
      supplierCompany,
      debit,
      credit,
      balance,
      raw: item,
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
  totalDueFromTable = 0,
}) => {
  const pendingDr = Number(creditPendingInForm) || 0;
  const tableDr = Number(creditTableTotal) || 0;
  const postedDr = fullCompanyMapping
    ? Number(ledgerBalance.creditToSeller) || 0
    : Number(ledgerBalance.totalCreditToSeller) || 0;

  const entryCr = Number(formAmount) || 0;

  // Total Credit (Cr.) = All advance balance + today's entry
  const existingAdvance = fullCompanyMapping
    ? Number(ledgerBalance.advanceBalance) || 0
    : Number(ledgerBalance.totalAdvanceBalance) || 0;

  // In Tally style, Total Credit is what we have to spend
  // User request: Credit amount = total credit amount from all credits
  const creditEntryTotal = existingAdvance + postedDr + entryCr;

  // In Tally style, Total Debit is the liability (Lorry Bills)
  // User request: Due Amount (Dr.) total = Lorry Bill (Dr.)
  const debitToSeller = Number(totalDueFromTable) || 0;

  const creditBalanceRemaining = creditEntryTotal - tableDr - postedDr;

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
  const bankCharges = Number(item.bankCharges) || 0;
  const amountAfterCd = gross - cd;
  const amountAfterBankCharges = amountAfterCd - bankCharges;
  const taxable = amountAfterBankCharges;
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
