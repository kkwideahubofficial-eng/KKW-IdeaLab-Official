import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const COLORS = {
  primary: '#1a237e',      // Navy Blue
  secondary: '#d4af37',    // Gold
  text: '#212121',
  textLight: '#757575',
  border: '#c5a059',
  bgLight: '#faf9f6'
};

export const generateCertificatePdf = async (data, outputPath) => {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Create A4 Landscape Document
  const doc = new PDFDocument({
    layout: 'landscape',
    size: 'A4',
    margin: 40
  });

  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    try {
      const width = 841.89;
      const height = 595.28;

      // 1. Draw Background Color
      doc.rect(0, 0, width, height).fill(COLORS.bgLight);

      // 2. Draw Decorative Borders
      // Outer Gold Border
      doc.rect(20, 20, width - 40, height - 40)
         .lineWidth(3)
         .stroke(COLORS.secondary);

      // Inner Navy Border
      doc.rect(28, 28, width - 56, height - 56)
         .lineWidth(1)
         .stroke(COLORS.primary);

      // Corner Accents (Draw simple triangles or shapes in corners)
      const accentSize = 25;
      // Top Left
      doc.moveTo(28, 28 + accentSize).lineTo(28 + accentSize, 28).lineTo(28, 28).fill(COLORS.primary);
      // Top Right
      doc.moveTo(width - 28, 28 + accentSize).lineTo(width - 28 - accentSize, 28).lineTo(width - 28, 28).fill(COLORS.primary);
      // Bottom Left
      doc.moveTo(28, height - 28 - accentSize).lineTo(28 + accentSize, height - 28).lineTo(28, height - 28).fill(COLORS.primary);
      // Bottom Right
      doc.moveTo(width - 28, height - 28 - accentSize).lineTo(width - 28 - accentSize, height - 28).lineTo(width - 28, height - 28).fill(COLORS.primary);

      // 3. Institution Logo & Header
      const logoSize = 50;
      const logoX = width / 2 - logoSize / 2;
      const logoPath = path.resolve('uploads/logo.png');
      
      let headerY = 55;
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, logoX, headerY, { width: logoSize, height: logoSize });
        headerY += logoSize + 15;
      } else {
        headerY += 20;
      }

      // 4. Header Text
      doc.fillColor(COLORS.primary)
         .font('Helvetica-Bold')
         .fontSize(14)
         .text('K. K. WAGH INSTITUTE OF ENGINEERING EDUCATION AND RESEARCH, NASHIK', 40, headerY, {
           width: width - 80,
           align: 'center'
         });

      doc.fillColor(COLORS.textLight)
         .font('Helvetica')
         .fontSize(10)
         .text('INNOVATION & STARTUP CELL (IDEA HUB)', 40, headerY + 18, {
           width: width - 80,
           align: 'center'
         });

      // 5. Title
      doc.fillColor(COLORS.secondary)
         .font('Times-Bold')
         .fontSize(32)
         .text('CERTIFICATE OF PARTICIPATION', 40, headerY + 45, {
           width: width - 80,
           align: 'center'
         });

      // 6. Presentation text
      doc.fillColor(COLORS.text)
         .font('Times-Italic')
         .fontSize(14)
         .text('This is proudly presented to', 40, headerY + 95, {
           width: width - 80,
           align: 'center'
         });

      // 7. Student Name
      doc.fillColor(COLORS.primary)
         .font('Helvetica-Bold')
         .fontSize(24)
         .text(data.studentName.toUpperCase(), 40, headerY + 120, {
           width: width - 80,
           align: 'center'
         });

      // Draw underline under name
      doc.moveTo(width / 2 - 180, headerY + 148)
         .lineTo(width / 2 + 180, headerY + 148)
         .lineWidth(1)
         .stroke(COLORS.secondary);

      // 8. Participation Details
      doc.fillColor(COLORS.text)
         .font('Helvetica')
         .fontSize(12)
         .text(`for successfully participating in the event / workshop`, 40, headerY + 165, {
           width: width - 80,
           align: 'center'
         });

      doc.fillColor(COLORS.primary)
         .font('Helvetica-Bold')
         .fontSize(16)
         .text(data.eventName, 40, headerY + 185, {
           width: width - 80,
           align: 'center'
         });

      const eventDateStr = new Date(data.eventDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      doc.fillColor(COLORS.text)
         .font('Helvetica')
         .fontSize(12)
         .text(`conducted by ${data.organizer || 'IDEA Hub'} on ${eventDateStr}.`, 40, headerY + 208, {
           width: width - 80,
           align: 'center'
         });

      // 9. Certificate ID / Metadata Y=470
      const metaY = height - 90;
      doc.fillColor(COLORS.textLight)
         .font('Courier')
         .fontSize(8.5)
         .text(`Certificate No: ${data.certificateNumber}`, 45, metaY + 30);

      doc.fillColor(COLORS.textLight)
         .font('Courier')
         .fontSize(8.5)
         .text(`Generated on: ${new Date(data.generatedAt).toLocaleDateString('en-IN')}`, 45, metaY + 42);

      // 10. Signatures Y=460
      const sigLineY = metaY + 15;

      // Left Signature (Coordinator)
      doc.moveTo(width - 400, sigLineY)
         .lineTo(width - 240, sigLineY)
         .lineWidth(1)
         .stroke(COLORS.textLight);

      doc.fillColor(COLORS.text)
         .font('Helvetica-Bold')
         .fontSize(9.5)
         .text(data.coordinatorName || 'Prof. Coordinator', width - 400, sigLineY + 6, { width: 160, align: 'center' });

      doc.fillColor(COLORS.textLight)
         .font('Helvetica')
         .fontSize(8.5)
         .text('Event Coordinator', width - 400, sigLineY + 18, { width: 160, align: 'center' });

      // Right Signature (Head of Startup Cell)
      doc.moveTo(width - 200, sigLineY)
         .lineTo(width - 40, sigLineY)
         .lineWidth(1)
         .stroke(COLORS.textLight);

      doc.fillColor(COLORS.text)
         .font('Helvetica-Bold')
         .fontSize(9.5)
         .text('Dr. Head, Startup Cell', width - 200, sigLineY + 6, { width: 160, align: 'center' });

      doc.fillColor(COLORS.textLight)
         .font('Helvetica')
         .fontSize(8.5)
         .text('IDEA Hub Convener', width - 200, sigLineY + 18, { width: 160, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }

    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
};
