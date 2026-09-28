import { AiOutlineEye } from "react-icons/ai";
import { FaDownload } from "react-icons/fa";
import Tables from "../../../../common/Tables/Tables";
import DownloadSauda from "../../../../components/DownloadSauda/DownloadSauda";

const DateWiseTotalsSection = ({
  dateTotals,
  partyTotals,
  saudaDetails,
  adjustments,
  selectedAdjustment,
  formatDate,
  formatNumber,
  onSelectAdjustment,
  onClearAdjustment,
}) => (
  <section className="rounded-2xl border border-emerald-200/60 bg-white p-4 shadow-lg sm:p-6">
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Date-wise Totals</h2>
        <p className="text-sm text-slate-500">
          Sauda, adjustment, loaded, and pending quantities for the selected
          date range
        </p>
      </div>
    </div>
    <div className="overflow-x-auto">
      <Tables
        headers={[
          "Date",
          "Total Saudas",
          "Sauda Quantity",
          "Loaded Quantity",
          "Total Adjustment",
          "Pending Quantity",
        ]}
        rows={dateTotals.map((item) => [
          formatDate(item.date),
          formatNumber(item.saudaCount),
          `${formatNumber(item.saudaQuantity)} Tons`,
          `${formatNumber(item.loadedQuantity)} Tons`,
          `${formatNumber(item.adjustmentQuantity)} Tons`,
          `${formatNumber(item.pendingQuantity)} Tons`,
        ])}
      />
    </div>
    {partyTotals.length > 0 && (
      <div className="mt-6 overflow-x-auto">
        <h3 className="mb-3 text-sm font-bold text-slate-700">
          Buyer and Seller Finance Totals
        </h3>
        <Tables
          headers={[
            "Date",
            "Seller Company",
            "Buyer Company",
            "Purchase Total",
            "Sales Total",
            "Pending Total",
          ]}
          rows={partyTotals.map((party) => [
            formatDate(party.date),
            party.sellerCompany || "-",
            party.buyerCompany || "-",
            `${formatNumber(party.purchaseQuantity)} Tons`,
            `${formatNumber(party.salesQuantity ?? party.adjustedQuantity)} Tons`,
            `${formatNumber(party.pendingQuantity)} Tons`,
          ])}
        />
      </div>
    )}
    {saudaDetails.length > 0 && (
      <div className="mt-6 overflow-x-auto">
        <h3 className="mb-3 text-sm font-bold text-slate-700">Sauda Details</h3>
        <Tables
          headers={[
            "Sauda Date",
            "Sauda No",
            "Buyer",
            "Buyer Company",
            "Seller Name",
            "Seller Company",
            "Consignee",
            "Commodity",
            "Quantity",
            "Loaded",
            "Adjusted",
            "Pending",
            "Rate",
            "Delivery Date",
            "Payment Terms",
          ]}
          rows={saudaDetails.map((sauda) => [
            formatDate(sauda.saudaDate),
            sauda.saudaNo || "-",
            sauda.buyer || "-",
            sauda.buyerCompany || "-",
            sauda.sellerName || "-",
            sauda.sellerCompany || "-",
            sauda.consignee || "-",
            sauda.commodity || "-",
            `${formatNumber(sauda.quantity)} Tons`,
            `${formatNumber(sauda.loadedQuantity)} Tons`,
            `${formatNumber(sauda.adjustmentQuantity)} Tons`,
            `${formatNumber(sauda.pendingQuantity)} Tons`,
            formatNumber(sauda.rate),
            formatDate(sauda.deliveryDate),
            sauda.paymentTerms || "-",
          ])}
        />
      </div>
    )}
    {adjustments.length > 0 && (
      <div className="mt-6 overflow-x-auto">
        <h3 className="mb-3 text-sm font-bold text-slate-700">
          Adjusted Saudas
        </h3>
        <Tables
          headers={[
            "Adjustment Date",
            "Sauda No",
            "Buyer Company",
            "Seller Name",
            "Seller Company",
            "Adjusted Quantity",
            "Actions",
          ]}
          rows={adjustments.map((adjustment) => [
            formatDate(adjustment.adjustmentDate),
            adjustment.saudaNo || "-",
            adjustment.buyerCompany || "-",
            adjustment.sellerName || "-",
            adjustment.sellerCompany || "-",
            `${formatNumber(adjustment.adjustmentQuantity)} Tons`,
            <div
              key={`adjustment-actions-${adjustment._id || adjustment.saudaNo}`}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => onSelectAdjustment(adjustment)}
                title="View adjustment details"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              >
                <AiOutlineEye size={17} />
              </button>
              <DownloadSauda
                data={adjustment}
                button={
                  <button
                    type="button"
                    title="Download Sauda"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  >
                    <FaDownload size={13} />
                  </button>
                }
              />
            </div>,
          ])}
        />
      </div>
    )}
    {selectedAdjustment && (
      <div className="mt-4 grid gap-2 rounded-lg border border-emerald-100 bg-emerald-50/50 p-4 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="font-bold">Buyer:</span>{" "}
          {selectedAdjustment.buyer || "-"}
        </div>
        <div>
          <span className="font-bold">Buyer Company:</span>{" "}
          {selectedAdjustment.buyerCompany || "-"}
        </div>
        <div>
          <span className="font-bold">Sauda No:</span>{" "}
          {selectedAdjustment.saudaNo || "-"}
        </div>
        <div>
          <span className="font-bold">Seller Name:</span>{" "}
          {selectedAdjustment.sellerName || "-"}
        </div>
        <div>
          <span className="font-bold">Seller Company:</span>{" "}
          {selectedAdjustment.sellerCompany || "-"}
        </div>
        <div>
          <span className="font-bold">Consignee:</span>{" "}
          {selectedAdjustment.consignee || "-"}
        </div>
        <div>
          <span className="font-bold">Buying Quantity:</span>{" "}
          {formatNumber(selectedAdjustment.purchaseQuantity)} Tons
        </div>
        <div>
          <span className="font-bold">Adjusted Quantity:</span>{" "}
          {formatNumber(selectedAdjustment.adjustmentQuantity)} Tons
        </div>
        <button
          type="button"
          onClick={onClearAdjustment}
          className="text-left text-xs font-bold text-emerald-700 hover:text-emerald-900"
        >
          Close details
        </button>
      </div>
    )}
  </section>
);

export default DateWiseTotalsSection;