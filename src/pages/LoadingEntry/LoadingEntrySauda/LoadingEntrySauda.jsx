import { lazy, Suspense, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));
const DateSelector = lazy(() =>
  import("../../../common/DateSelector/DateSelector")
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
    const calculatedTotalFreight = (parseFloat(formData.loadingWeight) || 0) * (parseFloat(formData.freightRate) || 0);
    const calculatedBalance = calculatedTotalFreight - (parseFloat(formData.advance) || 0);
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
      await axios.post("https://api.hansariafood.shop/api/loading-entries", formData);
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
      toast.error("Failed to add loading entry", error);
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-4">
          Loading Entry
        </h1>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label>Loading Date</label>
            <DateSelector
              name="loadingDate"
              value={formData.loadingDate}
              onChange={(date) => handleChange({ target: { name: "loadingDate", value: date } })}
            />
          </div>
          <div>
            <label>Loading Weight in Tons</label>
            <DataInput
  inputType="number"
  name="loadingWeight"
              value={formData.loadingWeight}
              placeholder="Enter weight in Tons"
              onChange={handleChange}
            />
          </div>
          <div>
            <label>Lorry Number</label>
            <DataInput
              name="lorryNumber"
              value={formData.lorryNumber}
              placeholder="Enter lorry number"
              onChange={handleChange}
              inputType="text/number"
            />
          </div>
          <div>
            <label>Added Transport</label>
            <DataInput
              name="addedTransport"
              value={formData.addedTransport}
              placeholder="Enter transport details"
              onChange={handleChange}
              inputType="text"
            />
          </div>
          <div>
            <label>Driver Name</label>
            <DataInput
              name="driverName"
              value={formData.driverName}
              placeholder="Enter driver name"
              onChange={handleChange}
              inputType="text"
            />
          </div>
          <div>
            <label>Driver Phone Number</label>
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
            <label>Freight Rate per Tons</label>
            <DataInput
              name="freightRate"
              value={formData.freightRate}
              placeholder="Enter freight rate"
              onChange={handleChange}
              inputType="number"
            />
          </div>
          <div>
            <label>Total Freight</label>
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
            <label>Advance</label>
            <DataInput
              name="advance"
              value={formData.advance}
              placeholder="Enter advance"
              onChange={handleChange}
              inputType="number"
            />
          </div>
          <div>
            <label>Balance</label>
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
            <label>Bill Number</label>
            <DataInput
              name="billNumber"
              value={formData.billNumber}
              placeholder="Enter bill number"
              onChange={handleChange}
              inputType="text"
            />
          </div>
          <div>
            <label>Date of Issue</label>
            <DateSelector
              name="dateOfIssue"
              value={formData.dateOfIssue}
              onChange={(date) => handleChange({ target: { name: "dateOfIssue", value: date } })}
            />
          </div>
          <div className="md:col-span-3">
            <label>Upload Document</label>
            <FileUpload
              label="Upload File"
              accept=".jpg,.png,.pdf"
              onFileChange={(file) => handleChange({ target: { name: "documentUrl", value: file.name } })}
            />
          </div>
          <div className="md:col-span-3 flex justify-center">
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700">
              Submit
            </button>
          </div>
        </form>
      </div>
    </Suspense>
  );
};

export default LoadingEntry;
