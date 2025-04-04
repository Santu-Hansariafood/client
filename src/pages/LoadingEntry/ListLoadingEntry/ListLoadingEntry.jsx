import React, { lazy, useEffect, useState, useMemo } from "react";
import axios from "axios";
import { MdVisibility, MdEdit, MdDelete, MdDownload } from "react-icons/md";
import { toast } from "react-toastify";

import PrintLoadingEntry from "../PrintLoadingEntry/PrintLoadingEntry";
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));
const Tables = lazy(() => import("../../../common/Tables/Tables"));
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox")); // ✅ Import SearchBox

const ListLoadingEntry = () => {
  const [loadingEntries, setLoadingEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [sellerMap, setSellerMap] = useState({});
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [popupType, setPopupType] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [entriesRes, sellersRes] = await Promise.all([
        axios.get("https://api.hansariafood.shop/api/loading-entries"),
        axios.get("https://api.hansariafood.shop/api/sellers"),
      ]);
      const sellerMapping = Object.fromEntries(
        sellersRes.data.map((seller) => [seller._id, seller.sellerName])
      );
      setSellerMap(sellerMapping);
      setLoadingEntries(entriesRes.data);
      setFilteredEntries(entriesRes.data); // ✅ Initialize filtered data
    } catch (error) {
      toast.error("Failed to fetch data");
    }
  };

  const handleView = (entry) => {
    setSelectedEntry(entry);
    setPopupType("view");
  };

  const handleEdit = (entry) => {
    setSelectedEntry(entry);
    setPopupType("edit");
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      try {
        await axios.delete(`https://api.hansariafood.shop/api/loading-entries/${id}`);
        toast.success("Entry deleted successfully");
        fetchData();
      } catch (error) {
        toast.error("Failed to delete entry");
      }
    }
  };

  const handleDownload = async (entry) => {
    try {
      const fileUrl = await PrintLoadingEntry(entry);
      if (fileUrl) {
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = `LoadingEntry-${entry.billNumber || "document"}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Download started successfully!");
      } else {
        toast.error("Failed to generate download.");
      }
    } catch (error) {
      toast.error("Error generating download.");
    }
  };

  const headers = [
    "Loading Date",
    "Seller Name",
    "Loading Weight",
    "Lorry Number",
    "Transport",
    "Driver",
    "Phone",
    "Freight Rate",
    "Total Freight",
    "Advance",
    "Balance",
    "Bill No",
    "Date of Issue",
    "Commodity",
    "Actions",
    "Download",
  ];

  const rows = useMemo(
    () =>
      filteredEntries.map((entry) => [
        new Date(entry.loadingDate).toLocaleDateString(),
        sellerMap[entry.supplier] || "Unknown Supplier",
        entry.loadingWeight,
        entry.lorryNumber,
        entry.addedTransport,
        entry.driverName,
        entry.driverPhoneNumber,
        entry.freightRate,
        entry.totalFreight,
        entry.advance,
        entry.balance,
        entry.billNumber,
        new Date(entry.dateOfIssue).toLocaleDateString(),
        entry.commodity,
        <div className="flex justify-center gap-2">
          <button
            onClick={() => handleView(entry)}
            title="View"
            className="p-1 text-blue-500 hover:bg-blue-100 rounded"
          >
            <MdVisibility size={18} />
          </button>
          <button
            onClick={() => handleEdit(entry)}
            title="Edit"
            className="p-1 text-green-500 hover:bg-green-100 rounded"
          >
            <MdEdit size={18} />
          </button>
          <button
            onClick={() => handleDelete(entry._id)}
            title="Delete"
            className="p-1 text-red-500 hover:bg-red-100 rounded"
          >
            <MdDelete size={18} />
          </button>
        </div>,
        <button
          onClick={() => handleDownload(entry)}
          title="Download"
          className="p-1 text-purple-500 hover:bg-purple-100 rounded flex justify-center"
        >
          <MdDownload size={18} />
        </button>,
      ]),
    [filteredEntries, sellerMap]
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-center text-blue-700 mb-4">
        Loading Entries
      </h1>

      {/* ✅ Search Boxes for Seller Name & Lorry Number */}
      <div className="flex gap-4 mb-4">
        <SearchBox
          placeholder="Search by Seller Name..."
          items={loadingEntries.map((entry) => sellerMap[entry.supplier] || "Unknown Supplier")}
          onSearch={(filteredNames) => {
            if (!filteredNames.length) {
              setFilteredEntries(loadingEntries);
              return;
            }
            setFilteredEntries(
              loadingEntries.filter((entry) => filteredNames.includes(sellerMap[entry.supplier]))
            );
          }}
        />

        <SearchBox
          placeholder="Search by Lorry Number..."
          items={loadingEntries.map((entry) => entry.lorryNumber)}
          onSearch={(filteredLorryNumbers) => {
            if (!filteredLorryNumbers.length) {
              setFilteredEntries(loadingEntries);
              return;
            }
            setFilteredEntries(
              loadingEntries.filter((entry) => filteredLorryNumbers.includes(entry.lorryNumber))
            );
          }}
        />
      </div>

      <Tables headers={headers} rows={rows} />

      {selectedEntry && (
        <PopupBox
          isOpen={!!popupType}
          onClose={() => setPopupType("")}
          title={popupType === "view" ? "View Entry" : "Edit Entry"}
        >
          {popupType === "view" ? (
            <pre>{JSON.stringify(selectedEntry, null, 2)}</pre>
          ) : (
            <div>
              <p>Edit functionality can be implemented here.</p>
            </div>
          )}
        </PopupBox>
      )}
    </div>
  );
};

export default ListLoadingEntry;
