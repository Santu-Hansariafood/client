import { jsPDF } from "jspdf";

const generatePDF = async (company) => {
  const doc = new jsPDF();
  const images = Object.values(company.documents);
  const loadImage = (url) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });

  for (let i = 0; i < images.length; i++) {
    if (i > 0) doc.addPage();

    try {
      const img = await loadImage(images[i]);
      const imgWidth = img.width;
      const imgHeight = img.height;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const aspectRatio = imgWidth / imgHeight;

      let drawWidth = pageWidth - 20;
      let drawHeight = drawWidth / aspectRatio;

      if (drawHeight > pageHeight - 20) {
        drawHeight = pageHeight - 20;
        drawWidth = drawHeight * aspectRatio;
      }

      const x = (pageWidth - drawWidth) / 2;
      const y = (pageHeight - drawHeight) / 2;
      doc.addImage(images[i], "JPEG", x, y, drawWidth, drawHeight);

      const watermarkText = "Hansaria Seller Data";
      doc.setFontSize(50);
      doc.setTextColor(0, 128, 0);
      doc.setFont("helvetica", "bold");

      const centerX = x + drawWidth / 2;
      const centerY = y + drawHeight / 2;

      doc.text(watermarkText, centerX, centerY, {
        align: "center",
        angle: 45,
      });
    } catch (error) {
      console.error("Error loading image:", images[i], error);
      doc.text(`Failed to load image: ${images[i]}`, 10, 10);
    }
  }

  doc.save(`${company.companyName}_Hansaria_Seller.pdf`);
};

export default generatePDF;
