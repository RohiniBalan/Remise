const PDFDocument = require('pdfkit');

/**
 * Generates a clean, professional PDF invoice for a completed order.
 * @param {Object} invoiceData Structured invoice details
 * @param {import('stream').Writable} res Output writable stream (Express response or buffer stream)
 */
function generateInvoicePdf(invoiceData, res) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: {
      Title: `Invoice - ${invoiceData.orderId}`,
      Author: invoiceData.store?.name || 'Remise Marketplace',
      Subject: `Order Invoice ${invoiceData.orderId}`,
    }
  });

  doc.pipe(res);

  const primaryColor = '#0F766E'; // Teal-700
  const darkTextColor = '#1E293B'; // Slate-800
  const lightTextColor = '#64748B'; // Slate-500
  const borderColor = '#E2E8F0'; // Slate-200
  const accentBg = '#F0FDFA'; // Teal-50
  const successColor = '#16A34A'; // Green-600

  // ── HEADER ──────────────────────────────────────────────────────────
  // Store Branding (Left)
  doc.rect(40, 40, 515, 75).fill(accentBg);
  
  doc.fillColor(primaryColor)
     .font('Helvetica-Bold')
     .fontSize(20)
     .text(invoiceData.store?.name || 'REMISE STORE', 55, 52);

  doc.fillColor(lightTextColor)
     .font('Helvetica')
     .fontSize(9);

  let storeMetaY = 76;
  const storeContactParts = [];
  if (invoiceData.store?.phone) storeContactParts.push(`Tel: ${invoiceData.store.phone}`);
  if (invoiceData.store?.email) storeContactParts.push(`Email: ${invoiceData.store.email}`);
  if (invoiceData.store?.upiId) storeContactParts.push(`UPI: ${invoiceData.store.upiId}`);
  
  if (storeContactParts.length > 0) {
    doc.text(storeContactParts.join('  |  '), 55, storeMetaY);
    storeMetaY += 12;
  }
  
  if (invoiceData.store?.address) {
    const addr = typeof invoiceData.store.address === 'string'
      ? invoiceData.store.address
      : [invoiceData.store.address.street, invoiceData.store.address.city, invoiceData.store.address.state, invoiceData.store.address.pinCode].filter(Boolean).join(', ');
    if (addr) doc.text(addr, 55, storeMetaY);
  }

  // Invoice Title & Status (Right)
  doc.fillColor(darkTextColor)
     .font('Helvetica-Bold')
     .fontSize(16)
     .text('TAX INVOICE', 360, 52, { align: 'right', width: 180 });

  const isCod = invoiceData.paymentMethod === 'cod' || invoiceData.paymentMethod === 'cash';
  const isPaid = invoiceData.paymentStatus === 'SUCCESS';

  const statusBadgeText = isPaid
    ? '● PAYMENT CONFIRMED (PAID)'
    : isCod
    ? '● CASH ON DELIVERY (PLACED)'
    : '● PAYMENT PENDING';

  const statusBadgeColor = isPaid ? successColor : (isCod ? '#0D9488' : '#D97706');

  doc.fillColor(statusBadgeColor)
     .font('Helvetica-Bold')
     .fontSize(10)
     .text(statusBadgeText, 360, 72, { align: 'right', width: 180 });

  doc.fillColor(lightTextColor)
     .font('Helvetica')
     .fontSize(9)
     .text(`Invoice Date: ${invoiceData.invoiceDateFormatted || new Date().toLocaleDateString('en-IN')}`, 360, 88, { align: 'right', width: 180 });

  doc.moveDown();

  // ── INVOICE META & CUSTOMER DETAILS (2 Columns) ──────────────────────
  const detailsY = 130;
  
  // Left Column: Billed To
  doc.rect(40, detailsY, 250, 115).stroke(borderColor);
  doc.rect(40, detailsY, 250, 24).fill('#F8FAFC');
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10).text('BILLED TO (CUSTOMER)', 50, detailsY + 7);

  doc.fillColor(darkTextColor).font('Helvetica-Bold').fontSize(10).text(invoiceData.customer?.name || 'Customer', 50, detailsY + 32);
  
  doc.font('Helvetica').fontSize(9).fillColor(lightTextColor);
  let custY = detailsY + 46;
  if (invoiceData.customer?.phone) {
    doc.text(`Phone: ${invoiceData.customer.phone}`, 50, custY);
    custY += 13;
  }
  if (invoiceData.customer?.email) {
    doc.text(`Email: ${invoiceData.customer.email}`, 50, custY);
    custY += 13;
  }
  if (invoiceData.customer?.address) {
    doc.text(`Address: ${invoiceData.customer.address}`, 50, custY, { width: 230, lineBreak: true });
  }

  // Right Column: Order & Payment Info
  doc.rect(305, detailsY, 250, 115).stroke(borderColor);
  doc.rect(305, detailsY, 250, 24).fill('#F8FAFC');
  doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(10).text('ORDER & PAYMENT DETAILS', 315, detailsY + 7);

  doc.font('Helvetica').fontSize(9).fillColor(darkTextColor);
  let orderMetaY = detailsY + 32;

  const renderMetaRow = (label, val, isBold = false) => {
    doc.font('Helvetica').fillColor(lightTextColor).text(label, 315, orderMetaY);
    doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fillColor(darkTextColor).text(val, 410, orderMetaY, { width: 135, align: 'right' });
    orderMetaY += 15;
  };

  renderMetaRow('Order ID:', invoiceData.orderId, true);
  renderMetaRow('Payment ID:', invoiceData.paymentId || invoiceData.orderId);
  renderMetaRow('Payment Mode:', invoiceData.paymentMethodFormatted || (isCod ? 'Cash on Delivery' : 'UPI / QR Payment'));
  renderMetaRow('Delivery Mode:', invoiceData.deliveryMethodFormatted || 'Standard Delivery');
  renderMetaRow('Payment Status:', isPaid ? 'SUCCESS (VERIFIED)' : (isCod ? 'PAYABLE ON DELIVERY (COD)' : 'PENDING'), true);


  // ── LINE ITEMS TABLE ────────────────────────────────────────────────
  const tableTop = 265;
  
  // Table Header
  doc.rect(40, tableTop, 515, 24).fill(primaryColor);
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
  doc.text('#', 48, tableTop + 7, { width: 25 });
  doc.text('Item Description', 78, tableTop + 7, { width: 250 });
  doc.text('Qty', 335, tableTop + 7, { width: 45, align: 'center' });
  doc.text('Unit Price', 390, tableTop + 7, { width: 75, align: 'right' });
  doc.text('Amount', 475, tableTop + 7, { width: 70, align: 'right' });

  let rowY = tableTop + 24;
  const items = invoiceData.items || [];

  items.forEach((item, index) => {
    const isEven = index % 2 === 0;
    if (isEven) {
      doc.rect(40, rowY, 515, 24).fill('#F8FAFC');
    }
    doc.rect(40, rowY, 515, 24).stroke(borderColor);

    doc.fillColor(darkTextColor).font('Helvetica').fontSize(9);
    doc.text(String(index + 1), 48, rowY + 7, { width: 25 });
    
    let title = item.title || 'Product';
    if (item.brand) title = `[${item.brand}] ${title}`;
    if (item.tierLabel) title += ` (${item.tierLabel})`;
    doc.text(title, 78, rowY + 7, { width: 250, ellipsis: true });

    doc.text(String(item.quantity || 1), 335, rowY + 7, { width: 45, align: 'center' });
    doc.text(`Rs. ${(item.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 390, rowY + 7, { width: 75, align: 'right' });
    
    const lineTotal = (item.price || 0) * (item.quantity || 1);
    doc.font('Helvetica-Bold').text(`Rs. ${lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 475, rowY + 7, { width: 70, align: 'right' });

    rowY += 24;
  });

  // ── FINANCIAL SUMMARY ───────────────────────────────────────────────
  const summaryTop = Math.max(rowY + 15, 420);
  const summaryLeft = 320;
  const summaryWidth = 235;

  doc.rect(summaryLeft, summaryTop, summaryWidth, 95).stroke(borderColor);

  let sumY = summaryTop + 10;
  const renderSummaryLine = (label, val) => {
    doc.font('Helvetica').fontSize(9).fillColor(lightTextColor).text(label, summaryLeft + 12, sumY);
    doc.font('Helvetica').fontSize(9).fillColor(darkTextColor).text(val, summaryLeft + 110, sumY, { width: 110, align: 'right' });
    sumY += 16;
  };

  const subtotal = invoiceData.summary?.subtotal || invoiceData.totalAmount || 0;
  const tax = invoiceData.summary?.tax || 0;
  const shipping = invoiceData.summary?.shipping || 0;
  const discount = invoiceData.summary?.discount || 0;
  const total = invoiceData.summary?.totalAmount || invoiceData.totalAmount || subtotal;

  renderSummaryLine('Items Subtotal:', `Rs. ${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  if (discount > 0) renderSummaryLine('Discount:', `- Rs. ${discount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  renderSummaryLine('Delivery / Shipping:', shipping === 0 ? 'FREE' : `Rs. ${shipping.toFixed(2)}`);
  renderSummaryLine('Taxes (GST):', tax === 0 ? 'Included' : `Rs. ${tax.toFixed(2)}`);

  // Total Highlight Box
  doc.rect(summaryLeft, sumY, summaryWidth, 25).fill(accentBg);
  doc.rect(summaryLeft, sumY, summaryWidth, 25).stroke(primaryColor);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(primaryColor).text(isPaid ? 'TOTAL PAID:' : (isCod ? 'TOTAL DUE (COD):' : 'TOTAL AMOUNT:'), summaryLeft + 12, sumY + 7);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(primaryColor).text(`Rs. ${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, summaryLeft + 100, sumY + 7, { width: 120, align: 'right' });

  // ── FOOTER ──────────────────────────────────────────────────────────
  const footerY = 730;
  doc.strokeColor(borderColor).lineWidth(1).moveTo(40, footerY).lineTo(555, footerY).stroke();

  doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor)
     .text('Thank you for your order!', 40, footerY + 10, { align: 'center', width: 515 });

  const footerText = isCod
    ? 'This is a verified computer-generated order bill / invoice. Payable via Cash on Delivery.'
    : 'This is a verified computer-generated tax invoice. Payment received via official UPI / QR integration.';

  doc.font('Helvetica').fontSize(8).fillColor(lightTextColor)
     .text(footerText, 40, footerY + 24, { align: 'center', width: 515 });


  doc.end();
}

module.exports = { generateInvoicePdf };
