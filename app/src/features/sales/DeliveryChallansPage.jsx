import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Plus, Truck, CheckCircle2, X, AlertTriangle, Printer, Package, MapPin, UserCheck } from 'lucide-react';
import { RelatedDocumentsCard } from '../../components/common/RelatedDocumentsCard';
import { PageHeader } from '../../components/common/PageHeader';
const challanGuide = {
    title: 'Delivery Challans & Waybills',
    subtitle: 'Warehouse logistics dispatch, non-commercial shipping waybills, and proof of delivery (POD).',
    purpose: 'A Delivery Challan (or Shipping Waybill) is a formal logistics manifest accompanying physical goods during transit from your warehouse to the customer destination. Unlike an invoice, it contains zero commercial pricing or taxes, focusing strictly on SKUs, piece counts, carrier details, and receiver signatures.',
    keyTerms: [
        { term: 'Delivery Challan / Waybill', definition: 'A logistics shipping manifest used for physical goods transport and gate-pass security verification.' },
        { term: 'Proof of Delivery (POD)', definition: 'Signed confirmation by the consignee receiver verifying that goods arrived in full quantity and undamaged condition.' },
        { term: 'Consignee', definition: 'The designated recipient or receiving warehouse facility where goods are to be delivered.' },
        { term: 'Carrier / Transporter', definition: 'The freight company, logistics provider, or fleet vehicle handling transit (e.g. FedEx Freight, DHL).' },
    ],
    tips: [
        'Delivery Challans never show commercial unit prices or taxes, matching standard international shipping practices.',
        'Click "Confirm POD" once the customer signs the physical or digital receiving slip to mark delivery complete.',
    ],
    workflow: ['Sales Order Confirmed', 'Delivery Challan Generated', 'Carrier In-Transit', 'Consignee Receives Goods', 'POD Verified & Invoice Issued'],
};
export const DeliveryChallansPage = () => {
    const { deliveryChallans, addDeliveryChallan, updateDeliveryChallanStatus, salesOrders, invoices, paymentIns, items: masterItems, calculateItemStock, } = useERP();
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedChallan, setSelectedChallan] = useState(null);
    const [selectedSoId, setSelectedSoId] = useState(salesOrders[0]?.id || '');
    const [transporter, setTransporter] = useState('FedEx Freight Direct');
    const [vehicleNo, setVehicleNo] = useState('TRK-9041-WA');
    const [driverContact, setDriverContact] = useState('+1 (555) 349-2810');
    const [totalPackages, setTotalPackages] = useState(4);
    const [dispatchNote, setDispatchNote] = useState('Fragile electronic components. Handle with pallet forklift.');
    const [lineItems, setLineItems] = useState([]);
    const handleSoChange = (soId) => {
        setSelectedSoId(soId);
        const order = salesOrders.find((o) => o.id === soId);
        if (order && order.items && order.items.length > 0) {
            setLineItems(order.items.map(it => ({ ...it })));
        }
    };
    const openAddModal = () => {
        const defaultSo = salesOrders[0];
        if (defaultSo) {
            setSelectedSoId(defaultSo.id);
            setLineItems(defaultSo.items ? defaultSo.items.map(it => ({ ...it })) : []);
        }
        setShowAddModal(true);
    };
    const handleItemQtyChange = (index, newQty) => {
        const updated = [...lineItems];
        updated[index] = { ...updated[index], qty: Math.max(1, newQty) };
        setLineItems(updated);
    };
    const handleCreate = (e) => {
        e.preventDefault();
        const order = salesOrders.find((o) => o.id === selectedSoId) || salesOrders[0];
        addDeliveryChallan({
            challanNumber: `DC-2026-${String(deliveryChallans.length + 45).padStart(3, '0')}`,
            salesOrderId: order?.id,
            salesOrderNumber: order?.orderNumber || 'SO-2026-0102',
            linkedSo: order?.orderNumber || 'SO-2026-0102',
            customerId: order?.customerId,
            customer: order?.customer || 'Acme Corp',
            dispatchDate: new Date().toISOString().split('T')[0],
            transporter,
            vehicleNo,
            status: 'In Transit',
            items: lineItems.length > 0 ? lineItems : order?.items || [],
        });
        setShowAddModal(false);
    };
    const markDelivered = (id) => {
        updateDeliveryChallanStatus(id, 'Delivered');
        if (selectedChallan && selectedChallan.id === id) {
            setSelectedChallan({ ...selectedChallan, status: 'Delivered' });
        }
    };
    const getChallanRelatedDocs = (challan) => {
        const docs = [];
        const soNum = challan.salesOrderNumber || challan.linkedSo;
        if (soNum) {
            const order = salesOrders.find((o) => o.orderNumber === soNum || o.id === challan.salesOrderId);
            if (order) {
                docs.push({
                    type: 'Sales Order',
                    number: order.orderNumber,
                    amount: order.amount,
                    date: order.date,
                    status: order.stage,
                });
                const invs = invoices.filter((i) => i.salesOrderId === order.id || i.linkedSo === order.orderNumber);
                invs.forEach((inv) => {
                    docs.push({
                        type: 'Invoice',
                        number: inv.invoiceNumber,
                        amount: inv.total,
                        date: inv.date,
                        status: inv.status,
                    });
                    const payments = paymentIns.filter((p) => p.invoiceId === inv.id || p.invoiceNumber === inv.invoiceNumber);
                    payments.forEach((p) => {
                        docs.push({
                            type: 'Payment',
                            number: p.receiptNumber,
                            amount: p.amount,
                            date: p.date,
                            status: 'Settled',
                        });
                    });
                });
            }
        }
        return docs;
    };
    const columns = [
        {
            key: 'challanNumber',
            header: 'Challan / Waybill #',
            render: (c) => (<button onClick={() => setSelectedChallan(c)} className="font-mono font-bold text-blue-600 hover:underline flex items-center gap-1.5 cursor-pointer text-left">
          <Truck size={13} className="text-slate-400"/> {c.challanNumber}
        </button>),
        },
        {
            key: 'salesOrderNumber',
            header: 'Linked Sales Order',
            render: (c) => <span className="font-mono font-semibold text-slate-700">{c.salesOrderNumber || c.linkedSo}</span>,
        },
        {
            key: 'customer',
            header: 'Consignee / Destination',
            render: (c) => (<div>
          <span className="font-bold text-[#1F2E4A] block">{c.customer}</span>
          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
            <MapPin size={10}/> Dock Receiving Bay
          </span>
        </div>),
        },
        {
            key: 'dispatchDate',
            header: 'Dispatch Date',
            render: (c) => <span className="text-slate-600 font-medium">{c.dispatchDate || c.date}</span>,
        },
        {
            key: 'transporter',
            header: 'Logistics Carrier',
            render: (c) => (<div>
          <p className="font-semibold text-slate-800">{c.transporter}</p>
          <span className="font-mono text-[10px] text-slate-500">
            {c.vehicleNo || c.trackingNumber || 'TRK-DIRECT'}
          </span>
        </div>),
        },
        {
            key: 'items',
            header: 'Total Units',
            align: 'center',
            render: (c) => {
                const totalUnits = (c.items || []).reduce((acc, it) => acc + (it.qty || 1), 0);
                return (<span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
            <Package size={11} className="text-slate-500"/> {totalUnits} pcs
          </span>);
            },
        },
        {
            key: 'status',
            header: 'Dispatch Status',
            align: 'center',
            render: (c) => <StatusBadge status={c.status}/>,
        },
        {
            key: 'actions',
            header: 'Proof of Delivery',
            align: 'right',
            render: (c) => c.status !== 'Delivered' ? (<button onClick={() => markDelivered(c.id)} className="px-2.5 py-1 bg-[#1F2E4A] text-white rounded text-[11px] font-semibold hover:bg-[#152033] cursor-pointer flex items-center gap-1 ml-auto shadow-sm">
            <CheckCircle2 size={11}/> Confirm POD
          </button>) : (<span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1 justify-end">
            <UserCheck size={12}/> POD Verified
          </span>),
        },
    ];
    // Stock shortage check for the modal
    const hasShortages = lineItems.some((item) => {
        if (!item.itemId)
            return false;
        const stock = calculateItemStock(item.itemId);
        return stock.available < item.qty;
    });
    return (<div className="space-y-6">
      <PageHeader title="Delivery Challans & Logistics Waybills" subtitle="Warehouse dispatch manifests, physical goods delivery waybills, carrier vehicle tracking, and proof of delivery (POD)." guide={challanGuide} actions={<Button icon={Plus} onClick={openAddModal}>
            Issue Delivery Challan
          </Button>}/>

      <DataTable title="Active Dispatch Consignments" columns={columns} data={deliveryChallans} keyExtractor={(c) => c.id} searchPlaceholder="Search challan #, sales order, or carrier..." searchFilter={(c, term) => c.challanNumber.toLowerCase().includes(term) ||
            (c.salesOrderNumber && c.salesOrderNumber.toLowerCase().includes(term)) ||
            c.customer.toLowerCase().includes(term) ||
            (c.transporter && c.transporter.toLowerCase().includes(term))}/>

      {/* Create Logistics Challan Modal */}
      {showAddModal && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-3xl w-full p-6 shadow-2xl text-xs max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600"/>
                <div>
                  <h3 className="font-bold text-base text-[#1F2E4A]">Issue Warehouse Delivery Challan</h3>
                  <p className="text-[11px] text-slate-500">Physical dispatch manifest for logistics and carrier tracking</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18}/>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 mt-4 overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Source Sales Order *</label>
                  <select required value={selectedSoId} onChange={(e) => handleSoChange(e.target.value)} className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 font-medium">
                    {salesOrders.map((so) => (<option key={so.id} value={so.id}>
                        {so.orderNumber} - {so.customer} ({so.items?.length || 0} items)
                      </option>))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Carrier / Transporter</label>
                  <input type="text" value={transporter} onChange={(e) => setTransporter(e.target.value)} className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800" placeholder="e.g. FedEx Freight, DHL"/>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Vehicle / Truck Plate #</label>
                  <input type="text" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800" placeholder="e.g. TRK-9041-WA"/>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Driver Contact / Phone</label>
                  <input type="text" value={driverContact} onChange={(e) => setDriverContact(e.target.value)} className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800"/>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Total Packages / Cartons</label>
                  <input type="number" min="1" value={totalPackages} onChange={(e) => setTotalPackages(Number(e.target.value))} className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800"/>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Handling / Gate Pass Instructions</label>
                <input type="text" value={dispatchNote} onChange={(e) => setDispatchNote(e.target.value)} className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800" placeholder="Special storage, gate pass, or forklift handling instructions..."/>
              </div>

              {/* Warehouse Dispatch Manifest Item Table (No Commercial Invoicing Fields) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 block">
                    Dispatch Item Manifest (Physical Goods Only)
                  </label>
                  <span className="text-[11px] text-slate-400">Commercial pricing excluded on shipping waybill</span>
                </div>

                {hasShortages && (<div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs">
                    <AlertTriangle size={16} className="text-rose-600 shrink-0"/>
                    <span>
                      <strong>Stock Warning:</strong> One or more items have insufficient warehouse stock. Please verify before dispatching.
                    </span>
                  </div>)}

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 uppercase font-semibold text-slate-500 tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Item SKU & Description</th>
                        <th className="py-2.5 px-3 w-28 text-center">Warehouse Bin</th>
                        <th className="py-2.5 px-3 w-24 text-center">Avail Stock</th>
                        <th className="py-2.5 px-3 w-24 text-center">Dispatch Qty</th>
                        <th className="py-2.5 px-3 w-20 text-center">UOM</th>
                        <th className="py-2.5 px-3 w-28 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {lineItems.length === 0 ? (<tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400">
                            No items found in selected sales order.
                          </td>
                        </tr>) : (lineItems.map((item, idx) => {
                const stock = item.itemId ? calculateItemStock(item.itemId) : { available: 10 };
                const mi = masterItems.find((m) => m.id === item.itemId);
                const isShort = stock.available < item.qty;
                return (<tr key={item.id || idx} className={`hover:bg-slate-50/70 ${isShort ? 'bg-rose-50/30' : ''}`}>
                              <td className="p-2.5">
                                <p className="font-semibold text-slate-800">{item.description}</p>
                                <span className="font-mono text-[10px] text-slate-400">SKU: {item.itemSku || mi?.sku || 'GEN-SKU'}</span>
                              </td>
                              <td className="p-2.5 text-center font-mono text-[11px] text-slate-600">
                                {mi?.category === 'Electronics' ? 'BIN-E04-R2' : 'BIN-A12-R1'}
                              </td>
                              <td className="p-2.5 text-center">
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${stock.available <= 0
                        ? 'bg-rose-100 text-rose-800'
                        : stock.available < item.qty
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-50 text-emerald-700'}`}>
                                  {stock.available} in stock
                                </span>
                              </td>
                              <td className="p-2.5 text-center">
                                <input type="number" min="1" value={item.qty} onChange={(e) => handleItemQtyChange(idx, Number(e.target.value))} className="w-16 text-center text-xs font-semibold text-slate-800 border border-slate-200 rounded px-1.5 py-1 focus:ring-1 focus:ring-blue-500"/>
                              </td>
                              <td className="p-2.5 text-center font-semibold text-slate-500">
                                PCS
                              </td>
                              <td className="p-2.5 text-center">
                                {isShort ? (<span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                                    Deficit ({item.qty - stock.available})
                                  </span>) : (<span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                    Ready
                                  </span>)}
                              </td>
                            </tr>);
            }))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Dispatch & Generate Waybill
                </Button>
              </div>
            </form>
          </div>
        </div>)}

      {/* Printable Logistics Waybill & POD Modal */}
      {selectedChallan && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 text-xs max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1F2E4A] text-white font-bold flex items-center justify-center">
                  <Truck size={18}/>
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1F2E4A]">Delivery Challan & Goods Waybill</h3>
                  <span className="font-mono font-semibold text-slate-500">{selectedChallan.challanNumber}</span>
                </div>
                <StatusBadge status={selectedChallan.status}/>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold cursor-pointer flex items-center gap-1.5">
                  <Printer size={13}/> Print Waybill
                </button>
                <button onClick={() => setSelectedChallan(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                  <X size={18}/>
                </button>
              </div>
            </div>

            <div className="space-y-6 overflow-y-auto pr-1 flex-1">
              {/* Shipper & Consignee Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Shipper / Dispatch From</span>
                  <p className="font-bold text-slate-900">Horizon Global Logistics & Warehousing Hub</p>
                  <p className="text-slate-600">452 Industrial Parkway, Dock 14B</p>
                  <p className="text-slate-600">Seattle, WA 98101 • United States</p>
                </div>
                <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-4">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Consignee / Deliver To</span>
                  <p className="font-bold text-blue-900">{selectedChallan.customer}</p>
                  <p className="text-slate-600">Customer Receiving Facility / Inbound Dock</p>
                  <p className="text-slate-600">Linked Order: <strong className="font-mono text-slate-800">{selectedChallan.salesOrderNumber || selectedChallan.linkedSo}</strong></p>
                </div>
              </div>

              {/* Carrier Logistics Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Transporter</span>
                  <p className="font-semibold text-slate-800">{selectedChallan.transporter}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Vehicle / Reg #</span>
                  <p className="font-mono font-semibold text-slate-800">{selectedChallan.vehicleNo || 'TRK-9041-WA'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Dispatch Date</span>
                  <p className="font-semibold text-slate-800">{selectedChallan.dispatchDate || selectedChallan.date || 'Today'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Dispatch Type</span>
                  <p className="font-semibold text-emerald-700">Non-Commercial Waybill</p>
                </div>
              </div>

              {/* Related Transaction Chain */}
              <RelatedDocumentsCard documents={getChallanRelatedDocs(selectedChallan)}/>

              {/* Clean Manifest Table (No Commercial Prices/Taxes) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <Package size={14} className="text-blue-600"/> Physical Goods Manifest ({selectedChallan.items?.length || 0} Items)
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">Verified by Warehouse Inspection</span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 uppercase font-semibold text-slate-500 tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">#</th>
                        <th className="py-2.5 px-3">Item Description</th>
                        <th className="py-2.5 px-3 w-32">SKU / Code</th>
                        <th className="py-2.5 px-3 w-28 text-center">Dispatched Qty</th>
                        <th className="py-2.5 px-3 w-20 text-center">UOM</th>
                        <th className="py-2.5 px-3 w-32 text-center">Packaging</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {(selectedChallan.items || []).map((it, idx) => (<tr key={it.id || idx} className="hover:bg-slate-50/60">
                          <td className="p-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-2.5 font-semibold text-slate-800">{it.description}</td>
                          <td className="p-2.5 font-mono text-slate-500 text-[11px]">{it.itemSku || 'SKU-LOG-01'}</td>
                          <td className="p-2.5 text-center font-bold text-slate-900">{it.qty}</td>
                          <td className="p-2.5 text-center text-slate-500 font-medium">PCS</td>
                          <td className="p-2.5 text-center text-slate-500 text-[11px]">Carton / Sealed</td>
                        </tr>))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Proof of Delivery (POD) & Authorization Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="border border-dashed border-slate-300 rounded-xl p-3 space-y-2 bg-slate-50/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Warehouse Dispatcher Signature</span>
                  <div className="h-12 border-b border-slate-300 flex items-end pb-1 font-mono text-[11px] text-slate-500">
                    Authorized Signatory (Warehouse Mgr.)
                  </div>
                  <p className="text-[10px] text-slate-400">Goods dispatched in undamaged, verified condition.</p>
                </div>

                <div className="border border-dashed border-blue-200 rounded-xl p-3 space-y-2 bg-blue-50/30">
                  <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Receiver Proof of Delivery (POD)</span>
                  <div className="h-12 border-b border-blue-300 flex items-end pb-1 font-mono text-[11px] text-blue-900">
                    {selectedChallan.status === 'Delivered' ? 'Signed & Received by Consignee' : 'Awaiting Consignee Receiver Signature & Stamp'}
                  </div>
                  <p className="text-[10px] text-slate-400">Received complete quantity in good order and condition.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 bg-slate-50 -mx-6 -mb-6 px-6 py-3">
              <span className="text-slate-500">
                Logistics Status: <strong className="text-slate-800">{selectedChallan.status}</strong>
              </span>
              <div className="flex items-center gap-2">
                {selectedChallan.status !== 'Delivered' && (<Button onClick={() => markDelivered(selectedChallan.id)}>
                    Confirm Proof of Delivery (POD)
                  </Button>)}
                <Button variant="outline" onClick={() => setSelectedChallan(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>)}
    </div>);
};
