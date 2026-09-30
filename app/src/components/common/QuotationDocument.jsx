import './quotationWorkflow.css';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { quotationTotals } from '../../utils/quotationDocument';
import { addressLines, companyInitial, joinNonEmpty } from './printLetterhead';
import { LetterpadBrand, LetterpadFooter, LetterpadDocLabel } from './SalesLetterpad';
import { lineSpecText, lineTotalWeight, formatKg } from '../../utils/salesLineMetal';

// Letterpad (documents/sewen letter pad.pdf). The previous header block is kept
// below, switched off -- flip this to restore it.
const USE_LEGACY_LETTERHEAD = false;

// Replaced (quotation-first sales): the quotation PDF now carries the full
// commercial document -- reference, salesperson, billing + shipping address,
// unit / HSN per line (custom and service lines included), the GST split,
// payment / delivery terms, notes and the authorized signature -- on the same
// letterhead and layout. The original render, kept for rollback:
//
// export function QuotationDocument({ quotation, company = null }) {
//   const totals = quotationTotals(quotation);
//   const companyName = company?.name || company?.tradeName || company?.legalName || '';
//   const companyAddress = joinNonEmpty(addressLines(company?.address), ', ');
//   const companyContact = joinNonEmpty([company?.gstin && `GSTIN: ${company.gstin}`, company?.phone, company?.email]);
//   const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: quotation.currency || 'USD' }).format(Number(value) || 0);
//   return <article className="qw-document printable-document bg-white text-slate-800 p-8 space-y-6">
//     <header className="flex justify-between gap-4 border-b-2 border-slate-800 pb-5">
//       <div>{companyName && <div className="font-black text-xl text-[#1F2E4A]">{companyInitial(companyName)} · {companyName.toUpperCase()}</div>}<p>Commercial Quotation</p>{companyAddress && <p className="text-xs text-slate-500">{companyAddress}</p>}{companyContact && <p className="text-xs text-slate-500">{companyContact}</p>}</div>
//       <div className="text-right"><h1 className="font-bold">{quotation.quoteNumber}</h1><p>Date: {quotation.date}</p>{quotation.validUntil && <p>Valid until: {quotation.validUntil}</p>}</div>
//     </header><h2 className="text-center font-extrabold text-2xl tracking-widest text-blue-950">QUOTATION</h2>
//     <div><h2 className="font-semibold">Quoted to</h2><p>{quotation.customer}</p>{quotation.billingAddress && <p>{typeof quotation.billingAddress === 'string' ? quotation.billingAddress : ['line1', 'line2', 'city', 'state', 'pincode', 'country'].map(key => quotation.billingAddress[key]).filter(Boolean).join(', ')}</p>}{quotation.dealReference && <p>Deal reference: {quotation.dealReference}</p>}</div>
//     <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr className="border-b"><th>Product / Service</th><th>Qty</th><th>Rate</th><th>Discount %</th><th>Tax %</th><th>Amount</th></tr></thead>
//       <tbody>{(quotation.items || []).map((item, index) => <tr key={index} className="border-b"><td className="py-3">{item.name || item.description}</td><td>{item.qty}</td><td>{money(item.rate)}</td><td>{item.discount ?? 0}</td><td>{item.tax ?? 0}</td><td>{money(item.amount ?? Number(item.qty) * Number(item.rate) * (1 - Number(item.discount || 0) / 100) * (1 + Number(item.tax || 0) / 100))}</td></tr>)}</tbody>
//     </table></div>
//     <dl className="ml-auto max-w-xs space-y-2">{[['Subtotal', totals.subtotal], ['Discount', totals.discount], ['Tax', totals.tax], ['Freight', totals.freight], ['Grand Total', totals.total]].map(([label, value]) => <div key={label} className="flex justify-between gap-8"><dt>{label}</dt><dd className="font-bold">{money(value)}</dd></div>)}</dl>
//     {(quotation.termsAndConditions || quotation.terms) && <section><h2 className="font-bold">Terms & Conditions</h2><p className="whitespace-pre-wrap">{quotation.termsAndConditions || quotation.terms}</p></section>}
//     <footer className="qw-document-footer"><strong>Thank you for your business!</strong><p>{companyName ? `${companyName} · Commercial Quotation` : 'Commercial Quotation'}</p></footer>
//   </article>;
// }

const addressText = (addr) => joinNonEmpty(addressLines(addr && typeof addr === 'object' && !addr.line1 && addr.street ? { ...addr, line1: addr.street } : addr), ', ');

// The ERP passes a quotation already mapped by backendSync (`quoteNumber`,
// `customer`, `items`); the public share page passes the server's serializer
// output (`quotationNumber`, `partyName`, `lineItems`). Read either.
const normalize = (q) => ({
  ...q,
  quoteNumber: q.quoteNumber || q.quotationNumber || '',
  customer: q.customer || q.partyName || '',
  items: q.items || q.lineItems || [],
  terms: q.termsAndConditions || q.terms || '',
  freight: q.freight ?? q.freightCharges,
});

const lineAmount = (item) => {
  // The server's lineTotal (after discount, with tax); else the editor's amount.
  if (item.lineTotal != null) return Number(item.lineTotal) || 0;
  if (item.amount != null && item.lineTotal === undefined && item.taxAmount === undefined) return Number(item.amount) || 0;
  return Number(item.qty) * Number(item.rate) * (1 - Number(item.discount || 0) / 100) * (1 + Number(item.tax || 0) / 100);
};

// `company` is the tenant letterhead: the ERP companyProfile, or the public
// share payload's `company` (tradeName / legalName, address parts).
// `shareUrl` (optional): the customer's preview link, printed as a QR code
// (Sweven spec §2.1: "branded PDF quotes with QR share link").
export function QuotationDocument({ quotation: source, company = null, shareUrl = '' }) {
  const quotation = normalize(source || {});
  const [qr, setQr] = useState('');
  useEffect(() => {
    let active = true;
    if (!shareUrl) { setQr(''); return undefined; }
    QRCode.toDataURL(shareUrl, { width: 160, margin: 1 }).then((url) => { if (active) setQr(url); }).catch(() => { if (active) setQr(''); });
    return () => { active = false; };
  }, [shareUrl]);
  const totalWeight = quotation.items.reduce((acc, item) => acc + lineTotalWeight(item), 0);
  const totals = quotationTotals(quotation);
  const companyName = company?.name || company?.tradeName || company?.legalName || '';
  const companyAddress = joinNonEmpty(addressLines(company?.address), ', ');
  const companyContact = joinNonEmpty([company?.gstin && `GSTIN: ${company.gstin}`, company?.pan && `PAN: ${company.pan}`, company?.phone, company?.email]);
  // Replaced: amounts are in the tenant's currency (INR for SEWEN), not USD.
  // const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: quotation.currency || 'USD' }).format(Number(value) || 0);
  const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: quotation.currency || company?.currency || 'INR' }).format(Number(value) || 0);
  const billing = addressText(quotation.billingAddress);
  const shipping = addressText(quotation.shippingAddress);
  const meta = [
    ['Reference', quotation.referenceNumber],
    ['Deal reference', quotation.dealReference],
    ['Salesperson', quotation.salesperson],
    ['Customer GSTIN', quotation.partyGstin || quotation.customerGstin],
    ['Place of supply', quotation.placeOfSupply],
  ].filter(([, value]) => value);
  const taxRows = totals.hasSplit
    ? [['Taxable Value', totals.taxable], ...(totals.igst > 0 ? [['IGST', totals.igst]] : [['CGST', totals.cgst], ['SGST', totals.sgst]])]
    : [['Tax', totals.tax]];
  const summary = [['Subtotal', totals.subtotal], ['Discount', totals.discount], ...taxRows, ['Freight', totals.freight], ['Grand Total', totals.total]]
    .filter(([label, value]) => label === 'Grand Total' || label === 'Subtotal' || Number(value));
  const signatory = quotation.authorizedPerson;
  return <article className="qw-document printable-document bg-white text-slate-800 p-8 space-y-6">
    <header className="flex justify-between gap-4 border-b-2 border-slate-800 pb-5">
      {USE_LEGACY_LETTERHEAD ? (
      <div>{company?.logo && <img src={company.logo} alt="" className="h-12 mb-2 object-contain"/>}{companyName && <div className="font-black text-xl text-[#1F2E4A]">{companyInitial(companyName)} · {companyName.toUpperCase()}</div>}<p>Commercial Quotation</p>{companyAddress && <p className="text-xs text-slate-500">{companyAddress}</p>}{companyContact && <p className="text-xs text-slate-500">{companyContact}</p>}</div>
      ) : <LetterpadBrand company={company} />}
      <div className="text-right">{!USE_LEGACY_LETTERHEAD && <LetterpadDocLabel>Commercial Quotation</LetterpadDocLabel>}<h1 className="font-bold">{quotation.quoteNumber}</h1><p>Date: {quotation.date}</p>{quotation.validUntil && <p>Valid until: {quotation.validUntil}</p>}</div>
    </header><h2 className="text-center font-extrabold text-2xl tracking-widest text-blue-950">QUOTATION</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div><h2 className="font-semibold">Quoted to</h2><p>{quotation.customer}</p>{billing && <p className="text-sm">{billing}</p>}{meta.map(([label, value]) => <p key={label} className="text-sm">{label}: {value}</p>)}</div>
      {shipping && shipping !== billing && <div><h2 className="font-semibold">Ship to</h2><p className="text-sm">{shipping}</p></div>}
    </div>
    <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr className="border-b"><th>#</th><th>Product / Service</th><th>HSN/SAC</th><th>Qty</th><th>Rate</th><th>Discount %</th><th>Tax %</th><th>Amount</th></tr></thead>
      <tbody>{quotation.items.map((item, index) => <tr key={index} className="border-b align-top"><td className="py-3 pr-2">{index + 1}</td><td className="py-3">{item.name || item.itemName || item.description}{item.description && item.description !== (item.name || item.itemName) && <p className="text-xs text-slate-500">{item.description}</p>}{(item.sku || item.itemSku) && <p className="text-xs text-slate-500 font-mono">SKU: {item.sku || item.itemSku}</p>}{lineSpecText(item) && <p className="text-xs text-slate-500">{lineSpecText(item)}</p>}</td><td>{item.hsnCode || '—'}</td><td>{item.qty}{item.uom ? ` ${item.uom}` : ''}</td><td>{money(item.rate)}</td><td>{item.discount ?? 0}</td><td>{item.tax ?? 0}</td><td>{money(lineAmount(item))}</td></tr>)}</tbody>
    </table></div>
    {totalWeight > 0 && <p className="text-xs text-slate-500 text-right">Total weight: {formatKg(totalWeight)} (theoretical)</p>}
    <dl className="ml-auto max-w-xs space-y-2">{summary.map(([label, value]) => <div key={label} className="flex justify-between gap-8"><dt>{label}</dt><dd className="font-bold">{money(value)}</dd></div>)}</dl>
    {quotation.paymentTerms && <section><h2 className="font-bold">Payment Terms</h2><p className="whitespace-pre-wrap">{quotation.paymentTerms}</p></section>}
    {quotation.deliveryTerms && <section><h2 className="font-bold">Delivery Terms</h2><p className="whitespace-pre-wrap">{quotation.deliveryTerms}</p></section>}
    {quotation.notes && <section><h2 className="font-bold">Notes</h2><p className="whitespace-pre-wrap">{quotation.notes}</p></section>}
    {quotation.terms && <section><h2 className="font-bold">Terms & Conditions</h2><p className="whitespace-pre-wrap">{quotation.terms}</p></section>}
    <section className="grid grid-cols-2 gap-12 pt-6 text-center text-sm">
      <div><div className="border-b border-slate-400 h-14"/><p className="font-semibold mt-2">Customer Acceptance</p><p className="text-xs text-slate-500">Signature, name &amp; date</p></div>
      <div><div className="border-b border-slate-400 h-14 flex items-end justify-center">{company?.signature && <img src={company.signature} alt="" className="h-12 object-contain"/>}</div><p className="font-semibold mt-2">{signatory || 'Authorized Signatory'}</p><p className="text-xs text-slate-500">{companyName ? `For ${companyName}` : 'Authorized Signatory'}</p></div>
    </section>
    {qr && <figure className="flex items-center gap-3 text-xs text-slate-500"><img src={qr} alt="Scan to view this quotation online" width="88" height="88"/><figcaption>Scan to view this quotation online,<br/>accept it or leave a comment.</figcaption></figure>}
    <footer className="qw-document-footer"><strong>Thank you for your business!</strong><p>{companyName ? `${companyName} · Commercial Quotation` : 'Commercial Quotation'}</p></footer>
    {!USE_LEGACY_LETTERHEAD && <LetterpadFooter company={company} />}
  </article>;
}
