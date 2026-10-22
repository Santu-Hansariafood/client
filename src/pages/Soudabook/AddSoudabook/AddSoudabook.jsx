import { useState, useEffect, Suspense, lazy } from "react";
import api, { clearApiCache } from "../../../utils/apiClient/apiClient";

import { fetchAllPages } from "../../../utils/apiClient/fetchAllPages";
import { FaPlus, FaTrash, FaCheck } from "react-icons/fa";
import { toast } from "react-toastify";
import Loading from "../../../common/Loading/Loading";
const DateSelector = lazy(
  () => import("../../../common/DateSelector/DateSelector"),
);
const DataDropdown = lazy(
  () => import("../../../common/DataDropdown/DataDropdown"),
);
const DataInput = lazy(() => import("../../../common/DataInput/DataInput"));

const AddSoudabook = () => {
  const [sellers, setSellers] = useState([]);
  const [items, setItems] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [rows, setRows] = useState([
    {
      date: new Date(),
      sellerName: null,
      item: null,
      oQnty: "",
      buyerName: null,
      rate: "",
      loadingQnty: "",
      location: "",
      unloadingQnty: "",
      paymentTerms: "",
      remarks: "",
    },
  ]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [sellersData, commoditiesData, buyersData] = await Promise.all([
          fetchAllPages("/sellers"),
          fetchAllPages("/commodities"),
          fetchAllPages("/buyers"),
        ]);

        setSellers(
          sellersData.map((s) => ({ value: s._id, label: s.sellerName })),
        );
        setItems(
          commoditiesData.map((i) => ({ value: i._id, label: i.name })),
        );
        setBuyers(
          buyersData.map((b) => ({ value: b._id, label: b.name })),
        );
      } catch (error) {
        toast.error("Error fetching initial data.");
      }
    };

    fetchInitialData();
  }, []);

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        date: new Date(),
        sellerName: null,
        item: null,
        oQnty: "",
        buyerName: null,
        rate: "",
        loadingQnty: "",
        location: "",
        unloadingQnty: "",
        paymentTerms: "",
        remarks: "",
      },
    ]);
  };

  const handleRemoveRow = (index) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    setRows(updatedRows);
  };

  const handleChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = value;
    setRows(updatedRows);
  };

  const handleApproveRow = (index) => {
    toast.log(`Row ${index + 1} approved`);
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="lux-card lux-gold-top p-4 sm:p-6 lg:p-8 space-y-6">
        <h2 className="font-serif text-2xl font-semibold text-lux-ink text-center mb-4">
          Add Soudabook
        </h2>

        {rows.map((row, index) => (
          <div
            key={index}
            className="grid grid-cols-1 gap-4 rounded-2xl border border-[#ece4d2] bg-lux-ivory p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <div className="col-span-1">
              <label className="mb-1 block font-serif text-sm font-medium text-lux-ink">
                Date
              </label>
              <DateSelector
                selectedDate={row.date}
                onChange={(date) => handleChange(index, "date", date)}
              />
            </div>

            <div className="col-span-1">
              <label className="mb-1 block font-serif text-sm font-medium text-lux-ink">
                Seller Name
              </label>
              <DataDropdown
                options={sellers}
                selectedOptions={row.sellerName}
                onChange={(selected) =>
                  handleChange(index, "sellerName", selected)
                }
                placeholder="Select Seller"
              />
            </div>

            <div className="col-span-1">
              <label className="mb-1 block font-serif text-sm font-medium text-lux-ink">
                Item
              </label>
              <DataDropdown
                options={items}
                selectedOptions={row.item}
                onChange={(selected) => handleChange(index, "item", selected)}
                placeholder="Select Item"
              />
            </div>

            <div className="col-span-1">
              <label className="mb-1 block font-serif text-sm font-medium text-lux-ink">
                O.Qnty
              </label>
              <DataInput
                value={row.oQnty}
                onChange={(e) => handleChange(index, "oQnty", e.target.value)}
                placeholder="O.Qnty"
              />
            </div>

            <div className="col-span-1">
              <label className="mb-1 block font-serif text-sm font-medium text-lux-ink">
                Buyer Name
              </label>
              <DataDropdown
                options={buyers}
                selectedOptions={row.buyerName}
                onChange={(selected) =>
                  handleChange(index, "buyerName", selected)
                }
                placeholder="Select Buyer"
              />
            </div>

            <div className="col-span-1">
              <label className="mb-1 block font-serif text-sm font-medium text-lux-ink">
                Rate
              </label>
              <DataInput
                value={row.rate}
                onChange={(e) => handleChange(index, "rate", e.target.value)}
                placeholder="Rate"
              />
            </div>

            <div className="col-span-1">
              <label className="mb-1 block font-serif text-sm font-medium text-lux-ink">
                Loading Qnty
              </label>
              <DataInput
                value={row.loadingQnty}
                onChange={(e) =>
                  handleChange(index, "loadingQnty", e.target.value)
                }
                placeholder="Loading Qnty"
              />
            </div>

            <div className="col-span-1">
              <label className="mb-1 block font-serif text-sm font-medium text-lux-ink">
                Location
              </label>
              <DataInput
                value={row.location}
                onChange={(e) =>
                  handleChange(index, "location", e.target.value)
                }
                placeholder="Location"
              />
            </div>

            <div className="col-span-1">
              <label className="mb-1 block font-serif text-sm font-medium text-lux-ink">
                Unloading Qnty
              </label>
              <DataInput
                value={row.unloadingQnty}
                onChange={(e) =>
                  handleChange(index, "unloadingQnty", e.target.value)
                }
                placeholder="Unloading Qnty"
              />
            </div>

            <div className="col-span-1">
              <label className="mb-1 block font-serif text-sm font-medium text-lux-ink">
                Payment Terms in days
              </label>
              <DataInput
                value={row.paymentTerms}
                onChange={(e) =>
                  handleChange(index, "paymentTerms", e.target.value)
                }
                placeholder="Payment Terms"
              />
            </div>

            <div className="col-span-1">
              <label className="mb-1 block font-serif text-sm font-medium text-lux-ink">
                Remarks
              </label>
              <DataInput
                value={row.remarks}
                onChange={(e) => handleChange(index, "remarks", e.target.value)}
                placeholder="Remarks"
              />
            </div>

            <div className="col-span-1 flex justify-center space-x-2">
              <button
                onClick={() => handleApproveRow(index)}
                className="text-lux-emerald hover:text-lux-deep"
              >
                <FaCheck size={18} />
              </button>
              <button
                onClick={() => handleRemoveRow(index)}
                className="text-rose-500 hover:text-rose-700"
              >
                <FaTrash size={18} />
              </button>
            </div>
          </div>
        ))}

        <div className="flex justify-center mt-4">
          <button
            onClick={handleAddRow}
            className="flex items-center rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-6 py-3 text-lg font-semibold text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-md transition hover:-translate-y-0.5"
          >
            <FaPlus className="mr-2" />
            Add More
          </button>
        </div>
      </div>
    </Suspense>
  );
};

export default AddSoudabook;
