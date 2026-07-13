import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

const COLORS = {
  primary: '#1a237e',
  secondary: '#283593',
  success: '#2e7d32',
  warning: '#f57f17',
  danger: '#c62828',
  border: '#bdbdbd',
  lightBg: '#f5f5f5',
  headerBg: '#e8eaf6',
  text: '#212121',
  textLight: '#616161',
  white: '#ffffff',
};

const MARGIN = 25;
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
const BOTTOM_MARGIN = 50;

const getLogoBufferOrPath = () => {
  const possiblePaths = [
    path.resolve('uploads/logo.png'),
    path.resolve('uploads/uploaded-logo.png'),
    path.resolve('uploads/logo.svg'),
    path.resolve('../innovate-hub-core/public/uploaded-logo.png'),
    path.resolve('../innovate-hub-core/public/logo.png'),
    path.resolve('../innovate-hub-core/public/logo.svg'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      if (p.endsWith('.svg')) {
        try {
          const content = fs.readFileSync(p, 'utf-8');
          const match = content.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/);
          if (match && match[1]) {
            return Buffer.from(match[1], 'base64');
          }
        } catch (e) {
          console.error('Error parsing SVG logo:', e);
        }
      } else {
        return p;
      }
    }
  }
  return null;
};

const remaining = (cy) => PAGE_HEIGHT - BOTTOM_MARGIN - cy;

const ensurePage = (doc, cy, needed) => {
  if (remaining(cy) < needed) {
    doc.addPage();
    return MARGIN;
  }
  return cy;
};

const drawSectionTitle = (doc, title, cy) => {
  cy = ensurePage(doc, cy, 28);
  doc.roundedRect(MARGIN, cy, CONTENT_WIDTH, 20, 3).fill(COLORS.headerBg);
  doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(10)
     .text(title, MARGIN + 8, cy + 4, { width: CONTENT_WIDTH - 16, align: 'center' });
  return cy + 26;
};

const drawInfoCard = (doc, fields, cy) => {
  const rowHeight = 20;
  const col1Width = 140;
  const col2Width = CONTENT_WIDTH - col1Width;
  const totalHeight = fields.length * rowHeight + 8;

  cy = ensurePage(doc, cy, totalHeight + 10);

  doc.roundedRect(MARGIN, cy, CONTENT_WIDTH, totalHeight, 4).stroke(COLORS.border);

  fields.forEach((field, i) => {
    const rowY = cy + 4 + i * rowHeight;
    if (i % 2 === 1) {
      doc.rect(MARGIN + 1, rowY, CONTENT_WIDTH - 2, rowHeight).fill(COLORS.lightBg);
    }

    doc.fillColor(COLORS.textLight).font('Helvetica-Bold').fontSize(9)
       .text(field.label, MARGIN + 6, rowY + 4, { width: col1Width - 6 });

    const sepX = MARGIN + col1Width;
    doc.moveTo(sepX, rowY).lineTo(sepX, rowY + rowHeight).stroke(COLORS.border);

    doc.fillColor(COLORS.text).font('Helvetica').fontSize(9)
       .text(String(field.value), sepX + 6, rowY + 4, { width: col2Width - 12 });
  });

  return cy + totalHeight + 10;
};

const drawTable = (doc, headers, rows, cy) => {
  const colWidth = CONTENT_WIDTH / headers.length;
  const rowHeight = 20;
  const headerHeight = 22;
  const totalHeight = headerHeight + rows.length * rowHeight + 2;

  cy = ensurePage(doc, cy, totalHeight + 10);

  doc.rect(MARGIN, cy, CONTENT_WIDTH, headerHeight).fill(COLORS.primary);
  headers.forEach((h, i) => {
    const x = MARGIN + i * colWidth;
    doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(8)
       .text(h, x + 3, cy + 6, { width: colWidth - 6, align: 'center' });
  });

  let yy = cy + headerHeight;
  rows.forEach((row, ri) => {
    if (ri % 2 === 1) {
      doc.rect(MARGIN, yy, CONTENT_WIDTH, rowHeight).fill(COLORS.lightBg);
    }
    row.forEach((cell, ci) => {
      const x = MARGIN + ci * colWidth;
      doc.fillColor(COLORS.text).font('Helvetica').fontSize(8)
         .text(String(cell), x + 3, yy + 4, { width: colWidth - 6, align: 'center' });
    });
    doc.moveTo(MARGIN, yy + rowHeight).lineTo(MARGIN + CONTENT_WIDTH, yy + rowHeight).stroke(COLORS.border);
    yy += rowHeight;
  });

  doc.rect(MARGIN, cy, CONTENT_WIDTH, yy - cy).stroke(COLORS.border);
  return yy + 10;
};

const drawFooter = (doc) => {
  const fy = PAGE_HEIGHT - BOTTOM_MARGIN;
  doc.moveTo(MARGIN, fy).lineTo(PAGE_WIDTH - MARGIN, fy).stroke(COLORS.border);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(7)
     .text(`Generated on: ${dateStr} ${timeStr}`, MARGIN, fy + 4, { width: CONTENT_WIDTH, align: 'center' });
  doc.font('Helvetica-Bold').fontSize(7)
     .text('Innovation & Startup Cell', MARGIN, fy + 14, { width: CONTENT_WIDTH, align: 'center' });
  doc.font('Helvetica').fontSize(6.5)
     .text('K. K. Wagh Institute of Engineering Education and Research, Nashik', MARGIN, fy + 24, { width: CONTENT_WIDTH, align: 'center' });
};

const badgeLabel = (status) => {
  const s = (status || 'pending').toLowerCase();
  const map = {
    approved: { text: 'APPROVED', color: COLORS.success },
    pending: { text: 'PENDING', color: COLORS.warning },
    rejected: { text: 'REJECTED', color: COLORS.danger },
    completed: { text: 'COMPLETED', color: COLORS.primary },
    cancelled: { text: 'CANCELLED', color: COLORS.textLight },
    overstayed: { text: 'OVERSTAYED', color: COLORS.danger },
    'conditional approval': { text: 'CONDITIONAL', color: COLORS.warning },
    'coordinator review': { text: 'PENDING COORD', color: COLORS.warning },
    'idea hub head review': { text: 'PENDING HEAD', color: COLORS.warning },
    'faculty verified': { text: 'FACULTY VERIFIED', color: COLORS.success },
    'submitted': { text: 'SUBMITTED', color: COLORS.secondary }
  };
  return map[s] || { text: s.toUpperCase(), color: COLORS.warning };
};

const statusDisplay = (status) => {
  const s = (status || 'pending').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const drawHeader = (doc, title, status, cy) => {
  doc.rect(MARGIN, cy, CONTENT_WIDTH, 2).fill(COLORS.primary);
  cy += 8;

  const logoWidth = 75;
  const logoHeight = 52;
  const logoX = MARGIN + 2;
  const logoY = cy + 2;

  const logo = getLogoBufferOrPath();
  if (logo) {
    try {
      doc.image(logo, logoX, logoY, { fit: [logoWidth, logoHeight], align: 'left', valign: 'center' });
    } catch (e) {
      console.error('Error rendering logo in header:', e);
    }
  } else {
    doc.roundedRect(logoX, logoY, logoWidth, logoHeight, 4).stroke(COLORS.border);
    doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(6)
       .text('Logo', logoX, logoY + 18, { width: logoWidth, align: 'center' });
  }

  const badge = badgeLabel(status);
  const badgeW = 95;
  const badgeH = 20;
  const badgeX = PAGE_WIDTH - MARGIN - badgeW - 2;
  const badgeY = cy + 12;

  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 10).fill(badge.color);
  doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(8.5)
     .text(badge.text, badgeX, badgeY + 5, { width: badgeW, align: 'center' });

  const textX = MARGIN + logoWidth + 8;
  const textW = badgeX - textX - 8;

  doc.fillColor(COLORS.primary).font('Helvetica-Bold').fontSize(12.5)
     .text('AICTE IDEA Lab and Innovation Centre', textX, cy + 3, { width: textW, align: 'center' });
  doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(8.5)
     .text('K. K. Wagh Institute of Engineering Education and Research, Nashik', textX, cy + 21, { width: textW, align: 'center' });

  cy += 44;

  doc.fillColor(COLORS.secondary).font('Helvetica-Bold').fontSize(15)
     .text(title, MARGIN, cy, { width: CONTENT_WIDTH, align: 'center' });
  cy += 24;

  doc.moveTo(MARGIN, cy).lineTo(PAGE_WIDTH - MARGIN, cy).stroke(COLORS.primary);
  cy += 10;

  return cy;
};

const generateRoomPdf = async (doc, data) => {
  let cy = drawHeader(doc, 'ROOM BOOKING APPLICATION', data.status, MARGIN);

  const sLabel = statusDisplay(data.status);

  cy = drawSectionTitle(doc, 'BOOKING INFORMATION', cy);
  cy = drawInfoCard(doc, [
    { label: 'Booking ID', value: data.header.bookingId || 'N/A' },
    { label: 'Date', value: data.header.bookingDate || 'N/A' },
    { label: 'Status', value: sLabel },
  ], cy);

  cy = drawSectionTitle(doc, 'TEAM DETAILS', cy);
  cy = drawInfoCard(doc, [
    { label: 'Team Name', value: data.team.teamName || 'N/A' },
    { label: 'Team Size', value: String(data.team.teamSize || 'N/A') },
    { label: 'Leader', value: data.team.teamLeaderName || 'N/A' },
    { label: 'Email', value: data.team.email || 'N/A' },
    { label: 'Mobile', value: data.team.mobile || 'N/A' },
  ], cy);

  cy = drawSectionTitle(doc, 'BOOKING DETAILS', cy);
  cy = drawInfoCard(doc, [
    { label: 'Room', value: data.booking.roomName || 'N/A' },
    { label: 'Date', value: data.booking.date || 'N/A' },
    { label: 'Time Slot', value: data.booking.timeSlot || 'N/A' },
    { label: 'Project Title', value: data.booking.projectTitle || 'N/A' },
    { label: 'Description', value: data.booking.projectDescription || 'N/A' },
  ], cy);

  if (data.team.teamMembers && data.team.teamMembers.length > 0) {
    cy = drawSectionTitle(doc, 'TEAM MEMBERS', cy);
    const rows = data.team.teamMembers.map((m, i) => [
      String(i + 1), m.name || 'N/A', m.branch || 'N/A', m.year || 'N/A',
    ]);
    cy = drawTable(doc, ['Sr. No.', 'Name', 'Branch', 'Year'], rows, cy);
  }

  cy = drawSectionTitle(doc, 'APPROVAL DETAILS', cy);
  const af = [{ label: 'Status', value: sLabel }];
  if (data.approvedBy) af.push({ label: 'Approved By', value: data.approvedBy });
  if (data.approvalDate) af.push({ label: 'Approved Date', value: data.approvalDate });
  if (data.remarks) af.push({ label: 'Remarks', value: data.remarks });
  cy = drawInfoCard(doc, af, cy);

  cy = drawSectionTitle(doc, 'DECLARATION', cy);
  cy = ensurePage(doc, cy, 50);
  doc.roundedRect(MARGIN, cy, CONTENT_WIDTH, 40, 4).fill(COLORS.lightBg).stroke(COLORS.border);
  doc.fillColor(COLORS.text).font('Helvetica-Oblique').fontSize(8)
     .text('The team agrees to use the room responsibly and follow all laboratory/institute rules. Any violation of rules may result in cancellation of booking and disciplinary action.',
       MARGIN + 8, cy + 6, { width: CONTENT_WIDTH - 16, align: 'center' });
  cy += 48;

  cy = drawSectionTitle(doc, 'SIGNATURES', cy);
  cy = ensurePage(doc, cy, 65);

  const sigY = cy;
  doc.moveTo(MARGIN + 20, sigY + 16).lineTo(MARGIN + 170, sigY + 16).stroke(COLORS.border);
  doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(8)
     .text('Student Signature', MARGIN + 20, sigY + 20, { width: 150, align: 'center' });

  doc.moveTo(MARGIN + CONTENT_WIDTH - 170, sigY + 16).lineTo(MARGIN + CONTENT_WIDTH - 20, sigY + 16).stroke(COLORS.border);
  doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(8)
     .text('Coordinator Signature', MARGIN + CONTENT_WIDTH - 170, sigY + 20, { width: 150, align: 'center' });

  if (data.qrData && remaining(cy) >= 75) {
    try {
      const qrBuffer = await QRCode.toBuffer(data.qrData, { width: 100, margin: 2 });
      doc.image(qrBuffer, PAGE_WIDTH - MARGIN - 70, sigY - 8, { width: 60, height: 60 });
    } catch (e) {
      console.error('QR error:', e);
    }
  }

  drawFooter(doc);
};


const generateMachineryPdf = async (doc, data) => {
  // Page header for K.K. Wagh IDEA Lab
  let cy = drawHeader(doc, 'PERMISSION FOR MATERIAL / MACHINERY USAGE', data.status, MARGIN);
  const sLabel = statusDisplay(data.status);

  // Section 1: Application Info
  cy = drawSectionTitle(doc, 'APPLICATION INFORMATION', cy);
  cy = drawInfoCard(doc, [
    { label: 'Request ID', value: data.header.applicationId || 'N/A' },
    { label: 'Project Name', value: data.header.projectName || 'N/A' },
    { label: 'Project Category', value: data.header.projectCategory || 'N/A' },
    { label: 'Application Date', value: data.header.applicationDate || 'N/A' },
    { label: 'Faculty Guide', value: data.header.guideName || 'N/A' },
  ], cy);

  // Section 2: Applicant Student Details
  cy = drawSectionTitle(doc, 'APPLICANT DETAILS', cy);
  cy = drawInfoCard(doc, [
    { label: 'Full Name', value: data.student.name || 'N/A' },
    { label: 'PRN / Roll Number', value: data.student.prn || 'N/A' },
    { label: 'Email Address', value: data.student.email || 'N/A' },
    { label: 'Mobile Number', value: data.student.mobile || 'N/A' },
    { label: 'Branch & Year', value: `${data.student.branch || 'N/A'} / ${data.student.year || 'N/A'}` },
  ], cy);

  // Section 3: Team Members
  if (data.teamMembers && data.teamMembers.length > 0) {
    cy = drawSectionTitle(doc, 'TEAM MEMBERS', cy);
    const rows = data.teamMembers.map(m => [
      String(m.index),
      m.name || 'N/A',
      m.prn || 'N/A',
      m.branch || 'N/A',
      m.year || 'N/A',
    ]);
    cy = drawTable(doc, ['Sr.', 'Name', 'PRN', 'Branch', 'Year'], rows, cy);
  }

  // Section 4: Requested Machines (Separate UI/Section)
  if (data.requestedMachines && data.requestedMachines.length > 0) {
    cy = drawSectionTitle(doc, 'REQUESTED MACHINERY BOOKINGS', cy);
    const rows = data.requestedMachines.map((m, i) => [
      String(i + 1),
      m.name || 'N/A',
      m.usageDate || 'N/A',
      m.timeSlot || 'N/A',
      `${m.hours || 0} hrs`,
      m.purpose || 'N/A'
    ]);
    cy = drawTable(doc, ['Sr.', 'Machine Name', 'Usage Date', 'Time Slot', 'Duration', 'Purpose'], rows, cy);
  }

  // Section 5: Requested Materials (Separate UI/Section)
  if (data.requestedMaterials && data.requestedMaterials.length > 0) {
    cy = drawSectionTitle(doc, 'REQUESTED MATERIALS ALLOCATION', cy);
    const rows = data.requestedMaterials.map((m, i) => [
      String(i + 1),
      m.name || 'N/A',
      String(m.quantity || 1),
      m.purpose || 'N/A'
    ]);
    cy = drawTable(doc, ['Sr.', 'Material Name', 'Qty Required', 'Purpose'], rows, cy);
  }

  // Section 6: Approval Details
  cy = drawSectionTitle(doc, 'APPROVALS & REMARKS', cy);
  const isApproved = ['Approved', 'Approved With Conditions', 'Material Allocated', 'Machine Scheduled', 'Active Booking', 'Work Completed', 'Closed', 'Completed'].includes(data.status);
  const approvalFields = [
    { label: 'Workflow Status', value: sLabel },
    { label: 'Coordinator Approval', value: isApproved ? '✓ APPROVED' : 'PENDING / REJECTED' },
    { label: 'Lab Head Approval', value: isApproved ? '✓ APPROVED' : 'PENDING / REJECTED' }
  ];
  if (data.approvedBy) approvalFields.push({ label: 'Final Approved By', value: data.approvedBy });
  if (data.approvalDate) approvalFields.push({ label: 'Action Date', value: data.approvalDate });
  if (data.remarks) approvalFields.push({ label: 'Reviewer Remarks', value: data.remarks });
  if (data.conditions) approvalFields.push({ label: 'Conditional Terms', value: data.conditions });
  
  cy = drawInfoCard(doc, approvalFields, cy);

  // Section 7: Declarations & Signatures
  cy = drawSectionTitle(doc, 'DECLARATION & SIGNATURES', cy);
  cy = ensurePage(doc, cy, 100);

  doc.fillColor(COLORS.text).font('Helvetica-Oblique').fontSize(7.5)
     .text('We agree that we will follow all safety guidelines. Any damage occurring due to improper resource usage will be the responsibility of the students/team.',
       MARGIN + 8, cy, { width: CONTENT_WIDTH - 16, align: 'center' });
  cy += 24;

  const sigY = cy;
  
  // Coordinator Sign Block
  doc.moveTo(MARGIN + 10, sigY + 35).lineTo(MARGIN + 140, sigY + 35).stroke(COLORS.border);
  doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(8)
     .text(isApproved ? '✓ SIGNED' : 'PENDING', MARGIN + 10, sigY + 12, { width: 130, align: 'center' });
  doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(8.5)
     .text('Coordinator Signature', MARGIN + 10, sigY + 39, { width: 130, align: 'center' });

  // Head Sign Block
  doc.moveTo(MARGIN + 160, sigY + 35).lineTo(MARGIN + 290, sigY + 35).stroke(COLORS.border);
  doc.fillColor(COLORS.text).font('Helvetica-Bold').fontSize(8)
     .text(isApproved ? '✓ SIGNED' : 'PENDING', MARGIN + 160, sigY + 12, { width: 130, align: 'center' });
  doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(8.5)
     .text('IDEA Lab Head Signature', MARGIN + 160, sigY + 39, { width: 130, align: 'center' });

  // Seal Area
  doc.roundedRect(MARGIN + 310, sigY, 70, 48, 5).stroke(COLORS.border);
  doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(7.5)
     .text('OFFICIAL\nSEAL', MARGIN + 310, sigY + 16, { width: 70, align: 'center' });

  // QR Code Verification
  if (data.qrData) {
    try {
      const qrBuffer = await QRCode.toBuffer(data.qrData, { width: 90, margin: 1 });
      doc.image(qrBuffer, PAGE_WIDTH - MARGIN - 80, sigY - 10, { width: 75, height: 75 });
      doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(6.5)
         .text('Scan to Verify Link', PAGE_WIDTH - MARGIN - 80, sigY + 67, { width: 75, align: 'center' });
    } catch (e) {
      console.error('QR code render error:', e);
    }
  }

  drawFooter(doc);
};

const generateSpecialRoomPdf = async (doc, data) => {
  const margin = 56.7;
  const contentWidth = 595.28 - 2 * margin;
  let currentY = margin;

  // Set default color to black for a clean black-and-white look
  doc.fillColor('#000000').strokeColor('#000000');

  // 1. Centered Header Box
  const headerHeight = 75;
  doc.rect(margin, currentY, contentWidth, headerHeight).lineWidth(1).stroke();

  // College logo inside the header box on top-left
  const logoWidth = 65;
  const logoHeight = 63;
  const logoX = margin + 8;
  const logoY = currentY + 6;

  const logo = getLogoBufferOrPath();
  if (logo) {
    try {
      doc.image(logo, logoX, logoY, { fit: [logoWidth, logoHeight], align: 'left', valign: 'center' });
    } catch (e) {
      console.error('Error rendering logo in SpecialRoomPdf:', e);
    }
  } else {
    // Draw oval border and "LOGO" text inside
    doc.lineWidth(1);
    doc.ellipse(logoX + logoWidth / 2, logoY + logoHeight / 2, logoWidth / 2, logoHeight / 2).stroke();
    doc.font('Times-Roman').fontSize(8);
    doc.text('COLLEGE\nLOGO', logoX, logoY + logoHeight / 2 - 8, { width: logoWidth, align: 'center' });
  }

  // Centered Header Box Text
  doc.font('Times-Bold').fontSize(13);
  doc.text('AICTE IDEA Lab and Innovation Centre', margin, currentY + 12, { width: contentWidth, align: 'center' });

  doc.fontSize(11.5);
  doc.text('K. K. Wagh Institute of Engineering Education and Research', margin, currentY + 30, { width: contentWidth, align: 'center' });

  doc.font('Times-Roman').fontSize(9.5);
  doc.text('Hirabai Haridas Vidyanagari, Amrutdham, Panchavati, Nashik - 422003', margin, currentY + 48, { width: contentWidth, align: 'center' });

  currentY += headerHeight + 18;

  // 2. Form Title
  doc.font('Times-Bold').fontSize(11.5);
  doc.text('Request Form for Conference Room / Discussion Room / Ideation Room', margin, currentY, { align: 'center', underline: true });
  
  currentY += 24;

  // 3. Letter Section
  doc.font('Times-Roman').fontSize(10.5);
  doc.text('To,', margin, currentY);
  doc.text('The Director', margin, currentY + 14);
  doc.text('K. K. Wagh Institute of Engineering Education and Research,', margin, currentY + 28);
  doc.text('Nashik', margin, currentY + 42);

  const currentDate = data.header.applicationDate || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(`Date: ${currentDate}`, 595.28 - margin - 200, currentY, { width: 200, align: 'right' });

  currentY += 62;

  // 4. Opening Paragraph
  doc.text('Respected Sir,', margin, currentY);
  doc.text('We need the following facility of the AICTE IDEA Lab and Innovation Centre for the purpose mentioned below.', margin, currentY + 16, { width: contentWidth });
  
  currentY += 42;

  // 5. Main Information Table
  const col1Width = 180;
  const col2Width = contentWidth - col1Width;

  const rows = [
    {
      label: 'Facility Required',
      value: data.room.facilityRequired || '',
      height: 25
    },
    {
      label: 'Date and Time',
      value: `${data.schedule.requestedDate || ''}\n${data.schedule.timeSlot || ''}`,
      height: 30
    },
    {
      label: 'Name of Requester (Mobile and Email ID)',
      value: `${data.student.name || ''}\nMobile: ${data.student.mobile || 'N/A'}  |  Email: ${data.student.email || 'N/A'}`,
      height: 35
    },
    {
      label: 'Purpose',
      value: data.room.purpose || '',
      height: 60 // increased height
    },
    {
      label: 'Recommendation of the Teaching Faculty in Case of Student Request',
      value: data.faculty.remarks || '',
      height: 50 // large multiline area
    },
    {
      label: 'Name of Recommending Faculty (Mobile and Email ID)',
      value: `${data.faculty.name || ''}\nMobile: ${data.faculty.mobile || 'N/A'}  |  Email: ${data.faculty.email || 'N/A'}`,
      height: 35
    },
    {
      label: 'Remark of the AICTE IDEA Lab & Innovation Centre Coordinator',
      value: '', // Custom handled for decision highlighting
      height: 35
    }
  ];

  const tableTop = currentY;
  const tableHeight = rows.reduce((acc, r) => acc + r.height, 0);

  // Draw table outline
  doc.rect(margin, tableTop, contentWidth, tableHeight).lineWidth(1).stroke();

  // Draw vertical column divider
  doc.moveTo(margin + col1Width, tableTop).lineTo(margin + col1Width, tableTop + tableHeight).stroke();

  let rowY = tableTop;
  rows.forEach((row, i) => {
    // Draw horizontal separator
    if (i > 0) {
      doc.moveTo(margin, rowY).lineTo(margin + contentWidth, rowY).stroke();
    }

    // Label column (Left)
    doc.font('Times-Bold').fontSize(9);
    doc.text(row.label, margin + 8, rowY + 6, { width: col1Width - 16 });

    // Value column (Right)
    doc.font('Times-Roman').fontSize(9);

    if (i === rows.length - 1) {
      // Coordinator Remark cell (Permitted / Not Permitted / Permitted with Condition)
      const status = (data.status || '').toLowerCase();
      let permitted = 'Permitted';
      let notPermitted = 'Not Permitted';
      let conditional = 'Permitted with Condition';

      if (status === 'approved' || status === 'completed') {
        permitted = '[X] Permitted';
        notPermitted = '[  ] Not Permitted';
        conditional = '[  ] Permitted with Condition';
      } else if (status === 'rejected') {
        permitted = '[  ] Permitted';
        notPermitted = '[X] Not Permitted';
        conditional = '[  ] Permitted with Condition';
      } else if (status === 'conditional approval') {
        permitted = '[  ] Permitted';
        notPermitted = '[  ] Not Permitted';
        conditional = '[X] Permitted with Condition';
      }

      doc.text(`${permitted}   /   ${notPermitted}   /   ${conditional}`, margin + col1Width + 8, rowY + 12, { width: col2Width - 16 });
    } else {
      // Normal cells
      doc.text(String(row.value), margin + col1Width + 8, rowY + 6, { width: col2Width - 16 });
    }

    rowY += row.height;
  });

  currentY = tableTop + tableHeight + 15;

  // 6. Approval Workflow Section
  const blockY = currentY;
  const blockHeight = 50;

  // Resolve coordinator and head names/statuses from history
  const approvalHistory = data.approvalHistory || [];

  // Faculty status
  let facultyStatus = 'Pending';
  if (data.faculty.verified === 'RECOMMENDED') {
    facultyStatus = 'Recommended';
  } else {
    const facHist = approvalHistory.find(h => h.role === 'Faculty');
    if (facHist) {
      if (facHist.action === 'Verified') facultyStatus = 'Recommended';
      else if (facHist.action === 'Rejected') facultyStatus = 'Not Recommended';
    }
  }

  // Coordinator status & name
  const coordHist = approvalHistory.find(h => h.role === 'Coordinator' && (h.action === 'Coordinator Approved' || h.action === 'Approved' || h.action === 'Rejected' || h.action === 'Changes Requested'));
  const coordinatorName = coordHist ? coordHist.byName : '';
  let coordinatorStatus = 'Pending';
  if (coordHist) {
    if (coordHist.action === 'Coordinator Approved' || coordHist.action === 'Approved') {
      coordinatorStatus = 'Approved';
    } else if (coordHist.action === 'Rejected') {
      coordinatorStatus = 'Rejected';
    }
  } else if (['IDEA Hub Head Review', 'Approved', 'Conditional Approval'].includes(data.status)) {
    coordinatorStatus = 'Approved';
  }

  // Head status & name
  const headHist = approvalHistory.find(h => h.role === 'Head' && (h.action === 'Approved' || h.action === 'Conditional Approval' || h.action === 'Rejected'));
  const headName = headHist ? headHist.byName : '';
  let headStatus = 'Pending';
  if (headHist) {
    if (headHist.action === 'Approved' || headHist.action === 'Conditional Approval') {
      headStatus = 'Approved';
    } else if (headHist.action === 'Rejected') {
      headStatus = 'Rejected';
    }
  } else if (['Approved', 'Conditional Approval'].includes(data.status)) {
    headStatus = 'Approved';
  }

  // Column 1: Faculty Recommendation
  let colX = margin;
  doc.font('Times-Bold').fontSize(9);
  doc.text('Faculty Recommendation', colX, blockY, { width: 130 });
  doc.font('Times-Roman').fontSize(8.5);
  doc.text(`Faculty Name: ${data.faculty.name || 'N/A'}`, colX, blockY + 14, { width: 130 });
  doc.text(`Status: ${facultyStatus}`, colX, blockY + 26, { width: 130 });

  // Column 2: Coordinator Approval
  colX = margin + 140;
  doc.font('Times-Bold').fontSize(9);
  doc.text('Coordinator Approval', colX, blockY, { width: 130 });
  doc.font('Times-Roman').fontSize(8.5);
  doc.text(`Coordinator Name: ${coordinatorName || 'N/A'}`, colX, blockY + 14, { width: 130 });
  doc.text(`Status: ${coordinatorStatus}`, colX, blockY + 26, { width: 130 });

  // Column 3: Head Approval
  colX = margin + 280;
  doc.font('Times-Bold').fontSize(9);
  doc.text('Head Approval', colX, blockY, { width: 130 });
  doc.font('Times-Roman').fontSize(8.5);
  doc.text(`Head Name: ${headName || 'N/A'}`, colX, blockY + 14, { width: 130 });
  doc.text(`Status: ${headStatus}`, colX, blockY + 26, { width: 130 });

  // QR Code on the bottom right
  const qrSize = 65;
  const qrX = 595.28 - margin - qrSize;
  const qrY = blockY + 5;

  const frontendUrl = process.env.FRONTEND_ORIGIN || process.env.FRONTEND_URL || 'https://ideahub-app.onrender.com';
  const qrText = data.qrData || `${frontendUrl}/verify-room-permission/${data.header.requestId || 'N/A'}`;

  try {
    const qrBuffer = await QRCode.toBuffer(qrText, { width: qrSize, margin: 1 });
    doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
    doc.font('Times-Roman').fontSize(6.5);
    doc.text('Scan to Verify', qrX, qrY + qrSize + 2, { width: qrSize, align: 'center' });
  } catch (e) {
    console.error('QR generation error:', e);
  }

  currentY = blockY + blockHeight + 15;

  // 7. Footer Notes
  doc.moveTo(margin, currentY).lineTo(595.28 - margin, currentY).lineWidth(0.8).stroke();
  currentY += 8;

  doc.font('Times-Bold').fontSize(9);
  doc.text('Note:', margin, currentY);

  doc.font('Times-Roman').fontSize(8.5);
  doc.text('1. Submitting the request form does not mean that permission is granted.', margin + 10, currentY + 12);
  doc.text('2. All facilities must be used with utmost care.', margin + 10, currentY + 24);
};

const generateRoomUsageReportPdf = async (doc, data) => {
  const margin = 30;
  const contentWidth = 595.28 - 2 * margin;
  let currentY = margin;

  // Header Box
  const topHeaderHeight = 70;
  doc.rect(margin, currentY, contentWidth, topHeaderHeight).lineWidth(1.2).strokeColor('#1a237e').stroke();

  // College / IDEA Lab Logo on Left
  const logo = getLogoBufferOrPath();
  const logoWidth = 65;
  const logoHeight = 56;
  const logoX = margin + 8;
  const logoY = currentY + (topHeaderHeight - logoHeight) / 2;

  if (logo) {
    try {
      doc.image(logo, logoX, logoY, { fit: [logoWidth, logoHeight], align: 'left', valign: 'center' });
    } catch (e) {
      console.error('Error drawing logo in RoomUsageReport:', e);
    }
  }

  // Header Text
  const textX = margin + logoWidth + 10;
  const textWidth = contentWidth - (logoWidth + 10) * 2;

  doc.fillColor('#1a237e').font('Times-Bold').fontSize(12);
  doc.text('AICTE IDEA Lab and Innovation Centre', textX, currentY + 10, { width: textWidth, align: 'center' });
  doc.fillColor('#212121').font('Times-Roman').fontSize(9.5);
  doc.text('K. K. Wagh Institute of Engineering Education and Research, Nashik', textX, currentY + 26, { width: textWidth, align: 'center' });
  doc.fillColor('#283593').font('Times-Bold').fontSize(10.5);
  doc.text(`Room Usage Report (${data.dateRangeStr})`, textX, currentY + 42, { width: textWidth, align: 'center' });

  currentY += topHeaderHeight + 15;

  // Table Columns
  // 1. Request ID (75)
  // 2. Room (80)
  // 3. Student Name (85)
  // 4. Project Name (110)
  // 5. Date (60)
  // 6. Time (70)
  // 7. Status (55)
  const colWidths = [75, 80, 85, 110, 60, 70, 55];
  const colHeaders = ['Request ID', 'Room', 'Student', 'Project', 'Date', 'Time Slot', 'Status'];

  const rowHeight = 22;
  const headerHeight = 24;

  // Draw Table Header
  doc.rect(margin, currentY, contentWidth, headerHeight).fill('#1a237e');
  doc.fillColor('#ffffff').font('Times-Bold').fontSize(8);
  
  let headerX = margin;
  colHeaders.forEach((h, idx) => {
    doc.text(h, headerX + 4, currentY + 7, { width: colWidths[idx] - 8, align: 'left' });
    headerX += colWidths[idx];
  });

  currentY += headerHeight;

  doc.fillColor('#000000').font('Times-Roman').fontSize(7);

  data.requests.forEach((r, rIdx) => {
    // Page break check
    if (currentY > 770) {
      doc.addPage();
      currentY = margin;
      
      // Redraw Table Header on new page
      doc.rect(margin, currentY, contentWidth, headerHeight).fill('#1a237e');
      doc.fillColor('#ffffff').font('Times-Bold').fontSize(8);
      
      let newHeaderX = margin;
      colHeaders.forEach((h, idx) => {
        doc.text(h, newHeaderX + 4, currentY + 7, { width: colWidths[idx] - 8, align: 'left' });
        newHeaderX += colWidths[idx];
      });
      currentY += headerHeight;
      doc.fillColor('#000000').font('Times-Roman').fontSize(7);
    }

    // Zebra striping
    if (rIdx % 2 === 1) {
      doc.rect(margin, currentY, contentWidth, rowHeight).fill('#f5f5f5');
    }

    // Bottom border
    doc.moveTo(margin, currentY + rowHeight).lineTo(margin + contentWidth, currentY + rowHeight).lineWidth(0.5).strokeColor('#bdbdbd').stroke();

    doc.fillColor('#000000');
    let cellX = margin;
    
    const timeStr = `${r.schedule.startTime} - ${r.schedule.endTime}`;
    const studentName = r.applicantDetails?.applicantName || 'N/A';
    const projectName = r.teamDetails?.projectName || 'N/A';
    
    // Draw cells
    doc.text(r.requestId, cellX + 4, currentY + 6, { width: colWidths[0] - 8, height: rowHeight - 8, ellipsis: true });
    cellX += colWidths[0];
    
    doc.text(r.facilityRequired, cellX + 4, currentY + 6, { width: colWidths[1] - 8, height: rowHeight - 8, ellipsis: true });
    cellX += colWidths[1];
    
    doc.text(studentName, cellX + 4, currentY + 6, { width: colWidths[2] - 8, height: rowHeight - 8, ellipsis: true });
    cellX += colWidths[2];
    
    doc.text(projectName, cellX + 4, currentY + 6, { width: colWidths[3] - 8, height: rowHeight - 8, ellipsis: true });
    cellX += colWidths[3];
    
    doc.text(r.schedule?.requestedDate || 'N/A', cellX + 4, currentY + 6, { width: colWidths[4] - 8, height: rowHeight - 8 });
    cellX += colWidths[4];
    
    doc.text(timeStr, cellX + 4, currentY + 6, { width: colWidths[5] - 8, height: rowHeight - 8 });
    cellX += colWidths[5];
    
    doc.text(r.status, cellX + 4, currentY + 6, { width: colWidths[6] - 8, height: rowHeight - 8, ellipsis: true });
    
    currentY += rowHeight;
  });

  // Footer Note
  currentY += 15;
  if (currentY > 770) {
    doc.addPage();
    currentY = margin;
  }
  doc.font('Times-Italic').fontSize(8).fillColor('#616161');
  doc.text(`Total Records Found: ${data.requests.length}`, margin, currentY);
  
  // Footer text on all pages
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    const fy = PAGE_HEIGHT - 35;
    doc.moveTo(margin, fy).lineTo(595.28 - margin, fy).lineWidth(0.5).strokeColor('#bdbdbd').stroke();
    doc.font('Times-Roman').fontSize(7).fillColor('#616161')
       .text(`AICTE IDEA Lab & Innovation Centre Room Usage Report - Page ${i + 1} of ${pages.count}`, margin, fy + 5, { width: contentWidth, align: 'center' });
  }
};

const generateMachineryUsageReportPdf = async (doc, data) => {
  const margin = 30;
  const contentWidth = 595.28 - 2 * margin;
  let currentY = margin;

  // Header Box
  const topHeaderHeight = 70;
  doc.rect(margin, currentY, contentWidth, topHeaderHeight).lineWidth(1.2).strokeColor('#1a237e').stroke();

  // College / IDEA Lab Logo on Left
  const logo = getLogoBufferOrPath();
  const logoWidth = 65;
  const logoHeight = 56;
  const logoX = margin + 8;
  const logoY = currentY + (topHeaderHeight - logoHeight) / 2;

  if (logo) {
    try {
      doc.image(logo, logoX, logoY, { fit: [logoWidth, logoHeight], align: 'left', valign: 'center' });
    } catch (e) {
      console.error('Error drawing logo in MachineryUsageReport:', e);
    }
  }

  // Header Text
  const textX = margin + logoWidth + 10;
  const textWidth = contentWidth - (logoWidth + 10) * 2;

  doc.fillColor('#1a237e').font('Times-Bold').fontSize(12);
  doc.text('AICTE IDEA Lab and Innovation Centre', textX, currentY + 10, { width: textWidth, align: 'center' });
  doc.fillColor('#212121').font('Times-Roman').fontSize(9.5);
  doc.text('K. K. Wagh Institute of Engineering Education and Research, Nashik', textX, currentY + 26, { width: textWidth, align: 'center' });
  doc.fillColor('#283593').font('Times-Bold').fontSize(10.5);
  doc.text(`Machinery Usage Report (${data.dateRangeStr})`, textX, currentY + 42, { width: textWidth, align: 'center' });

  currentY += topHeaderHeight + 15;

  // Table Columns
  // 1. Request ID (65)
  // 2. Type (50)
  // 3. Applicant Name (75)
  // 4. Machine Booked (85)
  // 5. Project Name (85)
  // 6. Date (55)
  // 7. Time Slot (70)
  // 8. Status (50)
  const colWidths = [65, 50, 75, 85, 85, 55, 70, 50];
  const colHeaders = ['Request ID', 'Type', 'Applicant', 'Machine', 'Project', 'Date', 'Time Slot', 'Status'];

  const rowHeight = 22;
  const headerHeight = 24;

  // Draw Table Header
  doc.rect(margin, currentY, contentWidth, headerHeight).fill('#1a237e');
  doc.fillColor('#ffffff').font('Times-Bold').fontSize(8);
  
  let headerX = margin;
  colHeaders.forEach((h, idx) => {
    doc.text(h, headerX + 4, currentY + 7, { width: colWidths[idx] - 8, align: 'left' });
    headerX += colWidths[idx];
  });

  currentY += headerHeight;

  doc.fillColor('#000000').font('Times-Roman').fontSize(7);

  let flatBookings = [];
  data.requests.forEach(r => {
    const isExt = r.applicantType === 'External';
    const applicantName = isExt ? r.externalFullName : (r.students?.[0]?.name || 'N/A');
    
    r.requestedMachines.forEach(m => {
      flatBookings.push({
        requestId: r.requestId,
        applicantType: r.applicantType || 'Internal',
        applicantName,
        projectName: r.projectName || 'N/A',
        machineName: m.machineId?.name || m.machineName || 'N/A',
        usageDate: m.usageDate ? new Date(m.usageDate).toLocaleDateString('en-IN') : 'N/A',
        timeSlot: `${m.startTime} - ${m.endTime}`,
        status: r.status
      });
    });
  });

  flatBookings.forEach((b, rIdx) => {
    // Page break check
    if (currentY > 770) {
      doc.addPage();
      currentY = margin;
      
      // Redraw Table Header on new page
      doc.rect(margin, currentY, contentWidth, headerHeight).fill('#1a237e');
      doc.fillColor('#ffffff').font('Times-Bold').fontSize(8);
      
      let newHeaderX = margin;
      colHeaders.forEach((h, idx) => {
        doc.text(h, newHeaderX + 4, currentY + 7, { width: colWidths[idx] - 8, align: 'left' });
        newHeaderX += colWidths[idx];
      });
      currentY += headerHeight;
      doc.fillColor('#000000').font('Times-Roman').fontSize(7);
    }

    // Zebra striping
    if (rIdx % 2 === 1) {
      doc.rect(margin, currentY, contentWidth, rowHeight).fill('#f5f5f5');
    }

    // Bottom border
    doc.moveTo(margin, currentY + rowHeight).lineTo(margin + contentWidth, currentY + rowHeight).lineWidth(0.5).strokeColor('#bdbdbd').stroke();

    doc.fillColor('#000000');
    let cellX = margin;
    
    // Draw cells
    doc.text(b.requestId, cellX + 4, currentY + 6, { width: colWidths[0] - 8, height: rowHeight - 8, ellipsis: true });
    cellX += colWidths[0];
    
    doc.text(b.applicantType, cellX + 4, currentY + 6, { width: colWidths[1] - 8, height: rowHeight - 8, ellipsis: true });
    cellX += colWidths[1];
    
    doc.text(b.applicantName, cellX + 4, currentY + 6, { width: colWidths[2] - 8, height: rowHeight - 8, ellipsis: true });
    cellX += colWidths[2];
    
    doc.text(b.machineName, cellX + 4, currentY + 6, { width: colWidths[3] - 8, height: rowHeight - 8, ellipsis: true });
    cellX += colWidths[3];
    
    doc.text(b.projectName, cellX + 4, currentY + 6, { width: colWidths[4] - 8, height: rowHeight - 8, ellipsis: true });
    cellX += colWidths[4];
    
    doc.text(b.usageDate, cellX + 4, currentY + 6, { width: colWidths[5] - 8, height: rowHeight - 8 });
    cellX += colWidths[5];
    
    doc.text(b.timeSlot, cellX + 4, currentY + 6, { width: colWidths[6] - 8, height: rowHeight - 8 });
    cellX += colWidths[6];
    
    doc.text(b.status, cellX + 4, currentY + 6, { width: colWidths[7] - 8, height: rowHeight - 8, ellipsis: true });
    
    currentY += rowHeight;
  });

  // Footer Note
  currentY += 15;
  if (currentY > 770) {
    doc.addPage();
    currentY = margin;
  }
  doc.font('Times-Italic').fontSize(8).fillColor('#616161');
  doc.text(`Total Records Found: ${flatBookings.length}`, margin, currentY);
  
  // Footer text on all pages
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    const fy = PAGE_HEIGHT - 35;
    doc.moveTo(margin, fy).lineTo(595.28 - margin, fy).lineWidth(0.5).strokeColor('#bdbdbd').stroke();
    doc.font('Times-Roman').fontSize(7).fillColor('#616161')
       .text(`AICTE IDEA Lab & Innovation Centre Machinery Usage Report - Page ${i + 1} of ${pages.count}`, margin, fy + 5, { width: contentWidth, align: 'center' });
  }
};

const generatePdf = async (type, data, outputPath) => {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const docMargin = type === 'specialRoom' ? 56.7 : (type === 'roomUsageReport' || type === 'machineryUsageReport' ? 30 : MARGIN);
  const doc = new PDFDocument({ margin: docMargin, size: 'A4', layout: 'portrait', bufferPages: true });

  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    (async () => {
      try {
        if (type === 'room') {
          await generateRoomPdf(doc, data);
        } else if (type === 'specialRoom') {
          await generateSpecialRoomPdf(doc, data);
        } else if (type === 'roomUsageReport') {
          await generateRoomUsageReportPdf(doc, data);
        } else if (type === 'machineryUsageReport') {
          await generateMachineryUsageReportPdf(doc, data);
        } else {
          await generateMachineryPdf(doc, data);
        }
        doc.end();
      } catch (err) {
        reject(err);
      }
    })();

    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
};

export default generatePdf;
