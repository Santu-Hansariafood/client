import Tables from "../../../../common/Tables/Tables";
import Pagination from "../../../../common/Paginations/Paginations";

const AdjustedSaudasSection = ({
  rows,
  total,
  page,
  itemsPerPage,
  adjustedQuantityByBuyerSauda,
  formatDate,
  formatNumber,
  getAdjustmentStatus,
  onPageChange,
  onAdjust,
}) => {
  const tableRows = rows.map((adjustment) => {
    const buyerKey = `${String(adjustment.buyerSaudaNo || "").toLowerCase()}|${String(adjustment.buyerCompany || "").toLowerCase()}`;
    const buyerAdjustedTotal = adjustedQuantityByBuyerSauda.get(buyerKey) || 0;
    const sellerAdjustedQuantity = Number(adjustment.adjustmentQuantity || 0);
    const isEqual =
      getAdjustmentStatus(
        adjustment.buyerSaudaNo
          ? adjustment.buyerQuantity
          : adjustment.purchaseQuantity,
        adjustment.buyerSaudaNo ? buyerAdjustedTotal : sellerAdjustedQuantity,
      ) === "Equal";

    return [
      adjustment.buyerSaudaNo || "-",
      adjustment.buyerCompany || "-",
      <div
        key={`mapping-${adjustment._id || adjustment.saudaNo}`}
        className="min-w-[190px] space-y-1 text-xs"
      >
        <div>
          <span className="font-bold text-slate-500">Buyer:</span>{" "}
          {adjustment.buyerSaudaNo || "No buyer Sauda linked"}
        </div>
        <div>
          <span className="font-bold text-slate-500">Seller(s):</span>{" "}
          {[...new Set([
            adjustment.saudaNo,
            ...(adjustment.adjustedWithSaudaNos || []),
          ])]
            .filter(Boolean)
            .join(", ") || "-"}
        </div>
      </div>,
      formatDate(adjustment.buyerSaudaDate),
      adjustment.buyerSaudaNo
        ? `${formatNumber(adjustment.buyerQuantity)} Tons`
        : "-",
      adjustment.buyerSaudaNo
        ? `${formatNumber(buyerAdjustedTotal)} Tons`
        : "-",
      adjustment.buyerSaudaNo
        ? `${formatNumber(
            Math.max(
              0,
              Number(adjustment.buyerQuantity || 0) - buyerAdjustedTotal,
            ),
          )} Tons`
        : "-",
      adjustment.saudaNo || "-",
      adjustment.sellerName || "-",
      adjustment.sellerCompany || "-",
      adjustment.consignee || adjustment.buyerConsignee || "-",
      adjustment.commodity || "-",
      `${formatNumber(adjustment.purchaseQuantity)} Tons`,
      `${formatNumber(sellerAdjustedQuantity)} Tons`,
      `${formatNumber(
        Math.max(
          0,
          Number(adjustment.purchaseQuantity || 0) - sellerAdjustedQuantity,
        ),
      )} Tons`,
      formatDate(adjustment.saudaDate),
      formatDate(adjustment.adjustmentDate),
      isEqual ? (
        <span
          key={`adjustment-status-${adjustment._id || adjustment.saudaNo}`}
          className="font-bold text-emerald-600"
        >
          Equal
        </span>
      ) : (
        <button
          key={`adjustment-status-${adjustment._id || adjustment.saudaNo}`}
          type="button"
          onClick={() => onAdjust(adjustment)}
          title="Load this Sauda for adjustment"
          className="font-bold text-amber-600 underline decoration-dashed underline-offset-2 hover:text-amber-800"
        >
          Not Equal - Adjust
        </button>
      ),
    ];
  });

  return (
    <div className="mt-6 overflow-x-auto">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h3 className="text-sm font-bold text-slate-700">Adjusted Saudas</h3>
      </div>
      {total > 0 ? (
        <div>
          <Tables
            headers={[
              "Buyer Sauda",
              "Buyer Company",
              "Buyer / Seller Sauda Mapping",
              "Buyer PO Date",
              "Buyer Quantity",
              "Buyer Adjusted Total",
              "Buyer Pending",
              "Seller Sauda",
              "Seller Name",
              "Seller Company",
              "Consignee",
              "Commodity",
              "Seller Quantity",
              "Seller Adjusted",
              "Seller Pending",
              "Seller PO Date",
              "Adjustment Date",
              "Status",
            ]}
            rows={tableRows}
          />
          <Pagination
            currentPage={page}
            totalItems={total}
            itemsPerPage={itemsPerPage}
            onPageChange={onPageChange}
          />
        </div>
      ) : (
        <p className="py-4 text-sm text-slate-500">
          No adjusted Saudas match the selected report filters.
        </p>
      )}
    </div>
  );
};

export default AdjustedSaudasSection;