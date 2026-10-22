import { lazy, Suspense, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaClipboardList } from "react-icons/fa";
import AdminPageShell from "../../common/AdminPageShell/AdminPageShell";
import Loading from "../../common/Loading/Loading";
import { usePaymentReceived } from "./hooks/usePaymentReceived";

const SearchBox = lazy(() => import("../../common/SearchBox/SearchBox"));
const PaymentList = lazy(() => import("./components/PaymentList"));
const PaymentDetails = lazy(() => import("./components/PaymentDetails"));

const PaymentReceived = () => {
  const navigate = useNavigate();
  const {
    payments,
    loading,
    error,
    currentPage,
    itemsPerPage,
    totalItems,
    searchInput,
    selectedPayment,
    showDetails,
    nextVoucherNumber,
    setCurrentPage,
    setItemsPerPage,
    setSearchInput,
    setSelectedPayment,
    setShowDetails,
    deletePayment,
    scanVoucher,
  } = usePaymentReceived();

  const handleViewDetails = useCallback(
    (payment) => {
      setSelectedPayment(payment);
      setShowDetails(true);
    },
    [setSelectedPayment, setShowDetails],
  );

  const handleEdit = useCallback(
    (payment) => {
      navigate(`/payments/received/add?id=${payment._id}`);
    },
    [navigate],
  );

  const handleAddNew = useCallback(() => {
    navigate("/payments/received/add");
  }, [navigate]);

  const handleCancel = useCallback(() => {
    setShowDetails(false);
    setSelectedPayment(null);
  }, [setShowDetails, setSelectedPayment]);

  return (
    <AdminPageShell
      title="Payment Received"
      subtitle="Manage and track all received payments"
      icon={FaClipboardList}
      noContentCard
    >
      <div className="mx-auto w-full max-w-6xl space-y-6 animate-slide-up sm:space-y-8">
        <div className="lux-card lux-gold-top group relative w-full overflow-hidden p-4 sm:p-6 lg:p-8">
          <div className="relative space-y-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-lux-emerald to-lux-deep shadow-lg shadow-lux-emerald/25 ring-1 ring-lux-gold/40 sm:h-16 sm:w-16">
                  <FaClipboardList className="text-2xl text-lux-gold-soft" />
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-lux-ink">
                    Payment Received
                  </h2>
                  <p className="text-sm font-semibold text-lux-muted">
                    Next Voucher Number: {nextVoucherNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={handleAddNew}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-5 py-2.5 text-sm font-bold text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/25 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none"
              >
                <FaPlus size={16} />
                Add New Payment
              </button>
            </div>
            <div className="relative group/search">
              <Suspense fallback={<Loading />}>
                <SearchBox
                  placeholder="Search by voucher number, seller bill no, or date..."
                  items={[]}
                  returnQuery={true}
                  onSearch={setSearchInput}
                  value={searchInput}
                />
              </Suspense>
            </div>
          </div>
        </div>

        <Suspense fallback={<Loading />}>
          <PaymentList
            payments={payments}
            loading={loading}
            error={error}
            totalItems={totalItems}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={setItemsPerPage}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={deletePayment}
            onScanVoucher={scanVoucher}
          />
        </Suspense>

        {showDetails && (
          <Suspense fallback={<Loading />}>
            <PaymentDetails
              payment={selectedPayment}
              onClose={handleCancel}
              onEdit={handleEdit}
              onDelete={deletePayment}
            />
          </Suspense>
        )}
      </div>
    </AdminPageShell>
  );
};

export default PaymentReceived;
