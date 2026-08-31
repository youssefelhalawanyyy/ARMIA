import { Order } from '@/types';

/**
 * Generate standalone, self-contained HTML for an official A4 Printable Invoice.
 * Designed to fit cleanly on EXACTLY 1 page of A4 without any page overflow or dark modal background bleeding.
 */
export function generateInvoiceHtml(order: Order): string {
  const customer = order.customerDetails;

  let formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  if (order.createdAt) {
    try {
      const ts = order.createdAt as { seconds?: number; toDate?: () => Date };
      const dateObj = ts.toDate ? ts.toDate() : ts.seconds ? new Date(ts.seconds * 1000) : null;
      if (dateObj) {
        formattedDate = dateObj.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
      }
    } catch {
      // fallback
    }
  }

  const invoiceNumber = order.orderId || (order.id ? `ARM-${order.id.slice(0, 6).toUpperCase()}` : 'ARM-100293');
  const isInstapay = order.paymentMethod === 'INSTAPAY';

  const itemsRows = (order.items || [])
    .map(
      (item, idx) => `
        <tr style="border-bottom: 1px solid #c4c4c4;">
          <td style="padding: 8px 10px; text-align: center; font-family: monospace; font-size: 11px; border-right: 1px solid #c4c4c4;">
            ${idx + 1}.
          </td>
          <td style="padding: 8px 12px; border-right: 1px solid #c4c4c4;">
            <div style="font-weight: 700; font-size: 12px; color: #111111;">${item.name}</div>
            <div style="font-size: 10.5px; color: #666666; margin-top: 2px;">
              ${item.selectedColor?.name || ''} ${item.selectedSize ? `• Size: ${item.selectedSize}` : ''}
            </div>
          </td>
          <td style="padding: 8px 10px; text-align: center; font-family: monospace; font-weight: 700; font-size: 11px; border-right: 1px solid #c4c4c4;">
            ${item.quantity}
          </td>
          <td style="padding: 8px 12px; text-align: center; font-family: monospace; font-size: 11px; border-right: 1px solid #c4c4c4;">
            EGP ${item.price.toFixed(2)}
          </td>
          <td style="padding: 8px 12px; text-align: right; font-family: monospace; font-weight: 700; font-size: 11.5px; color: #111111; border-right: 1px solid #c4c4c4;">
            EGP ${(item.price * item.quantity).toFixed(2)}
          </td>
        </tr>
      `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ARMIA Invoice #${invoiceNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 6mm 8mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff !important;
      color: #1F1F1F;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 11px;
      line-height: 1.35;
    }
    .invoice-container {
      width: 100%;
      max-width: 780px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e0e0e0;
      overflow: hidden;
    }
    .header-grid {
      display: table;
      width: 100%;
      table-layout: fixed;
    }
    .header-left {
      display: table-cell;
      width: 60%;
      background: #202020;
      color: #ffffff;
      padding: 24px 28px;
      vertical-align: middle;
    }
    .header-right {
      display: table-cell;
      width: 40%;
      background: #E5A84B;
      color: #1F1F1F;
      padding: 24px 20px;
      text-align: center;
      vertical-align: middle;
    }
    .info-columns {
      display: table;
      width: 100%;
      table-layout: fixed;
      padding: 20px 28px 12px 28px;
    }
    .info-col {
      display: table-cell;
      width: 50%;
      vertical-align: top;
    }
    .info-col-left {
      padding-right: 18px;
      border-right: 1px solid #ebebeb;
    }
    .info-col-right {
      padding-left: 18px;
    }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1.5px solid #202020;
      padding-bottom: 4px;
      margin-bottom: 8px;
      color: #111111;
    }
    .data-row {
      margin-bottom: 4px;
      display: flex;
    }
    .data-label {
      width: 110px;
      color: #666666;
      font-weight: 500;
    }
    .data-val {
      flex: 1;
      font-weight: 600;
      color: #111111;
    }
    .table-container {
      padding: 6px 28px;
    }
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #c4c4c4;
    }
    table.items-table th {
      background: #E5A84B;
      color: #111111;
      font-weight: 800;
      font-size: 11px;
      padding: 7px 10px;
      text-transform: uppercase;
      border: 1px solid #c4c4c4;
    }
    .summary-box {
      width: 320px;
      margin-left: auto;
      margin-top: 10px;
      border: 1px solid #c4c4c4;
      background: #ffffff;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 14px;
      font-size: 11px;
      border-bottom: 1px solid #e0e0e0;
    }
    .total-bar {
      background: #E5A84B;
      color: #111111;
      font-weight: 800;
      font-size: 13px;
      display: flex;
      justify-content: space-between;
      padding: 8px 14px;
    }
    .terms-box {
      margin: 16px 28px 0 28px;
      padding-top: 12px;
      border-top: 1px solid #ebebeb;
      display: table;
      width: 100%;
      table-layout: fixed;
    }
    .terms-left {
      display: table-cell;
      width: 65%;
      vertical-align: top;
      font-size: 10px;
      color: #555555;
      line-height: 1.4;
    }
    .terms-right {
      display: table-cell;
      width: 35%;
      vertical-align: middle;
      text-align: center;
    }
    .seal-box {
      display: inline-block;
      padding: 8px 16px;
      background: #FAF7F2;
      border: 1.5px solid #DCC9A6;
      border-radius: 6px;
    }
    .bottom-accent {
      width: 100%;
      height: 10px;
      background: #E5A84B;
      margin-top: 14px;
    }
  </style>
</head>
<body>

  <div class="invoice-container">
    
    <!-- 1. Header Grid -->
    <div class="header-grid">
      <div class="header-left">
        <div style="font-size: 28px; font-weight: 900; letter-spacing: 0.15em; line-height: 1;">
          INVOICE
        </div>
        <div style="font-size: 11px; color: #E5A84B; font-weight: 700; margin-top: 4px;">
          فاتورة شراء رسمية • ARMIA BOUTIQUE
        </div>
        <div style="width: 100%; height: 1.5px; background: rgba(255,255,255,0.4); margin: 10px 0;"></div>
        
        <div style="font-size: 11px; line-height: 1.6;">
          <div><strong style="color: #c4c4c4;">Invoice Number :</strong> <span style="font-family: monospace; font-weight: 800; color: #fff;">#${invoiceNumber}</span></div>
          <div><strong style="color: #c4c4c4;">Invoice Date :</strong> <span style="color: #fff;">${formattedDate}</span></div>
          <div><strong style="color: #c4c4c4;">Payment Method :</strong> <span style="color: #E5A84B; font-weight: 700;">${isInstapay ? 'Instapay Transfer (01204000195)' : 'Cash on Delivery (COD)'}</span></div>
        </div>
      </div>

      <div class="header-right">
        <div style="font-size: 22px; font-weight: 900; letter-spacing: 0.2em; font-family: serif; color: #111111;">
          ARMIA
        </div>
        <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 2px;">
          B O U T I Q U E
        </div>
        <div style="font-size: 8.5px; font-weight: 600; color: #333; margin-top: 6px; letter-spacing: 0.1em; text-transform: uppercase;">
          Cairo Atelier & Showroom
        </div>
      </div>
    </div>

    <!-- 2. Two Location & Info Columns -->
    <div class="info-columns">
      
      <!-- Boutique Info -->
      <div class="info-col info-col-left">
        <div class="section-title">
          Boutique Information • بيانات الأتيليه
        </div>
        <div class="data-row"><span class="data-label">Boutique:</span><span class="data-val">ARMIA Boutique (آرميا)</span></div>
        <div class="data-row"><span class="data-label">Location:</span><span class="data-val">Cairo Atelier & Showroom, Egypt</span></div>
        <div class="data-row"><span class="data-label">Hotline:</span><span class="data-val" style="font-family: monospace;">+20 122 085 9992</span></div>
        <div class="data-row"><span class="data-label">WhatsApp:</span><span class="data-val" style="font-family: monospace;">+20 122 085 9992</span></div>
        <div class="data-row"><span class="data-label">Email:</span><span class="data-val" style="font-family: monospace; font-size: 10.5px;">armiaboutique1@gmail.com</span></div>
        <div class="data-row"><span class="data-label">Instapay:</span><span class="data-val" style="font-family: monospace; color: #B67355; font-weight: 800;">01204000195</span></div>
      </div>

      <!-- Client Info -->
      <div class="info-col info-col-right">
        <div class="section-title">
          Client & Destination • بيانات العميل
        </div>
        <div class="data-row"><span class="data-label">Client Name:</span><span class="data-val" style="font-weight: 800;">${customer?.fullName || 'Valued Client'}</span></div>
        <div class="data-row"><span class="data-label">Governorate:</span><span class="data-val">${customer?.governorate || 'Cairo'}</span></div>
        <div class="data-row"><span class="data-label">City / District:</span><span class="data-val">${customer?.city || '-'}</span></div>
        <div class="data-row"><span class="data-label">Address:</span><span class="data-val" style="line-height: 1.25;">${customer?.address || 'Cairo, Egypt'}</span></div>
        <div class="data-row"><span class="data-label">Phone:</span><span class="data-val" style="font-family: monospace; font-weight: 800;">${customer?.phone || ''} ${customer?.alternatePhone ? ` / ${customer.alternatePhone}` : ''}</span></div>
        ${customer?.notes ? `<div class="data-row"><span class="data-label">Notes:</span><span class="data-val" style="font-style: italic; color: #B67355;">${customer.notes}</span></div>` : ''}
      </div>

    </div>

    <!-- 3. Items Table (ONLY purchased items) -->
    <div class="table-container">
      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 45px; text-align: center;">No.</th>
            <th style="text-align: left; padding-left: 12px;">Description (المنتج والوصف)</th>
            <th style="width: 75px; text-align: center;">Qty (الكمية)</th>
            <th style="width: 100px; text-align: center;">Unit Price</th>
            <th style="width: 110px; text-align: right; padding-right: 12px;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <!-- 4. Financial Breakdown Under Table -->
      <div class="summary-box">
        <div class="summary-row">
          <span style="color: #555;">Items Subtotal (المجموع الفرعي):</span>
          <span style="font-family: monospace; font-weight: 700;">EGP ${order.subtotal?.toFixed(2)}</span>
        </div>

        ${
          order.discountAmount && order.discountAmount > 0
            ? `
          <div class="summary-row" style="background: #eef9f2; color: #1e7e34;">
            <span>Discount (${order.discountTitle || order.discountCode || 'Promotion'}):</span>
            <span style="font-family: monospace; font-weight: 800;">-EGP ${order.discountAmount.toFixed(2)}</span>
          </div>
          <div class="summary-row" style="color: #333; font-weight: 600;">
            <span>Total After Discount (بعد الخصم):</span>
            <span style="font-family: monospace; font-weight: 800; color: #1e7e34;">EGP ${(order.subtotal - order.discountAmount).toFixed(2)}</span>
          </div>
        `
            : ''
        }

        <div class="summary-row">
          <span style="color: #555;">Delivery Fee (${customer?.governorate?.split('(')[0]?.trim() || 'Shipping'}):</span>
          <span style="font-family: monospace; font-weight: 700;">${order.shippingFee === 0 ? 'FREE' : `EGP ${order.shippingFee?.toFixed(2)}`}</span>
        </div>

        <div class="total-bar">
          <span>TOTAL AMOUNT DUE (الإجمالي):</span>
          <span style="font-family: monospace; font-size: 14px;">EGP ${order.totalAmount?.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <!-- 5. Policy Guarantee & Seal (NO Signature) -->
    <div class="terms-box">
      <div class="terms-left">
        <div style="font-weight: 700; color: #111; margin-bottom: 2px;">Terms of Inspection & Return Policy (سياسة المعاينة والاستبدال):</div>
        <div>• <strong>Package Inspection:</strong> You are entitled to open and inspect garments upon courier arrival before payment.</div>
        <div>• <strong>14-Day Guarantee:</strong> Exchanges permitted within 14 days of delivery for unworn items with original tags.</div>
        <div>• <strong>Concierge Support:</strong> WhatsApp / Call <strong style="color: #111;">+20 122 085 9992</strong> for instant assistance.</div>
      </div>

      <div class="terms-right">
        <div class="seal-box">
          <div style="font-size: 8px; text-transform: uppercase; font-weight: 800; color: #B67355; letter-spacing: 0.15em;">
            Official Atelier Seal
          </div>
          <div style="font-size: 11px; font-weight: 800; font-family: serif; color: #111; margin-top: 1px;">
            ARMIA BOUTIQUE
          </div>
          <div style="font-size: 8.5px; font-family: monospace; color: #666;">
            Verified #${invoiceNumber}
          </div>
        </div>
      </div>
    </div>

    <!-- 6. Bottom Gold Bar -->
    <div class="bottom-accent"></div>

  </div>

</body>
</html>
  `;
}

/**
 * Trigger pure, isolated printing via an invisible iframe.
 * Avoids any page background bleeding, avoids multi-page spilling, and prints 1 clean A4 sheet.
 */
export function printIsolatedInvoice(order: Order) {
  if (typeof window === 'undefined') return;

  const iframeId = 'armia-print-isolated-iframe';
  let iframe = document.getElementById(iframeId) as HTMLIFrameElement;

  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = iframeId;
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);
  }

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  const html = generateInvoiceHtml(order);

  doc.open();
  doc.write(html);
  doc.close();

  // Trigger print after iframe renders
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  }, 350);
}
