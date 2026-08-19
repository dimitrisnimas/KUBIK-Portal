const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const REGULAR_FONT = require.resolve('dejavu-fonts-ttf/ttf/DejaVuSans.ttf');
const BOLD_FONT = require.resolve('dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf');

const money = (value) => new Intl.NumberFormat('el-GR', {
  style: 'currency',
  currency: 'EUR',
}).format(Number(value) || 0);

const date = (value) => new Intl.DateTimeFormat('el-GR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
}).format(new Date(value));

const statusLabel = (status) => ({
  paid: 'Εξοφλημένο',
  pending: 'Σε αναμονή',
  overdue: 'Εκπρόθεσμο',
  cancelled: 'Ακυρωμένο',
}[status] || String(status || '—'));

const safeFilenamePart = (value) => String(value || 'invoice')
  .normalize('NFKD')
  .replace(/[^a-zA-Z0-9_-]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 80) || 'invoice';

const invoicePdfFilename = (invoice) => `${safeFilenamePart(invoice.invoice_number)}.pdf`;

function addRow(doc, label, value, y, options = {}) {
  const { bold = false, large = false } = options;
  doc.font('regular').fontSize(10).fillColor('#64748b').text(label, 56, y, { width: 210 });
  doc.font(bold ? 'bold' : 'regular')
    .fontSize(large ? 15 : 10)
    .fillColor('#0f172a')
    .text(String(value ?? '—'), 280, y, { width: 260, align: 'right' });
}

function generateInvoicePdf(invoice) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: 'A4', margin: 0, info: {
      Title: `Demo invoice ${invoice.invoice_number}`,
      Author: 'KUBIK Portal Demo',
      Subject: 'Demonstration invoice — not a tax document',
    } });

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.registerFont('regular', REGULAR_FONT);
    doc.registerFont('bold', BOLD_FONT);

    doc.rect(0, 0, 595.28, 132).fill('#0f172a');
    doc.font('regular').fontSize(10).fillColor('#94a3b8')
      .text('KUBIK PORTAL', 56, 42, { characterSpacing: 1.4 });
    doc.font('bold').fontSize(25).fillColor('#ffffff')
      .text('Demo Τιμολόγιο', 56, 65);
    doc.font('regular').fontSize(11).fillColor('#cbd5e1')
      .text(String(invoice.invoice_number || '—'), 330, 72, { width: 210, align: 'right' });

    doc.roundedRect(56, 158, 483, 55, 8).fill('#fff7ed').stroke('#fed7aa');
    doc.font('bold').fontSize(10).fillColor('#9a3412')
      .text('ΕΓΓΡΑΦΟ ΕΠΙΔΕΙΞΗΣ', 72, 172);
    doc.font('regular').fontSize(9).fillColor('#9a3412')
      .text('Δεν αποτελεί φορολογικό παραστατικό ή απαίτηση πληρωμής.', 72, 188);

    doc.font('bold').fontSize(13).fillColor('#0f172a').text('Στοιχεία', 56, 245);
    addRow(doc, 'Πελάτης', invoice.customer_name || 'Demo πελάτης', 278);
    addRow(doc, 'Email', invoice.customer_email || '—', 300);
    addRow(doc, 'Υπηρεσία', invoice.asset_name || 'Demo υπηρεσία', 322);
    addRow(doc, 'Περιγραφή', invoice.description || 'Υπηρεσίες KUBIK Portal', 344);
    addRow(doc, 'Ημερομηνία έκδοσης', date(invoice.created_at || new Date()), 366);
    addRow(doc, 'Ημερομηνία λήξης', date(invoice.due_date), 388);
    addRow(doc, 'Κατάσταση', statusLabel(invoice.status), 410, { bold: true });

    doc.moveTo(56, 452).lineTo(539, 452).strokeColor('#e2e8f0').stroke();
    doc.font('bold').fontSize(13).fillColor('#0f172a').text('Ανάλυση ποσού', 56, 478);
    addRow(doc, 'Καθαρή αξία', money(invoice.amount), 514);
    addRow(doc, 'ΦΠΑ', money(invoice.vat_amount), 540);
    doc.moveTo(280, 570).lineTo(539, 570).strokeColor('#cbd5e1').stroke();
    addRow(doc, 'Σύνολο', money(invoice.total_amount), 588, { bold: true, large: true });

    doc.font('regular').fontSize(8).fillColor('#94a3b8')
      .text('Δημιουργήθηκε αυτόματα από το KUBIK Portal Demo.', 56, 785, {
        width: 483,
        align: 'center',
      });
    doc.end();
  });
}

async function prepareInvoicePdf(invoice) {
  if (invoice.file_path && fs.existsSync(invoice.file_path)) {
    return {
      filename: invoice.filename || path.basename(invoice.file_path),
      path: invoice.file_path,
      generated: false,
    };
  }

  return {
    filename: invoicePdfFilename(invoice),
    content: await generateInvoicePdf(invoice),
    generated: true,
  };
}

module.exports = {
  generateInvoicePdf,
  invoicePdfFilename,
  prepareInvoicePdf,
};
