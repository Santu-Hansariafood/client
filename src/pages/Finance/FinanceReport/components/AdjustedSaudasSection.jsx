import { useState } from "react";
import { AiOutlineEye } from "react-icons/ai";
import { FaEdit, FaTrash } from "react-icons/fa";
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
  onDelete,
}) => {
  const [viewingAdjustment, setViewingAdjustment] = useState(null);
  const getBuyerAdjustedTotal = (adjustment) => {
    const key = `${String(adjustment.buyerSaudaNo || "").toLowerCase()}|${String(adjustment.buyerCompany || "").toLowerCase()}`;
    return adjustedQuantityByBuyerSauda.get(key) || 0;
  };
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
          <span className="font-bold text-lux-muted">Buyer:</span>{" "}
          {adjustment.buyerSaudaNo || "No buyer Sauda linked"}
        </div>
        <div>
          <span className="font-bold text-lux-muted">Seller(s):</span>{" "}
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
        <span className="font-bold text-lux-emerald">Equal</span>
      ) : (
        <span className="font-bold text-amber-600">Not Equal</span>
      ),
      <div
        key={`adjustment-actions-${adjustment._id || adjustment.saudaNo}`}
        className="flex items-center gap-2"
      >
        <button
          type="button"
          onClick={() => setViewingAdjustment(adjustment)}
          title="View adjustment"
          aria-label="View adjustment"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#ece4d2] bg-lux-ivory text-lux-emerald hover:bg-lux-cream"
        >
          <AiOutlineEye size={17} />
        </button>
        <button
          type="button"
          onClick={() => onAdjust(adjustment)}
          title="Edit adjustment"
          aria-label="Edit adjustment"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#ece4d2] bg-lux-ivory text-lux-emerald hover:bg-lux-cream"
        >
          <FaEdit size={14} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(adjustment)}
          title="Delete adjustment"
          aria-label="Delete adjustment"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
        >
          <FaTrash size={13} />
        </button>
      </div>,
    ];
  });

  return (
    <div className="lux-card lux-gold-top mt-6 overflow-x-auto p-4 sm:p-6">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h3 className="font-serif text-sm font-bold text-lux-ink">
          Adjusted Saudas
        </h3>
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
              "Actions",
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
        <p className="py-4 text-sm text-lux-muted">
          No adjusted Saudas match the selected report filters.
        </p>
      )}
      {viewingAdjustment && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setViewingAdjustment(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="adjusted-sauda-view-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3
                id="adjusted-sauda-view-title"
                className="font-serif text-lg font-bold text-lux-ink"
              >
                Adjustment details
              </h3>
              <button
                type="button"
                onClick={() => setViewingAdjustment(null)}
                className="rounded-lg px-3 py-1 text-sm font-semibold text-lux-muted hover:bg-lux-ivory"
              >
                Close
              </button>
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              {[
                ["Buyer Sauda", viewingAdjustment.buyerSaudaNo || "-"],
                ["Buyer Company", viewingAdjustment.buyerCompany || "-"],
                ["Buyer Quantity", `${formatNumber(viewingAdjustment.buyerQuantity)} Tons`],
                ["Buyer Adjusted Total", `${formatNumber(getBuyerAdjustedTotal(viewingAdjustment))} Tons`],
                ["Seller Sauda", viewingAdjustment.saudaNo || "-"],
                ["Mapped Seller Saudas", (viewingAdjustment.adjustedWithSaudaNos || []).join(", ") || "-"],
                ["Seller Company", viewingAdjustment.sellerCompany || "-"],
                ["Seller Name", viewingAdjustment.sellerName || "-"],
                ["Consignee", viewingAdjustment.consignee || viewingAdjustment.buyerConsignee || "-"],
                ["Commodity", viewingAdjustment.commodity || "-"],
                ["Seller Quantity", `${formatNumber(viewingAdjustment.purchaseQuantity)} Tons`],
                ["Adjusted Quantity", `${formatNumber(viewingAdjustment.adjustmentQuantity)} Tons`],
                ["Adjustment Date", formatDate(viewingAdjustment.adjustmentDate)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-lux-ivory p-3">
                  <div className="text-xs font-bold uppercase tracking-wide text-lux-muted">
                    {label}
                  </div>
                  <div className="mt-1 font-semibold text-lux-ink">{value}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdjustedSaudasSection;