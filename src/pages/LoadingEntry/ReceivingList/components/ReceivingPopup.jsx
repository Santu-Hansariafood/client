import React, { lazy, Suspense, useCallback } from "react";
import { FaPrint } from "react-icons/fa";
import { toast } from "react-toastify";
import { pdf } from "@react-pdf/renderer";
import QRCode from "qrcode";
import api from "../../../../utils/apiClient/apiClient";
import MasterReceivingReportPDF from "../MasterReceivingReportPDF";
import { downloadFile } from "../../../../utils/fileDownloader";
import { buildSaudaPdfData } from "../../../../utils/saudaPdf/buildSaudaPdfData";
import logoUrl from "../../../../assets/Hans.jpg";

const PopupBox = lazy(() => import("../../../../common/PopupBox/PopupBox"));
const Loading = lazy(() => import("../../../../common/Loading/Loading"));

import DocumentsDisplay from "./DocumentsDisplay";
import QualityClaimsSection from "./QualityClaimsSection";
import QuickDetailsSection from "./QuickDetailsSection";
import BillCalculationSection from "./BillCalculationSection";
import SendReportSection from "./SendReportSection";

const ReceivingPopup = ({
  selectedEntry,
  showPopup,
  setShowPopup,
  setSelectedEntry,
  userRole,
  sellerCompanies,
  selectedSellerEmail,
  setSelectedSellerEmail,
  cdValue,
  gstValue,
  getMasterData,
  user,
  mobile,
  fetchData,
}) => {
  const [sendingEmail, setSendingEmail] = React.useState(false);

  const handlePrint = useCallback(async () => {
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

      const matchedCommodity = commodityData.find(
        (c) =>
          c.name?.toLowerCase() === selectedEntry.commodity?.toLowerCase() ||
          c.label?.toLowerCase() === selectedEntry.commodity?.toLowerCase(),
      );

      const pdfData = buildSaudaPdfData({
        item: {
          ...selectedEntry,
          cd: cdValue,
          gst: gstValue,
        },
        consigneeData,
        supplierData,
        buyerData,
        companyData,
        commodityData,
        qualityParameterData: [],
        sellerProfileData: [],
        getConsigneeDisplay: (item) => {
          const c = item?.consignee;
          if (typeof c === "object" && c?.name) return c.name;
          if (typeof c === "object" && c?.label) return c.label;
          return String(c || "N/A");
        },
      });

      pdfData.hsnCode =
        matchedCommodity?.hsnCode ||
        matchedCommodity?.hsn ||
        matchedCommodity?.hsnNumber ||
        matchedCommodity?.hsnCodeNumber ||
        matchedCommodity?.hsn_code ||
        selectedEntry.hsnCode ||
        selectedEntry.hsn ||
        selectedEntry.hsn_code;

      const qrData = JSON.stringify({
        saudaNo: selectedEntry.saudaNo,
        billNo: selectedEntry.billNumber,
        sellerBillNo: selectedEntry.sellerBillNo,
        lorryNo: selectedEntry.lorryNumber,
        loadingWeight: selectedEntry.loadingWeight,
        unloadingWeight: selectedEntry.unloadingWeight,
        loadingDate: selectedEntry.loadingDate,
        unloadingDate: selectedEntry.unloadingDate,
        commodity: selectedEntry.commodity,
        buyerCompany: selectedEntry.buyerCompany,
        sellerCompany: selectedEntry.supplierCompany,
        rate: selectedEntry.actualRate || selectedEntry.rate,
        cd: cdValue,
        gst: gstValue,
      });
      let qrCodeUrl = null;
      try {
        qrCodeUrl = await QRCode.toDataURL(qrData);
      } catch (e) {
        toast.error("Failed to generate QR code");
      }

      const preparedEntry = { ...pdfData, qrCodeUrl };

      const document = (
        <MasterReceivingReportPDF entries={[preparedEntry]} logoUrl={logoUrl} />
      );

      const blob = await pdf(document).toBlob();

      let fileName = `receiving_report_${selectedEntry.saudaNo || "document"}`;
      if (selectedEntry.billNumber && selectedEntry.billNumber !== "0") {
        fileName += `_bill_${selectedEntry.billNumber}`;
      }
      fileName += ".pdf";

      downloadFile(blob, fileName);

      // Now send the email automatically if selectedSellerEmail exists
      if (selectedSellerEmail) {
        // Convert blob to base64 for email
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            const base64data = reader.result.split(",")[1];
            resolve(base64data);
          };
          reader.onerror = reject;
        });

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

        // Update sent status
        await api.put(`/loading-entries/${selectedEntry._id}`, {
          sentStatus: "Sent",
        });
        fetchData();

        toast.update(toastId, {
          render: "Report downloaded, emailed, and status updated successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        toast.update(toastId, {
          render: "Report downloaded successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Print Error:", error);
      toast.error("Error generating PDF or sending email");
      toast.update(toastId, {
        render: "Failed to generate comprehensive report",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  }, [selectedEntry, getMasterData, cdValue, gstValue, selectedSellerEmail, user, mobile, fetchData]);

  const handleSendEmail = useCallback(async () => {
    if (!selectedEntry || !selectedSellerEmail) {
      toast.error("Please select a seller email");
      return;
    }

    const toastId = toast.loading("Preparing and sending report...");
    setSendingEmail(true);

    try {
      // First generate PDF blob
      const {
        consigneeData,
        supplierData,
        buyerData,
        companyData,
        commodityData,
      } = await getMasterData();

      const matchedCommodity = commodityData.find(
        (c) =>
          c.name?.toLowerCase() === selectedEntry.commodity?.toLowerCase() ||
          c.label?.toLowerCase() === selectedEntry.commodity?.toLowerCase(),
      );

      const pdfData = buildSaudaPdfData({
        item: {
          ...selectedEntry,
          cd: cdValue,
          gst: gstValue,
        },
        consigneeData,
        supplierData,
        buyerData,
        companyData,
        commodityData,
        qualityParameterData: [],
        sellerProfileData: [],
        getConsigneeDisplay: (item) => {
          const c = item?.consignee;
          if (typeof c === "object" && c?.name) return c.name;
          if (typeof c === "object" && c?.label) return c.label;
          return String(c || "N/A");
        },
      });

      pdfData.hsnCode =
        matchedCommodity?.hsnCode ||
        matchedCommodity?.hsn ||
        matchedCommodity?.hsnNumber ||
        matchedCommodity?.hsnCodeNumber ||
        matchedCommodity?.hsn_code ||
        selectedEntry.hsnCode ||
        selectedEntry.hsn ||
        selectedEntry.hsn_code;

      const qrData = JSON.stringify({
        saudaNo: selectedEntry.saudaNo,
        billNo: selectedEntry.billNumber,
        sellerBillNo: selectedEntry.sellerBillNo,
        lorryNo: selectedEntry.lorryNumber,
        loadingWeight: selectedEntry.loadingWeight,
        unloadingWeight: selectedEntry.unloadingWeight,
        loadingDate: selectedEntry.loadingDate,
        unloadingDate: selectedEntry.unloadingDate,
        commodity: selectedEntry.commodity,
        buyerCompany: selectedEntry.buyerCompany,
        sellerCompany: selectedEntry.supplierCompany,
        rate: selectedEntry.actualRate || selectedEntry.rate,
        cd: cdValue,
        gst: gstValue,
      });
      let qrCodeUrl = null;
      try {
        qrCodeUrl = await QRCode.toDataURL(qrData);
      } catch (e) {
        toast.error("Failed to generate QR code");
      }

      const preparedEntry = { ...pdfData, qrCodeUrl };

      const document = (
        <MasterReceivingReportPDF entries={[preparedEntry]} logoUrl={logoUrl} />
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

      try {
        await api.put(`/loading-entries/${selectedEntry._id}`, {
          sentStatus: "Sent",
        });
        fetchData();
      } catch (err) {
        toast.error("Error updating sent status");
      }
    } catch (error) {
      toast.error("Error sending email");
      toast.update(toastId, {
        render: "Failed to send report",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setSendingEmail(false);
    }
  }, [
    selectedEntry,
    selectedSellerEmail,
    getMasterData,
    cdValue,
    gstValue,
    user,
    mobile,
    fetchData,
  ]);

  const handleClosePopup = useCallback(() => {
    setShowPopup(false);
    setSelectedEntry(null);
  }, [setShowPopup, setSelectedEntry]);

  if (!showPopup || !selectedEntry) {
    return null;
  }

  return (
    <Suspense fallback={<Loading />}>
      <PopupBox
        isOpen={showPopup}
        onClose={handleClosePopup}
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
            <SendReportSection
              sellerCompanies={sellerCompanies}
              selectedEntry={selectedEntry}
              selectedSellerEmail={selectedSellerEmail}
              setSelectedSellerEmail={setSelectedSellerEmail}
              onSendEmail={handleSendEmail}
              sendingEmail={sendingEmail}
            />
          )}

          <DocumentsDisplay
            documents={selectedEntry.documents}
            documentUrl={selectedEntry.documentUrl}
          />

          <QualityClaimsSection qualityClaims={selectedEntry.qualityClaims} />

          <QuickDetailsSection selectedEntry={selectedEntry} />

          <BillCalculationSection
            selectedEntry={selectedEntry}
            cdValue={cdValue}
            gstValue={gstValue}
          />
        </div>
      </PopupBox>
    </Suspense>
  );
};

export default ReceivingPopup;
