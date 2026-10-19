import { formatContractDate, formatContractMoney } from './contractFormatting';
import { downloadElementAsPdf } from '../services/exportUtils';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function buildContractHtml(contract, deal) {
  const rows = [
    ['Contract Number', contract.contractNumber],
    ['Contract Type', contract.contractType],
    ['Customer', contract.customer || deal?.client],
    ...(deal ? [['Deal', `${deal?.dealNumber || deal?.id || '—'} — ${deal?.name || ''}`]] : []),
    ['Template', contract.template],
    ['Start Date', formatContractDate(contract.startDate)],
    ['End Date', formatContractDate(contract.endDate)],
    ['Contract Value', formatContractMoney(contract.amount)],
    ['Status', contract.status || 'Draft'],
    ['Created On', formatContractDate(contract.createdAt)],
    ['Description', contract.description],
  ];

  const bodyHtml = `
    <div style="font-family: Arial, sans-serif; color: #172033; padding: 32px; background: #ffffff;">
      <h1 style="margin: 0 0 4px; font-size: 22px; font-weight: 800; text-transform: uppercase;">Contract ${escapeHtml(contract.contractNumber)}</h1>
      <p style="color: #64748b; margin: 0 0 20px; font-size: 13px;">${escapeHtml(contract.contractType || '')} — ${escapeHtml(contract.customer || '')}</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 720px; font-size: 12px;">
        ${rows.map(([label, value]) => `<tr><th style="border: 1px solid #dbe2ea; padding: 8px 10px; text-align: left; background: #f8fafc; width: 32%;">${escapeHtml(label)}</th><td style="border: 1px solid #dbe2ea; padding: 8px 10px; text-align: left;">${escapeHtml(value || '—')}</td></tr>`).join('')}
      </table>
      <h2 style="font-size: 14px; margin: 24px 0 8px; font-weight: 700; text-transform: uppercase;">Terms &amp; Conditions</h2>
      <div style="font-size: 12px; line-height: 1.7; white-space: pre-wrap; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">${escapeHtml(contract.terms || 'No terms recorded.')}</div>
    </div>
  `;

  return { rows, bodyHtml };
}

export function printContract(contract, deal) {
  const { rows } = buildContractHtml(contract, deal);
  const html = `<!doctype html><html><head><title>${escapeHtml(contract.contractNumber)} - Contract</title><style>body{font-family:Arial,sans-serif;color:#172033;padding:40px}h1{margin:0 0 4px;font-size:24px}p.sub{color:#64748b;margin:0 0 24px}table{border-collapse:collapse;width:100%;max-width:720px}th,td{border:1px solid #dbe2ea;padding:10px;text-align:left;font-size:13px;vertical-align:top}th{background:#f1f5f9;width:32%}h2{font-size:15px;margin:28px 0 8px}p.terms{font-size:13px;line-height:1.8;white-space:pre-wrap}</style></head><body><h1>Contract ${escapeHtml(contract.contractNumber)}</h1><p class="sub">${escapeHtml(contract.contractType || '')} — ${escapeHtml(contract.customer || '')}</p><table>${rows.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value || '—')}</td></tr>`).join('')}</table><h2>Terms & Conditions</h2><p class="terms">${escapeHtml(contract.terms || 'No terms recorded.')}</p></body></html>`;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => {
      try {
        if (iframe.parentNode) document.body.removeChild(iframe);
      } catch (e) {
        // ignore
      }
    }, 2000);
  }, 300);
}

export async function downloadContractAsPdf(contract, deal) {
  const { bodyHtml } = buildContractHtml(contract, deal);
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.backgroundColor = '#ffffff';
  container.innerHTML = bodyHtml;
  document.body.appendChild(container);

  try {
    const filename = `Contract-${contract.contractNumber || contract.id || 'record'}.pdf`;
    await downloadElementAsPdf(container, filename);
  } finally {
    document.body.removeChild(container);
  }
}
