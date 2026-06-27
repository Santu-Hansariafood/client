import {
  lazy,
  useEffect,
  useState,
  useMemo,
  useCallback,
  Suspense,
} from "react";
import PropTypes from "prop-types";
import api from "../../../utils/apiClient/apiClient";
import {
  FaClipboardList,
  FaEye,
  FaPrint,
  FaCopy,
  FaExclamationTriangle,
  FaSync,
  FaFileAlt,
  FaEnvelope,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import Loading from "../../../common/Loading/Loading";
import { downloadFile } from "../../../utils/fileDownloader";

import MasterReceivingReportPDF from "./MasterReceivingReportPDF";
import { pdf } from "@react-pdf/renderer";
import { fetchAllPages } from "../../../utils/apiClient/fetchAllPages";
import { buildSaudaPdfData } from "../../../utils/saudaPdf/buildSaudaPdfData";
import logoUrl from "../../../assets/Hans.png";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const Tables = lazy(() => import("../../../common/Tables/Tables"));
const Pagination = lazy(
  () => import("../../../common/Paginations/Paginations"),
);
const SearchBox = lazy(() => import("../../../common/SearchBox/SearchBox"));
const PopupBox = lazy(() => import("../../../common/PopupBox/PopupBox"));

const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("en-GB");
};

const AttachmentBadge = ({ count }) => (
  <span
    className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 shadow-sm flex items-center gap-2 w-fit"
    role="status"
    aria-label={`${count} attachments`}
  >
    <FaFileAlt className="text-slate-400" />
    {count} {count === 1 ? "File" : "Files"}
  </span>
);

AttachmentBadge.propTypes = {
  count: PropTypes.number.isRequired,
};

const ReceivingList = () => {
  const { userRole, mobile, user } = useAuth();
  const [loadingEntries, setLoadingEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [sentFilter, setSentFilter] = useState("All");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [masterDataCache, setMasterDataCache] = useState(null);
  const [sellerCompanies, setSellerCompanies] = useState([]);
  const [selectedSellerEmail, setSelectedSellerEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const getMasterData = useCallback(async () => {
    if (masterDataCache) return masterDataCache;

    const [consigneeData, supplierData, buyerData, companyData, commodityData] =
      await Promise.all([
        fetchAllPages("/consignees", { limit: 200 }),
        fetchAllPages("/seller-company", { limit: 200 }),
        fetchAllPages("/buyers", { limit: 200 }),
        fetchAllPages("/companies", { limit: 200 }),
        fetchAllPages("/commodities", { limit: 200 }),
      ]);

    const data = {
      consigneeData,
      supplierData,
      buyerData,
      companyData,
      commodityData,
    };
    setMasterDataCache(data);
    return data;
  }, [masterDataCache]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/loading-entries/receiving", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchInput,
          sentStatus: sentFilter,
          role: userRole,
          mobile: mobile,
        },
      });

      const payload = response.data || {};
      const data = Array.isArray(payload.data) ? payload.data : [];
      setLoadingEntries(data);
      setTotalItems(Number(payload.total) || 0);
    } catch (error) {
      console.error("Error fetching receiving entries:", error);
      setError(
        "Failed to load receiving entries. Please check your connection.",
      );
      toast.error("Failed to fetch receiving entries");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    itemsPerPage,
    searchInput,
    sentFilter,
    userRole,
    mobile,
    getMasterData,
  ]);

  const fetchSellerCompanies = useCallback(async () => {
    try {
      const res = await api.get("/seller-company");
      const sellers = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setSellerCompanies(sellers);
    } catch (err) {
      console.error("Error fetching seller companies:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchSellerCompanies();
  }, [fetchData, fetchSellerCompanies]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handlePageSizeChange = useCallback((size) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  }, []);

  const handleViewDocuments = useCallback((entry) => {
    setSelectedEntry(entry);
    setShowPopup(true);
    // Auto-select first matching seller email if only one
    const matchingSellers = sellerCompanies.filter(
      (sc) =>
        entry?.supplierCompany?.toLowerCase() ===
        sc.companyName?.toLowerCase()
    );
    if (matchingSellers.length === 1) {
      setSelectedSellerEmail(matchingSellers[0].email);
    } else {
      setSelectedSellerEmail("");
    }
  }, [sellerCompanies]);

  const handleSearch = useCallback((q) => {
    setSearchInput(q);
    setCurrentPage(1);
  }, []);

  const handleToggleSentStatus = useCallback(
    async (entry) => {
      const newStatus = entry.sentStatus === "Sent" ? "Not Sent" : "Sent";
      try {
        await api.put(`/loading-entries/${entry._id}`, {
          sentStatus: newStatus,
        });
        toast.success(`Status updated to ${newStatus}`);
        fetchData();
      } catch (error) {
        console.error("Error updating status:", error);
        toast.error("Failed to update status");
      }
    },
    [fetchData],
  );

  const handleCopy = useCallback(
    async (entry) => {
      const toastId = toast.loading("Preparing details to copy...");

      let cdValue = 0;
      let gstValue = 0;
      try {
        const selfOrderRes = await api.get("/self-order", {
          params: {
            search: entry.saudaNo,
            limit: 1,
          },
        });
        const selfOrders = Array.isArray(selfOrderRes?.data?.data)
          ? selfOrderRes.data.data
          : Array.isArray(selfOrderRes?.data)
            ? selfOrderRes.data
            : [];

        const normalize = (v) =>
          String(v || "")
            .trim()
            .toLowerCase();
        const selfOrder = selfOrders.find(
          (order) => normalize(order?.saudaNo) === normalize(entry?.saudaNo),
        );
        if (selfOrder) {
          cdValue = Number(selfOrder.cd || 0);
          gstValue = Number(selfOrder.gst || 0);
        }
      } catch (e) {
        console.error("Error fetching sauda for copy:", e);
      }

      const grossAmount =
        (entry.unloadingWeight || 0) * (entry.actualRate || 0);
      const cdDeduction = grossAmount * (cdValue / 100);
      const taxableValue = grossAmount - cdDeduction;
      const gstAmount = taxableValue * (gstValue / 100);
      const finalAmount = taxableValue + gstAmount;

      const documents = [];
      if (entry.documents?.kantaSlip)
        documents.push(`Kanta Slip: ${entry.documents.kantaSlip}`);
      if (entry.documents?.unloadingChallan)
        documents.push(
          `Unloading Challan: ${entry.documents.unloadingChallan}`,
        );
      if (entry.documents?.partyBillCopy)
        documents.push(`Party Bill Copy: ${entry.documents.partyBillCopy}`);

      const textToCopy = `*RECEIVING ENTRY DETAILS*

*Sauda No:* _${entry.saudaNo || "N/A"}_
*Invoice No:* _${entry.billNumber || "N/A"}_
*Lorry No:* _${(entry.lorryNumber || "N/A").toUpperCase()}_
*Loading Weight:* _${entry.loadingWeight || 0}_ *Tons*
*Unloading Weight:* _${entry.unloadingWeight || 0}_ *Tons*
*Loading Date:* _${formatDate(entry.loadingDate)}_
*Unloading Date:* _${formatDate(entry.unloadingDate)}_
*Rate:* _Rs. ${entry.actualRate || 0}_
*Gross Amount:* _Rs. ${grossAmount.toFixed(2)}_
${cdValue > 0 ? `*CD (${cdValue}%):* _ Rs. - ${cdDeduction.toFixed(2)}_` : ""}
${cdValue > 0 ? `*Taxable Value:* _Rs. ${taxableValue.toFixed(2)}_` : ""}
${gstValue > 0 ? `*GST (${gstValue}%):* _+ Rs. ${gstAmount.toFixed(2)}_` : ""}
*Final Amount:* _Rs. ${finalAmount.toFixed(2)}_
*Seller Company:* _${entry.supplierCompany || "N/A"}_
*Buyer Company:* _${entry.buyerCompany || "N/A"}_

*DOCUMENTS:*

${
  documents.length > 0
    ? documents.map((doc) => `• _${doc}_`).join("\n")
    : "_No documents attached_"
}

_*Thanks and Regards,*_
_*Purchase Team*_
_*Hansaria Food Private Limited*_`;

      navigator.clipboard
        .writeText(textToCopy)
        .then(async () => {
          toast.update(toastId, {
            render: "Entry details copied to clipboard!",
            type: "success",
            isLoading: false,
            autoClose: 3000,
          });
          if (entry.sentStatus !== "Sent") {
            try {
              await api.put(`/loading-entries/${entry._id}`, {
                sentStatus: "Sent",
              });
              fetchData();
            } catch (err) {
              console.error("Auto-status update failed:", err);
            }
          }
        })
        .catch((err) => {
          console.error("Failed to copy:", err);
          toast.update(toastId, {
            render: "Failed to copy details",
            type: "error",
            isLoading: false,
            autoClose: 3000,
          });
        });
    },
    [fetchData],
  );

  const handlePrint = async () => {
    if (!selectedEntry) return;

    const toastId = toast.loading("Generating comprehensive entry report...");

    try {
      const {
        consigneeData,
        supplierData,
        buyerData,
        companyData,
        commodityData,
      } = await getMasterData();

      let cdValue = 0;
      let gstValue = 0;
      try {
        const selfOrderRes = await api.get("/self-order", {
          params: {
            search: selectedEntry.saudaNo,
            limit: 1,
          },
        });
        const selfOrders = Array.isArray(selfOrderRes?.data?.data)
          ? selfOrderRes.data.data
          : Array.isArray(selfOrderRes?.data)
          ? selfOrderRes.data
          : [];

        const normalize = (v) =>
          String(v || "")
            .trim()
            .toLowerCase();
        const selfOrder = selfOrders.find(
          (order) =>
            normalize(order?.saudaNo) === normalize(selectedEntry?.saudaNo),
        );
        if (selfOrder) {
          cdValue = Number(selfOrder.cd || 0);
          gstValue = Number(selfOrder.gst || 0);
        }
      } catch (e) {
        console.error("Error fetching self-order for CD:", e);
      }

      const pdfData = buildSaudaPdfData({
        item: { ...selectedEntry, cd: cdValue, gst: gstValue },
        consigneeData,
        supplierData,
        buyerData,
        companyData,
        commodityData,
        getConsigneeDisplay: (row) => {
          const consignee = row?.consignee;
          if (typeof consignee === "object" && consignee?.name)
            return consignee.name;
          if (typeof consignee === "object" && consignee?.label)
            return consignee.label;
          return String(consignee || "N/A");
        },
      });

      const qrData = JSON.stringify({
        saudaNo: selectedEntry.saudaNo,
        billNo: selectedEntry.billNumber,
        lorry: selectedEntry.lorryNumber,
        weight: selectedEntry.loadingWeight,
      });
      let qrCodeUrl = null;
      try {
        qrCodeUrl = await QRCode.toDataURL(qrData);
      } catch (e) {
        console.error("QR Error", e);
      }

      const preparedEntry = { ...pdfData, qrCodeUrl };

      const document = (
        <MasterReceivingReportPDF
          entries={[preparedEntry]}
          logoUrl={logoUrl?.default || logoUrl}
        />
      );

      const blob = await pdf(document).toBlob();

      let fileName = `receiving_report_${selectedEntry.saudaNo || "document"}`;
      if (selectedEntry.billNumber && selectedEntry.billNumber !== "0") {
        fileName += `_bill_${selectedEntry.billNumber}`;
      }
      fileName += ".pdf";

      downloadFile(blob, fileName);
      toast.update(toastId, {
        render: "Report downloaded successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.update(toastId, {
        render: "Failed to generate comprehensive report",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleSendEmail = async () => {
    if (!selectedEntry || !selectedSellerEmail) {
      toast.error("Please select a seller email");
      return;
    }

    const toastId = toast.loading("Preparing and sending report...");
    setSendingEmail(true);

    try {
      // First generate the PDF blob
      const {
        consigneeData,
        supplierData,
        buyerData,
        companyData,
        commodityData,
      } = await getMasterData();

      let cdValue = 0;
      let gstValue = 0;
      try {
        const selfOrderRes = await api.get("/self-order", {
          params: {
            search: selectedEntry.saudaNo,
            limit: 1,
          },
        });
        const selfOrders = Array.isArray(selfOrderRes?.data?.data)
          ? selfOrderRes.data.data
          : Array.isArray(selfOrderRes?.data)
          ? selfOrderRes.data
          : [];

        const normalize = (v) =>
          String(v || "")
            .trim()
            .toLowerCase();
        const selfOrder = selfOrders.find(
          (order) =>
            normalize(order?.saudaNo) === normalize(selectedEntry?.saudaNo),
        );
        if (selfOrder) {
          cdValue = Number(selfOrder.cd || 0);
          let gstValue = Number(selfOrder.gst || 0);
        }
      } catch (e) {
        console.error("Error fetching self-order for CD:", e);
      }

      const pdfData = buildSaudaPdfData({
        item: { ...selectedEntry, cd: cdValue, gst: gstValue },
        consigneeData,
        supplierData,
        buyerData,
        companyData,
        commodityData,
        getConsigneeDisplay: (row) => {
          const consignee = row?.consignee;
          if (typeof consignee === "object" && consignee?.name)
            return consignee.name;
          if (typeof consignee === "object" && consignee?.label)
            return consignee.label;
          return String(consignee || "N/A");
        },
      });

      const qrData = JSON.stringify({
        saudaNo: selectedEntry.saudaNo,
        billNo: selectedEntry.billNumber,
        lorry: selectedEntry.lorryNumber,
        weight: selectedEntry.loadingWeight,
      });
      let qrCodeUrl = null;
      try {
        qrCodeUrl = await QRCode.toDataURL(qrData);
      } catch (e) {
        console.error("QR Error", e);
      }

      const preparedEntry = { ...pdfData, qrCodeUrl };

      const document = (
        <MasterReceivingReportPDF
          entries={[preparedEntry]}
          logoUrl={logoUrl?.default || logoUrl}
        />
      );

      const blob = await pdf(document).toBlob();
      
      // Convert blob to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result.split(",")[1];
          resolve(base64data);
        };
        reader.onerror = reject;
      });

      // Get sent by info from auth
      let sentByName = user?.name || "";
      let sentByMobile = mobile || "";

      await api.post("/email/send-receiving-report", {
        pdf: base64,
        sellerEmail: selectedSellerEmail,
        saudaNo: selectedEntry.saudaNo,
        billNo: selectedEntry.billNumber,
        claimParameters: selectedEntry.qualityClaims || [],
        sentByMobile,
        sentByName,
      });

      toast.update(toastId, {
        render: "Report sent successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      // Update sent status
      try {
        await api.put(`/loading-entries/${selectedEntry._id}`, {
          sentStatus: "Sent",
        });
        fetchData();
      } catch (err) {
        console.error("Error updating sent status:", err);
      }

    } catch (error) {
      console.error("Error sending email:", error);
      toast.update(toastId, {
        render: "Failed to send report",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDownloadPDFReport = useCallback(() => {
    if (loadingEntries.length === 0) return;

    const doc = new jsPDF("landscape");
    const tableColumn = [
      "Sauda No",
      "Loading No",
      "Lorry No",
      "Loading Wt",
      "Unloading Wt",
      "Loading Date",
      "Unloading Date",
      "Rate",
      "Amount",
      "Seller Co",
      "Buyer Co",
    ];

    const tableRows = loadingEntries.map((entry) => [
      entry.saudaNo || "N/A",
      entry.billNumber || "N/A",
      (entry.lorryNumber || "N/A").toUpperCase(),
      `${entry.loadingWeight || 0} T`,
      `${entry.unloadingWeight || 0} T`,
      formatDate(entry.loadingDate),
      formatDate(entry.unloadingDate),
      `Rs. ${entry.actualRate || 0}`,
      `Rs. ${((entry.unloadingWeight || 0) * (entry.actualRate || 0)).toFixed(2)}`,
      entry.supplierCompany || "N/A",
      entry.buyerCompany || "N/A",
    ]);

    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59);
    doc.text("RECEIVING ENTRIES REPORT", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString("en-GB")}`, 14, 30);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 2 },
    });

    doc.save(`ReceivingEntries_${new Date().toISOString().split("T")[0]}.pdf`);
  }, [loadingEntries]);

  const handlePrintAllWithDocuments = useCallback(async () => {
    if (loadingEntries.length === 0) return;

    const toastId = toast.loading("Generating Master Report with documents...");

    try {
      const {
        consigneeData,
        supplierData,
        buyerData,
        companyData,
        commodityData,
      } = await getMasterData();

      const preparedEntries = await Promise.all(
        loadingEntries.map(async (entry) => {
          let cdValue = 0;
      let gstValue = 0;
          try {
            const selfOrderRes = await api.get("/self-order", {
              params: {
                search: entry.saudaNo,
                limit: 1,
              },
            });
            const selfOrders = Array.isArray(selfOrderRes?.data?.data)
              ? selfOrderRes.data.data
              : Array.isArray(selfOrderRes?.data)
                ? selfOrderRes.data
                : [];

            const normalize = (v) =>
              String(v || "")
                .trim()
                .toLowerCase();
            const selfOrder = selfOrders.find(
              (order) =>
                normalize(order?.saudaNo) === normalize(entry?.saudaNo),
            );
            if (selfOrder) {
              cdValue = Number(selfOrder.cd || 0);
              gstValue = Number(selfOrder.gst || 0);
            }
          } catch (e) {
            console.error("Error fetching self-order for CD/GST:", e);
          }

          const pdfData = buildSaudaPdfData({
            item: { ...entry, cd: cdValue, gst: gstValue },
            consigneeData,
            supplierData,
            buyerData,
            companyData,
            commodityData,
            getConsigneeDisplay: (row) => {
              const consignee = row?.consignee;
              if (typeof consignee === "object" && consignee?.name)
                return consignee.name;
              if (typeof consignee === "object" && consignee?.label)
                return consignee.label;
              return String(consignee || "N/A");
            },
          });

          const qrData = JSON.stringify({
            saudaNo: entry.saudaNo,
            billNo: entry.billNumber,
            lorry: entry.lorryNumber,
            weight: entry.loadingWeight,
          });
          let qrCodeUrl = null;
          try {
            qrCodeUrl = await QRCode.toDataURL(qrData);
          } catch (e) {
            console.error("QR Error", e);
          }

          return { ...pdfData, qrCodeUrl };
        }),
      );

      const document = (
        <MasterReceivingReportPDF
          entries={preparedEntries}
          logoUrl={logoUrl?.default || logoUrl}
        />
      );

      const blob = await pdf(document).toBlob();
      downloadFile(
        blob,
        `Master_Receiving_Report_${new Date().toISOString().split("T")[0]}.pdf`,
      );

      toast.update(toastId, {
        render: "Master Report downloaded successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error generating master report:", error);
      toast.update(toastId, {
        render: "Failed to generate Master Report",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  }, [loadingEntries]);

  const headers = [
    "Sauda No",
    "Loading No",
    "Lorry No",
    "Loading Wt",
    "Unloading Wt",
    "Loading Date",
    "Unloading Date",
    "Rate",
    "Amount",
    "Seller Co",
    "Buyer Co",
    "Status",
    "Attachment",
    "Actions",
  ];

  const rows = useMemo(
    () =>
      loadingEntries.map((entry) => {
        const docs = entry.documents || {};
        const attachmentCount = [
          docs.kantaSlip,
          docs.unloadingChallan,
          docs.partyBillCopy,
          entry.documentUrl,
        ].filter((url) => typeof url === "string" && url.trim() !== "").length;

        return [
          entry.saudaNo || "N/A",
          entry.billNumber || "N/A",
          <span
            key={`lorry-${entry._id}`}
            className="font-bold uppercase text-slate-600"
          >
            {entry.lorryNumber || "N/A"}
          </span>,
          `${entry.loadingWeight || 0} T`,
          `${entry.unloadingWeight || 0} T`,
          formatDate(entry.loadingDate),
          formatDate(entry.unloadingDate),
          `Rs. ${entry.actualRate || 0}`,
          `Rs. ${((entry.unloadingWeight || 0) * (entry.actualRate || 0)).toFixed(2)}`,
          entry.supplierCompany || "N/A",
          entry.buyerCompany || "N/A",
          <button
            key={`status-${entry._id}`}
            onClick={() => {
              if (userRole === "Admin" || userRole === "Employee") {
                handleToggleSentStatus(entry);
              }
            }}
            disabled={userRole !== "Admin" && userRole !== "Employee"}
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
              entry.sentStatus === "Sent"
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : "bg-amber-50 text-amber-600 border-amber-100"
            } ${userRole !== "Admin" && userRole !== "Employee" ? "cursor-default opacity-80" : "hover:scale-105 active:scale-95"}`}
          >
            {entry.sentStatus || "Not Sent"}
          </button>,
          <AttachmentBadge
            key={`attach-${entry._id}`}
            count={attachmentCount}
          />,
          <div key={`actions-${entry._id}`} className="flex items-center gap-2">
            <button
              onClick={() => handleViewDocuments(entry)}
              className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100 focus:ring-2 focus:ring-blue-500/20"
              title="View Documents"
              aria-label="View Documents"
            >
              <FaEye size={16} />
            </button>
            <button
              onClick={() => handleCopy(entry)}
              className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100 focus:ring-2 focus:ring-emerald-500/20"
              title="Copy Details"
              aria-label="Copy Details"
            >
              <FaCopy size={16} />
            </button>
          </div>,
        ];
      }),
    [loadingEntries, handleCopy, handleViewDocuments, handleToggleSentStatus],
  );

  if (error) {
    return (
      <AdminPageShell noContentCard>
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center space-y-4 p-8 bg-white rounded-3xl border border-red-100 shadow-xl max-w-md">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <FaExclamationTriangle size={32} />
            </div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
              Sync Failure
            </h2>
            <p className="text-slate-500 text-sm font-semibold">{error}</p>
            <button
              onClick={fetchData}
              className="px-8 py-3 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 mx-auto shadow-lg shadow-red-200 hover:bg-red-700 transition-all"
            >
              <FaSync />
              Retry Fetch
            </button>
          </div>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Receiving Entries"
        subtitle="Manage unloading data & document verification"
        icon={FaClipboardList}
        noContentCard
      >
        <div className="max-w-[1700px] mx-auto space-y-8 p-4 sm:p-6 lg:p-10">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110" />
            <div className="relative space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200/50 w-fit backdrop-blur-sm">
                  {["All", "Sent", "Not Sent"].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setSentFilter(status);
                        setCurrentPage(1);
                      }}
                      className={`relative px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
                        sentFilter === status
                          ? "bg-white text-blue-600 shadow-md shadow-blue-100 ring-1 ring-blue-50"
                          : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handlePrintAllWithDocuments}
                    disabled={loadingEntries.length === 0}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center gap-2 text-xs uppercase tracking-widest"
                  >
                    <FaFileAlt size={14} />
                    Master Report
                  </button>
                  <button
                    onClick={handleDownloadPDFReport}
                    disabled={loadingEntries.length === 0}
                    className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 flex items-center gap-2 text-xs uppercase tracking-widest"
                  >
                    <FaPrint size={14} />
                    Table Report
                  </button>
                  <span className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100 flex items-center">
                    Live Database
                  </span>
                </div>
              </div>
              <div className="relative group/search">
                <SearchBox
                  placeholder="Query by Sauda No, Lorry No, or Seller Company..."
                  items={[]}
                  returnQuery={true}
                  onSearch={handleSearch}
                  value={searchInput}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-4 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[500px] relative">
            {loading && <Loading />}

            <Tables headers={headers} rows={rows} />

            {totalItems > 0 && (
              <div className="mt-10 flex justify-center pb-6">
                <Pagination
                  currentPage={currentPage}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            )}

            {!loading && rows.length === 0 && (
              <div className="py-20 text-center">
                <FaClipboardList className="text-6xl text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest">
                  No entries found
                </p>
              </div>
            )}
          </div>

          {showPopup && selectedEntry && (
            <PopupBox
              isOpen={showPopup}
              onClose={() => {
                setShowPopup(false);
                setSelectedEntry(null);
              }}
              title="Document Attachments & Quality Reports"
              maxWidth="max-w-7xl"
              headerActions={
                <button
                  onClick={handlePrint}
                  title="Print Report"
                  aria-label="Print Report"
                  className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 text-white hover:bg-black transition-all duration-300 shadow-xl shadow-slate-200 border border-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-400/20 active:scale-95 group"
                >
                  <FaPrint className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              }
            >
              <div className="p-4 sm:p-8 space-y-10">
                {(userRole === "Admin" || userRole === "Employee") && (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-[2rem] p-6 shadow-sm">
                    <h4 className="text-base font-black text-emerald-900 mb-4 flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Send Report to Seller
                    </h4>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <select
                        value={selectedSellerEmail}
                        onChange={(e) => setSelectedSellerEmail(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl border border-emerald-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent font-medium"
                      >
                        <option value="">Select Seller Email</option>
                        {sellerCompanies
                          .filter(
                            (sc) =>
                              selectedEntry?.supplierCompany?.toLowerCase() ===
                              sc.companyName?.toLowerCase()
                          )
                          .length > 0
                          ? sellerCompanies
                              .filter(
                                (sc) =>
                                  selectedEntry?.supplierCompany?.toLowerCase() ===
                                  sc.companyName?.toLowerCase()
                              )
                              .map((sc) => (
                                <option key={sc._id} value={sc.email}>
                                  {sc.companyName} - {sc.email}
                                </option>
                              ))
                          : sellerCompanies.map((sc) => (
                              <option key={sc._id} value={sc.email}>
                                {sc.companyName} - {sc.email}
                              </option>
                            ))}
                      </select>
                      <button
                        onClick={handleSendEmail}
                        disabled={!selectedSellerEmail || sendingEmail}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200"
                      >
                        <FaEnvelope size={18} />
                        {sendingEmail ? "Sending..." : "Send Report"}
                      </button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {[
                    { key: "kantaSlip", label: "Kanta Slip", color: "blue" },
                    {
                      key: "unloadingChallan",
                      label: "Unloading Challan",
                      color: "indigo",
                    },
                    {
                      key: "partyBillCopy",
                      label: "Party Bill Copy",
                      color: "emerald",
                    },
                  ].map((docType) => {
                    const url = selectedEntry.documents?.[docType.key];
                    if (!url) return null;

                    return (
                      <div key={docType.key} className="space-y-4 group">
                        <div className="flex items-center justify-between">
                          <h4
                            className={`text-xs font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-3`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full bg-${docType.color}-500 animate-pulse`}
                            />
                            {docType.label}
                          </h4>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded bg-slate-50">
                            Verified
                          </span>
                        </div>

                        <div className="relative rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm group-hover:shadow-xl transition-all duration-500 bg-slate-50 flex items-center justify-center min-h-[300px]">
                          {url.endsWith(".pdf") ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group/btn flex flex-col items-center gap-4 p-10 text-center"
                            >
                              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shadow-lg group-hover/btn:scale-110 transition-transform">
                                <FaFileAlt size={32} />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1">
                                  View PDF Document
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  Opens in new tab
                                </p>
                              </div>
                            </a>
                          ) : (
                            <img
                              src={url}
                              alt={docType.label}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quality Claims Section */}
                {selectedEntry.qualityClaims &&
                  selectedEntry.qualityClaims.length > 0 && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-[2rem] p-6 shadow-sm">
                      <h4 className="text-base font-black text-indigo-900 mb-6 flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        Quality Parameters & Claims
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-indigo-100/50 border border-indigo-200 rounded-t-2xl">
                              <th className="px-4 py-3 font-bold text-indigo-800 text-left rounded-tl-2xl">
                                Quality Parameter
                              </th>
                              <th className="px-4 py-3 font-bold text-indigo-800 text-left">
                                Standard Value
                              </th>
                              <th className="px-4 py-3 font-bold text-indigo-800 text-left">
                                Actual Value
                              </th>
                              <th className="px-4 py-3 font-bold text-indigo-800 text-left">
                                Difference
                              </th>
                              <th className="px-4 py-3 font-bold text-indigo-800 text-left">
                                Claim Amount
                              </th>
                              <th className="px-4 py-3 font-bold text-indigo-800 text-left rounded-tr-2xl">
                                Notes
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedEntry.qualityClaims.map((claim, index) => {
                              const standard = Number(claim.standardValue || 0);
                              const actual = Number(claim.actualValue || 0);
                              const difference = actual - standard;

                              return (
                                <tr
                                  key={index}
                                  className="border border-indigo-100 bg-white hover:bg-indigo-50/50 transition-colors"
                                >
                                  <td className="px-4 py-3 font-semibold text-slate-700">
                                    {claim.parameterName || "-"}
                                  </td>
                                  <td className="px-4 py-3 text-slate-600 font-mono">
                                    {standard.toFixed(2)}%
                                  </td>
                                  <td className="px-4 py-3 text-slate-800 font-bold">
                                    {actual.toFixed(2)}%
                                  </td>
                                  <td
                                    className={`px-4 py-3 font-mono font-bold ${difference >= 0 ? "text-red-600" : "text-green-600"}`}
                                  >
                                    {difference >= 0 ? "+" : ""}
                                    {difference.toFixed(2)}%
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="font-bold text-indigo-700">
                                      ₹{" "}
                                      {Number(claim.claimAmount || 0).toFixed(
                                        2,
                                      )}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-slate-600 italic">
                                    {claim.notes || "-"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                {/* Bill & Payable Calculation Section */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-[2rem] p-6 shadow-sm">
                  <h4 className="text-base font-black text-emerald-900 mb-6 flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Bill & Payable Calculation
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-100">
                        <span className="font-semibold text-slate-700">
                          Total Bill Value
                        </span>
                        <span className="text-lg font-black text-emerald-700">
                          ₹{" "}
                          {(
                            (selectedEntry.unloadingWeight || 0) *
                            (selectedEntry.actualRate || 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                      {selectedEntry.qualityClaims &&
                        selectedEntry.qualityClaims.length > 0 && (
                          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-amber-100">
                            <span className="font-semibold text-slate-700">
                              Less Total Quality Claim
                            </span>
                            <span className="text-lg font-bold text-amber-600">
                              - ₹{" "}
                              {selectedEntry.qualityClaims
                                .reduce(
                                  (sum, c) =>
                                    sum + (Number(c.claimAmount) || 0),
                                  0,
                                )
                                .toFixed(2)}
                            </span>
                          </div>
                        )}
                      {selectedEntry.secondClaim &&
                        Number(selectedEntry.secondClaim) > 0 && (
                          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-purple-100">
                            <span className="font-semibold text-slate-700">
                              Less Second Claim
                            </span>
                            <span className="text-lg font-bold text-purple-600">
                              - ₹ {Number(selectedEntry.secondClaim).toFixed(2)}
                            </span>
                          </div>
                        )}
                      {selectedEntry.otherCharges &&
                        Number(selectedEntry.otherCharges) > 0 && (
                          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-teal-100">
                            <span className="font-semibold text-slate-700">
                              Less Other Charges
                            </span>
                            <span className="text-lg font-bold text-teal-600">
                              - ₹{" "}
                              {Number(selectedEntry.otherCharges).toFixed(2)}
                            </span>
                          </div>
                        )}
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-orange-100">
                        <span className="font-semibold text-slate-700">
                          Less Bank Charges
                        </span>
                        <span className="text-lg font-bold text-orange-600">
                          - ₹{" "}
                          {Number(selectedEntry.bankCharges || 200).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 shadow-lg w-full">
                        <span className="text-base font-bold text-white block mb-2">
                          Payable Amount
                        </span>
                        <span className="text-3xl font-black text-white">
                          ₹{" "}
                          {(() => {
                            const totalBill =
                              (selectedEntry.unloadingWeight || 0) *
                              (selectedEntry.actualRate || 0);
                            const qualityClaims =
                              selectedEntry.qualityClaims?.reduce(
                                (sum, c) => sum + (Number(c.claimAmount) || 0),
                                0,
                              ) || 0;
                            const secondClaim = Number(
                              selectedEntry.secondClaim || 0,
                            );
                            const otherCharges = Number(
                              selectedEntry.otherCharges || 0,
                            );
                            const bankCharges = Number(
                              selectedEntry.bankCharges || 200,
                            );
                            return (
                              totalBill -
                              qualityClaims -
                              secondClaim -
                              otherCharges -
                              bankCharges
                            ).toFixed(2);
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {selectedEntry.generalRemarks && (
                    <div className="mt-4 p-3 bg-white rounded-xl border border-slate-100">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-1">
                        Remarks
                      </span>
                      <p className="text-slate-700">
                        {selectedEntry.generalRemarks}
                      </p>
                    </div>
                  )}
                </div>

                {Object.values(selectedEntry.documents || {}).every(
                  (v) => !v,
                ) &&
                  !selectedEntry.qualityClaims?.length && (
                    <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                      <FaClipboardList className="text-6xl text-slate-200 mx-auto mb-6" />
                      <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
                        Zero artifacts detected
                      </p>
                    </div>
                  )}
              </div>
            </PopupBox>
          )}
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default ReceivingList;
