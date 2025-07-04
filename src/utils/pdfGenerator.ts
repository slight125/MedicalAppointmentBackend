import PDFDocument from "pdfkit";

export const generatePrescriptionPDF = (data: {
  doctorName: string;
  patientName: string;
  appointmentId: number;
  medicines: string[];
  notes?: string;
  issuedAt?: string;
}): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on("error", reject);

      // Header
      doc.fontSize(24).text("📋 Medical Prescription", { align: "center" });
      doc.moveDown();
      
      // Add a line separator
      doc.moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();
      doc.moveDown();

      // Patient and Doctor Information
      doc.fontSize(14).text("Patient Information:", { underline: true });
      doc.fontSize(12).text(`Patient Name: ${data.patientName}`);
      doc.moveDown();

      doc.fontSize(14).text("Doctor Information:", { underline: true });
      doc.fontSize(12).text(`Doctor Name: ${data.doctorName}`);
      doc.moveDown();

      doc.fontSize(14).text("Prescription Details:", { underline: true });
      doc.fontSize(12).text(`Appointment ID: ${data.appointmentId}`);
      
      if (data.issuedAt) {
        doc.text(`Date Issued: ${new Date(data.issuedAt).toLocaleDateString()}`);
      }
      doc.moveDown();

      // Medicines Section
      doc.fontSize(14).text("Prescribed Medicines:", { underline: true });
      doc.moveDown(0.5);
      
      if (data.medicines && data.medicines.length > 0) {
        data.medicines.forEach((med, idx) => {
          doc.fontSize(12).text(`${idx + 1}. ${med}`, { indent: 20 });
        });
      } else {
        doc.fontSize(12).text("No medicines prescribed", { indent: 20 });
      }

      // Doctor's Notes Section
      if (data.notes && data.notes.trim()) {
        doc.moveDown();
        doc.fontSize(14).text("Doctor's Notes:", { underline: true });
        doc.fontSize(12).text(data.notes, { indent: 20 });
      }

      // Footer
      doc.moveDown(2);
      doc.moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();
      doc.moveDown();
      doc.fontSize(10).text("This prescription is generated electronically and is valid.", { align: "center" });
      doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: "center" });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
