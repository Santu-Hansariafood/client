import Loading from "../../../../common/Loading/Loading";
import Tables from "../../../../common/Tables/Tables";
import Pagination from "../../../../common/Paginations/Paginations";

const PurchaseOrdersSection = ({
  rows,
  loading,
  total,
  page,
  itemsPerPage,
  onPageChange,
}) => (
  <section className="lux-card lux-gold-top p-4 sm:p-6">
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <h2 className="font-serif text-base font-semibold text-lux-ink">
          Purchase orders
        </h2>
      </div>
      <span className="rounded-full border border-[#ece4d2] bg-lux-ivory px-3 py-1 text-[10px] font-black uppercase tracking-widest text-lux-emerald">
        {total} Records
      </span>
    </div>
    {loading ? (
      <Loading />
    ) : (
      <div className="overflow-x-auto">
        <Tables
          headers={[
            "Sl No",
            "Date",
            "Sauda No",
            "Seller Company",
            "Buyer Company",
            "Consignee",
            "Purchase Quantity",
            "Rate",
            "CD",
            "GST",
            "Delivery Date",
            "Payment Terms",
            "Action",
          ]}
          rows={rows}
        />
      </div>
    )}
    <Pagination
      currentPage={page}
      totalItems={total}
      itemsPerPage={itemsPerPage}
      onPageChange={onPageChange}
    />
  </section>
);

export default PurchaseOrdersSection;