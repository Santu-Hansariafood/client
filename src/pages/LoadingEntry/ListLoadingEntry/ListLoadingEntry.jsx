import React, { useEffect, useState } from "react";
import axios from "axios";
import Tables from "../../../common/Tables/Tables";
import { MdVisibility, MdEdit, MdDelete, MdDownload } from "react-icons/md";
import PrintLoadingEntry from "../PrintLoadingEntry/PrintLoadingEntry";
import { toast } from "react-toastify";

const ListLoadingEntry = () => {
  const [loadingEntries, setLoadingEntries] = useState([]);
  const [sellerMap, setSellerMap] = useState({});

  useEffect(() => {
    // Fetch loading entries
    axios
      .get("http://localhost:5000/api/loading-entries")
      .then((response) => setLoadingEntries(response.data))
      .catch(() => toast.error("Failed to fetch loading entries"));

    // Fetch sellers and create a map of seller ID to seller name
    axios
      .get("http://localhost:5000/api/sellers")
      .then((response) => {
        const map = {};
        response.data.forEach((seller) => {
          map[seller._id] = seller.sellerName;
        });
        setSellerMap(map);
      })
      .catch(() => toast.error("Failed to fetch sellers"));
  }, []);

  const handleView = (entry) => {
    console.log("View entry:", entry);
  };

  const handleEdit = (id) => {
    console.log("Edit entry:", id);
  };

  const handleDelete = (id) => {
    console.log("Delete entry:", id);
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
      console.error(error);
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

  const rows = loadingEntries.map((entry) => [
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
        onClick={() => handleEdit(entry._id)}
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
  ]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-center text-blue-700 mb-4">
        Loading Entries
      </h1>
      <Tables headers={headers} rows={rows} />
    </div>
  );
};

export default ListLoadingEntry;
