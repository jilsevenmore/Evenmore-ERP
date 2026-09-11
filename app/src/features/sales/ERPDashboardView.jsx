import React from 'react';
import { AlertTriangle, Receipt, GitPullRequest, ArrowRight, ShieldCheck, ArrowUpRight, } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
export const DashboardView = ({ onSelectScreen, faultyParts, invoices, zoneRequests, }) => {
    const { formatCurrency } = useERP();
    const reportedFaulty = faultyParts.filter((p) => p.status === 'Reported').length;
    const inProgressFaulty = faultyParts.filter((p) => p.status === 'Sent for Replacement').length;
    const totalInvoiceSum = invoices.reduce((s, i) => s + i.total, 0);
    const unpaidInvoices = invoices.filter((i) => i.status === 'Unpaid');
    const unpaidSum = unpaidInvoices.reduce((s, i) => s + i.total, 0);
    const pendingZoneReqs = zoneRequests.filter((r) => r.status === 'Requested').length;
    return (<div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 bg-[#F8F9FA] font-sans">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg border border-[#CED4DA] shadow-2xs">
        <div>
          <span className="inline-block px-2 py-0.5 bg-[#1F2E4A]/10 text-[#1F2E4A] text-[11px] font-bold uppercase tracking-wider rounded mb-2">
            Horizon Operations Hub
          </span>
          <h2 className="text-2xl font-bold text-[#1F2E4A] tracking-tight">
            Enterprise Inventory & Logistics Dashboard
          </h2>
          <p className="text-xs text-[#5a6062] mt-1">
            Real-time synchronization across Faulty Parts RMA, Customer Invoicing, and Zone Requisitions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
            All Nodes Operational
          </span>
        </div>
      </div>

      {/* 3 Core Workflow Modules from Screenshots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Screen 1 Card: Faulty Parts Loop */}
        <div className="bg-white rounded-lg border border-[#CED4DA] p-6 shadow-2xs flex flex-col justify-between hover:border-[#1F2E4A] transition-all group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5"/>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5a6062]">
                Workflow #1
              </span>
            </div>

            <h3 className="text-base font-bold text-[#1F2E4A] group-hover:text-blue-900 transition-colors">
              Faulty Parts Loop
            </h3>
            <p className="text-xs text-[#5a6062] mt-1 mb-4 leading-relaxed">
              Track defective hardware through vendor diagnostics, courier return logistics, and inventory replacement.
            </p>

            <div className="space-y-2.5 bg-[#F8F9FA] p-3 rounded border border-[#CED4DA]/70 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#5a6062]">Awaiting Vendor Shipment:</span>
                <span className="font-bold text-[#1F2E4A]">{reportedFaulty} items</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5a6062]">In Vendor Assessment:</span>
                <span className="font-semibold text-blue-700">{inProgressFaulty} units</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5a6062]">Total Active RMAs:</span>
                <span className="font-bold text-[#2d3335]">{faultyParts.length}</span>
              </div>
            </div>
          </div>

          <button onClick={() => onSelectScreen('faulty-parts')} className="mt-6 w-full py-2 bg-[#1F2E4A] hover:bg-[#152036] text-white rounded text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-2xs">
            Open Faulty Parts Screen
            <ArrowRight className="w-3.5 h-3.5"/>
          </button>
        </div>

        {/* Screen 2 Card: Sales Invoices */}
        <div className="bg-white rounded-lg border border-[#CED4DA] p-6 shadow-2xs flex flex-col justify-between hover:border-[#1F2E4A] transition-all group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
                <Receipt className="w-5 h-5"/>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5a6062]">
                Workflow #2
              </span>
            </div>

            <h3 className="text-base font-bold text-[#1F2E4A] group-hover:text-blue-900 transition-colors">
              Sales Invoices
            </h3>
            <p className="text-xs text-[#5a6062] mt-1 mb-4 leading-relaxed">
              Enterprise customer billing table with real-time tax calculation, draft saving, and payment recording.
            </p>

            <div className="space-y-2.5 bg-[#F8F9FA] p-3 rounded border border-[#CED4DA]/70 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#5a6062]">Total Billed (YTD):</span>
                <span className="font-bold text-[#1F2E4A] font-mono">
                  {formatCurrency(totalInvoiceSum, { noDecimals: true })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5a6062]">Pending Collections:</span>
                <span className="font-semibold text-amber-700 font-mono">
                  {formatCurrency(unpaidSum, { noDecimals: true })} ({unpaidInvoices.length} unpaid)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5a6062]">Generated Invoices:</span>
                <span className="font-bold text-[#2d3335]">{invoices.length} records</span>
              </div>
            </div>
          </div>

          <button onClick={() => onSelectScreen('sales-invoices')} className="mt-6 w-full py-2 bg-[#1F2E4A] hover:bg-[#152036] text-white rounded text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-2xs">
            Open Sales Invoices Screen
            <ArrowRight className="w-3.5 h-3.5"/>
          </button>
        </div>

        {/* Screen 3 Card: Zone Stock Requests */}
        <div className="bg-white rounded-lg border border-[#CED4DA] p-6 shadow-2xs flex flex-col justify-between hover:border-[#0CB1AC] transition-all group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 text-[#0CB1AC] flex items-center justify-center">
                <GitPullRequest className="w-5 h-5"/>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5a6062]">
                Workflow #3
              </span>
            </div>

            <h3 className="text-base font-bold text-[#1F2E4A] group-hover:text-teal-800 transition-colors">
              Zone Stock Requests
            </h3>
            <p className="text-xs text-[#5a6062] mt-1 mb-4 leading-relaxed">
              Warehouse fulfillment queues across manufacturing zones with instant sign-off and dispatch drawers.
            </p>

            <div className="space-y-2.5 bg-[#F8F9FA] p-3 rounded border border-[#CED4DA]/70 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#5a6062]">Awaiting Approval:</span>
                <span className="font-bold text-amber-700">{pendingZoneReqs} requisitions</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5a6062]">Active Zones:</span>
                <span className="font-semibold text-[#2d3335]">Zone A, B, C, D, F</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5a6062]">Main Warehouse Stock:</span>
                <span className="font-bold text-emerald-700">Healthy (42-110+ units)</span>
              </div>
            </div>
          </div>

          <button onClick={() => onSelectScreen('zone-requests')} className="mt-6 w-full py-2 bg-[#0CB1AC] hover:bg-[#0aa09c] text-white rounded text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-2xs">
            Open Zone Requests Screen
            <ArrowRight className="w-3.5 h-3.5"/>
          </button>
        </div>
      </div>

      {/* Recent Cross-Module Activity */}
      <div className="bg-white rounded-lg border border-[#CED4DA] p-6 shadow-2xs">
        <h3 className="text-sm font-bold text-[#1F2E4A] uppercase tracking-wider mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#1F2E4A]"/>
          System Operational Audit Stream
        </h3>
        <div className="divide-y divide-[#CED4DA] text-xs">
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-blue-500"/>
              <div>
                <p className="font-semibold text-[#1F2E4A]">
                  RMA-2023-1094 Registered: Cisco Catalyst 9300 Switch (Qty: 2)
                </p>
                <p className="text-[#5a6062]">Vendor: Cisco Direct • Port 12-24 PoE failure logged</p>
              </div>
            </div>
            <button onClick={() => onSelectScreen('faulty-parts')} className="text-xs text-[#1F2E4A] font-semibold hover:underline flex items-center gap-1">
              Inspect RMA <ArrowUpRight className="w-3 h-3"/>
            </button>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500"/>
              <div>
                <p className="font-semibold text-[#1F2E4A]">
                  Invoice INV-2026-003 Generated: Stark Industries ($45,000.00)
                </p>
                <p className="text-[#5a6062]">Linked SO-2026-0050 • Status: Paid</p>
              </div>
            </div>
            <button onClick={() => onSelectScreen('sales-invoices')} className="text-xs text-[#1F2E4A] font-semibold hover:underline flex items-center gap-1">
              View Invoice <ArrowUpRight className="w-3 h-3"/>
            </button>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-amber-500"/>
              <div>
                <p className="font-semibold text-[#1F2E4A]">
                  Requisition #REQ-8042 Submitted: 12V Battery Pack (5 units)
                </p>
                <p className="text-[#5a6062]">Requested by Sarah Jenkins for Zone A (Sector 4)</p>
              </div>
            </div>
            <button onClick={() => onSelectScreen('zone-requests')} className="text-xs text-[#0CB1AC] font-semibold hover:underline flex items-center gap-1">
              Review Requisition <ArrowUpRight className="w-3 h-3"/>
            </button>
          </div>
        </div>
      </div>
    </div>);
};
