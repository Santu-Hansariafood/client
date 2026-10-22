import { lazy } from "react";
import { FaMoneyBillWave } from "react-icons/fa";
import QualityClaimsTable, { calculateClaimAmount } from "./QualityClaimsTable";

const DataDropdown = lazy(
  () => import("../../../../common/DataDropdown/DataDropdown"),
);
const FileUpload = lazy(
  () => import("../../../../common/FileUpload/FileUpload"),
);
const DateSelector = lazy(
  () => import("../../../../common/DateSelector/DateSelector"),
);

const EditLoadingEntryPopup = ({
  editEntry,
  setEditEntry,
  currentSelfOrder,
  currentCompany,
  handleEditFieldChange,
  handleQualityChange,
  handleUpdateEntry,
  transporters,
  stateOptions,
  paymentTermsMap,
  onClose,
  isSaving,
  onNavigateToPaymentReceived,
}) => {
  const qualityClaims = Array.isArray(editEntry?.qualityClaims)
    ? editEntry.qualityClaims
    : [];

  const totalClaimAmount = editEntry.manualClaim
    ? Number(editEntry.manualClaimAmount || 0).toFixed(2)
    : qualityClaims
        .reduce((total, claim) => total + (Number(claim.claimAmount) || 0), 0)
        .toFixed(2);

  const updateDocumentsState = (updates = {}) => {
    setEditEntry((prev) => ({
      ...prev,
      documents: {
        kantaSlip: "",
        unloadingChallan: "",
        partyBillCopy: "",
        qualityReport: "",
        ...(prev?.documents || {}),
        ...updates,
      },
    }));
  };

  const calculatePayableAmount = () => {
    if (editEntry.isRejected) {
      return "0.00";
    }

    const rate = Number(currentSelfOrder?.rate || 0);
    const weight = Number(editEntry.unloadingWeight || 0);
    const totalBill = rate * weight;
    const cdPercent = Number(currentSelfOrder?.cd || 0);
    const cdAmount = totalBill * (cdPercent / 100);
    const gstPercent = Number(currentSelfOrder?.gst || 0);
    const gstAmount = (totalBill - cdAmount) * (gstPercent / 100);
    const netAmount = totalBill - cdAmount + gstAmount;

    const totalClaim = editEntry.manualClaim
      ? Number(editEntry.manualClaimAmount || 0)
      : qualityClaims.reduce(
          (total, claim) => total + (Number(claim.claimAmount) || 0),
          0,
        );
    const secondClaim = Number(editEntry.secondClaim || 0);
    const otherCharges = Number(editEntry.otherCharges || 0);
    const bankCharges = Number(editEntry.bankCharges || 0);
    const tds = Number(editEntry.tds || 0);

    return (
      netAmount -
      totalClaim -
      secondClaim -
      otherCharges -
      bankCharges -
      tds
    ).toFixed(2);
  };

  const handleRejectLorry = () => {
    if (
      window.confirm(
        "Are you sure you want to reject this lorry? This will set all brokerage and payable amounts to 0.",
      )
    ) {
      setEditEntry((prev) => ({
        ...prev,
        isRejected: true,
        buyerBrokerage: 0,
        sellerBrokerage: 0,
        totalFreight: 0,
        balance: 0,
        manualClaimAmount: 0,
        secondClaim: 0,
        otherCharges: 0,
        bankCharges: 0,
        tds: 0,
        qualityClaims: (prev.qualityClaims || []).map((claim) => ({
          ...claim,
          claimAmount: 0,
        })),
      }));
    }
  };

  const handleManualRateChange = (e) => {
    const newRate = e.target.value;
    if (editEntry?.qualityClaims?.length > 0) {
      setEditEntry((prev) => {
        const newClaims = prev.qualityClaims.map((claim) => {
          const actual = claim.actualValue;
          const standard = claim.standardValue;
          const saudaRate = parseFloat(currentSelfOrder?.rate || 0);
          const manualRate = parseFloat(newRate || 0);
          const weight = parseFloat(prev.unloadingWeight || 0);
          let claimAmount = 0;
          if (weight > 0 && (saudaRate > 0 || manualRate > 0)) {
            claimAmount = calculateClaimAmount(
              claim.paramValues,
              actual,
              standard,
              saudaRate,
              manualRate,
              weight,
            );
          }
          return { ...claim, claimAmount: Math.abs(claimAmount).toFixed(2) };
        });
        return {
          ...prev,
          manualCalculationRate: newRate,
          qualityClaims: newClaims,
        };
      });
    } else {
      setEditEntry((prev) => ({ ...prev, manualCalculationRate: newRate }));
    }
  };

  const buildBreakdownItems = () => {
    const rate = Number(currentSelfOrder?.rate || 0);
    const weight = Number(editEntry.unloadingWeight || 0);
    const cdPercent = Number(currentSelfOrder?.cd || 0);
    const gstPercent = Number(currentSelfOrder?.gst || 0);
    const grossAmount = weight * rate;
    const cdAmount = grossAmount * (cdPercent / 100);
    const gstAmount = (grossAmount - cdAmount) * (gstPercent / 100);

    const items = [];
    items.push({
      type: "add",
      label: "Gross Amount",
      detail: `${weight.toFixed(3)} T x Rs${rate.toFixed(2)}/Ton`,
      amount: grossAmount,
      color: "text-lux-ink",
      bg: "bg-lux-ivory",
      border: "border-[#ece4d2]",
      sign: "+",
      signColor: "text-emerald-600",
    });
    if (cdAmount > 0) {
      items.push({
        type: "deduct",
        label: `CD (${cdPercent.toFixed(2)}%)`,
        detail: "Cash Discount on Gross",
        amount: cdAmount,
        color: "text-yellow-700",
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        sign: "-",
        signColor: "text-red-500",
      });
    }
    if (gstAmount > 0) {
      items.push({
        type: "add",
        label: `GST (${gstPercent.toFixed(2)}%)`,
        detail: `On (Gross - CD) = Rs${(grossAmount - cdAmount).toFixed(2)}`,
        amount: gstAmount,
        color: "text-pink-700",
        bg: "bg-pink-50",
        border: "border-pink-200",
        sign: "+",
        signColor: "text-emerald-600",
      });
    }

    if (editEntry.manualClaim) {
      const mca = Number(editEntry.manualClaimAmount || 0);
      if (mca > 0) {
        items.push({
          type: "deduct",
          label: "Manual Quality Claim",
          detail: "Report not received - manual entry",
          amount: mca,
          color: "text-red-700",
          bg: "bg-red-50",
          border: "border-red-200",
          sign: "-",
          signColor: "text-red-500",
        });
      }
    } else {
      qualityClaims.forEach((claim) => {
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
          items.push({
            type: "deduct",
            label: `Claim: ${claim.parameterName || "Unnamed"}`,
            detail: `Std: ${std}% / Act: ${act}%${
              claim.notes ? ` . ${claim.notes}` : ""
            }`,
            amount: claimAmt,
            color: "text-red-700",
            bg: "bg-red-50",
            border: "border-red-200",
            sign: "-",
            signColor: "text-red-500",
          });
        }
      });
    }

    const secondClaim = Number(editEntry.secondClaim || 0);
    if (secondClaim > 0) {
      items.push({
        type: "deduct",
        label: "2nd Claim",
        detail: editEntry.secondClaimRemarks || "Secondary deduction",
        amount: secondClaim,
        color: "text-purple-700",
        bg: "bg-purple-50",
        border: "border-purple-200",
        sign: "-",
        signColor: "text-red-500",
      });
    }

    const otherCharges = Number(editEntry.otherCharges || 0);
    if (otherCharges > 0) {
      items.push({
        type: "deduct",
        label: "Other Charges",
        detail: editEntry.otherChargesRemarks || "Miscellaneous charges",
        amount: otherCharges,
        color: "text-teal-700",
        bg: "bg-teal-50",
        border: "border-teal-200",
        sign: "-",
        signColor: "text-red-500",
      });
    }

    const bankCharges = Number(editEntry.bankCharges || 0);
    if (bankCharges > 0) {
      items.push({
        type: "deduct",
        label: "Bank Charges",
        detail: editEntry.bankChargesRemarks || "Bank processing charges",
        amount: bankCharges,
        color: "text-orange-700",
        bg: "bg-orange-50",
        border: "border-orange-200",
        sign: "-",
        signColor: "text-red-500",
      });
    }

    const tds = Number(editEntry.tds || 0);
    if (tds > 0) {
      items.push({
        type: "deduct",
        label: "TDS",
        detail: editEntry.tdsRemarks || "Tax Deducted at Source",
        amount: tds,
        color: "text-rose-800",
        bg: "bg-rose-50",
        border: "border-rose-200",
        sign: "-",
        signColor: "text-red-500",
      });
    }

    return items;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div>
          <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
            Loading Date *
          </label>
          <input
            type="date"
            name="loadingDate"
            value={editEntry.loadingDate || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-[#e4dbc6] bg-lux-cream px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lux-gold/20"
            aria-label="Loading Date"
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
            Delivery Date
          </label>
          <input
            type="date"
            name="deliveryDate"
            value={editEntry.deliveryDate || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-[#e4dbc6] bg-lux-cream px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lux-gold/20"
            aria-label="Delivery Date"
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
            Sauda No *
          </label>
          <input
            type="text"
            name="saudaNo"
            value={editEntry.saudaNo || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-[#e4dbc6] bg-lux-cream px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lux-gold/20"
            aria-label="Sauda Number"
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
            Payment Terms
          </label>
          <input
            type="text"
            value={paymentTermsMap[editEntry.saudaNo] || "N/A"}
            disabled
            className="w-full rounded-lg border border-[#e4dbc6] bg-lux-ivory px-3 py-2 text-sm text-lux-muted cursor-not-allowed"
            aria-label="Payment Terms (read-only)"
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
            Bill No
          </label>
          <input
            type="text"
            name="billNumber"
            value={editEntry.billNumber || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-[#e4dbc6] bg-lux-cream px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lux-gold/20"
            aria-label="Bill Number"
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
            Seller Bill No
          </label>
          <input
            type="text"
            name="sellerBillNo"
            value={editEntry.sellerBillNo || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-[#e4dbc6] bg-lux-cream px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lux-gold/20"
            aria-label="Seller Bill Number"
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
            Date of Issue
          </label>
          <input
            type="date"
            name="dateOfIssue"
            value={editEntry.dateOfIssue || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-[#e4dbc6] bg-lux-cream px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lux-gold/20"
            aria-label="Date of Issue"
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
            Lorry Number *
          </label>
          <input
            type="text"
            name="lorryNumber"
            value={editEntry.lorryNumber || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-[#e4dbc6] bg-lux-cream px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lux-gold/20"
            aria-label="Lorry Number"
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
            Transporter
          </label>
          <DataDropdown
            options={transporters}
            selectedOptions={
              editEntry.transporterId
                ? [
                    transporters.find(
                      (t) => t.value === editEntry.transporterId,
                    ),
                  ].filter(Boolean)
                : []
            }
            onChange={(option) => {
              setEditEntry((prev) => ({
                ...prev,
                transporterId: option?.value || "",
                addedTransport: option?.label || "",
              }));
            }}
            placeholder="Select Transporter"
            isMulti={false}
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
            Driver Name
          </label>
          <input
            type="text"
            name="driverName"
            value={editEntry.driverName || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-[#e4dbc6] bg-lux-cream px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lux-gold/20"
            aria-label="Driver Name"
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
            Driver Phone
          </label>
          <input
            type="tel"
            name="driverPhoneNumber"
            value={editEntry.driverPhoneNumber || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-[#e4dbc6] bg-lux-cream px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lux-gold/20"
            aria-label="Driver Phone"
            pattern="[0-9]{10}"
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
            Commodity
          </label>
          <input
            type="text"
            name="commodity"
            value={editEntry.commodity || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-[#e4dbc6] bg-lux-cream px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lux-gold/20"
            aria-label="Commodity"
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
            Loading From
          </label>
          <DataDropdown
            options={stateOptions}
            selectedOptions={
              editEntry.loadingFrom
                ? [
                    stateOptions.find((s) => s.value === editEntry.loadingFrom),
                  ].filter(Boolean)
                : []
            }
            onChange={(option) => {
              setEditEntry((prev) => ({
                ...prev,
                loadingFrom: option?.value || "",
              }));
            }}
            placeholder="Select State"
            isMulti={false}
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
            Loading Weight (Tons)
          </label>
          <input
            type="number"
            name="loadingWeight"
            value={
              editEntry.loadingWeight != null && editEntry.loadingWeight !== ""
                ? Number(editEntry.loadingWeight).toFixed(3)
                : ""
            }
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-[#e4dbc6] bg-lux-cream px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lux-gold/20"
            aria-label="Loading Weight"
            step="0.001"
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
            Bags
          </label>
          <input
            type="number"
            name="bags"
            value={editEntry.bags || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-[#e4dbc6] bg-lux-cream px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lux-gold/20"
            aria-label="Bags"
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
            Unloading Weight (Tons)
          </label>
          <input
            type="text"
            inputMode="decimal"
            name="unloadingWeight"
            value={
              editEntry.unloadingWeight != null &&
              editEntry.unloadingWeight !== ""
                ? editEntry.unloadingWeight
                : ""
            }
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || /^\d*\.?\d{0,3}$/.test(val)) {
                handleEditFieldChange(e);
              }
            }}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
              editEntry.loadingWeight &&
              editEntry.unloadingWeight &&
              parseFloat(editEntry.unloadingWeight) >
                parseFloat(editEntry.loadingWeight)
                ? "border-rose-400 bg-rose-50 focus:ring-rose-500"
                : "border-[#e4dbc6] bg-lux-cream focus:ring-lux-gold/20"
            }`}
            aria-label="Unloading Weight"
            placeholder="e.g. 14.202 or 102.230"
          />
          {editEntry.loadingWeight &&
            editEntry.unloadingWeight &&
            parseFloat(editEntry.unloadingWeight) >
              parseFloat(editEntry.loadingWeight) && (
              <p className="mt-1 text-xs text-rose-600 font-semibold">
                ! Unloading Weight cannot exceed Loading Weight (
                {Number(editEntry.loadingWeight).toFixed(3)} Tons)
              </p>
            )}
        </div>
        <div>
          <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
            Unloading Date
          </label>
          <input
            type="date"
            name="unloadingDate"
            value={editEntry.unloadingDate || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-[#e4dbc6] bg-lux-cream px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lux-gold/20"
            aria-label="Unloading Date"
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
            Freight Rate
          </label>
          <input
            type="number"
            name="freightRate"
            value={editEntry.freightRate || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-[#e4dbc6] bg-lux-cream px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lux-gold/20"
            aria-label="Freight Rate"
            step="0.01"
          />
        </div>

        <div>
          <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
            Total Freight
          </label>
          <input
            type="number"
            name="totalFreight"
            value={editEntry.totalFreight || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-[#e4dbc6] bg-lux-cream px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lux-gold/20"
            aria-label="Total Freight"
            step="0.01"
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
            Advance
          </label>
          <input
            type="number"
            name="advance"
            value={editEntry.advance || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-[#e4dbc6] bg-lux-cream px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lux-gold/20"
            aria-label="Advance"
            step="0.01"
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
            Balance
          </label>
          <input
            type="number"
            name="balance"
            value={editEntry.balance || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-[#e4dbc6] bg-lux-cream px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lux-gold/20"
            aria-label="Balance"
            step="0.01"
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
            Buyer Brokerage
          </label>
          <input
            type="number"
            name="buyerBrokerage"
            value={editEntry.buyerBrokerage || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-[#e4dbc6] bg-lux-cream px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lux-gold/20"
            aria-label="Buyer Brokerage"
            step="0.01"
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
            Seller Brokerage
          </label>
          <input
            type="number"
            name="sellerBrokerage"
            value={editEntry.sellerBrokerage || ""}
            readOnly
            className="w-full rounded-lg border border-[#e4dbc6] bg-lux-ivory px-3 py-2 text-sm text-lux-muted cursor-not-allowed"
            aria-label="Seller Brokerage"
            step="0.01"
          />
        </div>
        <div>
          <label className="block mb-1 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
            Due Date
          </label>
          <DateSelector
            selectedDate={editEntry.dueDate || null}
            onChange={(date) =>
              handleEditFieldChange({
                target: {
                  name: "dueDate",
                  value: date ? new Date(date).toISOString().split("T")[0] : "",
                },
              })
            }
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="showAllQualityParameters"
            checked={editEntry.showAllQualityParameters}
            onChange={(e) => {
              setEditEntry((prev) => ({
                ...prev,
                showAllQualityParameters: e.target.checked,
              }));
            }}
            className="w-5 h-5 text-lux-emerald rounded focus:ring-lux-emerald cursor-pointer"
          />
          <label
            htmlFor="showAllQualityParameters"
            className="text-xs font-bold uppercase tracking-widest text-lux-muted font-serif cursor-pointer"
          >
            Show All Quality Parameters
          </label>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
            Manual Calculation Rate
          </label>
          <input
            type="number"
            name="manualCalculationRate"
            value={editEntry.manualCalculationRate || ""}
            onChange={handleManualRateChange}
            className="w-32 rounded-lg border border-[#e4dbc6] bg-lux-cream px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lux-gold/20"
            aria-label="Manual Calculation Rate"
            step="0.01"
          />
        </div>
      </div>
      <QualityClaimsTable
        editEntry={editEntry}
        currentSelfOrder={currentSelfOrder}
        currentCompany={currentCompany}
        handleQualityChange={handleQualityChange}
      />

      {editEntry.qualityClaims && editEntry.qualityClaims.length > 0 && (
        <>
          <div className="mt-4 flex items-center justify-between bg-lux-ivory px-4 py-3 rounded-lg border border-lux-gold/20">
            <span className="font-serif text-sm font-bold text-lux-ink">
              Total Claim:
            </span>
            <span className="text-lg font-black text-lux-emerald">
              Rs {totalClaimAmount}
            </span>
          </div>

          <div className="mt-6 bg-lux-ivory border border-lux-gold/20 rounded-xl p-5 shadow-sm">
            <h4 className="font-serif text-base font-semibold text-lux-ink mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-lux-gold"></span>
              Bill & Payable Calculation - Purpose-wise Breakdown
            </h4>

            <div className="space-y-4">
              {editEntry.manualCalculationRate && (
                <div className="flex justify-between items-center p-3 bg-lux-cream rounded-lg shadow-xs border border-lux-gold/20">
                  <span className="font-semibold text-lux-ink text-sm">
                    Manual Calculation Rate:
                  </span>
                  <span className="text-lg font-bold text-lux-emerald">
                    Rs {Number(editEntry.manualCalculationRate).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="bg-lux-cream rounded-xl shadow-sm border border-[#ece4d2] overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-lux-ivory border-b border-[#ece4d2] text-[10px] font-black uppercase tracking-wider text-lux-muted">
                  <div className="col-span-1 text-center">+/-</div>
                  <div className="col-span-6">Particulars & Purpose</div>
                  <div className="col-span-3">Detail / Remarks</div>
                  <div className="col-span-2 text-right">Amount (Rs)</div>
                </div>
                {buildBreakdownItems().map((item, idx) => (
                  <div
                    key={idx}
                    className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-[#ece4d2] ${item.bg} last:border-b-0 hover:brightness-95 transition-all`}
                  >
                    <div className="col-span-1 flex items-center justify-center">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black ${item.signColor} bg-white/70 shadow-sm border`}
                      >
                        {item.sign}
                      </span>
                    </div>
                    <div className="col-span-6 flex flex-col justify-center">
                      <span
                        className={`text-sm font-black ${item.color}`}
                      >
                        {item.label}
                      </span>
                    </div>
                    <div className="col-span-3 flex items-center">
                      <span className="text-[10px] font-semibold text-lux-muted leading-snug">
                        {item.detail}
                      </span>
                    </div>
                    <div
                      className={`col-span-2 flex items-center justify-end ${item.color}`}
                    >
                      <span className="text-sm font-black tabular-nums">
                        {item.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-12 gap-2 px-4 py-4 bg-gradient-to-r from-lux-emerald via-lux-deep to-lux-emerald text-lux-gold-soft border-t-2 border-lux-gold/40">
                  <div className="col-span-10 flex items-center">
                    <span className="text-[10px] font-black uppercase tracking-wider leading-tight">
                      Net Payable = Gross - CD - Claims - BankChgs - 2ndClaim - Others - TDS + GST
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end">
                    <span className="text-xl font-black tabular-nums">
                      = Rs {calculatePayableAmount()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 p-3 bg-lux-cream rounded-xl shadow-sm border border-purple-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lux-ink text-sm">
                      Less 2nd Claim:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-lux-muted font-bold">Rs</span>
                      <input
                        type="number"
                        value={
                          editEntry.secondClaim != null
                            ? editEntry.secondClaim
                            : ""
                        }
                        onChange={(e) => {
                          setEditEntry((prev) => ({
                            ...prev,
                            secondClaim: e.target.value,
                          }));
                        }}
                        placeholder="0.00"
                        className="w-28 px-3 py-1.5 border border-[#e4dbc6] bg-lux-cream rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={editEntry.secondClaimRemarks || ""}
                    onChange={(e) => {
                      setEditEntry((prev) => ({
                        ...prev,
                        secondClaimRemarks: e.target.value,
                      }));
                    }}
                    placeholder="Purpose / Remarks..."
                    className="w-full px-3 py-1.5 border border-[#e4dbc6] bg-lux-ivory rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lux-gold/20 focus:border-lux-emerald"
                  />
                </div>

                <div className="space-y-2 p-3 bg-lux-cream rounded-xl shadow-sm border border-teal-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lux-ink text-sm">
                      Less Other Charges:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-lux-muted font-bold">Rs</span>
                      <input
                        type="number"
                        value={
                          editEntry.otherCharges != null
                            ? editEntry.otherCharges
                            : ""
                        }
                        onChange={(e) => {
                          setEditEntry((prev) => ({
                            ...prev,
                            otherCharges: e.target.value,
                          }));
                        }}
                        placeholder="0.00"
                        className="w-28 px-3 py-1.5 border border-[#e4dbc6] bg-lux-cream rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lux-gold/20 focus:border-lux-emerald"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={editEntry.otherChargesRemarks || ""}
                    onChange={(e) => {
                      setEditEntry((prev) => ({
                        ...prev,
                        otherChargesRemarks: e.target.value,
                      }));
                    }}
                    placeholder="Purpose / Remarks..."
                    className="w-full px-3 py-1.5 border border-[#e4dbc6] bg-lux-ivory rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lux-gold/20 focus:border-lux-emerald"
                  />
                </div>

                <div className="space-y-2 p-3 bg-lux-cream rounded-xl shadow-sm border border-orange-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lux-ink text-sm">
                      Less Bank Charges:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-lux-muted font-bold">Rs</span>
                      <input
                        type="number"
                        value={
                          editEntry.bankCharges != null
                            ? editEntry.bankCharges
                            : ""
                        }
                        onChange={(e) => {
                          setEditEntry((prev) => ({
                            ...prev,
                            bankCharges: e.target.value,
                          }));
                        }}
                        placeholder="0.00"
                        className="w-28 px-3 py-1.5 border border-[#e4dbc6] bg-lux-cream rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lux-gold/20 focus:border-lux-emerald"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={editEntry.bankChargesRemarks || ""}
                    onChange={(e) => {
                      setEditEntry((prev) => ({
                        ...prev,
                        bankChargesRemarks: e.target.value,
                      }));
                    }}
                    placeholder="Purpose / Remarks..."
                    className="w-full px-3 py-1.5 border border-[#e4dbc6] bg-lux-ivory rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lux-gold/20 focus:border-lux-emerald"
                  />
                </div>

                <div className="space-y-2 p-3 bg-lux-cream rounded-xl shadow-sm border border-red-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lux-ink text-sm">
                      Less TDS:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-lux-muted font-bold">Rs</span>
                      <input
                        type="number"
                        value={editEntry.tds != null ? editEntry.tds : ""}
                        onChange={(e) => {
                          setEditEntry((prev) => ({
                            ...prev,
                            tds: e.target.value,
                          }));
                        }}
                        placeholder="0.00"
                        className="w-28 px-3 py-1.5 border border-[#e4dbc6] bg-lux-cream rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-lux-gold/20 focus:border-lux-emerald"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={editEntry.tdsRemarks || ""}
                    onChange={(e) => {
                      setEditEntry((prev) => ({
                        ...prev,
                        tdsRemarks: e.target.value,
                      }));
                    }}
                    placeholder="Purpose / Remarks..."
                    className="w-full px-3 py-1.5 border border-[#e4dbc6] bg-lux-ivory rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lux-gold/20 focus:border-lux-emerald"
                  />
                </div>
              </div>

              <div className="p-3 bg-lux-cream rounded-xl shadow-sm border border-[#ece4d2]">
                <span className="font-serif text-sm font-bold text-lux-ink block mb-2">
                  General Remarks:
                </span>
                <input
                  type="text"
                  value={editEntry.generalRemarks || ""}
                  onChange={(e) => {
                    setEditEntry((prev) => ({
                      ...prev,
                      generalRemarks: e.target.value,
                    }));
                  }}
                  placeholder="Add any additional remarks..."
                  className="w-full px-3 py-2 border border-[#e4dbc6] bg-lux-cream rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lux-gold/20 focus:border-lux-emerald"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-5 bg-gradient-to-r from-lux-emerald via-lux-deep to-lux-emerald rounded-xl shadow-lg text-lux-gold-soft">
                <div className="flex-1 w-full sm:w-auto">
                  <span className="text-lg font-bold">Payable Amount:</span>
                  <span className="text-3xl font-black ml-3">
                    Rs {calculatePayableAmount()}
                  </span>
                </div>
                {onNavigateToPaymentReceived && (
                  <button
                    type="button"
                    onClick={() =>
                      onNavigateToPaymentReceived({
                        payableAmount: calculatePayableAmount(),
                        loadingEntryId: editEntry._id,
                        buyerCompany:
                          editEntry.buyerCompany ||
                          editEntry.consignee ||
                          "",
                        supplierCompany: editEntry.supplierCompany || "",
                        saudaNo: editEntry.saudaNo || "",
                        lorryNumber: editEntry.lorryNumber || "",
                      })
                    }
                    className="flex items-center gap-2 px-5 py-3 bg-lux-cream text-lux-emerald rounded-xl font-black text-sm uppercase tracking-wider shadow-xl hover:bg-white transition-all border-2 border-lux-gold/40"
                  >
                    <FaMoneyBillWave size={16} />
                    Record Payment Received
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={editEntry.manualClaim}
                onChange={(e) => {
                  setEditEntry((prev) => ({
                    ...prev,
                    manualClaim: e.target.checked,
                  }));
                }}
                className="w-5 h-5 text-lux-emerald rounded focus:ring-lux-emerald cursor-pointer"
              />
              <span className="text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">
                Report not Received, Enter Manual claim Amount
              </span>
            </label>

            {editEntry.manualClaim && (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-lux-muted font-bold text-lg">Rs</span>
                <input
                  type="number"
                  value={
                    editEntry.manualClaimAmount != null
                      ? editEntry.manualClaimAmount
                      : ""
                  }
                  onChange={(e) => {
                    setEditEntry((prev) => ({
                      ...prev,
                      manualClaimAmount: e.target.value,
                    }));
                  }}
                  placeholder="Enter manual claim amount"
                  className="flex-1 max-w-xs px-4 py-2 bg-lux-cream border border-[#e4dbc6] rounded-lg text-base font-bold text-lux-ink focus:ring-2 focus:ring-lux-gold/20 outline-none"
                  step="0.01"
                />
              </div>
            )}
          </div>

          <p className="mt-3 text-[11px] text-lux-muted italic">
            * Claim Amount is automatically calculated based on (Actual -
            Standard) x Sauda Rate (Rs
            {currentSelfOrder?.rate || 0})
          </p>
        </>
      )}

      <div className="mt-6 pt-6 border-t border-[#ece4d2]">
        <h4 className="text-base font-bold text-lux-ink mb-4 flex items-center gap-2 font-serif">
          <span className="w-2 h-2 rounded-full bg-lux-gold"></span>
          Upload Documents
        </h4>
        {!editEntry.unloadingWeight || !editEntry.unloadingDate ? (
          <div className="mb-4 p-3 bg-lux-ivory border border-lux-gold/20 rounded-lg">
            <p className="text-sm text-lux-emerald">
              i Tip: Fill in both <b>Unloading Weight</b> and{" "}
              <b>Unloading Date</b> to ensure the entry is complete. Document
              upload is enabled regardless - Kanta Slip / Unloading Challan can
              be attached first.
            </p>
          </div>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FileUpload
            label="1. Kanta Slip"
            accept="image/*,.pdf"
            minWidth={800}
            minHeight={600}
            currentUrl={editEntry.documents?.kantaSlip || ""}
            onFileChange={(url) => {
              updateDocumentsState({ kantaSlip: url });
            }}
            onFileRemove={() => {
              updateDocumentsState({ kantaSlip: "" });
            }}
          />
          <FileUpload
            label="2. Unloading Challan"
            accept="image/*,.pdf"
            minWidth={800}
            minHeight={600}
            currentUrl={editEntry.documents?.unloadingChallan || ""}
            onFileChange={(url) => {
              updateDocumentsState({ unloadingChallan: url });
            }}
            onFileRemove={() => {
              updateDocumentsState({ unloadingChallan: "" });
            }}
          />
          <FileUpload
            label="3. Party Bill Copy"
            accept="image/*,.pdf"
            minWidth={800}
            minHeight={600}
            currentUrl={editEntry.documents?.partyBillCopy || ""}
            onFileChange={(url) => {
              updateDocumentsState({ partyBillCopy: url });
            }}
            onFileRemove={() => {
              updateDocumentsState({ partyBillCopy: "" });
            }}
          />
        </div>

        <div className="mt-8 pt-6 border-t border-[#ece4d2]">
          <h4 className="text-base font-bold text-lux-ink mb-4 flex items-center gap-2 font-serif">
            <span className="w-2 h-2 rounded-full bg-lux-gold"></span>
            Document Attachments & Quality Reports
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FileUpload
              label="4. Quality Report (Lab Certificate / Test Report)"
              accept="image/*,.pdf"
              minWidth={800}
              minHeight={600}
              currentUrl={editEntry.documents?.qualityReport || ""}
              onFileChange={(url) => {
                updateDocumentsState({ qualityReport: url });
              }}
              onFileRemove={() => {
                updateDocumentsState({ qualityReport: "" });
              }}
            />
            <FileUpload
              label="5. Other Document Attachment"
              accept="image/*,.pdf"
              minWidth={800}
              minHeight={600}
              currentUrl={editEntry.documentUrl || ""}
              onFileChange={(url) => {
                setEditEntry((prev) => ({
                  ...prev,
                  documentUrl: url,
                }));
              }}
              onFileRemove={() => {
                setEditEntry((prev) => ({
                  ...prev,
                  documentUrl: "",
                }));
              }}
            />
          </div>
        </div>
      </div>

      {editEntry.isRejected && (
        <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-lg">
          <p className="text-rose-700 font-semibold">
            This lorry has been rejected. All amounts are set to 0.
          </p>
        </div>
      )}

      <div className="flex justify-between items-center pt-4 border-t border-[#ece4d2] mt-4">
        {!editEntry.isRejected && (
          <button
            onClick={handleRejectLorry}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-rose-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-100 hover:shadow-lg active:scale-[0.97]"
          >
            Reject Lorry
          </button>
        )}
        <div className="flex gap-3 ml-auto">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e4dbc6] bg-lux-cream px-4 py-2.5 text-lux-emerald shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lg active:scale-[0.97]"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateEntry}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/25 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Update Entry"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditLoadingEntryPopup;
