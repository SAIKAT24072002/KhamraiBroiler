/**
 * Generates print-ready HTML template for invoices dynamically.
 * @param {object} order - Mongoose Order object populated with customer details
 * @param {object} settings - Mongoose Settings object for dynamic store details
 * @returns {string} - Complete HTML template
 */
const generateInvoiceHTML = (order, settings) => {
  const currency = settings.currency || '₹';
  const logoSrc = settings.logoUrl || ''; // base64 or cloudinary
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const itemsRows = order.items.map(item => `
    <tr class="item-row">
      <td>${item.name}</td>
      <td class="text-center">${item.quantity} ${item.unit}</td>
      <td class="text-right">${currency}${item.price.toFixed(2)}</td>
      <td class="text-right">${currency}${item.total.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Invoice #${order.orderNumber}</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #333;
          margin: 0;
          padding: 20px;
          line-height: 1.4;
          font-size: 14px;
        }
        .invoice-box {
          max-width: 800px;
          margin: auto;
          padding: 30px;
          border: 1px solid #eee;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
          background: #fff;
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .header-table td {
          vertical-align: top;
        }
        .title {
          font-size: 26px;
          font-weight: bold;
          color: #b91c1c; /* Premium broiler red */
          margin: 0 0 5px 0;
        }
        .tagline {
          font-size: 12px;
          font-style: italic;
          color: #666;
          margin: 0 0 15px 0;
        }
        .logo {
          max-height: 70px;
          max-width: 150px;
          object-fit: contain;
        }
        .invoice-details {
          text-align: right;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .details-table td {
          padding: 10px;
          border: 1px solid #f3f4f6;
          vertical-align: top;
        }
        .section-title {
          font-size: 12px;
          text-transform: uppercase;
          color: #777;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          margin-bottom: 20px;
        }
        .items-table th {
          background: #f9fafb;
          border-bottom: 2px solid #e5e7eb;
          padding: 12px 10px;
          font-weight: bold;
          font-size: 13px;
        }
        .items-table td {
          padding: 12px 10px;
          border-bottom: 1px solid #f3f4f6;
        }
        .item-row:hover {
          background: #f9fafb;
        }
        .totals-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .totals-table td {
          padding: 8px 10px;
        }
        .totals-table tr.grand-total td {
          border-top: 2px solid #e5e7eb;
          font-size: 16px;
          font-weight: bold;
          color: #b91c1c;
        }
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
        }
        .pickup-badge {
          background-color: #fef2f2;
          border: 1px solid #fee2e2;
          color: #b91c1c;
          padding: 8px 12px;
          border-radius: 4px;
          display: inline-block;
          font-weight: bold;
          margin-top: 5px;
        }
        .footer {
          margin-top: 40px;
          border-top: 1px solid #eee;
          padding-top: 20px;
          text-align: center;
          color: #777;
          font-size: 12px;
        }
        .btn-print {
          display: block;
          width: 120px;
          margin: 20px auto 0 auto;
          padding: 10px;
          background: #b91c1c;
          color: #fff;
          border: none;
          border-radius: 4px;
          font-weight: bold;
          text-align: center;
          cursor: pointer;
          text-decoration: none;
        }
        @media print {
          body {
            padding: 0;
            background: #fff;
          }
          .invoice-box {
            border: none;
            box-shadow: none;
            padding: 0;
          }
          .btn-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <!-- Main Header -->
        <table class="header-table">
          <tr>
            <td>
              ${logoSrc ? `<img src="${logoSrc}" class="logo" alt="Logo"/>` : ''}
              <div class="title">${settings.businessName}</div>
              <div class="tagline">${settings.tagline}</div>
              <div>${settings.storeAddress}</div>
              <div>Phone: ${settings.phone} | WhatsApp: +91 ${settings.whatsappNumber}</div>
            </td>
            <td class="invoice-details">
              <div style="font-size: 20px; font-weight: bold; color: #b91c1c; margin-bottom: 10px;">INVOICE</div>
              <div><strong>Invoice No:</strong> ${order.orderNumber}</div>
              <div><strong>Order Date:</strong> ${formatDate(order.createdAt)}</div>
              <div><strong>Payment Status:</strong> <span style="color: ${order.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b'}">${order.paymentStatus}</span></div>
              <div><strong>Payment Mode:</strong> ${order.paymentMethod}</div>
            </td>
          </tr>
        </table>

        <!-- Metadata Section -->
        <table class="details-table">
          <tr>
            <td style="width: 50%;">
              <div class="section-title">Customer Details</div>
              <div><strong>Name:</strong> ${order.customer.name}</div>
              <div><strong>Mobile:</strong> ${order.customer.mobile}</div>
              ${order.customer.email ? `<div><strong>Email:</strong> ${order.customer.email}</div>` : ''}
            </td>
            <td style="width: 50%;">
              <div class="section-title">Store Pickup Details</div>
              <div><strong>Date:</strong> ${formatDate(order.pickupDate)}</div>
              <div><strong>Time Slot:</strong> ${order.pickupTime}</div>
              <div class="pickup-badge">STORE PICKUP ONLY</div>
            </td>
          </tr>
        </table>

        <!-- Order Items -->
        <table class="items-table">
          <thead>
            <tr>
              <th>Product / Description</th>
              <th class="text-center">Quantity</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Total Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <!-- Order Summary Totals -->
        <table class="totals-table">
          <tr>
            <td style="width: 60%; vertical-align: top; font-size: 12px; color: #666;">
              ${order.orderNote ? `<strong>Order Note:</strong><br/>${order.orderNote}` : ''}
            </td>
            <td style="width: 40%;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td>Subtotal:</td>
                  <td class="text-right">${currency}${order.subtotal.toFixed(2)}</td>
                </tr>
                ${order.discount > 0 ? `
                <tr style="color: #b91c1c;">
                  <td>Discount Applied:</td>
                  <td class="text-right">-${currency}${order.discount.toFixed(2)}</td>
                </tr>
                ` : ''}
                ${order.loyaltyPointsRedeemed > 0 ? `
                <tr style="color: #2563eb;">
                  <td>Loyalty Points Redeemed (${order.loyaltyPointsRedeemed}):</td>
                  <td class="text-right">-${currency}${order.loyaltyPointsRedeemed.toFixed(2)}</td>
                </tr>
                ` : ''}
                <tr class="grand-total">
                  <td>Grand Total:</td>
                  <td class="text-right">${currency}${order.total.toFixed(2)}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Loyalty Points Earned Info -->
        ${order.loyaltyPointsEarned > 0 ? `
          <div style="margin-top: 15px; font-size: 12px; background-color: #eff6ff; color: #1e40af; border: 1px dashed #bfdbfe; padding: 10px; border-radius: 4px; display: inline-block;">
            🎉 Congratulations! You have earned <strong>${order.loyaltyPointsEarned} Loyalty Points</strong> on this order.
          </div>
        ` : ''}

        <!-- Invoice Footer -->
        <div class="footer">
          <div>Thank you for business with <strong>${settings.businessName}</strong>!</div>
          <div style="margin-top: 5px;">${settings.pickupInstructions}</div>
          <div style="margin-top: 15px; font-size: 10px; color: #aaa;">This is a computer generated invoice and does not require a physical signature.</div>
        </div>
      </div>

      <button class="btn-print" onclick="window.print()">Print Invoice</button>
    </body>
    </html>
  `;
};

module.exports = {
  generateInvoiceHTML
};
