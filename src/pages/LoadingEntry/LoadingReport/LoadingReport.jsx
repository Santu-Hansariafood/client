import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  lazy,
  Suspense,
} from "react";
import { toast } from "react-toastify";
import {
  FaFilePdf,
  FaCalendarAlt,
  FaTruckLoading,
  FaHistory,
  FaBoxOpen,
} from "react-icons/fa";
import api from "../../../utils/apiClient/apiClient";
import Loading from "../../../common/Loading/Loading";
import AdminPageShell from "../../../common/AdminPageShell/AdminPageShell";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logoUrl from "../../../assets/Hans.png";

const DateSelector = lazy(
  () => import("../../../common/DateSelector/DateSelector"),
);
const Tables = lazy(() => import("../../../common/Tables/Tables"));
const DataDropdown = lazy(
  () => import("../../../common/DataDropdown/DataDropdown"),
);
const Pagination = lazy(
  () => import("../../../common/Paginations/Paginations"),
);

const LoadingReport = () => {
  const [loadingEntries, setLoadingEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCommodity, setSelectedCommodity] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const fetchLoadingEntries = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = selectedDate
        ? selectedDate.toISOString().split("T")[0]
        : "";
      const params = {
        date: dateStr,
        commodity: selectedCommodity?.value || "",
        page: currentPage,
        limit: itemsPerPage,
      };

      const response = await api.get("/loading-entries", { params });
      const data = response.data?.data || response.data || [];
      const total = response.data?.total || data.length;

      setLoadingEntries(data);
      setTotalItems(total);
    } catch (error) {
      console.error("Failed to fetch loading entries", error);
      toast.error("Failed to load loading records");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedCommodity, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchLoadingEntries();
  }, [fetchLoadingEntries]);

  const commodityOptions = useMemo(() => {
    const commodities = Array.from(
      new Set(loadingEntries.map((e) => e.commodity).filter(Boolean)),
    );
    return commodities.map((c) => ({ value: c, label: c }));
  }, [loadingEntries]);

  const summaryData = useMemo(() => {
    const totalWeight = loadingEntries.reduce(
      (sum, e) => sum + (Number(e.loadingWeight) || 0),
      0,
    );
    const totalBags = loadingEntries.reduce(
      (sum, e) => sum + (Number(e.bags) || 0),
      0,
    );
    const distinctLorry = new Set(loadingEntries.map((e) => e.lorryNumber))
      .size;

    return {
      totalWeight,
      totalBags,
      totalEntries: loadingEntries.length,
      distinctLorry,
    };
  }, [loadingEntries]);

  const headers = useMemo(
    () => [
      "Sl No",
      "Time",
      "Sauda No",
      "Lorry No",
      "Commodity",
      "Weight (Tons)",
      "Bags",
      "Consignee",
      "Supplier",
      "Entered By",
    ],
    [],
  );

  const rows = loadingEntries.map((entry, index) => [
    (currentPage - 1) * itemsPerPage + index + 1,
    new Date(entry.createdAt).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    entry.saudaNo,
    entry.lorryNumber,
    <span
      key={`comm-${index}`}
      className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold border border-blue-100 uppercase"
    >
      {entry.commodity}
    </span>,
    <span key={`weight-${index}`} className="font-bold text-emerald-600">
      {Number(entry.loadingWeight || 0).toFixed(2)}
    </span>,
    entry.bags || "N/A",
    <div
      key={`con-${index}`}
      className="max-w-[150px] truncate text-xs font-medium"
    >
      {entry.consignee}
    </div>,
    <div
      key={`sup-${index}`}
      className="max-w-[150px] truncate text-xs text-slate-500 italic"
    >
      {entry.supplierCompany}
    </div>,
    <div key={`entered-${index}`} className="flex flex-col text-[10px]">
      <span className="font-bold text-slate-700">
        {entry.creatorName || "Admin"}
      </span>
      <span className="text-slate-400 uppercase">
        {entry.entryByRole || "Admin"}
      </span>
    </div>,
  ]);

  const downloadPDF = async () => {
    let toastId;
    try {
      setLoading(true);
      toastId = toast.loading("Generating PDF report...");

      const dateStr = selectedDate
        ? selectedDate.toISOString().split("T")[0]
        : "";
      const params = {
        date: dateStr,
        commodity: selectedCommodity?.value || "",
        limit: 1000,
      };

      const response = await api.get("/loading-entries", { params });
      const allEntries = response.data?.data || response.data || [];

      if (allEntries.length === 0) {
        toast.dismiss(toastId);
        toast.info("No records found for the selected date.");
        return;
      }

      const doc = new jsPDF("landscape");
      const totalPagesExp = "{total_pages_count_string}";
      const displayDate = selectedDate
        ? selectedDate.toLocaleDateString("en-IN")
        : "All Dates";

      try {
        doc.addImage(logoUrl, "PNG", 250, 5, 30, 30);
      } catch (err) {
        console.warn("Could not add logo to PDF:", err);
      }

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(5, 120, 90);

      doc.text("LOADING PERFORMANCE REPORT", pageWidth / 2, 18, {
        align: "center",
      });

      doc.setDrawColor(5, 120, 90);
      doc.setLineWidth(0.6);
      doc.line(70, 22, 227, 22);

      doc.setFontSize(10);
      doc.setTextColor(100);

      doc.text(`Report Date: ${displayDate}`, 14, 30);
      doc.text(`Generated On: ${new Date().toLocaleString("en-IN")}`, 14, 35);

      const fullWeight = allEntries.reduce(
        (sum, e) => sum + (Number(e.loadingWeight) || 0),
        0,
      );

      const fullBags = allEntries.reduce(
        (sum, e) => sum + (Number(e.bags) || 0),
        0,
      );

      const fullLorry = new Set(allEntries.map((e) => e.lorryNumber)).size;

      doc.setDrawColor(220);
      doc.setFillColor(245, 248, 250);

      doc.roundedRect(14, 42, 268, 24, 3, 3, "FD");

      doc.line(81, 42, 81, 66);
      doc.line(148, 42, 148, 66);
      doc.line(215, 42, 215, 66);

      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.setFont("helvetica", "bold");

      doc.text("TOTAL WEIGHT", 47, 50, { align: "center" });
      doc.text("TOTAL BAGS", 114, 50, { align: "center" });
      doc.text("TOTAL VEHICLES", 181, 50, { align: "center" });
      doc.text("TOTAL ENTRIES", 245, 50, { align: "center" });

      doc.setFontSize(16);
      doc.setTextColor(0);

      doc.text(`${fullWeight.toFixed(2)} TONS`, 47, 60, {
        align: "center",
      });

      doc.text(`${fullBags}`, 114, 60, {
        align: "center",
      });

      doc.text(`${fullLorry}`, 181, 60, {
        align: "center",
      });

      doc.text(`${allEntries.length}`, 245, 60, {
        align: "center",
      });
      const tableColumn = [
        "Sl No",
        "Time",
        "Sauda No",
        "Lorry No",
        "Commodity",
        "Weight (T)",
        "Bags",
        "Consignee",
        "Supplier",
        "Entered By",
      ];
      const tableRows = allEntries.map((entry, index) => [
        index + 1,
        new Date(entry.createdAt).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        entry.saudaNo,
        entry.lorryNumber,
        entry.commodity,
        Number(entry.loadingWeight || 0).toFixed(2),
        entry.bags || "-",
        entry.consignee,
        entry.supplierCompany,
        `${entry.creatorName || "Admin"} (${entry.entryByRole || "Admin"})`,
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 75,
        theme: "grid",
        headStyles: {
          fillColor: [5, 150, 105],
          textColor: 255,
          fontSize: 9,
          halign: "center",
        },
        styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak" },
        columnStyles: {
          0: { halign: "center", cellWidth: 15 },
          5: { halign: "right", fontStyle: "bold" },
          6: { halign: "center" },
        },
        didDrawPage: () => {
          doc.setDrawColor(180);
          doc.setLineWidth(0.5);

          doc.line(14, pageHeight - 12, 282, pageHeight - 12);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(120);

          doc.text(
            "Hansaria Food Private Limited | Internal Logistics Monitoring Report",
            14,
            pageHeight - 6,
          );

          let str = "Page " + doc.internal.getNumberOfPages();

          if (typeof doc.putTotalPages === "function") {
            str = str + " of " + totalPagesExp;
          }

          doc.text(str, pageWidth / 2, pageHeight - 6, {
            align: "center",
          });

          doc.text(
            `Generated on ${new Date().toLocaleString("en-IN")}`,
            282,
            pageHeight - 6,
            {
              align: "right",
            },
          );
        },
      });

      let finalY = doc.lastAutoTable.finalY || 180;

      if (finalY + 55 > pageHeight) {
        doc.addPage();
        finalY = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30);

      doc.text("Authorized Signatory", 220, finalY + 18);

      doc.setDrawColor(120);
      doc.line(215, finalY + 20, 280, finalY + 20);

      doc.setFontSize(11);
      doc.text("Hansaria Food Private Limited", 220, finalY + 28);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Purchase & Logistics Department", 220, finalY + 34);

      doc.setDrawColor(220);
      doc.setFillColor(248, 249, 250);

      doc.roundedRect(14, finalY + 10, 180, 38, 2, 2, "FD");

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(90);

      const disclaimerText =
        "This document is electronically generated by Hansaria Food Private Limited for internal operational and logistics monitoring purposes only. " +
        "All loading details, vehicle records, commodity information, and quantity measurements mentioned in this report are system captured data based on operational entries. " +
        "Any unauthorized modification, reproduction, or external circulation of this report without prior approval from the management is strictly prohibited.";

      const splitText = doc.splitTextToSize(disclaimerText, 170);

      doc.text(splitText, 18, finalY + 18);

      if (typeof doc.putTotalPages === "function") {
        doc.putTotalPages(totalPagesExp);
      }

      doc.save(`Loading_Report_${displayDate.replace(/\//g, "-")}.pdf`);
      toast.dismiss(toastId);
      toast.success("PDF Report generated successfully!");
    } catch (error) {
      console.error("PDF Generation Error:", error);
      if (toastId) toast.dismiss(toastId);
      toast.error("Failed to generate PDF report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <AdminPageShell
        title="Date-wise Loading Report"
        icon={FaHistory}
        noContentCard
      >
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Select Date
                </label>
                <DateSelector
                  selectedDate={selectedDate}
                  onChange={setSelectedDate}
                />
              </div>

              <div className="md:col-span-1">
                <DataDropdown
                  label="Filter Commodity"
                  options={commodityOptions}
                  selectedOptions={selectedCommodity}
                  onChange={setSelectedCommodity}
                  isClearable
                  placeholder="All Commodities"
                />
              </div>

              <div className="lg:col-span-2 flex justify-end gap-3">
                <button
                  onClick={downloadPDF}
                  disabled={!loadingEntries.length}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl text-sm font-bold hover:bg-slate-900 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  <FaFilePdf size={18} />
                  Download Report
                </button>
                <button
                  onClick={fetchLoadingEntries}
                  className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-colors border border-emerald-100"
                  title="Refresh Data"
                >
                  <FaTruckLoading
                    size={20}
                    className={loading ? "animate-bounce" : ""}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group relative bg-white rounded-[2rem] p-6 border border-slate-200 shadow-xl shadow-slate-200/40 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-emerald-500/10 rounded-full transition-transform duration-700 group-hover:scale-150"></div>
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Total Weight
                  </p>
                  <div className="flex items-end gap-2">
                    <h3 className="text-3xl font-black text-slate-900">
                      {summaryData.totalWeight.toFixed(2)}
                    </h3>
                    <span className="text-[10px] font-bold text-emerald-600 mb-1">
                      TONS
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20 transform transition-transform group-hover:rotate-12">
                  <FaTruckLoading size={20} />
                </div>
              </div>
            </div>

            <div className="group relative bg-white rounded-[2rem] p-6 border border-slate-200 shadow-xl shadow-slate-200/40 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-blue-500/10 rounded-full transition-transform duration-700 group-hover:scale-150"></div>
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Total Bags
                  </p>
                  <h3 className="text-3xl font-black text-slate-900">
                    {summaryData.totalBags}
                  </h3>
                </div>
                <div className="p-4 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/20 transform transition-transform group-hover:rotate-12">
                  <FaBoxOpen size={20} />
                </div>
              </div>
            </div>

            <div className="group relative bg-white rounded-[2rem] p-6 border border-slate-200 shadow-xl shadow-slate-200/40 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-amber-500/10 rounded-full transition-transform duration-700 group-hover:scale-150"></div>
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Vehicles
                  </p>
                  <h3 className="text-3xl font-black text-slate-900">
                    {summaryData.distinctLorry}
                  </h3>
                </div>
                <div className="p-4 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/20 transform transition-transform group-hover:rotate-12">
                  <FaTruckLoading size={20} />
                </div>
              </div>
            </div>

            <div className="group relative bg-white rounded-[2rem] p-6 border border-slate-200 shadow-xl shadow-slate-200/40 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-slate-500/10 rounded-full transition-transform duration-700 group-hover:scale-150"></div>
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Total Entries
                  </p>
                  <h3 className="text-3xl font-black text-slate-900">
                    {summaryData.totalEntries}
                  </h3>
                </div>
                <div className="p-4 bg-slate-700 text-white rounded-2xl shadow-lg shadow-slate-700/20 transform transition-transform group-hover:rotate-12">
                  <FaHistory size={20} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FaCalendarAlt className="text-emerald-500" />
                Loading Records for{" "}
                {selectedDate
                  ? selectedDate.toLocaleDateString("en-IN")
                  : "All Dates"}
              </h3>
            </div>

            <div className="p-4">
              {loading ? (
                <div className="py-20">
                  <Loading />
                </div>
              ) : (
                <>
                  <Tables headers={headers} rows={rows} />
                  <div className="mt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalItems={totalItems}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                      onPageSizeChange={(size) => {
                        setItemsPerPage(size);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </AdminPageShell>
    </Suspense>
  );
};

export default LoadingReport;
