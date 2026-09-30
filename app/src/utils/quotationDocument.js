const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

// Replaced (quotation-first sales): the PDF now prefers the totals the server
// computed (with the CGST/SGST vs IGST split) and falls back to the line math
// only for a quotation that exists locally. The original, kept for reference:
// export function quotationTotals(quote) {
//   const items = quote.items || [];
//   const subtotal = items.reduce((sum, item) => sum + number(item.qty) * number(item.rate), 0);
//   const discount = items.reduce((sum, item) => sum + number(item.qty) * number(item.rate) * number(item.discount) / 100, 0);
//   const tax = items.reduce((sum, item) => sum + number(item.qty) * number(item.rate) * (1 - number(item.discount) / 100) * number(item.tax) / 100, 0);
//   const freight = number(quote.freight);
//   return { subtotal, discount, tax, freight, total: quote.amount != null ? number(quote.amount) : subtotal - discount + tax + freight };
// }
export function quotationTotals(quote) {
  const items = quote.items || quote.lineItems || [];
  const subtotal = items.reduce((sum, item) => sum + number(item.qty) * number(item.rate), 0);
  const discount = items.reduce((sum, item) => sum + number(item.qty) * number(item.rate) * number(item.discount) / 100, 0);
  const tax = items.reduce((sum, item) => sum + number(item.qty) * number(item.rate) * (1 - number(item.discount) / 100) * number(item.tax) / 100, 0);
  const freight = number(quote.freight ?? quote.freightCharges);
  const server = quote.totalTax !== undefined || quote.taxableValue !== undefined;
  const totalTax = server ? number(quote.totalTax) : tax;
  const total = quote.total != null ? number(quote.total)
    : quote.amount != null ? number(quote.amount) : subtotal - discount + tax + freight;
  return {
    subtotal: server && quote.subtotal != null ? number(quote.subtotal) : subtotal,
    discount: server && quote.totalDiscount != null ? number(quote.totalDiscount) : discount,
    taxable: server && quote.taxableValue != null ? number(quote.taxableValue) : subtotal - discount,
    tax: totalTax,
    cgst: number(quote.cgst),
    sgst: number(quote.sgst),
    igst: number(quote.igst),
    // Only the server knows the place of supply, so only it can split GST.
    hasSplit: server && (number(quote.cgst) + number(quote.sgst) + number(quote.igst)) > 0,
    freight,
    total,
  };
}

// A quotation the customer rejected, that lapsed, was cancelled or already
// became an order is no longer an offer (the server's convert-to-order refuses
// the same set with 409).
export const NON_CONVERTIBLE_QUOTATION_STATUSES = ['Confirmed', 'Converted', 'Invoiced', 'Rejected', 'Expired', 'Cancelled'];
export const isQuotationConvertible = (quote) => Boolean(quote) && !NON_CONVERTIBLE_QUOTATION_STATUSES.includes(quote.status);

// Explicit customer-facing projection. Never publish CRM notes, costs, balances or contacts.
export function publicQuotation(quote, currency = 'USD') {
  // Replaced (quotation-first sales): the commercial header the PDF prints.
  // const fields = ['quoteNumber', 'date', 'validUntil', 'customer', 'amount', 'freight', 'terms', 'termsAndConditions', 'dealReference'];
  const fields = ['quoteNumber', 'date', 'validUntil', 'customer', 'amount', 'freight', 'terms', 'termsAndConditions', 'dealReference',
    'referenceNumber', 'salesperson', 'paymentTerms', 'deliveryTerms', 'authorizedPerson'];
  const result = Object.fromEntries(fields.filter(key => quote[key] != null).map(key => [key, quote[key]]));
  result.currency = currency;
  if (quote.billingAddress) {
    result.billingAddress = typeof quote.billingAddress === 'string' ? { line1: quote.billingAddress } :
      Object.fromEntries(['line1', 'line2', 'city', 'state', 'pincode', 'country'].filter(key => typeof quote.billingAddress[key] === 'string').map(key => [key, quote.billingAddress[key]]));
  }
  result.items = (quote.items || []).map(item => Object.fromEntries(
    // Replaced: unit and HSN/SAC print on custom / service lines too.
    // ['name', 'description', 'qty', 'rate', 'amount', 'discount', 'tax'].filter(key => item[key] != null).map(key => [key, item[key]])
    ['name', 'description', 'qty', 'uom', 'hsnCode', 'rate', 'amount', 'discount', 'tax'].filter(key => item[key] != null).map(key => [key, item[key]])
  ));
  return result;
}
