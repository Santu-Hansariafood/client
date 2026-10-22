import { lazy, Suspense, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DateSelector = lazy(
  () => import("../../../common/DateSelector/DateSelector"),
);
const FileUpload = lazy(() => import("../../../common/FileUpload/FileUpload"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
import "tailwindcss/tailwind.css";
import Loading from "../../../common/Loading/Loading";

const LoadingEntry = () => {
  const location = useLocation();
  const orderData = location.state?.order || {};

  const [formData, setFormData] = useState({
    loadingDate: "",
    loadingWeight: "",
    lorryNumber: "",
    addedTransport: "",
    driverName: "",
    driverPhoneNumber: "",
    freightRate: "",
    totalFreight: "",
    advance: "",
    balance: "",
    billNumber: "",
    dateOfIssue: "",
    documentUrl: "",
    saudaNo: orderData.saudaNo || "",
    supplier: orderData.supplier || "",
    consignee: orderData.consignee || "",
    commodity: orderData.commodity || "",
  });

  useEffect(() => {
    const calculatedTotalFreight =
      (parseFloat(formData.loadingWeight) || 0) *
      (parseFloat(formData.freightRate) || 0);
    const calculatedBalance =
      calculatedTotalFreight - (parseFloat(formData.advance) || 0);
    setFormData((prevData) => ({
      ...prevData,
      totalFreight: calculatedTotalFreight.toFixed(2),
      balance: calculatedBalance.toFixed(2),
    }));
  }, [formData.loadingWeight, formData.freightRate, formData.advance]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/loading-entries", formData);
      clearApiCache();
      toast.success("Loading entry added successfully");
      setFormData({
        loadingDate: "",
        loadingWeight: "",
        lorryNumber: "",
        addedTransport: "",
        driverName: "",
        driverPhoneNumber: "",
        freightRate: "",
        totalFreight: "",
        advance: "",
        balance: "",
        billNumber: "",
        dateOfIssue: "",
        documentUrl: "",
      });
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to add loading entry",
      );
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="mx-auto w-full max-w-5xl lux-card lux-gold-top p-4 sm:p-6 lg:p-8">
        <h1 className="font-serif font-semibold text-center text-lux-ink text-2xl mb-6">
          Loading Entry
        </h1>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:gap-6"
        >
          <div>
            <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">Loading Date</label>
            <DateSelector
              name="loadingDate"
              value={formData.loadingDate}
              onChange={(date) =>
                handleChange({ target: { name: "loadingDate", value: date } })
              }
            />
          </div>
          <div>
            <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">Loading Weight in Tons</label>
            <DataInput
              inputType="number"
              name="loadingWeight"
              value={formData.loadingWeight}
              placeholder="Enter weight in Tons"
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">Lorry Number</label>
            <DataInput
              name="lorryNumber"
              value={formData.lorryNumber}
              placeholder="Enter lorry number"
              onChange={handleChange}
              inputType="text/number"
            />
          </div>
          <div>
            <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">Added Transport</label>
            <DataInput
              name="addedTransport"
              value={formData.addedTransport}
              placeholder="Enter transport details"
              onChange={handleChange}
              inputType="text"
            />
          </div>
          <div>
            <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">Driver Name</label>
            <DataInput
              name="driverName"
              value={formData.driverName}
              placeholder="Enter driver name"
              onChange={handleChange}
              inputType="text"
            />
          </div>
          <div>
            <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">Driver Phone Number</label>
            <DataInput
              name="driverPhoneNumber"
              value={formData.driverPhoneNumber}
              placeholder="Enter phone number"
              onChange={handleChange}
              inputType="number"
              maxLength="10"
              minLength="10"
              required
            />
          </div>
          <div>
            <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">Freight Rate per Tons</label>
            <DataInput
              name="freightRate"
              value={formData.freightRate}
              placeholder="Enter freight rate"
              onChange={handleChange}
              inputType="number"
            />
          </div>
          <div>
            <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">Total Freight</label>
            <DataInput
              name="totalFreight"
              value={formData.totalFreight}
              placeholder="Enter total freight"
              onChange={handleChange}
              inputType="number"
              readOnly
            />
          </div>
          <div>
            <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">Advance</label>
            <DataInput
              name="advance"
              value={formData.advance}
              placeholder="Enter advance"
              onChange={handleChange}
              inputType="number"
            />
          </div>
          <div>
            <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">Balance</label>
            <DataInput
              name="balance"
              value={formData.balance}
              placeholder="Enter balance"
              onChange={handleChange}
              inputType="number"
              readOnly
            />
          </div>
          <div>
            <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">Bill Number</label>
            <DataInput
              name="billNumber"
              value={formData.billNumber}
              placeholder="Enter bill number"
              onChange={handleChange}
              inputType="text"
            />
          </div>
          <div>
            <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">Date of Issue</label>
            <DateSelector
              name="dateOfIssue"
              value={formData.dateOfIssue}
              onChange={(date) =>
                handleChange({ target: { name: "dateOfIssue", value: date } })
              }
            />
          </div>
          <div className="md:col-span-3">
            <label className="block mb-2 text-xs font-bold uppercase tracking-widest text-lux-muted font-serif">Upload Document</label>
            <FileUpload
              label="Upload File"
              accept=".jpg,.png,.pdf"
              onFileChange={(file) =>
                handleChange({
                  target: { name: "documentUrl", value: file.name },
                })
              }
            />
          </div>
          <div className="md:col-span-3 flex justify-center">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-5 py-2.5 text-sm font-bold text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/25 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97]"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </Suspense>
  );
};

export default LoadingEntry;
