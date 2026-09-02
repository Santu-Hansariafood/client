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

export const getPaymentCompositeAmount = (payment = {}) =>
  (Number(payment.amount) || 0) +
  (Number(payment.claim) || 0) +
  (Number(payment.tds) || 0);

export const getLedgerRowClaimAmount = (row = {}) =>
  Number(
    row.totalClaims ??
      (row.raw?.uiType === "payment" ? row.raw?.claim : 0) ??
      0,
  ) || 0;

const calculateOutstandingAmount = (entry) => {
  if (!entry || entry.isRejected) return 0;
  const weight =
    Number(entry.unloadingWeight || 0) > 0
      ? Number(entry.unloadingWeight)
      : Number(entry.loadingWeight) || 0;
  const gross = weight * (Number(entry.actualRate || entry.rate) || 0);
  const cd = gross * ((Number(entry.cd) || 0) / 100);
  const taxable = gross - cd;
  const gst = taxable * ((Number(entry.gst) || 0) / 100);
  const qualityClaims = entry.manualClaim
    ? Number(entry.manualClaimAmount) || 0
    : (entry.qualityClaims || []).reduce(
        (sum, claim) => sum + (Number(claim.claimAmount) || 0),
        0,
      );
  const deductions =
    qualityClaims +
    (Number(entry.secondClaim) || 0) +
    (Number(entry.otherCharges) || 0) +
    (Number(entry.bankCharges) || 0) +
    (Number(entry.tds) || 0);
  return Math.max(
    0,
    taxable + gst - deductions - (Number(entry.paidAmount) || 0),
  );
};

export const buildEntryBreakdown = (entry) => {
  if (!entry || entry.isRejected) return [];
  const breakdown = [];
  const weight =
    entry.unloadingWeight && entry.unloadingWeight > 0
      ? entry.unloadingWeight
      : entry.loadingWeight || 0;
  const rate = entry.actualRate || entry.rate || 0;
  const grossAmount = weight * rate;
  const cdPercent = entry.cd || 0;
  const gstPercent = entry.gst || 0;
  const cdAmount = grossAmount * (cdPercent / 100);
  const amountAfterCd = grossAmount - cdAmount;
  const bankCharges = Number(entry.bankCharges) || 0;
  const taxableAmount = amountAfterCd;
  const gstAmount = taxableAmount * (gstPercent / 100);

  if (grossAmount > 0) {
    breakdown.push({
      type: "add",
      label: `Gross Amount (${weight.toFixed(3)}T × ₹${rate.toFixed(2)})`,
      amount: grossAmount,
      category: "gross",
    });
  }
  if (cdAmount > 0) {
    breakdown.push({
      type: "deduct",
      label: `CD (${cdPercent.toFixed(2)}% on Gross)`,
      amount: cdAmount,
      category: "cd",
    });
  }
  if (gstAmount > 0) {
    breakdown.push({
      type: "add",
      label: `GST (${gstPercent.toFixed(2)}% on Taxable)`,
      amount: gstAmount,
      category: "gst",
    });
  }
  if (entry.qualityClaims && Array.isArray(entry.qualityClaims)) {
    entry.qualityClaims.forEach((claim) => {
      const claimAmt = Number(claim.claimAmount) || 0;
      if (claimAmt > 0) {
        const std =
          claim.standardValue != null
            ? Number(claim.standardValue).toFixed(2)
            : "-";
        const act =
          claim.actualValue != null
            ? Number(claim.actualValue).toFixed(2)
            : "-";
        breakdown.push({
          type: "deduct",
          label: `Quality Claim: ${claim.parameterName || "Unnamed"} (Std:${std}% / Act:${act}%)${claim.notes ? ` · ${claim.notes}` : ""}`,
          amount: claimAmt,
          category: "qualityClaim",
          parameterName: claim.parameterName,
          standardValue: claim.standardValue,
          actualValue: claim.actualValue,
        });
      }
    });
  }
  if (entry.manualClaim && entry.manualClaimAmount) {
    const mca = Number(entry.manualClaimAmount) || 0;
    if (mca > 0) {
      breakdown.push({
        type: "deduct",
        label: `Manual Quality Claim (Report not received)`,
        amount: mca,
        category: "qualityClaim",
        parameterName: "Manual Claim",
      });
    }
  }
  const secondClaim = Number(entry.secondClaim) || 0;
  if (secondClaim > 0) {
    breakdown.push({
      type: "deduct",
      label: `2nd Claim${entry.secondClaimRemarks ? ` · ${entry.secondClaimRemarks}` : ""}`,
      amount: secondClaim,
      category: "secondClaim",
    });
  }
  const otherCharges = Number(entry.otherCharges) || 0;
  if (otherCharges > 0) {
    breakdown.push({
      type: "deduct",
      label: `Other Charges${entry.otherChargesRemarks ? ` · ${entry.otherChargesRemarks}` : ""}`,
      amount: otherCharges,
      category: "otherCharges",
    });
  }
  if (bankCharges > 0) {
    breakdown.push({
      type: "deduct",
      label: `Bank Charges${entry.bankChargesRemarks ? ` · ${entry.bankChargesRemarks}` : ""}`,
      amount: bankCharges,
      category: "bankCharges",
    });
  }
  const tds = Number(entry.tds) || 0;
  if (tds > 0) {
    breakdown.push({
      type: "deduct",
      label: `TDS${entry.tdsRemarks ? ` · ${entry.tdsRemarks}` : ""}`,
      amount: tds,
      category: "tds",
    });
  }
  return breakdown;
};

export const buildPaymentAllocationBreakdown = (payment) => {
  if (
    !payment ||
    !Array.isArray(payment.mappings) ||
    payment.mappings.length === 0
  )
    return [];
  const breakdown = [];
  payment.mappings.forEach((mapping, idx) => {
    const loadingEntry = mapping.loadingEntryId || {};
    const allocatedAmt = Number(mapping.allocatedAmount) || 0;
    if (allocatedAmt <= 0) return;
    const parts = [];
    if (mapping.secondClaim && Number(mapping.secondClaim) > 0) {
      parts.push({
        type: "deduct",
        label: `2nd Claim${mapping.secondClaimRemarks ? ` · ${mapping.secondClaimRemarks}` : ""}`,
        amount: Number(mapping.secondClaim),
      });
    }
    if (mapping.otherCharges && Number(mapping.otherCharges) > 0) {
      parts.push({
        type: "deduct",
        label: `Other Charges${mapping.otherChargesRemarks ? ` · ${mapping.otherChargesRemarks}` : ""}`,
        amount: Number(mapping.otherCharges),
      });
    }
    if (mapping.bankCharges && Number(mapping.bankCharges) > 0) {
      parts.push({
        type: "deduct",
        label: `Bank Charges${mapping.bankChargesRemarks ? ` · ${mapping.bankChargesRemarks}` : ""}`,
        amount: Number(mapping.bankCharges),
      });
    }
    if (mapping.tds && Number(mapping.tds) > 0) {
      parts.push({
        type: "deduct",
        label: `TDS${mapping.tdsRemarks ? ` · ${mapping.tdsRemarks}` : ""}`,
        amount: Number(mapping.tds),
      });
    }
    breakdown.push({
      mappingIndex: idx,
      paymentDate: payment.date,
      voucherNo: payment.voucherNumber,
      paymentMode: payment.paymentMode,
      saudaNo: mapping.saudaNo || loadingEntry.saudaNo || "-",
      lorryNumber: loadingEntry.lorryNumber || "-",
      billNumber: loadingEntry.billNumber || mapping.billNumber || "-",
      allocatedAmount: allocatedAmt,
      debitNote: mapping.debitNote || "",
      creditNote: mapping.creditNote || "",
      remarks: mapping.remarks || mapping.generalRemarks || "",
      parts,
    });
  });
  return breakdown;
};

export const buildTallyVoucherRows = (
  payments,
  openingBalance = 0,
  entries = [],
) => {
  const allItems = [
    ...payments.map((p) => ({ ...p, uiType: "payment" })),
    ...entries.map((e) => ({ ...e, uiType: "entry" })),
  ];

  const sorted = allItems.sort((a, b) => {
    const da = new Date(a.date || a.unloadingDate || a.loadingDate).getTime();
    const db = new Date(b.date || b.unloadingDate || b.loadingDate).getTime();
    if (da !== db) return da - db;

    if (a.uiType !== b.uiType) {
      return a.uiType === "entry" ? -1 : 1;
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
      grossAmount: 0,
      gstAmount: 0,
      totalClaims: 0,
      cdAmount: 0,
      bankCharges: 0,
      breakdown: [],
      paymentAllocations: [],
    });
  }

  sorted.forEach((item) => {
    if (item.uiType === "entry") {
      if (item.isRejected) {
        const particulars = `Rejected: ${item.saudaNo} | Lorry: ${item.lorryNumber}${item.billNumber ? ` | Inv: ${item.billNumber}` : ""}`;
        const vchType = "Rejected";
        const buyerCompany = item.buyerCompany || "";
        const supplierCompany = item.supplierCompany || "";
        const date = item.unloadingDate || item.loadingDate;
        const id = `entry-${item._id}`;

        rows.push({
          id,
          date,
          particulars,
          vchType,
          buyerCompany,
          supplierCompany,
          debit: 0,
          credit: 0,
          balance,
          raw: item,
          grossAmount: 0,
          gstAmount: 0,
          totalClaims: 0,
          cdAmount: 0,
          bankCharges: 0,
          secondClaim: 0,
          otherCharges: 0,
          tds: 0,
          weight: item.unloadingWeight || item.loadingWeight || 0,
          rate: item.actualRate || item.rate || 0,
          breakdown: [],
          paymentAllocations: [],
        });
      } else {
        const weight =
          item.unloadingWeight && item.unloadingWeight > 0
            ? item.unloadingWeight
            : item.loadingWeight || 0;
        const rate = item.actualRate || item.rate || 0;
        const grossAmount = weight * rate;
        const cdPercent = item.cd || 0;
        const gstPercent = item.gst || 0;
        const cdAmount = grossAmount * (cdPercent / 100);
        const amountAfterCd = grossAmount - cdAmount;
        const bankCharges = Number(item.bankCharges) || 0;
        const taxableAmount = amountAfterCd;
        const gstAmount = taxableAmount * (gstPercent / 100);

        let totalClaims = 0;
        if (item.qualityClaims && Array.isArray(item.qualityClaims)) {
          totalClaims = item.qualityClaims.reduce((sum, claim) => {
            return sum + (Number(claim.claimAmount) || 0);
          }, 0);
        }
        if (item.manualClaim && item.manualClaimAmount) {
          totalClaims += Number(item.manualClaimAmount) || 0;
        }
        const secondClaim = Number(item.secondClaim) || 0;
        const otherCharges = Number(item.otherCharges) || 0;
        const tds = Number(item.tds) || 0;
        const dueAmount = calculateOutstandingAmount(item);
        const debit = dueAmount;

        const credit = 0;
        const hasUnloading = item.unloadingWeight && item.unloadingWeight > 0;
        const particulars = [
          `Bill: ${item.saudaNo}`,
          `Lorry: ${item.lorryNumber}`,
          item.billNumber ? `Inv: ${item.billNumber}` : "",
          hasUnloading
            ? `Unld: ${Number(item.unloadingWeight).toFixed(3)}T`
            : `Load: ${Number(weight).toFixed(3)}T`,
          `@ ₹${Number(rate).toFixed(2)}`,
        ]
          .filter(Boolean)
          .join(" | ");
        const vchType = "Bill";
        const buyerCompany = item.buyerCompany || "";
        const supplierCompany = item.supplierCompany || "";
        const date = item.unloadingDate || item.loadingDate;
        const id = `entry-${item._id}`;

        const paymentAllocationsForEntry = [];
        payments.forEach((pay) => {
          if (pay.mappings && Array.isArray(pay.mappings)) {
            pay.mappings.forEach((mapping) => {
              const entryId =
                typeof mapping.loadingEntryId === "object" &&
                mapping.loadingEntryId
                  ? mapping.loadingEntryId._id
                  : mapping.loadingEntryId;
              if (String(entryId) === String(item._id)) {
                paymentAllocationsForEntry.push({
                  paymentId: pay._id,
                  paymentDate: pay.date,
                  voucherNo: pay.voucherNumber,
                  paymentMode: pay.paymentMode,
                  allocatedAmount: Number(mapping.allocatedAmount) || 0,
                  remarks: mapping.remarks || "",
                });
              }
            });
          }
        });

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
          grossAmount: dueAmount,
          gstAmount,
          totalClaims,
          cdAmount,
          bankCharges,
          secondClaim,
          otherCharges,
          tds,
          weight,
          rate,
          isUnloading: hasUnloading,
          unloadingDate: item.unloadingDate || null,
          loadingDate: item.loadingDate || null,
          billNumber: item.billNumber || "",
          breakdown: buildEntryBreakdown(item),
          paymentAllocations: paymentAllocationsForEntry,
        });
      }
    } else {
      const payment = item;
      const mappedTotal = (payment.mappings || []).reduce(
        (sum, m) => sum + (Number(m.allocatedAmount) || 0),
        0,
      );
      const totalPaymentAmount = getPaymentCompositeAmount(payment);
      const isBuyer = payment.ledgerType === "Buyer";
      const paymentType = payment.paymentType || "";
      const calculatedUnadjustedAmount = Math.max(
        0,
        totalPaymentAmount - mappedTotal,
      );
      const unadjustedAmount =
        payment.unadjustedAmount !== undefined &&
        payment.unadjustedAmount !== null
          ? Math.max(
              Number(payment.unadjustedAmount) || 0,
              calculatedUnadjustedAmount,
            )
          : calculatedUnadjustedAmount;

      const sellerFromMapping =
        payment.mappings?.[0]?.loadingEntryId?.supplierCompany || "";
      const buyerFromMapping =
        payment.mappings?.[0]?.loadingEntryId?.buyerCompany || "";
      const buyerCompany = payment.buyerCompany || buyerFromMapping || "";
      const supplierCompany =
        payment.supplierCompany || sellerFromMapping || "";
      const date = payment.date;
      const paymentClaimAmount = Number(payment.claim) || 0;
      const onAccountClaimAmount = mappedTotal > 0 ? 0 : paymentClaimAmount;
      const paymentAllocBreakdown = buildPaymentAllocationBreakdown(payment);

      if (payment.mappings && payment.mappings.length > 0) {
        payment.mappings.forEach((mapping, mIdx) => {
          const allocatedAmt = Number(mapping.allocatedAmount) || 0;
          if (allocatedAmt <= 0) return;
          const loadingEntry = mapping.loadingEntryId || {};
          const lorryNum = loadingEntry.lorryNumber || "—";
          const billNum = loadingEntry.billNumber || "";
          let allocatedCredit = 0;
          let allocatedDebit = 0;
          if (isBuyer) {
            if (paymentType === "Adjustment") {
              allocatedDebit = allocatedAmt;
            } else {
              allocatedCredit = allocatedAmt;
            }
          } else {
            allocatedDebit = allocatedAmt;
          }
          balance = balance + allocatedDebit - allocatedCredit;
          const mapParts = [];
          if (mapping.secondClaim && Number(mapping.secondClaim) > 0) {
            mapParts.push({
              type: "deduct",
              label: `2nd Claim${mapping.secondClaimRemarks ? ` · ${mapping.secondClaimRemarks}` : ""}`,
              amount: Number(mapping.secondClaim),
            });
          }
          if (mapping.otherCharges && Number(mapping.otherCharges) > 0) {
            mapParts.push({
              type: "deduct",
              label: `Other Charges${mapping.otherChargesRemarks ? ` · ${mapping.otherChargesRemarks}` : ""}`,
              amount: Number(mapping.otherCharges),
            });
          }
          if (mapping.bankCharges && Number(mapping.bankCharges) > 0) {
            mapParts.push({
              type: "deduct",
              label: `Bank Charges${mapping.bankChargesRemarks ? ` · ${mapping.bankChargesRemarks}` : ""}`,
              amount: Number(mapping.bankCharges),
            });
          }
          if (mapping.tds && Number(mapping.tds) > 0) {
            mapParts.push({
              type: "deduct",
              label: `TDS${mapping.tdsRemarks ? ` · ${mapping.tdsRemarks}` : ""}`,
              amount: Number(mapping.tds),
            });
          }
          rows.push({
            id: `${payment._id}-map-${mIdx}`,
            date,
            particulars: [
              `PYT: Sauda ${mapping.saudaNo || loadingEntry.saudaNo || "—"}`,
              `Lorry ${lorryNum}`,
              billNum ? `Bill ${billNum}` : "",
              payment.voucherNumber ? `Vch #${payment.voucherNumber}` : "",
            ]
              .filter(Boolean)
              .join(" | "),
            vchType: payment.paymentMode || payment.paymentType || "—",
            buyerCompany,
            supplierCompany,
            debit: allocatedDebit,
            credit: allocatedCredit,
            balance,
            raw: item,
            grossAmount: 0,
            gstAmount: 0,
            totalClaims: 0,
            cdAmount: 0,
            bankCharges: Number(mapping.bankCharges) || 0,
            secondClaim: Number(mapping.secondClaim) || 0,
            otherCharges: Number(mapping.otherCharges) || 0,
            tds: Number(mapping.tds) || Number(payment.tds) || 0,
            weight:
              loadingEntry.unloadingWeight || loadingEntry.loadingWeight || 0,
            rate: loadingEntry.actualRate || loadingEntry.rate || 0,
            isPaymentRow: true,
            mappingIndex: mIdx,
            voucherNo: payment.voucherNumber,
            paymentMode: payment.paymentMode,
            saudaNo: mapping.saudaNo || loadingEntry.saudaNo || "",
            lorryNumber: lorryNum,
            billNumber: billNum,
            allocatedAmount: allocatedAmt,
            debitNote: mapping.debitNote || "",
            creditNote: mapping.creditNote || "",
            generalRemarks: mapping.remarks || mapping.generalRemarks || "",
            breakdown: mapParts,
            paymentAllocations: [],
          });
        });
      }

      if (unadjustedAmount > 0.01) {
        let unadjustedCredit = 0;
        let unadjustedDebit = 0;
        if (isBuyer) {
          if (paymentType === "Adjustment") {
            unadjustedDebit = unadjustedAmount;
          } else {
            unadjustedCredit = unadjustedAmount;
          }
        } else {
          unadjustedDebit = unadjustedAmount;
        }
        balance = balance + unadjustedDebit - unadjustedCredit;
        const entriesPart =
          payment.entries &&
          Array.isArray(payment.entries) &&
          payment.entries.length > 0
            ? payment.entries
            : [];
        rows.push({
          id: `${payment._id}-on-account`,
          date,
          particulars: [
            "On Account",
            payment.voucherNumber ? `Vch #${payment.voucherNumber}` : "",
            payment.remarks ? payment.remarks : "",
          ]
            .filter(Boolean)
            .join(" | "),
          vchType: payment.paymentType || payment.paymentMode || "—",
          buyerCompany,
          supplierCompany,
          debit: unadjustedDebit,
          credit: unadjustedCredit,
          balance,
          raw: item,
          grossAmount: 0,
          gstAmount: 0,
          totalClaims: onAccountClaimAmount,
          cdAmount: 0,
          bankCharges: 0,
          secondClaim: 0,
          otherCharges: 0,
          tds: Number(payment.tds) || 0,
          isPaymentRow: true,
          isOnAccount: true,
          voucherNo: payment.voucherNumber,
          paymentMode: payment.paymentMode,
          claim: Number(payment.claim) || 0,
          breakdown: entriesPart.map((e) => ({
            type: "add",
            label: [
              e.description || "Part Payment",
              e.date
                ? `Dt: ${new Date(e.date).toLocaleDateString("en-GB")}`
                : "",
            ]
              .filter(Boolean)
              .join(" · "),
            amount: Number(e.amount) || 0,
            date: e.date,
            description: e.description,
          })),
          paymentAllocations: [],
          partEntries: entriesPart,
        });
      }
    }
  });

  return rows;
};

export const calculateVoucherTotals = (rows) => {
  return rows.reduce(
    (totals, row) => {
      if (!row.isOpening) {
        totals.totalClaims += getLedgerRowClaimAmount(row);

        if (row.raw?.uiType === "entry") {
          totals.totalBillValue += row.grossAmount || 0;
          totals.totalGst += row.gstAmount || 0;
          totals.totalCd += row.cdAmount || 0;
          totals.totalBankCharges += row.bankCharges || 0;
        }
      }
      return totals;
    },
    {
      totalBillValue: 0,
      totalGst: 0,
      totalClaims: 0,
      totalCd: 0,
      totalBankCharges: 0,
    },
  );
};

export const buildTallyOutstandingRows = (entries, calculateTallyDetails) =>
  entries.map((entry) => {
    if (entry.isRejected) {
      return {
        id: entry.uiKey || entry._id,
        date: entry.loadingDate,
        particulars: `Rejected: ${entry.saudaNo} | ${entry.lorryNumber}${entry.billNumber ? ` | Bill ${entry.billNumber}` : ""} | ${entry.commodity || ""}`,
        vchType: "Rejected",
        buyerCompany: entry.buyerCompany || "—",
        supplierCompany: entry.supplierCompany || "—",
        debit: 0,
        credit: 0,
        balance: 0,
        entry,
        details: { dueAmount: 0, netAmount: 0, grossAmount: 0, gstAmount: 0 },
      };
    }
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

export const formatBreakdownText = (breakdown = []) => {
  if (!Array.isArray(breakdown) || breakdown.length === 0) return "";

  const parts = breakdown
    .filter((item) => Number(item.amount || 0) > 0)
    .map((item) => {
      const prefix = item.paymentDate ? `${item.paymentDate} | ` : "";
      const label = item.label || item.description || "Adjustment";
      const amount = Number(item.amount || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      const typeTag = item.type === "add" ? "ADD" : "DEDUCT";
      return `${prefix}${typeTag}: ${label} ${amount}`;
    });

  return parts.join(" | ");
};

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

  const existingAdvance = fullCompanyMapping
    ? Number(ledgerBalance.advanceBalance) || 0
    : Number(ledgerBalance.totalAdvanceBalance) || 0;

  const creditEntryTotal = existingAdvance + postedDr + entryCr;

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

export const filterEntriesForCompanyScope = (
  items,
  companyPair,
  {
    pendingOnly = false,
    unadjustedOnly = false,
    excludeFullyPaid = false,
  } = {},
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

export const calculateEntryDueAmount = (item) => {
  if (item.isRejected) return 0;
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
