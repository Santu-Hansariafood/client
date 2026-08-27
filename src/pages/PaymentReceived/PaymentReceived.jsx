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
      <div className="max-w-[1700px] mx-auto space-y-8 p-4 sm:p-6 lg:p-10">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group">
          <div className="relative space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <FaClipboardList className="text-2xl text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800">
                    Payment Received
                  </h2>
                  <p className="text-slate-500 text-sm font-semibold">
                    Next Voucher Number: {nextVoucherNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={handleAddNew}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.15em] hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center gap-3"
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
