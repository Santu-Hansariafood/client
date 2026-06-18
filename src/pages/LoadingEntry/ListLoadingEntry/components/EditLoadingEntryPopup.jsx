import React, { lazy } from "react";
import { toast } from "react-toastify";
import QualityClaimsTable, { calculateClaimAmount } from "./QualityClaimsTable";

const DataDropdown = lazy(
  () => import("../../../../common/DataDropdown/DataDropdown"),
);
const FileUpload = lazy(
  () => import("../../../../common/FileUpload/FileUpload"),
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
}) => {
  const totalClaimAmount = editEntry.manualClaim
    ? editEntry.manualClaimAmount || 0
    : editEntry.qualityClaims
        .reduce((total, claim) => total + (Number(claim.claimAmount) || 0), 0)
        .toFixed(2);

  const calculatePayableAmount = () => {
    const rate = Number(currentSelfOrder?.rate || 0);
    const weight = Number(editEntry.unloadingWeight || 0);
    const totalBill = rate * weight;
    // const cdAmount = totalBill * ((Number(currentSelfOrder?.cd) || 0) / 100);
    // const gstAmount = totalBill * ((Number(currentSelfOrder?.gst) || 0) / 100);
    const totalClaim = editEntry.manualClaim
      ? Number(editEntry.manualClaimAmount || 0)
      : editEntry.qualityClaims.reduce(
          (total, claim) => total + (Number(claim.claimAmount) || 0),
          0,
        );
    const secondClaim = Number(editEntry.secondClaim || 0);
    const otherCharges = Number(editEntry.otherCharges || 0);
    const bankCharges = Number(editEntry.bankCharges || 0);
    const tds = Number(editEntry.tds || 0);
    return (
      totalBill -
      totalClaim -
      secondClaim -
      otherCharges -
      bankCharges -
      tds
    ).toFixed(2);
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Loading Date *
          </label>
          <input
            type="date"
            name="loadingDate"
            value={editEntry.loadingDate || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Loading Date"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Delivery Date
          </label>
          <input
            type="date"
            name="deliveryDate"
            value={editEntry.deliveryDate || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Delivery Date"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Sauda No *
          </label>
          <input
            type="text"
            name="saudaNo"
            value={editEntry.saudaNo || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Sauda Number"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Payment Terms
          </label>
          <input
            type="text"
            value={paymentTermsMap[editEntry.saudaNo] || "N/A"}
            disabled
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-slate-50 text-slate-700 cursor-not-allowed"
            aria-label="Payment Terms (read-only)"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Bill No
          </label>
          <input
            type="text"
            name="billNumber"
            value={editEntry.billNumber || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Bill Number"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Date of Issue
          </label>
          <input
            type="date"
            name="dateOfIssue"
            value={editEntry.dateOfIssue || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Date of Issue"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Lorry Number *
          </label>
          <input
            type="text"
            name="lorryNumber"
            value={editEntry.lorryNumber || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Lorry Number"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
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
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Driver Name
          </label>
          <input
            type="text"
            name="driverName"
            value={editEntry.driverName || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Driver Name"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Driver Phone
          </label>
          <input
            type="tel"
            name="driverPhoneNumber"
            value={editEntry.driverPhoneNumber || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Driver Phone"
            pattern="[0-9]{10}"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Commodity
          </label>
          <input
            type="text"
            name="commodity"
            value={editEntry.commodity || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Commodity"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
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
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Loading Weight
          </label>
          <input
            type="number"
            name="loadingWeight"
            value={editEntry.loadingWeight || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Loading Weight"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Bags
          </label>
          <input
            type="number"
            name="bags"
            value={editEntry.bags || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Bags"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Unloading Weight
          </label>
          <input
            type="number"
            name="unloadingWeight"
            value={editEntry.unloadingWeight || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Unloading Weight"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Unloading Date
          </label>
          <input
            type="date"
            name="unloadingDate"
            value={editEntry.unloadingDate || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Unloading Date"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Freight Rate
          </label>
          <input
            type="number"
            name="freightRate"
            value={editEntry.freightRate || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Freight Rate"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Total Freight
          </label>
          <input
            type="number"
            name="totalFreight"
            value={editEntry.totalFreight || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Total Freight"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Advance
          </label>
          <input
            type="number"
            name="advance"
            value={editEntry.advance || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Advance"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Balance
          </label>
          <input
            type="number"
            name="balance"
            value={editEntry.balance || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Balance"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Buyer Brokerage
          </label>
          <input
            type="number"
            name="buyerBrokerage"
            value={editEntry.buyerBrokerage || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Buyer Brokerage"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">
            Seller Brokerage
          </label>
          <input
            type="number"
            name="sellerBrokerage"
            value={editEntry.sellerBrokerage || ""}
            onChange={handleEditFieldChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Seller Brokerage"
            step="0.01"
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
            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
          />
          <label
            htmlFor="showAllQualityParameters"
            className="text-sm font-semibold text-slate-700 cursor-pointer"
          >
            Show All Quality Parameters
          </label>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-700">
            Manual Calculation Rate
          </label>
          <input
            type="number"
            name="manualCalculationRate"
            value={editEntry.manualCalculationRate || ""}
            onChange={handleManualRateChange}
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
          <div className="mt-4 flex items-center justify-between bg-indigo-50 px-4 py-3 rounded-lg border border-indigo-100">
            <span className="text-sm font-bold text-indigo-800">
              Total Claim:
            </span>
            <span className="text-lg font-black text-indigo-600">
              ₹ {totalClaimAmount}
            </span>
          </div>

          <div className="mt-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-5 shadow-sm">
            <h4 className="text-base font-bold text-emerald-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Bill & Payable Calculation
            </h4>

            <div className="space-y-4">
              {/* Total Bill Value */}
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl shadow-sm border border-emerald-200">
                <span className="font-bold text-slate-800 text-sm">
                  Total Bill Value:
                </span>
                <span className="text-xl font-black text-emerald-700">
                  ₹{" "}
                  {(
                    Number(editEntry.unloadingWeight || 0) *
                    Number(currentSelfOrder?.rate || 0)
                  ).toFixed(2)}
                </span>
              </div>

              {/* Manual Calculation Rate */}
              {editEntry.manualCalculationRate && (
                <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-xs border border-emerald-100">
                  <span className="font-semibold text-slate-700 text-sm">
                    Manual Calculation Rate:
                  </span>
                  <span className="text-lg font-bold text-emerald-600">
                    ₹ {Number(editEntry.manualCalculationRate).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Total Claim */}
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl shadow-sm border border-amber-200">
                <span className="font-bold text-slate-800 text-sm">
                  Less Total Claim:
                </span>
                <span className="text-lg font-black text-red-600">
                  - ₹ {totalClaimAmount}
                </span>
              </div>

              {/* Deductions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 2nd Claim */}
                <div className="space-y-2 p-3 bg-white rounded-xl shadow-sm border border-purple-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700 text-sm">
                      Less 2nd Claim:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        value={editEntry.secondClaim != null ? editEntry.secondClaim : ""}
                        onChange={(e) => {
                          setEditEntry((prev) => ({
                            ...prev,
                            secondClaim: e.target.value,
                          }));
                        }}
                        placeholder="0.00"
                        className="w-28 px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
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
                    placeholder="Remarks..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 bg-slate-50"
                  />
                </div>

                {/* Other Charges */}
                <div className="space-y-2 p-3 bg-white rounded-xl shadow-sm border border-teal-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700 text-sm">
                      Less Other Charges:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        value={editEntry.otherCharges != null ? editEntry.otherCharges : ""}
                        onChange={(e) => {
                          setEditEntry((prev) => ({
                            ...prev,
                            otherCharges: e.target.value,
                          }));
                        }}
                        placeholder="0.00"
                        className="w-28 px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
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
                    placeholder="Remarks..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 bg-slate-50"
                  />
                </div>

                {/* Bank Charges */}
                <div className="space-y-2 p-3 bg-white rounded-xl shadow-sm border border-orange-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700 text-sm">
                      Less Bank Charges:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        value={editEntry.bankCharges != null ? editEntry.bankCharges : ""}
                        onChange={(e) => {
                          setEditEntry((prev) => ({
                            ...prev,
                            bankCharges: e.target.value,
                          }));
                        }}
                        placeholder="0.00"
                        className="w-28 px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
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
                    placeholder="Remarks..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 bg-slate-50"
                  />
                </div>

                {/* TDS */}
                <div className="space-y-2 p-3 bg-white rounded-xl shadow-sm border border-red-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700 text-sm">
                      Less TDS:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold">₹</span>
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
                        className="w-28 px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
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
                    placeholder="Remarks..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 bg-slate-50"
                  />
                </div>
              </div>

              {/* General Remarks */}
              <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200">
                <span className="text-sm font-bold text-slate-700 block mb-2">
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/30 focus:border-slate-500"
                />
              </div>

              {/* Payable Amount */}
              <div className="flex justify-between items-center p-5 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-xl shadow-lg text-white">
                <span className="text-lg font-bold">Payable Amount:</span>
                <span className="text-3xl font-black">
                  ₹ {calculatePayableAmount()}
                </span>
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
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-sm font-semibold text-slate-700">
                Report not Received, Enter Manual claim Amount
              </span>
            </label>

            {editEntry.manualClaim && (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-slate-400 font-bold text-lg">₹</span>
                <input
                  type="number"
                  value={editEntry.manualClaimAmount != null ? editEntry.manualClaimAmount : ""}
                  onChange={(e) => {
                    setEditEntry((prev) => ({
                      ...prev,
                      manualClaimAmount: e.target.value,
                    }));
                  }}
                  placeholder="Enter manual claim amount"
                  className="flex-1 max-w-xs px-4 py-2 bg-white border border-indigo-300 rounded-lg text-base font-bold text-indigo-800 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  step="0.01"
                />
              </div>
            )}
          </div>

          <p className="mt-3 text-[11px] text-slate-500 italic">
            * Claim Amount is automatically calculated based on (Actual -
            Standard) × Sauda Rate (₹
            {currentSelfOrder?.rate || 0})
          </p>
        </>
      )}

      {editEntry.unloadingWeight && editEntry.unloadingDate ? (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            Upload Documents
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FileUpload
              label="1. Kanta Slip"
              accept="image/*,.pdf"
              minWidth={800}
              minHeight={600}
              currentUrl={editEntry.documents?.kantaSlip}
              onFileChange={(url) => {
                setEditEntry((prev) => ({
                  ...prev,
                  documents: {
                    ...prev.documents,
                    kantaSlip: url,
                  },
                }));
              }}
              onFileRemove={() => {
                setEditEntry((prev) => ({
                  ...prev,
                  documents: {
                    ...prev.documents,
                    kantaSlip: "",
                  },
                }));
              }}
            />
            <FileUpload
              label="2. Unloading Challan"
              accept="image/*,.pdf"
              minWidth={800}
              minHeight={600}
              currentUrl={editEntry.documents?.unloadingChallan}
              onFileChange={(url) => {
                setEditEntry((prev) => ({
                  ...prev,
                  documents: {
                    ...prev.documents,
                    unloadingChallan: url,
                  },
                }));
              }}
              onFileRemove={() => {
                setEditEntry((prev) => ({
                  ...prev,
                  documents: {
                    ...prev.documents,
                    unloadingChallan: "",
                  },
                }));
              }}
            />
            <FileUpload
              label="3. Party Bill Copy"
              accept="image/*,.pdf"
              minWidth={800}
              minHeight={600}
              currentUrl={editEntry.documents?.partyBillCopy}
              onFileChange={(url) => {
                setEditEntry((prev) => ({
                  ...prev,
                  documents: {
                    ...prev.documents,
                    partyBillCopy: url,
                  },
                }));
              }}
              onFileRemove={() => {
                setEditEntry((prev) => ({
                  ...prev,
                  documents: {
                    ...prev.documents,
                    partyBillCopy: "",
                  },
                }));
              }}
            />
          </div>
        </div>
      ) : (
        <div className="border-t border-slate-200 pt-6">
          <p className="text-sm text-slate-500 text-center py-4">
            Please fill in both Unloading Weight and Unloading Date to enable
            document upload.
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleUpdateEntry}
          disabled={isSaving}
          className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold shadow-sm hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? "Saving..." : "Update Entry"}
        </button>
      </div>
    </div>
  );
};

export default EditLoadingEntryPopup;
