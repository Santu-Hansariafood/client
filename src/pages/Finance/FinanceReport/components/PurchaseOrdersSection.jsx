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
  <section className="rounded-2xl border border-emerald-200/60 bg-white p-4 shadow-lg sm:p-6">
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Purchase Orders</h2>
        <p className="text-sm text-slate-500">
          Company-wise financed Sauda list
        </p>
      </div>
      <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
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