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
  <section className="lux-card lux-gold-top p-4 sm:p-6">
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-serif text-lg font-bold text-lux-ink">
          Date-wise Totals
        </h2>
        <p className="text-sm text-lux-muted">
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
        <h3 className="mb-3 font-serif text-sm font-bold text-lux-ink">
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
        <h3 className="mb-3 font-serif text-sm font-bold text-lux-ink">
          Sauda Details
        </h3>
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
        <h3 className="mb-3 font-serif text-sm font-bold text-lux-ink">
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#ece4d2] bg-lux-ivory text-lux-emerald hover:bg-lux-cream"
              >
                <AiOutlineEye size={17} />
              </button>
              <DownloadSauda
                data={adjustment}
                button={
                  <button
                    type="button"
                    title="Download Sauda"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#ece4d2] bg-lux-ivory text-lux-emerald hover:bg-lux-cream"
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
      <div className="mt-4 grid gap-2 rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4 text-sm text-lux-ink sm:grid-cols-2 lg:grid-cols-4">
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
          className="text-left text-xs font-bold text-lux-emerald hover:text-lux-deep"
        >
          Close details
        </button>
      </div>
    )}
  </section>
);

export default DateWiseTotalsSection;