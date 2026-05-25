import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaTimes, FaPrint, FaCalendarAlt, FaBuilding, FaUserTie, FaBox, FaArrowDown, FaFilePdf, FaChartLine, FaExclamationTriangle } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../../../utils/apiClient/apiClient';
import Loading from '../../../../common/Loading/Loading';
import logoImg from '../../../../assets/Hans.png';

const SaudaDetailPopup = ({ saudaNo, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const fetchDetails = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/self-orders/details/${saudaNo}`);
            setData(response.data);
        } catch (err) {
            console.error('Error fetching sauda details:', err);
            setError(err.response?.data?.message || 'Failed to load sauda details. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [saudaNo]);

    useEffect(() => {
        if (saudaNo) fetchDetails();
    }, [saudaNo, fetchDetails]);

    // Handle ESC key and Backdrop click
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    const consolidatedData = useMemo(() => {
        if (!data) return [];

        const items = [];
        let runningBalance = 0;

        // Add Loading Entries
        (data.entries || []).forEach(entry => {
            const weight = entry.unloadingWeight || entry.loadingWeight || 0;
            const rate = entry.actualRate || 0;
            const cd = entry.cd || 0;
            const gst = entry.gst || 0;
            
            const gross = weight * rate;
            const taxable = gross - (gross * cd / 100);
            const amount = taxable + (taxable * gst / 100);
            
            runningBalance += amount;
            
            items.push({
                type: 'loading',
                date: entry.loadingDate,
                billNo: entry.billNumber || '-',
                lNo: entry.loadingNo || '-',
                lWt: entry.loadingWeight || 0,
                unDt: entry.unloadingDate ? new Date(entry.unloadingDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }) : '-',
                unWt: entry.unloadingWeight || 0,
                amount: amount,
                balance: runningBalance,
                original: entry
            });
        });

        // Add Payments
        (data.payments || []).forEach(payment => {
            // Find mappings for this specific sauda
            const saudaMappings = (payment.mappings || []).filter(m => m.saudaNo === saudaNo);
            const allocatedAmount = saudaMappings.reduce((sum, m) => sum + (m.allocatedAmount || 0), 0);
            
            if (allocatedAmount > 0) {
                runningBalance -= allocatedAmount;
                items.push({
                    type: 'payment',
                    date: payment.date,
                    mode: payment.paymentMode,
                    remarks: payment.remarks,
                    amount: allocatedAmount,
                    balance: runningBalance,
                    original: payment
                });
            }
        });

        // Sort by date and then type (loading entries first if same date)
        return items.sort((a, b) => {
            const dateDiff = new Date(a.date) - new Date(b.date);
            if (dateDiff === 0) {
                return a.type === 'loading' ? -1 : 1;
            }
            return dateDiff;
        });
    }, [data, saudaNo]);

    const handlePrint = useCallback(() => {
        if (!data) return;

        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;

        // Header Background for Logo
        doc.setFillColor(250, 250, 250);
        doc.rect(0, 0, pageWidth, 30, 'F');

        // Logo
        try {
            doc.addImage(logoImg, 'PNG', margin, 5, 20, 20);
        } catch (e) {
            console.error("Logo failed to load for PDF");
        }

        // --- TALLY STYLE HEADER ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text("HANSARIA FOOD PVT. LTD.", pageWidth / 2 + 10, 15, { align: "center" });

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text("Sector 4, Plot 12, IMT Manesar, Gurugram, Haryana", pageWidth / 2 + 10, 20, { align: "center" });
        
        doc.setLineWidth(0.5);
        doc.line(margin, 28, pageWidth - margin, 28); // Top Border

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(`SAUDA MIS REPORT: ${saudaNo}`, margin, 35);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, pageWidth - margin, 35, { align: "right" });

        doc.line(margin, 38, pageWidth - margin, 38); // Header Bottom Border

        // Sauda Details Section
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(`Buyer : ${data.order.buyerCompany.toUpperCase()}`, margin, 45);
        doc.text(`Seller : ${(data.order.supplier?.sellerName || data.order.supplierCompany).toUpperCase()}`, margin, 50);
        doc.text(`Consignee : ${(data.order.consignee || '-').toUpperCase()}`, margin, 55);

        doc.text(`Sauda Dt. : ${new Date(data.order.date).toLocaleDateString('en-GB')}`, pageWidth - margin, 45, { align: "right" });
        doc.text(`Qty : ${data.order.quantity.toLocaleString()} ${data.order.unit || 'Ton'}`, pageWidth - margin, 50, { align: "right" });
        doc.text(`Rate : Rs. ${data.order.rate.toLocaleString()}`, pageWidth - margin, 55, { align: "right" });

        // Table
        const tableData = [];
        consolidatedData.forEach(item => {
            if (item.type === 'loading') {
                tableData.push([
                    new Date(item.date).toLocaleDateString('en-GB'),
                    item.billNo,
                    item.lNo,
                    item.lWt.toFixed(3),
                    item.unDt,
                    item.unWt.toFixed(3),
                    `Rs. ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    `Rs. ${item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                ]);
            } else {
                // Payment Description Row
                tableData.push([
                    { 
                        content: `${new Date(item.date).toLocaleDateString('en-GB')} – Payment made Rs. ${item.amount.toLocaleString()}/- by ${item.mode.toUpperCase()}${item.remarks ? ` [${item.remarks.toUpperCase()}]` : ''}`, 
                        colSpan: 8, 
                        styles: { fontStyle: 'italic', textColor: [50, 50, 50], fillColor: [245, 245, 245] } 
                    }
                ]);
                // Deduction Row
                tableData.push([
                    '', '', '', '', '', '',
                    { content: `– Rs. ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, styles: { halign: 'right', fontStyle: 'bold', textColor: [150, 0, 0] } },
                    { content: item.balance <= 1 && item.balance >= -1 ? 'NIL' : `Rs. ${item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, styles: { halign: 'right', fontStyle: 'bold', textColor: [0, 80, 0] } }
                ]);
            }
        });

        autoTable(doc, {
            startY: 62,
            head: [['DATE', 'BILL NO.', 'L.NO.', 'L.WT', 'UN.DT', 'UN.WT', 'AMOUNT', 'BALANCE']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [240, 240, 240],
                textColor: [0, 0, 0],
                fontSize: 8,
                fontStyle: 'bold',
                lineWidth: 0.1,
                lineColor: [0, 0, 0],
                halign: 'center'
            },
            styles: {
                fontSize: 7,
                cellPadding: 2,
                textColor: [0, 0, 0],
                lineColor: [200, 200, 200]
            },
            columnStyles: {
                0: { cellWidth: 20, halign: 'center' },
                1: { cellWidth: 15, halign: 'center' },
                2: { cellWidth: 15, halign: 'center' },
                3: { halign: 'right' },
                4: { cellWidth: 15, halign: 'center' },
                5: { halign: 'right' },
                6: { halign: 'right' },
                7: { halign: 'right' }
            },
            margin: { left: margin, right: margin },
            didDrawPage: (data) => {
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(7);
                doc.setTextColor(150, 150, 150);
                doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageWidth - margin, doc.internal.pageSize.height - 10, { align: "right" });
                doc.text("This is a computer generated document.", margin, doc.internal.pageSize.height - 10);
            }
        });

        doc.save(`Sauda_MIS_${saudaNo}.pdf`);
    }, [data, saudaNo, consolidatedData]);

    if (!saudaNo) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                            <FaFilePdf size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 italic tracking-tight">Details of {saudaNo}</h3>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Sauda MIS Report</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg"
                        >
                            <FaPrint /> Export PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-100 hover:bg-rose-50 rounded-xl transition-all"
                        >
                            <FaTimes size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-4">
                            <Loading size="lg" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Syncing Ledger Details...</p>
                        </div>
                    ) : data ? (
                        <>
                            {/* Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <FaBuilding className="text-slate-400" />
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buyer</p>
                                            <p className="font-bold text-slate-800 uppercase">{data.order.buyerCompany}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <FaUserTie className="text-slate-400" />
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seller</p>
                                            <p className="font-bold text-slate-800 uppercase">
                                                {data.order.supplier?.sellerName || data.order.supplierCompany}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <FaArrowDown className="text-slate-400" />
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consignee</p>
                                            <p className="font-bold text-slate-800 uppercase">{data.order.consignee || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 bg-slate-900 p-6 rounded-3xl text-white shadow-xl shadow-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sauda Date</p>
                                            <p className="text-lg font-black italic tracking-tighter">{new Date(data.order.date).toLocaleDateString('en-GB')}</p>
                                        </div>
                                        <FaCalendarAlt className="text-slate-700" size={24} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity</p>
                                            <p className="text-lg font-black italic tracking-tighter">{data.order.quantity.toLocaleString()} {data.order.unit || 'Ton'}</p>
                                        </div>
                                        <FaBox className="text-slate-700" size={24} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rate</p>
                                            <p className="text-lg font-black italic tracking-tighter">Rs. {data.order.rate.toLocaleString()}</p>
                                        </div>
                                        <FaChartLine className="text-slate-700" size={24} />
                                    </div>
                                </div>
                            </div>

                            {/* Ledger Table */}
                            <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-sm bg-white">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200">
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill No.</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">L.No.</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">L.Wt</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Un.Dt</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Un.Wt</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                            <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {consolidatedData.map((item, idx) => (
                                            <React.Fragment key={idx}>
                                                {item.type === 'loading' ? (
                                                    <tr className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-4 py-4 text-xs font-bold text-slate-600">{new Date(item.date).toLocaleDateString('en-GB')}</td>
                                                        <td className="px-4 py-4 text-xs font-black text-slate-900">{item.billNo}</td>
                                                        <td className="px-4 py-4 text-xs font-bold text-slate-600">{item.lNo}</td>
                                                        <td className="px-4 py-4 text-xs font-black text-slate-900 text-right">{item.lWt.toFixed(3)}</td>
                                                        <td className="px-4 py-4 text-xs font-bold text-slate-600">{item.unDt}</td>
                                                        <td className="px-4 py-4 text-xs font-black text-slate-900 text-right">{item.unWt.toFixed(3)}</td>
                                                        <td className="px-4 py-4 text-xs font-black text-slate-900 text-right italic">Rs. {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                        <td className="px-4 py-4 text-xs font-black text-slate-900 text-right italic">Rs. {item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    </tr>
                                                ) : (
                                                    <tr className="bg-emerald-50/30">
                                                        <td colSpan={6} className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                                                <p className="text-[11px] font-bold text-slate-600 italic">
                                                                    {new Date(item.date).toLocaleDateString('en-GB')} – Payment made Rs. {item.amount.toLocaleString()}/- by {item.mode}
                                                                    {item.remarks && <span className="text-slate-400 ml-1">[{item.remarks}]</span>}
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs font-black text-rose-500 text-right italic">– Rs. {item.amount.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-xs font-black text-emerald-600 text-right italic">
                                                            {item.balance <= 1 && item.balance >= -1 ? 'NIL' : `Rs. ${item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center">
                            <p className="text-slate-400 font-bold uppercase tracking-widest">No details found for this Sauda.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SaudaDetailPopup;
