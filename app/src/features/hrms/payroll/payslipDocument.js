// Payslip documents: a directly downloadable PDF (drawn with plain PDF
// operators, no library) and a matching print / save-as-PDF window.
// Both show only figures the payroll record actually holds.

function currentMonthLabel() {
  return new Date().toLocaleString("en-GB", { month: "long", year: "numeric" });
}

// One normalised view of a payslip row, shared by the PDF and print layouts.
export function payslipFigures(p, company = {}) {
  const std = Number(p.standardSalary || 0);
  const totalDays = Number(p.totalDays || 24);
  const dailyHours = Number(p.dailyHours || 8);
  const attended = p.attendedDays !== undefined ? Number(p.attendedDays) : totalDays;
  const absent = p.absentDays !== undefined ? Number(p.absentDays) : Math.max(0, totalDays - attended);
  const perDay = p.perDaySalary !== undefined ? Number(p.perDaySalary) : (totalDays > 0 ? Math.round(std / totalDays) : 0);
  const lop = p.attendanceDeduction !== undefined ? Number(p.attendanceDeduction) : Math.round(perDay * absent);
  const additional = Number(p.additionalEarnings || 0);
  const statutory = Number(p.deductions || 0);
  const advance = Number(p.advance || 0);
  const gross = std + additional;
  const totalDeductions = lop + statutory + advance;
  const net = Math.max(0, gross - totalDeductions);
  const paid = p.status === "Paid";
  return {
    company: {
      name: company.legalName || company.name || "",
      address: company.address || "",
      meta: [company.gstin && `GSTIN ${company.gstin}`, company.phone, company.email].filter(Boolean).join("  |  "),
    },
    name: p.name || "Employee",
    empId: p.empId || "-",
    slipRef: p.id || "-",
    role: p.role || "-",
    department: p.department || "-",
    month: p.month || currentMonthLabel(),
    bank: p.bank || "Bank transfer",
    status: p.status || "In Progress",
    paid,
    paidAmount: paid ? Number(p.paidAmount ?? net) : null,
    paymentDate: paid ? p.paymentDate || "" : "",
    totalDays, attended, absent, dailyHours, perDay,
    earnings: [
      ["Standard Monthly Salary", std],
      ["Overtime / Bonus", additional],
    ],
    deductions: [
      [`Loss of Pay (${absent} day${absent === 1 ? "" : "s"})`, lop],
      ["Statutory Deductions", statutory],
      ["Salary Advance Recovery", advance],
    ],
    gross, totalDeductions, net,
  };
}

export function formatAmount(value) {
  return Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Indian numbering (lakh / crore) in words, e.g. "Rupees Forty-Five Thousand Only".
export function amountInWords(value) {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const twoDigits = (n) => (n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? `-${ones[n % 10]}` : ""));
  const threeDigits = (n) => [n >= 100 && `${ones[Math.floor(n / 100)]} Hundred`, n % 100 && twoDigits(n % 100)].filter(Boolean).join(" ");
  const words = (n) => {
    if (n === 0) return "Zero";
    const parts = [];
    const crore = Math.floor(n / 10000000);
    if (crore) parts.push(`${words(crore)} Crore`);
    const lakh = Math.floor((n % 10000000) / 100000);
    if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
    const thousand = Math.floor((n % 100000) / 1000);
    if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
    const rest = n % 1000;
    if (rest) parts.push(threeDigits(rest));
    return parts.join(" ");
  };
  const rupees = Math.floor(Math.abs(Number(value) || 0));
  const paise = Math.round((Math.abs(Number(value) || 0) - rupees) * 100);
  return `Rupees ${words(rupees)}${paise ? ` and ${twoDigits(paise)} Paise` : ""} Only`;
}

/* ------------------------------------------------------------------ */
/* PDF                                                                 */
/* ------------------------------------------------------------------ */

// Standard Helvetica / Helvetica-Bold advance widths (1/1000 em) for ASCII 32-126.
const WIDTHS = {
  F1: [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584],
  F2: [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584],
};

// The standard fonts cover Latin text only; fold everything else to ASCII.
function ascii(value) {
  return String(value ?? "")
    .replace(/₹/g, "Rs.")
    .replace(/[•·]/g, "-")
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7E]/g, "?");
}

function textWidth(text, font, size) {
  let units = 0;
  for (const ch of text) units += WIDTHS[font][ch.charCodeAt(0) - 32] ?? 556;
  return (units * size) / 1000;
}

function fit(text, font, size, maxWidth) {
  let out = ascii(text);
  if (textWidth(out, font, size) <= maxWidth) return out;
  while (out.length > 1 && textWidth(`${out}...`, font, size) > maxWidth) out = out.slice(0, -1);
  return `${out.trimEnd()}...`;
}

function wrap(text, font, size, maxWidth) {
  const lines = [];
  let line = "";
  for (const word of ascii(text).split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && textWidth(next, font, size) > maxWidth) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

const hex = (color) => [1, 3, 5].map((i) => (parseInt(color.slice(i, i + 2), 16) / 255).toFixed(3)).join(" ");
const n = (v) => Number(v.toFixed(2));

// Small drawing surface using top-left coordinates on an A4 page.
function createCanvas() {
  const H = 842;
  const ops = [];
  const k = 0.5523;
  const roundRectPath = (x, y, w, h, r) => {
    const t = H - y, b = H - y - h, l = x, rt = x + w;
    ops.push(
      `${n(l + r)} ${n(t)} m`, `${n(rt - r)} ${n(t)} l`,
      `${n(rt - r + r * k)} ${n(t)} ${n(rt)} ${n(t - r + r * k)} ${n(rt)} ${n(t - r)} c`,
      `${n(rt)} ${n(b + r)} l`,
      `${n(rt)} ${n(b + r - r * k)} ${n(rt - r + r * k)} ${n(b)} ${n(rt - r)} ${n(b)} c`,
      `${n(l + r)} ${n(b)} l`,
      `${n(l + r - r * k)} ${n(b)} ${n(l)} ${n(b + r - r * k)} ${n(l)} ${n(b + r)} c`,
      `${n(l)} ${n(t - r)} l`,
      `${n(l)} ${n(t - r + r * k)} ${n(l + r - r * k)} ${n(t)} ${n(l + r)} ${n(t)} c`,
      "h",
    );
  };
  return {
    rect(x, y, w, h, { fill, stroke, radius = 0, lineWidth = 0.75 } = {}) {
      ops.push("q");
      if (fill) ops.push(`${hex(fill)} rg`);
      if (stroke) ops.push(`${hex(stroke)} RG ${lineWidth} w`);
      if (radius) roundRectPath(x, y, w, h, radius);
      else ops.push(`${n(x)} ${n(H - y - h)} ${n(w)} ${n(h)} re`);
      ops.push(fill && stroke ? "B" : fill ? "f" : "S", "Q");
    },
    line(x1, y1, x2, y2, color = "#E2E8F0", lineWidth = 0.75) {
      ops.push("q", `${hex(color)} RG ${lineWidth} w`, `${n(x1)} ${n(H - y1)} m ${n(x2)} ${n(H - y2)} l S`, "Q");
    },
    // y is the text baseline; align is left | right | center relative to x.
    text(value, x, y, { size = 10, bold = false, color = "#1E293B", align = "left", maxWidth } = {}) {
      const font = bold ? "F2" : "F1";
      const str = maxWidth ? fit(value, font, size, maxWidth) : ascii(value);
      const w = textWidth(str, font, size);
      const left = align === "right" ? x - w : align === "center" ? x - w / 2 : x;
      const escaped = str.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
      ops.push("BT", `${hex(color)} rg`, `/${font} ${size} Tf`, `${n(left)} ${n(H - y)} Td`, `(${escaped}) Tj`, "ET");
    },
    stream: () => ops.join("\n"),
  };
}

function buildPdf(stream) {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
  ];
  // Everything is ASCII, so string length equals byte length for the xref offsets.
  let out = "%PDF-1.4\n";
  const offsets = objects.map((body, i) => {
    const offset = out.length;
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
    return offset;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return out;
}

const NAVY = "#1F2E4A";
const ACCENT = "#246BFE";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";

function drawPayslip(f) {
  const c = createCanvas();
  const L = 40, R = 555, W = R - L;

  // Header band
  c.rect(0, 0, 595, 92, { fill: NAVY });
  c.rect(0, 92, 595, 4, { fill: ACCENT });
  c.text(f.company.name || "Salary Slip", L, 40, { size: 17, bold: true, color: "#FFFFFF", maxWidth: 330 });
  if (f.company.address) c.text(f.company.address, L, 58, { size: 8.5, color: "#C7D2E5", maxWidth: 330 });
  if (f.company.meta) c.text(f.company.meta, L, 72, { size: 8.5, color: "#C7D2E5", maxWidth: 330 });
  c.text("PAYSLIP", R, 40, { size: 18, bold: true, color: "#FFFFFF", align: "right" });
  c.text(`Pay period: ${f.month}`, R, 58, { size: 9.5, color: "#C7D2E5", align: "right" });
  const pillText = ascii(f.status.toUpperCase());
  const pillW = textWidth(pillText, "F2", 8) + 18;
  c.rect(R - pillW, 65, pillW, 16, { fill: f.paid ? "#DCFCE7" : "#DBEAFE", radius: 8 });
  c.text(pillText, R - pillW / 2, 76, { size: 8, bold: true, color: f.paid ? "#15803D" : "#1D4ED8", align: "center" });

  // Employee details
  let y = 124;
  c.text("EMPLOYEE DETAILS", L, y, { size: 8.5, bold: true, color: MUTED });
  y += 8;
  c.rect(L, y, W, 84, { fill: "#F8FAFC", stroke: BORDER, radius: 6 });
  const half = W / 2;
  c.line(L + half, y + 12, L + half, y + 72);
  const details = [
    [["Employee Name", f.name], ["Employee ID", f.empId], ["Designation", f.role], ["Department", f.department]],
    [["Pay Period", f.month], ["Payslip No.", f.slipRef], ["Bank / Mode", f.bank], ["Payment Date", f.paymentDate || "-"]],
  ];
  details.forEach((rows, col) => {
    const x = L + 16 + col * half;
    rows.forEach(([label, value], i) => {
      const rowY = y + 22 + i * 17;
      c.text(label, x, rowY, { size: 8.5, color: MUTED });
      c.text(value, x + 86, rowY, { size: 9.5, bold: true, color: "#0F172A", maxWidth: half - 118 });
    });
  });
  y += 84;

  // Attendance tiles
  y += 26;
  c.text("ATTENDANCE", L, y, { size: 8.5, bold: true, color: MUTED });
  y += 8;
  const tiles = [
    ["Working Days", String(f.totalDays)],
    ["Days Present", String(f.attended)],
    ["Days Absent (LOP)", String(f.absent)],
    ["Hours / Day", `${f.dailyHours} h`],
    ["Per-day Rate", formatAmount(f.perDay)],
  ];
  const gap = 8, tileW = (W - gap * (tiles.length - 1)) / tiles.length;
  tiles.forEach(([label, value], i) => {
    const x = L + i * (tileW + gap);
    c.rect(x, y, tileW, 46, { stroke: BORDER, fill: "#FFFFFF", radius: 6 });
    c.text(value, x + tileW / 2, y + 21, { size: 13, bold: true, color: NAVY, align: "center", maxWidth: tileW - 10 });
    c.text(label, x + tileW / 2, y + 36, { size: 7.5, color: MUTED, align: "center" });
  });
  y += 46;

  // Earnings & deductions table
  y += 26;
  const rowH = 24;
  const rows = Math.max(f.earnings.length, f.deductions.length);
  const tableH = rowH * (rows + 2);
  c.rect(L, y, W, tableH, { stroke: BORDER, radius: 6 });
  c.rect(L + 0.4, y + 0.4, W - 0.8, rowH, { fill: "#EEF3FB" });
  const columns = [
    { x: L, title: "EARNINGS", items: f.earnings, total: ["Gross Earnings", f.gross], color: "#0F172A" },
    { x: L + half, title: "DEDUCTIONS", items: f.deductions, total: ["Total Deductions", f.totalDeductions], color: "#B91C1C" },
  ];
  columns.forEach(({ x, title, items, total, color }) => {
    c.text(title, x + 12, y + 16, { size: 8.5, bold: true, color: "#214E8F" });
    c.text("AMOUNT (INR)", x + half - 12, y + 16, { size: 8.5, bold: true, color: "#214E8F", align: "right" });
    items.forEach(([label, value], i) => {
      const rowY = y + rowH * (i + 1) + 16;
      c.text(label, x + 12, rowY, { size: 9, color: "#334155", maxWidth: half - 110 });
      c.text(formatAmount(value), x + half - 12, rowY, { size: 9, color: value && color !== "#0F172A" ? color : "#0F172A", align: "right" });
    });
    const totalY = y + rowH * (rows + 1);
    c.text(total[0], x + 12, totalY + 16, { size: 9.5, bold: true, color: "#0F172A" });
    c.text(formatAmount(total[1]), x + half - 12, totalY + 16, { size: 9.5, bold: true, color, align: "right" });
  });
  for (let i = 1; i <= rows + 1; i += 1) c.line(L, y + rowH * i, R, y + rowH * i);
  c.line(L + half, y, L + half, y + tableH);
  y += tableH;

  // Net pay
  y += 18;
  const words = wrap(amountInWords(f.net), "F1", 8.5, 280);
  const netH = Math.max(60, 40 + words.length * 11);
  c.rect(L, y, W, netH, { fill: "#ECFDF5", stroke: "#A7F3D0", radius: 6 });
  c.text("NET PAY", L + 16, y + 22, { size: 10, bold: true, color: "#047857" });
  words.forEach((line, i) => c.text(line, L + 16, y + 38 + i * 11, { size: 8.5, color: "#065F46" }));
  c.text(`INR ${formatAmount(f.net)}`, R - 16, y + netH / 2 + 7, { size: 19, bold: true, color: "#065F46", align: "right" });
  y += netH;

  y += 18;
  c.text("Net Pay = Gross Earnings - Total Deductions (Loss of Pay + Statutory Deductions + Advance Recovery)", L, y, { size: 8, color: MUTED, maxWidth: W });
  if (f.paid) {
    y += 14;
    c.text(`Disbursed INR ${formatAmount(f.paidAmount)}${f.paymentDate ? ` on ${f.paymentDate}` : ""} via ${f.bank}.`, L, y, { size: 8, color: MUTED, maxWidth: W });
  }

  // Signatures
  const signY = 720;
  c.line(L, signY, L + 170, signY, "#94A3B8");
  c.text("Employee Signature", L, signY + 14, { size: 8.5, color: MUTED });
  c.line(R - 170, signY, R, signY, "#94A3B8");
  c.text(f.company.name ? `For ${f.company.name}` : "Authorised Signatory", R, signY - 8, { size: 8.5, bold: true, color: "#334155", align: "right", maxWidth: 220 });
  c.text("Authorised Signatory", R, signY + 14, { size: 8.5, color: MUTED, align: "right" });

  // Footer
  c.line(L, 790, R, 790);
  c.text("This is a computer-generated payslip. Confidential - for the named employee only.", L, 806, { size: 7.5, color: "#94A3B8" });
  c.text(`Generated ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`, R, 806, { size: 7.5, color: "#94A3B8", align: "right" });

  return c.stream();
}

export function downloadPayslipPdf(p, company) {
  const f = payslipFigures(p, company);
  const blob = new Blob([buildPdf(drawPayslip(f))], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Payslip_${ascii(f.name).replace(/[^A-Za-z0-9]+/g, "_")}_${ascii(f.month).replace(/[^A-Za-z0-9]+/g, "_")}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ------------------------------------------------------------------ */
/* Print / save-as-PDF window                                          */
/* ------------------------------------------------------------------ */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function printPayslip(p, company) {
  const f = payslipFigures(p, company);
  const e = escapeHtml;
  const rows = Math.max(f.earnings.length, f.deductions.length);
  const cell = (item, negative) => item
    ? `<td>${e(item[0])}</td><td class="num${negative && item[1] ? " neg" : ""}">${formatAmount(item[1])}</td>`
    : "<td></td><td></td>";
  const tableRows = Array.from({ length: rows }, (_, i) => `<tr>${cell(f.earnings[i])}${cell(f.deductions[i], true)}</tr>`).join("");
  const details = [
    ["Employee Name", f.name], ["Pay Period", f.month],
    ["Employee ID", f.empId], ["Payslip No.", f.slipRef],
    ["Designation", f.role], ["Bank / Mode", f.bank],
    ["Department", f.department], ["Payment Date", f.paymentDate || "-"],
  ];
  const tiles = [
    ["Working Days", f.totalDays], ["Days Present", f.attended], ["Days Absent (LOP)", f.absent],
    ["Hours / Day", `${f.dailyHours} h`], ["Per-day Rate", formatAmount(f.perDay)],
  ];

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Payslip - ${e(f.name)} - ${e(f.month)}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; font-size: 12px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 210mm; min-height: 297mm; margin: 0 auto; display: flex; flex-direction: column; }
  header { background: ${NAVY}; color: #fff; padding: 22px 40px 18px; display: flex; justify-content: space-between; gap: 24px; border-bottom: 4px solid ${ACCENT}; }
  header h1 { margin: 0; font-size: 21px; } header p { margin: 4px 0 0; color: #c7d2e5; font-size: 11px; }
  header .right { text-align: right; } header .title { font-size: 21px; font-weight: 800; letter-spacing: .5px; }
  .pill { display: inline-block; margin-top: 6px; padding: 2px 10px; border-radius: 99px; font-size: 10px; font-weight: 700; background: ${f.paid ? "#dcfce7" : "#dbeafe"}; color: ${f.paid ? "#15803d" : "#1d4ed8"}; }
  main { padding: 24px 40px; flex: 1; }
  h2 { font-size: 10.5px; color: ${MUTED}; letter-spacing: .6px; margin: 20px 0 8px; }
  .details { display: grid; grid-template-columns: 1fr 1fr; gap: 9px 28px; background: #f8fafc; border: 1px solid ${BORDER}; border-radius: 8px; padding: 14px 18px; }
  .details div { display: grid; grid-template-columns: 110px 1fr; } .details span { color: ${MUTED}; } .details b { color: #0f172a; overflow-wrap: anywhere; }
  .tiles { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
  .tiles div { border: 1px solid ${BORDER}; border-radius: 8px; padding: 10px 6px; text-align: center; }
  .tiles b { display: block; font-size: 17px; color: ${NAVY}; } .tiles span { font-size: 10px; color: ${MUTED}; }
  table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid ${BORDER}; border-radius: 8px; overflow: hidden; }
  th { background: #eef3fb; color: #214e8f; text-align: left; font-size: 10.5px; padding: 9px 12px; }
  td { padding: 9px 12px; border-top: 1px solid ${BORDER}; }
  th:nth-child(3), td:nth-child(3) { border-left: 1px solid ${BORDER}; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; } .neg { color: #b91c1c; }
  tfoot td { background: #f8fafc; font-weight: 700; }
  .net { margin-top: 18px; display: flex; justify-content: space-between; align-items: center; gap: 20px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 14px 18px; }
  .net small { display: block; color: #065f46; margin-top: 4px; } .net b { color: #047857; } .net strong { font-size: 24px; color: #065f46; white-space: nowrap; }
  .note { color: ${MUTED}; font-size: 10.5px; margin: 12px 0 0; }
  .sign { display: flex; justify-content: space-between; margin-top: 64px; }
  .sign div { width: 220px; border-top: 1px solid #94a3b8; padding-top: 6px; color: ${MUTED}; } .sign div:last-child { text-align: right; }
  footer { margin: 0 40px; padding: 12px 0 20px; border-top: 1px solid ${BORDER}; display: flex; justify-content: space-between; color: #94a3b8; font-size: 10px; }
</style></head>
<body><div class="page">
  <header>
    <div><h1>${e(f.company.name || "Salary Slip")}</h1>${f.company.address ? `<p>${e(f.company.address)}</p>` : ""}${f.company.meta ? `<p>${e(f.company.meta)}</p>` : ""}</div>
    <div class="right"><div class="title">PAYSLIP</div><p>Pay period: ${e(f.month)}</p><span class="pill">${e(f.status.toUpperCase())}</span></div>
  </header>
  <main>
    <h2>EMPLOYEE DETAILS</h2>
    <div class="details">${details.map(([label, value]) => `<div><span>${e(label)}</span><b>${e(value)}</b></div>`).join("")}</div>
    <h2>ATTENDANCE</h2>
    <div class="tiles">${tiles.map(([label, value]) => `<div><b>${e(value)}</b><span>${e(label)}</span></div>`).join("")}</div>
    <h2>EARNINGS &amp; DEDUCTIONS</h2>
    <table>
      <thead><tr><th>EARNINGS</th><th class="num">AMOUNT (INR)</th><th>DEDUCTIONS</th><th class="num">AMOUNT (INR)</th></tr></thead>
      <tbody>${tableRows}</tbody>
      <tfoot><tr><td>Gross Earnings</td><td class="num">${formatAmount(f.gross)}</td><td>Total Deductions</td><td class="num neg">${formatAmount(f.totalDeductions)}</td></tr></tfoot>
    </table>
    <div class="net"><div><b>NET PAY</b><small>${e(amountInWords(f.net))}</small></div><strong>INR ${formatAmount(f.net)}</strong></div>
    <p class="note">Net Pay = Gross Earnings - Total Deductions (Loss of Pay + Statutory Deductions + Advance Recovery)</p>
    ${f.paid ? `<p class="note">Disbursed INR ${formatAmount(f.paidAmount)}${f.paymentDate ? ` on ${e(f.paymentDate)}` : ""} via ${e(f.bank)}.</p>` : ""}
    <div class="sign"><div>Employee Signature</div><div>${f.company.name ? `<b style="color:#334155">For ${e(f.company.name)}</b><br>` : ""}Authorised Signatory</div></div>
  </main>
  <footer><span>This is a computer-generated payslip. Confidential - for the named employee only.</span><span>Generated ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span></footer>
</div></body></html>`;

  const printWindow = window.open("", "_blank", "width=900,height=1000");
  if (!printWindow) { window.alert("Please allow pop-ups to print or save the payslip."); return; }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 400);
}
