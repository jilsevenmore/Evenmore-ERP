import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockCustomers, mockVendors, mockInventoryItems, mockCategories, mockQuotations, mockSalesOrders, mockDeliveryChallans, mockPaymentIns, mockSalesReturns, mockPurchaseOrders, mockPurchaseBills, mockPaymentOuts, mockPurchaseReturns, mockExpenses, mockLocations, mockTransfers, mockServiceUsages, mockValuationItems, mockMonthEndAudits, mockBankAccounts, initialFaultyParts, initialSalesInvoices, initialZoneRequests, mockInventoryMovements, mockParties, mockUnits, mockCategoryParts, mockItemParts } from '../data/erp/mockData';
import { formatDateDDMMYYYY, getCurrentDateFormatted } from '../utils/dateUtils';
import { formatCurrency as formatCurrencyUtil, getCurrencySymbol, getCurrencyConfig, CURRENCY_CONFIGS, fetchLiveExchangeRates, DEFAULT_RATES } from '../utils/currencyUtils';
const STORAGE_KEY = 'horizon_erp_v2_state';
const initialJournalEntries = [
    {
        id: 'je-1',
        entryNumber: 'JE-2026-081',
        date: 'Oct 24, 2026',
        description: 'Inventory Purchase - Cisco Catalyst Switches',
        reference: 'BILL-2026-0190',
        debitAccount: '1410 - Inventory Asset',
        creditAccount: '2010 - Accounts Payable',
        amount: 22200.0,
        status: 'Posted',
    },
    {
        id: 'je-2',
        entryNumber: 'JE-2026-082',
        date: 'Oct 25, 2026',
        description: 'Client Invoice Settlement - Acme Corp',
        reference: 'REC-2026-0051',
        debitAccount: '1010 - Cash & Bank',
        creditAccount: '1210 - Accounts Receivable',
        amount: 5820.0,
        status: 'Posted',
    },
    {
        id: 'je-3',
        entryNumber: 'JE-2026-083',
        date: 'Oct 26, 2026',
        description: 'Operating Freight Overheads',
        reference: 'EXP-2026-051',
        debitAccount: '5020 - Logistics & Freight Expense',
        creditAccount: '1010 - Cash & Bank',
        amount: 145.8,
        status: 'Posted',
    },
];
const ERPContext = createContext(null);
const loadSavedState = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed?.parties) && parsed.parties.length > 0) {
                parsed.parties = parsed.parties.map((p, idx) => {
                    const fallback = mockParties[idx] || mockParties[0] || {};
                    return {
                        ...fallback,
                        ...p,
                        name: p.name || p.companyName || p.company || fallback.name || `Partner ${idx + 1}`,
                    };
                });
            }
            if (Array.isArray(parsed?.customers) && parsed.customers.length > 0) {
                parsed.customers = parsed.customers.map((c, idx) => {
                    const fallback = mockCustomers[idx] || mockCustomers[0] || {};
                    return {
                        ...fallback,
                        ...c,
                        name: c.name || fallback.name || `Customer ${idx + 1}`,
                    };
                });
            }
            if (Array.isArray(parsed?.vendors) && parsed.vendors.length > 0) {
                parsed.vendors = parsed.vendors.map((v, idx) => {
                    const fallback = mockVendors[idx] || mockVendors[0] || {};
                    return {
                        ...fallback,
                        ...v,
                        name: v.name || fallback.name || `Vendor ${idx + 1}`,
                    };
                });
            }
            return parsed;
        }
    }
    catch (e) {
        console.error('Failed to load state from localStorage', e);
    }
    return null;
};
export const ERPProvider = ({ children, }) => {
    const initial = loadSavedState();
    const [faultyParts, setFaultyParts] = useState(initial?.faultyParts || initialFaultyParts);
    const [invoices, setInvoices] = useState(initial?.invoices || initialSalesInvoices);
    const [zoneRequests, setZoneRequests] = useState(initial?.zoneRequests || initialZoneRequests);
    const [customers, setCustomers] = useState(initial?.customers || mockCustomers);
    const [vendors, setVendors] = useState(initial?.vendors || mockVendors);
    const [parties, setParties] = useState(initial?.parties || mockParties);
    const [units, setUnits] = useState(initial?.units || mockUnits);
    const [categoryParts, setCategoryParts] = useState(initial?.categoryParts || mockCategoryParts);
    const [itemParts, setItemParts] = useState(initial?.itemParts || mockItemParts);
    const [items, setItems] = useState(initial?.items || mockInventoryItems);
    const [categories, setCategories] = useState(initial?.categories || mockCategories);
    const [quotations, setQuotations] = useState(initial?.quotations || mockQuotations);
    const [salesOrders, setSalesOrders] = useState(initial?.salesOrders || mockSalesOrders);
    const [deliveryChallans, setDeliveryChallans] = useState(initial?.deliveryChallans || mockDeliveryChallans);
    const [paymentIns, setPaymentIns] = useState(initial?.paymentIns || mockPaymentIns);
    const [salesReturns, setSalesReturns] = useState(initial?.salesReturns || mockSalesReturns);
    const [purchaseOrders, setPurchaseOrders] = useState(initial?.purchaseOrders || mockPurchaseOrders);
    const [purchaseBills, setPurchaseBills] = useState(initial?.purchaseBills || mockPurchaseBills);
    const [paymentOuts, setPaymentOuts] = useState(initial?.paymentOuts || mockPaymentOuts);
    const [purchaseReturns, setPurchaseReturns] = useState(initial?.purchaseReturns || mockPurchaseReturns);
    const [expenses, setExpenses] = useState(initial?.expenses || mockExpenses);
    const [locations, setLocations] = useState(initial?.locations || mockLocations);
    const [transfers, setTransfers] = useState(initial?.transfers || mockTransfers);
    const [serviceUsages, setServiceUsages] = useState(initial?.serviceUsages || mockServiceUsages);
    const [valuationItems, setValuationItems] = useState(initial?.valuationItems || mockValuationItems);
    const [monthEndAudits, setMonthEndAudits] = useState(initial?.monthEndAudits || mockMonthEndAudits);
    const [bankAccounts, setBankAccounts] = useState(initial?.bankAccounts || mockBankAccounts);
    const [journalEntries, setJournalEntries] = useState(initial?.journalEntries || initialJournalEntries);
    const [inventoryMovements, setInventoryMovements] = useState(initial?.inventoryMovements || mockInventoryMovements);
    const [currency, setCurrencyState] = useState(() => {
        return initial?.currency || localStorage.getItem('evenmore_currency') || 'USD ($)';
    });
    const [liveRates, setLiveRates] = useState(DEFAULT_RATES);
    const [toastMessage, setToastMessage] = useState(null);

    useEffect(() => {
        fetchLiveExchangeRates()
            .then((rates) => {
                if (rates) setLiveRates(rates);
            })
            .catch((err) => console.warn('Live forex rate sync:', err));
    }, []);

    const setCurrency = (newCurr) => {
        setCurrencyState(newCurr);
        try {
            localStorage.setItem('evenmore_currency', newCurr);
        } catch (e) {}
        showToast(`System base currency updated to ${newCurr}`);
    };

    const formatCurrency = (amount, opts = {}) => {
        return formatCurrencyUtil(amount, currency, { ...opts, customRates: liveRates });
    };

    const currencySymbol = getCurrencySymbol(currency);

    // Auto-save to localStorage
    useEffect(() => {
        try {
            const stateToSave = {
                faultyParts,
                invoices,
                zoneRequests,
                customers,
                vendors,
                parties,
                units,
                categoryParts,
                itemParts,
                items,
                categories,
                quotations,
                salesOrders,
                deliveryChallans,
                paymentIns,
                salesReturns,
                purchaseOrders,
                purchaseBills,
                paymentOuts,
                purchaseReturns,
                expenses,
                locations,
                transfers,
                serviceUsages,
                valuationItems,
                monthEndAudits,
                bankAccounts,
                journalEntries,
                inventoryMovements,
                currency,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        }
        catch (e) {
            console.error('Failed to save state to localStorage', e);
        }
    }, [
        faultyParts,
        invoices,
        zoneRequests,
        customers,
        vendors,
        parties,
        units,
        categoryParts,
        itemParts,
        items,
        categories,
        quotations,
        salesOrders,
        deliveryChallans,
        paymentIns,
        salesReturns,
        purchaseOrders,
        purchaseBills,
        paymentOuts,
        purchaseReturns,
        expenses,
        locations,
        transfers,
        serviceUsages,
        valuationItems,
        monthEndAudits,
        bankAccounts,
        journalEntries,
        inventoryMovements,
    ]);
    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage((prev) => (prev === msg ? null : prev));
        }, 3500);
    };
    const resetDemoData = () => {
        localStorage.removeItem(STORAGE_KEY);
        setFaultyParts(initialFaultyParts);
        setInvoices(initialSalesInvoices);
        setZoneRequests(initialZoneRequests);
        setCustomers(mockCustomers);
        setVendors(mockVendors);
        setItems(mockInventoryItems);
        setCategories(mockCategories);
        setQuotations(mockQuotations);
        setSalesOrders(mockSalesOrders);
        setDeliveryChallans(mockDeliveryChallans);
        setPaymentIns(mockPaymentIns);
        setSalesReturns(mockSalesReturns);
        setPurchaseOrders(mockPurchaseOrders);
        setPurchaseBills(mockPurchaseBills);
        setPaymentOuts(mockPaymentOuts);
        setPurchaseReturns(mockPurchaseReturns);
        setExpenses(mockExpenses);
        setLocations(mockLocations);
        setTransfers(mockTransfers);
        setServiceUsages(mockServiceUsages);
        setValuationItems(mockValuationItems);
        setMonthEndAudits(mockMonthEndAudits);
        setBankAccounts(mockBankAccounts);
        setJournalEntries(initialJournalEntries);
        setInventoryMovements(mockInventoryMovements);
        showToast('Factory demo data restored successfully.');
    };
    // ---------------- DOMAIN QUERIES ----------------
    const getItemMovements = (itemIdOrSku) => {
        return inventoryMovements.filter((m) => m.itemId === itemIdOrSku || m.itemSku?.toLowerCase() === itemIdOrSku.toLowerCase());
    };
    const calculateItemStock = (itemIdOrSku) => {
        const item = items.find((i) => i.id === itemIdOrSku || i.sku?.toLowerCase() === itemIdOrSku.toLowerCase());
        const targetId = item?.id || itemIdOrSku;
        const targetSku = item?.sku || itemIdOrSku;
        // Sum all movements for this item
        const moves = inventoryMovements.filter((m) => m.itemId === targetId || (m.itemSku && m.itemSku.toLowerCase() === targetSku.toLowerCase()));
        let netMovementQty = 0;
        moves.forEach((m) => {
            netMovementQty += m.quantity;
        });
        // Count damaged parts
        const damagedMoves = moves.filter((m) => m.type === 'FAULTY');
        const totalDamaged = damagedMoves.reduce((acc, m) => acc + Math.abs(m.quantity), 0);
        // Sum open reservations from Sales Orders in 'Draft' / 'Confirmed' / 'Packing'
        let reservedQty = 0;
        salesOrders.forEach((so) => {
            if (so.stage !== 'Delivered' && so.stage !== 'Invoiced' && so.stage !== 'Cancelled' && so.status !== 'Cancelled') {
                if (so.items && Array.isArray(so.items)) {
                    so.items.forEach((line) => {
                        if (line.itemId === targetId || line.itemSku?.toLowerCase() === targetSku.toLowerCase()) {
                            reservedQty += line.qty || 0;
                        }
                    });
                }
            }
        });
        const onHand = Math.max(0, netMovementQty > 0 ? netMovementQty : (item?.availableQty ?? 0));
        const available = Math.max(0, onHand - reservedQty);
        return {
            onHand,
            reserved: reservedQty,
            damaged: totalDamaged,
            available,
        };
    };
    const getCustomerLedger = (customerIdOrName) => {
        const cust = customers.find((c) => c.id === customerIdOrName || c.name.toLowerCase() === customerIdOrName.toLowerCase());
        const custName = cust?.name || customerIdOrName;
        const entries = [];
        // 1. Invoices (Debit - increases customer balance / AR)
        invoices.forEach((inv) => {
            if (inv.customer?.toLowerCase() === custName.toLowerCase() || (cust && inv.customerId === cust.id)) {
                entries.push({
                    id: `led-inv-${inv.id}`,
                    date: inv.date,
                    type: 'Sales Invoice',
                    reference: inv.invoiceNumber,
                    description: `Invoice ${inv.invoiceNumber} - ${inv.items?.[0]?.description || 'General Merchandise'}`,
                    debit: inv.total,
                    credit: 0,
                    balance: 0,
                });
            }
        });
        // 2. Payments (Credit - decreases AR)
        paymentIns.forEach((p) => {
            if (p.customer?.toLowerCase() === custName.toLowerCase() || (cust && p.customerId === cust.id)) {
                entries.push({
                    id: `led-pay-${p.id}`,
                    date: p.date,
                    type: 'Payment Received',
                    reference: p.receiptNumber,
                    description: `Settlement via ${p.mode || 'Bank'} (${p.reference || 'Ref'})`,
                    debit: 0,
                    credit: p.amount,
                    balance: 0,
                });
            }
        });
        // 3. Sales Returns / Credit Notes (Credit - decreases AR)
        salesReturns.forEach((sr) => {
            if (sr.customer?.toLowerCase() === custName.toLowerCase() || (cust && sr.customerId === cust.id)) {
                entries.push({
                    id: `led-sr-${sr.id}`,
                    date: sr.date,
                    type: 'Credit Note',
                    reference: sr.returnNumber,
                    description: `Credit Note for Return against ${sr.invoiceRef || 'Invoice'}: ${sr.reason}`,
                    debit: 0,
                    credit: sr.amount,
                    balance: 0,
                });
            }
        });
        // Sort entries chronologically
        entries.sort((a, b) => (a.date > b.date ? 1 : -1));
        // Calculate running balance
        let runningBalance = 0;
        return entries.map((entry) => {
            runningBalance += entry.debit - entry.credit;
            return {
                ...entry,
                balance: runningBalance,
            };
        });
    };
    const getVendorLedger = (vendorIdOrName) => {
        const vend = vendors.find((v) => v.id === vendorIdOrName || v.name.toLowerCase() === vendorIdOrName.toLowerCase());
        const vendName = vend?.name || vendorIdOrName;
        const entries = [];
        // 1. Purchase Bills (Credit - increases AP liability)
        purchaseBills.forEach((b) => {
            if (b.vendor?.toLowerCase() === vendName.toLowerCase() || (vend && b.vendorId === vend.id)) {
                entries.push({
                    id: `led-bill-${b.id}`,
                    date: b.date || b.billDate,
                    type: 'Vendor Bill',
                    reference: b.billNumber,
                    description: `Bill ${b.billNumber} from ${b.vendor}`,
                    debit: 0,
                    credit: b.total || b.amount,
                    balance: 0,
                });
            }
        });
        // 2. Payments (Debit - decreases AP liability)
        paymentOuts.forEach((p) => {
            if (p.vendor?.toLowerCase() === vendName.toLowerCase() || (vend && p.vendorId === vend.id)) {
                entries.push({
                    id: `led-pout-${p.id}`,
                    date: p.date,
                    type: 'Payment Out',
                    reference: p.voucherNumber,
                    description: `Disbursement via ${p.mode || 'ACH'} (${p.reference || 'Ref'})`,
                    debit: p.amount,
                    credit: 0,
                    balance: 0,
                });
            }
        });
        // 3. Purchase Returns / Debit Notes (Debit - decreases AP liability)
        purchaseReturns.forEach((pr) => {
            if (pr.vendor?.toLowerCase() === vendName.toLowerCase() || (vend && pr.vendorId === vend.id)) {
                entries.push({
                    id: `led-pr-${pr.id}`,
                    date: pr.date,
                    type: 'Debit Note',
                    reference: pr.debitNoteNumber,
                    description: `Debit Note for Supplier Return: ${pr.reason}`,
                    debit: pr.amount,
                    credit: 0,
                    balance: 0,
                });
            }
        });
        // Sort chronologically
        entries.sort((a, b) => (a.date > b.date ? 1 : -1));
        // Calculate running balance (Liability = Credit - Debit)
        let runningBalance = 0;
        return entries.map((entry) => {
            runningBalance += entry.credit - entry.debit;
            return {
                ...entry,
                balance: runningBalance,
            };
        });
    };
    const getInvoiceOutstanding = (invoiceIdOrNum) => {
        if (!invoiceIdOrNum) return { total: 0, paid: 0, balanceDue: 0, status: 'Unpaid' };
        const query = String(invoiceIdOrNum).toLowerCase();
        const inv = invoices.find((i) => i?.id === invoiceIdOrNum || (i?.invoiceNumber && i.invoiceNumber.toLowerCase() === query));
        if (!inv)
            return { total: 0, paid: 0, balanceDue: 0, status: 'Unpaid' };
        // Sum all payments received for this invoice
        const relatedPayments = paymentIns.filter((p) => p.invoiceId === inv.id || (p.invoiceNumber && inv.invoiceNumber && p.invoiceNumber.toLowerCase() === inv.invoiceNumber.toLowerCase()));
        const paid = relatedPayments.reduce((acc, p) => acc + (p.amount || 0), 0) + (inv.paidAmount && relatedPayments.length === 0 ? inv.paidAmount : 0);
        const total = inv.total || 0;
        const balanceDue = Math.max(0, total - paid);
        let status = 'Unpaid';
        if (balanceDue <= 0.01) {
            status = 'Paid';
        }
        else if (paid > 0) {
            status = 'Partially Paid';
        }
        else {
            status = inv.status === 'Overdue' ? 'Overdue' : 'Unpaid';
        }
        return { total, paid, balanceDue, status };
    };
    const getBillOutstanding = (billIdOrNum) => {
        if (!billIdOrNum) return { total: 0, paid: 0, balanceDue: 0, status: 'Unpaid' };
        const query = String(billIdOrNum).toLowerCase();
        const bill = purchaseBills.find((b) => b?.id === billIdOrNum || (b?.billNumber && b.billNumber.toLowerCase() === query));
        if (!bill)
            return { total: 0, paid: 0, balanceDue: 0, status: 'Unpaid' };
        const billNumLower = bill.billNumber ? bill.billNumber.toLowerCase() : '';
        const relatedPayments = paymentOuts.filter((p) => p.billId === bill.id || (p.billNumber && billNumLower && p.billNumber.toLowerCase() === billNumLower));
        const paid = relatedPayments.reduce((acc, p) => acc + (p.amount || 0), 0) + (bill.paidAmount && relatedPayments.length === 0 ? bill.paidAmount : 0);
        const total = bill.total || bill.amount || 0;
        const balanceDue = Math.max(0, total - paid);
        let status = 'Unpaid';
        if (balanceDue <= 0.01) {
            status = 'Paid';
        }
        else if (paid > 0) {
            status = 'Partially Paid';
        }
        else {
            status = bill.status === 'Overdue' ? 'Overdue' : 'Unpaid';
        }
        return { total, paid, balanceDue, status };
    };
    // ---------------- INVENTORY MOVEMENT ENGINE ----------------
    const recordMovement = (mov) => {
        const newMovement = {
            id: mov.id || `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            itemId: mov.itemId,
            itemSku: mov.itemSku,
            itemName: mov.itemName,
            locationId: mov.locationId || 'loc-1',
            locationName: mov.locationName || 'Main Central Hub',
            type: mov.type,
            quantity: mov.quantity,
            unitCost: mov.unitCost || 0,
            referenceType: mov.referenceType,
            referenceId: mov.referenceId,
            referenceNumber: mov.referenceNumber,
            date: mov.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            notes: mov.notes || '',
        };
        setInventoryMovements((prev) => [newMovement, ...prev]);
        // Also update physical availableQty in InventoryItem state
        setItems((prev) => prev.map((item) => {
            if (item.id === newMovement.itemId || item.sku?.toLowerCase() === newMovement.itemSku?.toLowerCase()) {
                const newAvailable = Math.max(0, item.availableQty + newMovement.quantity);
                let newStatus = item.status;
                if (newAvailable <= item.reorderLevel / 2) {
                    newStatus = 'Critical';
                }
                else if (newAvailable <= item.reorderLevel) {
                    newStatus = 'Low Stock';
                }
                else {
                    newStatus = 'Optimal';
                }
                return {
                    ...item,
                    availableQty: newAvailable,
                    status: newStatus,
                };
            }
            return item;
        }));
        return newMovement;
    };
    // ---------------- ACTIONS & TRANSACTIONS ----------------
    const addFaultyPart = (newPart) => {
        const part = {
            id: `fp-${Date.now()}`,
            rmaNumber: newPart.rmaNumber ||
                `RMA-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            date: newPart.date || 'Today',
            product: newPart.product || 'Unknown Hardware Item',
            sku: newPart.sku || 'SKU-GEN-01',
            serialNumber: newPart.serialNumber || 'SN-UNKNOWN',
            qty: newPart.qty || 1,
            vendor: newPart.vendor || 'Direct Vendor',
            status: 'Reported',
            notes: newPart.notes || 'Defect reported.',
            initiatedBy: newPart.initiatedBy || 'System Admin',
            timeline: [
                {
                    id: 'tl-1',
                    title: 'Fault Reported',
                    timestamp: `${newPart.date || 'Today'} • Just now`,
                    description: newPart.notes || 'Diagnostic logs attached.',
                    status: 'completed',
                },
                {
                    id: 'tl-2',
                    title: 'Ship to Vendor',
                    timestamp: 'Pending Action',
                    status: 'current',
                    actionLabel: 'Mark as Shipped',
                    actionType: 'ship',
                },
                {
                    id: 'tl-3',
                    title: 'Vendor Assessment',
                    status: 'future',
                },
                {
                    id: 'tl-4',
                    title: 'Replacement / Credit',
                    status: 'future',
                },
            ],
        };
        setFaultyParts((prev) => [part, ...prev]);
        // Record FAULTY movement (removes from active stock)
        const targetItem = items.find((i) => i.sku?.toLowerCase() === part.sku?.toLowerCase() || i.name === part.product);
        if (targetItem) {
            recordMovement({
                itemId: targetItem.id,
                itemSku: targetItem.sku,
                itemName: targetItem.name,
                type: 'FAULTY',
                quantity: -part.qty,
                unitCost: targetItem.costPrice,
                referenceType: 'FaultyPart',
                referenceId: part.id,
                referenceNumber: part.rmaNumber,
                notes: `RMA Defect: ${part.notes}`,
            });
        }
        showToast(`RMA case ${part.rmaNumber} initiated.`);
        return part;
    };
    const updateFaultyPartStatus = (id, newStatus) => {
        setFaultyParts((prev) => prev.map((p) => {
            if (p.id !== id)
                return p;
            return {
                ...p,
                status: newStatus,
            };
        }));
    };
    const updateFaultyPartNotes = (id, newNotes) => {
        setFaultyParts((prev) => prev.map((p) => {
            if (p.id !== id)
                return p;
            return {
                ...p,
                notes: newNotes,
            };
        }));
    };
    const createInvoice = (newInvoice) => {
        const subtotal = newInvoice.subtotal ||
            (newInvoice.items ? newInvoice.items.reduce((acc, it) => acc + (it.amount || it.qty * it.rate), 0) : 0) ||
            newInvoice.total || 0;
        const tax = newInvoice.tax ?? Math.round(subtotal * 0.08 * 100) / 100;
        const total = newInvoice.total ?? Math.round((subtotal + tax) * 100) / 100;
        const invoice = {
            id: newInvoice.id || `inv-${Date.now()}`,
            invoiceNumber: newInvoice.invoiceNumber ||
                `INV-2026-${String(invoices.length + 101).padStart(3, '0')}`,
            customerId: newInvoice.customerId,
            customer: newInvoice.customer || 'Acme Corp',
            linkedSo: newInvoice.linkedSo || newInvoice.salesOrderId,
            salesOrderId: newInvoice.salesOrderId || newInvoice.linkedSo,
            date: newInvoice.date || 'Today',
            dueDate: newInvoice.dueDate || '30 Days from now',
            status: newInvoice.status || 'Unpaid',
            items: newInvoice.items && newInvoice.items.length > 0
                ? newInvoice.items
                : [
                    {
                        id: `item-${Date.now()}`,
                        description: 'Standard Order Merchandise',
                        qty: 1,
                        rate: subtotal,
                        amount: subtotal,
                    },
                ],
            subtotal,
            tax,
            total,
            paidAmount: newInvoice.paidAmount || 0,
            notes: newInvoice.notes || 'Sales Invoice',
        };
        setInvoices((prev) => [invoice, ...prev]);
        // Update customer outstanding balance
        if (invoice.customer) {
            setCustomers((prev) => prev.map((c) => c.name.toLowerCase() === invoice.customer.toLowerCase() || (invoice.customerId && c.id === invoice.customerId)
                ? { ...c, balance: c.balance + invoice.total }
                : c));
        }
        // Auto-create Journal Entry for Revenue & AR
        const je = {
            id: `je-${Date.now()}`,
            entryNumber: `JE-2026-${String(journalEntries.length + 81).padStart(3, '0')}`,
            date: invoice.date,
            description: `Sales Invoice - ${invoice.customer}`,
            reference: invoice.invoiceNumber,
            debitAccount: '1210 - Accounts Receivable',
            creditAccount: '4010 - Sales Revenue',
            amount: invoice.total,
            status: 'Posted',
        };
        setJournalEntries((prev) => [je, ...prev]);
        showToast(`Invoice ${invoice.invoiceNumber} created for ${invoice.customer}`);
        return invoice;
    };
    const updateInvoiceStatus = (id, newStatus) => {
        setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status: newStatus } : inv)));
        showToast(`Invoice status updated to ${newStatus}.`);
    };
    const addZoneRequest = (newReq) => {
        const req = {
            id: `req-${Date.now()}`,
            requestNumber: newReq.requestNumber ||
                `#REQ-${Math.floor(8000 + Math.random() * 900)}`,
            requestedBy: newReq.requestedBy || 'Sarah Jenkins',
            avatarInitials: newReq.avatarInitials || 'SJ',
            product: newReq.product || 'Standard Spare Component',
            sku: newReq.sku || 'SKU-STD-01',
            qty: newReq.qty || 1,
            zone: newReq.zone || 'Zone A',
            targetSector: newReq.targetSector || 'Zone A (Main)',
            date: newReq.date || 'Today',
            submittedAt: newReq.submittedAt || 'Submitted just now',
            status: 'Requested',
            notes: newReq.notes || 'Emergency requisition.',
            warehouseStock: newReq.warehouseStock || 50,
            managerSignoffNeeded: true,
        };
        setZoneRequests((prev) => [req, ...prev]);
        showToast(`Requisition ${req.requestNumber} queued.`);
        return req;
    };
    const updateZoneRequestStatus = (id, newStatus) => {
        setZoneRequests((prev) => prev.map((r) => {
            if (r.id !== id)
                return r;
            return { ...r, status: newStatus };
        }));
        if (newStatus === 'Fulfilled') {
            const targetReq = zoneRequests.find((r) => r.id === id);
            if (targetReq) {
                const targetItem = items.find((i) => i.sku?.toLowerCase() === targetReq.sku?.toLowerCase());
                if (targetItem) {
                    recordMovement({
                        itemId: targetItem.id,
                        itemSku: targetItem.sku,
                        itemName: targetItem.name,
                        type: 'ZONE_ISSUE',
                        quantity: -targetReq.qty,
                        unitCost: targetItem.costPrice,
                        referenceType: 'ZoneRequest',
                        referenceId: targetReq.id,
                        referenceNumber: targetReq.requestNumber,
                        notes: `Internal Issue to ${targetReq.zone}`,
                    });
                }
            }
        }
    };
    const updateZoneRequest = updateZoneRequestStatus;
    const addInventoryItem = (item) => {
        const isSerial = item.trackingMode === 'Serial';
        const serials = Array.isArray(item.serialNumbers) ? item.serialNumbers : [];
        const calculatedQty = isSerial ? serials.length : (item.availableQty ?? 10);
        const newItem = {
            id: item.id || `itm-${Date.now()}`,
            sku: item.sku || `ITM-${Math.floor(1000 + Math.random() * 9000)}`,
            name: item.name || 'New Hardware Item',
            category: item.category || 'General',
            categoryId: item.categoryId || undefined,
            itemKind: item.itemKind || 'Standalone',
            vendor: item.vendor || '',
            description: item.description || '',
            lifecycleStatus: item.lifecycleStatus || 'Active',
            uom: item.uom || 'Unit',
            purchaseUnit: item.purchaseUnit || item.uom || 'Unit',
            salesUnit: item.salesUnit || item.uom || 'Unit',
            unitConversionFactor: Number(item.unitConversionFactor) || 1,
            trackingMode: item.trackingMode || 'Quantity',
            serialNumbers: serials,
            availableQty: calculatedQty,
            reservedQty: item.reservedQty ?? 0,
            reorderLevel: item.reorderLevel ?? 5,
            costPrice: item.costPrice ?? 50,
            sellingPrice: item.sellingPrice ?? 90,
            location: item.location || 'Main Central Warehouse',
            status: 'Optimal',
            customFieldValues: item.customFieldValues || {},
        };
        if (newItem.availableQty <= newItem.reorderLevel / 2) {
            newItem.status = 'Critical';
        }
        else if (newItem.availableQty <= newItem.reorderLevel) {
            newItem.status = 'Low Stock';
        }
        setItems((prev) => [newItem, ...prev]);
        // Record initial movement seed for this item
        if (newItem.availableQty > 0) {
            recordMovement({
                itemId: newItem.id,
                itemSku: newItem.sku,
                itemName: newItem.name,
                type: 'ADJUSTMENT',
                quantity: newItem.availableQty,
                unitCost: newItem.costPrice,
                referenceType: 'StockAdjustment',
                referenceId: `init-${newItem.id}`,
                referenceNumber: 'INITIAL-STOCK',
                notes: 'Initial master catalog stock intake',
            });
        }
        showToast(`SKU ${newItem.sku} added to Master.`);
        return newItem;
    };
    const updateInventoryItem = (id, updates) => {
        setItems((prev) => prev.map((item) => {
            if (item.id !== id && item.sku !== id)
                return item;
            const isSerial = updates.trackingMode ? updates.trackingMode === 'Serial' : item.trackingMode === 'Serial';
            const serials = updates.serialNumbers !== undefined ? (Array.isArray(updates.serialNumbers) ? updates.serialNumbers : []) : (item.serialNumbers || []);
            const updatedAvailableQty = isSerial ? serials.length : (updates.availableQty !== undefined ? updates.availableQty : item.availableQty);
            const updated = {
                ...item,
                ...updates,
                serialNumbers: serials,
                availableQty: updatedAvailableQty,
            };
            if (updated.availableQty <= updated.reorderLevel / 2) {
                updated.status = 'Critical';
            }
            else if (updated.availableQty <= updated.reorderLevel) {
                updated.status = 'Low Stock';
            }
            else {
                updated.status = 'Optimal';
            }
            return updated;
        }));
        showToast(`Item updated successfully.`);
    };
    const addSerialNumbers = (itemId, serials) => {
        if (!Array.isArray(serials) || serials.length === 0) return;
        setItems((prev) => prev.map((item) => {
            if (item.id === itemId || item.sku?.toLowerCase() === itemId?.toLowerCase()) {
                const current = item.serialNumbers || [];
                const updated = Array.from(new Set([...current, ...serials.filter(Boolean)]));
                return {
                    ...item,
                    trackingMode: 'Serial',
                    serialNumbers: updated,
                    availableQty: updated.length,
                };
            }
            return item;
        }));
    };
    const removeSerialNumbers = (itemId, serialsToRemove) => {
        if (!Array.isArray(serialsToRemove) || serialsToRemove.length === 0) return;
        const removeSet = new Set(serialsToRemove.map((s) => String(s).trim().toLowerCase()));
        setItems((prev) => prev.map((item) => {
            if (item.id === itemId || item.sku?.toLowerCase() === itemId?.toLowerCase()) {
                const current = item.serialNumbers || [];
                const updated = current.filter((s) => !removeSet.has(String(s).trim().toLowerCase()));
                return {
                    ...item,
                    serialNumbers: updated,
                    availableQty: updated.length,
                };
            }
            return item;
        }));
    };
    const addParty = (p) => {
        const newParty = {
            id: p.id || `pty-${Date.now()}`,
            code: p.code || `PARTY-${String(parties.length + 1).padStart(3, '0')}`,
            type: p.type || 'Customer',
            name: p.name || 'New Enterprise Partner',
            phone: p.phone || '+1 (555) 000-0000',
            email: p.email || 'billing@partner.com',
            gstTreatment: p.gstTreatment || 'Registered Business',
            gstin: p.gstin || '',
            placeOfSupply: p.placeOfSupply || 'Maharashtra (27)',
            gstNotes: p.gstNotes || '',
            tdsApplicable: p.tdsApplicable ?? false,
            tdsSection: p.tdsSection || '',
            tdsRate: p.tdsRate ?? 0,
            tcsApplicable: p.tcsApplicable ?? false,
            tcsRate: p.tcsRate ?? 0,
            ledgerAccount: p.ledgerAccount || (p.type === 'Vendor' ? '2010 - Accounts Payable' : '1210 - Accounts Receivable'),
            creditLimit: p.creditLimit ?? (p.type === 'Vendor' ? 0 : 50000),
            paymentTerms: p.paymentTerms || 'Net 30',
            bankAccountNumber: p.bankAccountNumber || '',
            ifscCode: p.ifscCode || '',
            bankName: p.bankName || '',
            accountHolderName: p.accountHolderName || '',
            openingBalance: p.openingBalance ?? 0,
            balance: p.balance ?? (p.openingBalance ?? 0),
            billingAddress: p.billingAddress || {
                line1: 'Corporate Headquarters',
                line2: '',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001',
            },
            shippingAddress: p.shippingAddress || {
                line1: 'Corporate Headquarters',
                line2: '',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001',
            },
            contacts: p.contacts && p.contacts.length > 0 ? p.contacts : [
                { id: `cnt-${Date.now()}`, name: p.name || 'Primary POC', role: 'Business Executive', phone: p.phone || '', email: p.email || '' },
            ],
            status: p.status || 'Active',
        };
        setParties((prev) => [newParty, ...prev]);
        // Also sync into customers / vendors state for backward compatibility
        if (newParty.type === 'Customer' || newParty.type === 'Both') {
            addCustomer({
                id: newParty.id,
                code: newParty.code,
                name: newParty.name,
                contactPerson: newParty.contacts[0]?.name ?? '',
                email: newParty.email,
                phone: newParty.phone,
                balance: newParty.balance,
                creditLimit: newParty.creditLimit ?? 50000,
                status: newParty.status === 'Inactive' ? 'On Hold' : 'Active',
            });
        }
        if (newParty.type === 'Vendor' || newParty.type === 'Both') {
            addVendor({
                id: newParty.id,
                code: newParty.code,
                name: newParty.name,
                category: 'General',
                contactPerson: newParty.contacts[0]?.name ?? '',
                email: newParty.email,
                phone: newParty.phone,
                balance: newParty.balance,
                paymentTerms: newParty.paymentTerms ?? 'Net 30',
                status: newParty.status === 'Active' ? 'Active' : 'Inactive',
            });
        }
        showToast(`Party ${newParty.name} (${newParty.type}) registered.`);
        return newParty;
    };
    const updateParty = (id, updates) => {
        setParties((prev) => prev.map((p) => (p.id === id || p.code === id ? { ...p, ...updates } : p)));
        showToast(`Party updated.`);
    };
    const addUnit = (u) => {
        const newUnit = {
            id: u.id || `uom-${Date.now()}`,
            code: u.code || 'unit',
            label: u.label || u.code || 'Unit',
        };
        setUnits((prev) => [...prev, newUnit]);
        showToast(`Unit ${newUnit.label} added.`);
        return newUnit;
    };
    const addCategoryPart = (part) => {
        const newPart = {
            id: part.id || `cp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            categoryId: part.categoryId,
            itemId: part.itemId,
            defaultQty: Number(part.defaultQty) || 1,
        };
        setCategoryParts((prev) => [...prev, newPart]);
        showToast(`Sub-part linked to category BOM.`);
        return newPart;
    };
    const removeCategoryPart = (id) => {
        setCategoryParts((prev) => prev.filter((p) => p.id !== id));
        showToast(`Sub-part removed from category BOM.`);
    };
    const addItemPart = (part) => {
        const newItemPart = {
            id: part.id || `ip-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            parentItemId: part.parentItemId || '',
            partItemId: part.partItemId || '',
            requiredQty: Number(part.requiredQty) || 1,
        };
        setItemParts((prev) => [...prev, newItemPart]);
        showToast(`BOM part linked to machine.`);
        return newItemPart;
    };
    const updateItemPart = (id, updates) => {
        setItemParts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
        showToast(`Machine BOM part updated.`);
    };
    const removeItemPart = (id) => {
        setItemParts((prev) => prev.filter((p) => p.id !== id));
        showToast(`Machine BOM part removed.`);
    };

    // Derived compatibility helpers for customers / vendors
    const customersFromParties = parties
        .filter((p) => p.type === 'Customer' || p.type === 'Both')
        .map((p) => ({
            id: p.id,
            code: p.code,
            name: p.name,
            contactPerson: p.contacts?.[0]?.name ?? '',
            email: p.email,
            phone: p.phone,
            balance: p.balance,
            creditLimit: p.creditLimit ?? 0,
            status: p.status === 'Inactive' ? 'On Hold' : 'Active',
        }));

    const vendorsFromParties = parties
        .filter((p) => p.type === 'Vendor' || p.type === 'Both')
        .map((p) => ({
            id: p.id,
            code: p.code,
            name: p.name,
            category: 'General',
            contactPerson: p.contacts?.[0]?.name ?? '',
            email: p.email,
            phone: p.phone,
            balance: p.balance,
            paymentTerms: p.paymentTerms ?? 'Net 30',
            status: p.status === 'Active' ? 'Active' : 'Inactive',
        }));
    const adjustItemStock = (idOrSku, adjustment, isAbsolute = false, reason = 'Manual Stock Adjustment') => {
        const targetItem = items.find((i) => i.id === idOrSku || i.sku?.toLowerCase() === idOrSku?.toLowerCase());
        if (!targetItem)
            return;
        const diff = isAbsolute ? adjustment - targetItem.availableQty : adjustment;
        if (diff === 0)
            return;
        recordMovement({
            itemId: targetItem.id,
            itemSku: targetItem.sku,
            itemName: targetItem.name,
            type: 'ADJUSTMENT',
            quantity: diff,
            unitCost: targetItem.costPrice,
            referenceType: 'StockAdjustment',
            referenceId: `adj-${Date.now()}`,
            referenceNumber: `ADJ-${Math.floor(1000 + Math.random() * 9000)}`,
            notes: reason,
        });
        showToast(`Stock for ${targetItem.sku} adjusted by ${diff > 0 ? '+' : ''}${diff} units.`);
    };
    const addCustomer = (cust) => {
        const newCust = {
            id: cust.id || `cust-${Date.now()}`,
            code: cust.code || `CUST-${String(customers.length + 1).padStart(3, '0')}`,
            name: cust.name || 'New Client Account',
            contactPerson: cust.contactPerson || 'Account Executive',
            email: cust.email || 'billing@client.com',
            phone: cust.phone || '+1 (555) 000-0000',
            balance: cust.balance ?? 0,
            creditLimit: cust.creditLimit ?? 25000,
            status: cust.status || 'Active',
        };
        setCustomers((prev) => {
            const exists = prev.some(c => c.id === newCust.id || c.code === newCust.code);
            return exists ? prev.map(c => c.id === newCust.id ? { ...c, ...newCust } : c) : [newCust, ...prev];
        });

        // Synchronize automatically with Parties
        setParties((prev) => {
            const exists = prev.some(p => p.id === newCust.id || p.code === newCust.code || (p.name && p.name.toLowerCase() === newCust.name.toLowerCase()));
            if (exists) {
                return prev.map(p => (p.id === newCust.id || p.code === newCust.code || (p.name && p.name.toLowerCase() === newCust.name.toLowerCase())) ? {
                    ...p,
                    name: newCust.name,
                    email: newCust.email || p.email,
                    phone: newCust.phone || p.phone,
                    balance: newCust.balance ?? p.balance,
                    creditLimit: newCust.creditLimit ?? p.creditLimit,
                } : p);
            }
            const newParty = {
                id: newCust.id,
                code: newCust.code,
                name: newCust.name,
                type: 'Customer',
                partyType: 'Customer',
                contactPerson: newCust.contactPerson,
                email: newCust.email,
                phone: newCust.phone,
                balance: newCust.balance ?? 0,
                creditLimit: newCust.creditLimit ?? 25000,
                status: newCust.status || 'Active',
                billingAddress: { line1: 'Corporate Headquarters', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
                shippingAddress: { line1: 'Corporate Headquarters', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
                contacts: [{ id: `cnt-${Date.now()}`, name: newCust.contactPerson || newCust.name, role: 'Primary Contact', phone: newCust.phone, email: newCust.email }],
            };
            return [newParty, ...prev];
        });

        showToast(`Customer ${newCust.name} created and synced to Parties.`);
        return newCust;
    };
    const updateCustomer = (id, updates) => {
        setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
        setParties((prev) => prev.map((p) => (p.id === id || p.code === id ? { ...p, ...updates } : p)));
    };
    const addVendor = (ven) => {
        const newVendor = {
            id: ven.id || `ven-${Date.now()}`,
            code: ven.code || `VEND-${String(vendors.length + 1).padStart(3, '0')}`,
            name: ven.name || 'New Supplier Entity',
            category: ven.category || 'Direct Hardware',
            contactPerson: ven.contactPerson || 'Vendor Rep',
            email: ven.email || 'sales@vendor.com',
            phone: ven.phone || '+1 (555) 000-0000',
            balance: ven.balance ?? 0,
            paymentTerms: ven.paymentTerms || 'Net 30',
            status: ven.status || 'Active',
        };
        setVendors((prev) => {
            const exists = prev.some(v => v.id === newVendor.id || v.code === newVendor.code);
            return exists ? prev.map(v => v.id === newVendor.id ? { ...v, ...newVendor } : v) : [newVendor, ...prev];
        });

        // Synchronize automatically with Parties
        setParties((prev) => {
            const exists = prev.some(p => p.id === newVendor.id || p.code === newVendor.code || (p.name && p.name.toLowerCase() === newVendor.name.toLowerCase()));
            if (exists) {
                return prev.map(p => (p.id === newVendor.id || p.code === newVendor.code || (p.name && p.name.toLowerCase() === newVendor.name.toLowerCase())) ? {
                    ...p,
                    name: newVendor.name,
                    email: newVendor.email || p.email,
                    phone: newVendor.phone || p.phone,
                    balance: newVendor.balance ?? p.balance,
                    paymentTerms: newVendor.paymentTerms ?? p.paymentTerms,
                } : p);
            }
            const newParty = {
                id: newVendor.id,
                code: newVendor.code,
                name: newVendor.name,
                type: 'Vendor',
                partyType: 'Vendor',
                category: newVendor.category,
                contactPerson: newVendor.contactPerson,
                email: newVendor.email,
                phone: newVendor.phone,
                balance: newVendor.balance ?? 0,
                paymentTerms: newVendor.paymentTerms || 'Net 30',
                status: newVendor.status || 'Active',
                billingAddress: { line1: 'Supplier Facility', city: 'Delhi', state: 'Delhi', pincode: '110001' },
                shippingAddress: { line1: 'Supplier Facility', city: 'Delhi', state: 'Delhi', pincode: '110001' },
                contacts: [{ id: `cnt-${Date.now()}`, name: newVendor.contactPerson || newVendor.name, role: 'Sales Contact', phone: newVendor.phone, email: newVendor.email }],
            };
            return [newParty, ...prev];
        });

        showToast(`Vendor ${newVendor.name} added and synced to Parties.`);
        return newVendor;
    };
    const updateVendor = (id, updates) => {
        setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
        setParties((prev) => prev.map((p) => (p.id === id || p.code === id ? { ...p, ...updates } : p)));
    };
    const addCategory = (cat) => {
        const newCat = {
            id: cat.id || `cat-${Date.now()}`,
            name: cat.name || 'Hardware Category',
            code: (cat.code || 'GEN').toUpperCase(),
            itemCount: 0,
            totalValuation: 0,
            leadTimeDays: cat.leadTimeDays ?? 7,
            hasSubParts: cat.hasSubParts ?? false,
            description: cat.description || '',
            customFields: cat.customFields || [],
        };
        setCategories((prev) => [...prev, newCat]);
        showToast(`Category ${newCat.name} registered.`);
        return newCat;
    };
    const updateCategory = (id, updates) => {
        setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
        showToast(`Category updated.`);
    };
    const addQuotation = (quote) => {
        const totalAmount = quote.amount ||
            (quote.items ? quote.items.reduce((acc, it) => acc + (it.amount || it.qty * it.rate), 0) : 0) || 5000;
        const newQ = {
            id: quote.id || `q-${Date.now()}`,
            quoteNumber: quote.quoteNumber || `EST-2026-${String(quotations.length + 91).padStart(3, '0')}`,
            customerId: quote.customerId,
            customer: quote.customer || 'Acme Corp',
            date: formatDateDDMMYYYY(quote.date || 'Today'),
            validUntil: quote.validUntil || 'In 30 days',
            amount: totalAmount,
            status: quote.status || 'Draft',
            items: quote.items || [],
            notes: quote.notes || 'Commercial quotation',
        };
        setQuotations((prev) => [newQ, ...prev]);
        showToast(`Quotation ${newQ.quoteNumber} issued.`);
        return newQ;
    };
    const updateQuotationStatus = (id, status) => {
        setQuotations((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
    };
    const convertQuotationToSalesOrder = (quoteId) => {
        const quote = quotations.find((q) => q.id === quoteId);
        if (!quote)
            return undefined;
        updateQuotationStatus(quoteId, 'Confirmed');
        const newOrder = {
            id: `so-${Date.now()}`,
            orderNumber: `SO-2026-${String(salesOrders.length + 101).padStart(4, '0')}`,
            quotationId: quote.id,
            quotationNumber: quote.quoteNumber,
            customerId: quote.customerId,
            customer: quote.customer,
            date: getCurrentDateFormatted(),
            deliveryDate: 'In 14 days',
            amount: quote.amount,
            stage: 'Confirmed',
            status: 'Confirmed',
            paymentStatus: 'Unpaid',
            items: quote.items && quote.items.length > 0 ? quote.items : [
                {
                    id: `item-${Date.now()}`,
                    description: `Deliverables per ${quote.quoteNumber}`,
                    qty: 1,
                    rate: quote.amount,
                    amount: quote.amount,
                },
            ],
        };
        setSalesOrders((prev) => [newOrder, ...prev]);
        showToast(`Quote ${quote.quoteNumber} converted to Sales Order ${newOrder.orderNumber}!`);
        return newOrder;
    };
    const addSalesOrder = (order) => {
        const orderAmt = order.amount ||
            (order.items ? order.items.reduce((acc, it) => acc + (it.amount || it.qty * it.rate), 0) : 0) || 5000;
        const newOrder = {
            id: order.id || `so-${Date.now()}`,
            orderNumber: order.orderNumber ||
                `SO-2026-${String(salesOrders.length + 101).padStart(4, '0')}`,
            quotationId: order.quotationId,
            quotationNumber: order.quotationNumber,
            customerId: order.customerId,
            customer: order.customer || 'Acme Corp',
            date: formatDateDDMMYYYY(order.date || 'Today'),
            deliveryDate: order.deliveryDate || 'In 10 days',
            amount: orderAmt,
            stage: order.stage || 'Draft',
            status: order.stage || 'Draft',
            paymentStatus: order.paymentStatus || 'Unpaid',
            items: order.items || [],
            notes: order.notes || '',
        };
        setSalesOrders((prev) => [newOrder, ...prev]);
        showToast(`Sales Order ${newOrder.orderNumber} created.`);
        return newOrder;
    };
    const updateSalesOrderStage = (id, stage) => {
        setSalesOrders((prev) => prev.map((o) => (o.id === id ? { ...o, stage, status: stage } : o)));
    };
    const convertSalesOrderToChallan = (orderId) => {
        const order = salesOrders.find((o) => o.id === orderId);
        if (!order)
            return undefined;
        updateSalesOrderStage(orderId, 'Dispatched');
        const newChallan = {
            id: `dc-${Date.now()}`,
            challanNumber: `DC-2026-${String(deliveryChallans.length + 80).padStart(3, '0')}`,
            salesOrderId: order.id,
            salesOrderNumber: order.orderNumber,
            linkedSo: order.orderNumber,
            customerId: order.customerId,
            customer: order.customer,
            date: getCurrentDateFormatted(),
            dispatchDate: getCurrentDateFormatted(),
            transporter: 'FedEx Freight Direct',
            vehicleNo: 'TRK-8821-WA',
            status: 'In Transit',
            items: order.items || [],
        };
        setDeliveryChallans((prev) => [newChallan, ...prev]);
        // Record SALE movement for delivered items
        if (newChallan.items && newChallan.items.length > 0) {
            newChallan.items.forEach((line) => {
                if (line.itemId || line.itemSku) {
                    const item = items.find((i) => i.id === line.itemId || i.sku?.toLowerCase() === line.itemSku?.toLowerCase());
                    recordMovement({
                        itemId: item?.id || line.itemId || `itm-${Date.now()}`,
                        itemSku: item?.sku || line.itemSku || 'GEN-SKU',
                        itemName: item?.name || line.description,
                        type: 'SALE',
                        quantity: -line.qty,
                        unitCost: item?.costPrice || line.rate,
                        referenceType: 'DeliveryChallan',
                        referenceId: newChallan.id,
                        referenceNumber: newChallan.challanNumber,
                        notes: `Dispatched to ${order.customer} via ${newChallan.challanNumber}`,
                    });
                }
            });
        }
        showToast(`Delivery Challan ${newChallan.challanNumber} issued for ${order.orderNumber}`);
        return newChallan;
    };
    const convertSalesOrderToInvoice = (orderId) => {
        const order = salesOrders.find((o) => o.id === orderId);
        if (!order)
            return undefined;
        updateSalesOrderStage(orderId, 'Invoiced');
        const orderAmt = order.amount ?? 1000;
        const sourceLines = (order.items && order.items.length > 0)
            ? order.items
            : (order.lineItems && order.lineItems.length > 0)
                ? order.lineItems
                : [];
        const itemsList = sourceLines.length > 0
            ? sourceLines.map((line, idx) => ({
                id: line.id || `item-${Date.now()}-${idx}`,
                itemId: line.itemId || '',
                sku: line.sku || line.itemSku || '',
                itemSku: line.sku || line.itemSku || '',
                name: line.name || line.description || `Deliverable Item ${idx + 1}`,
                description: line.name || line.description || `Deliverable Item ${idx + 1}`,
                qty: line.qty || 1,
                rate: line.rate || 0,
                amount: line.amount || (line.qty || 1) * (line.rate || 0),
            }))
            : [
                {
                    id: `item-${Date.now()}`,
                    description: `Fulfillment of ${order.orderNumber}`,
                    name: `Fulfillment of ${order.orderNumber}`,
                    qty: 1,
                    rate: orderAmt,
                    amount: orderAmt,
                },
            ];
        const subtotal = itemsList.reduce((acc, it) => acc + (it.amount || it.qty * it.rate), 0);
        const tax = Math.round(subtotal * 0.08 * 100) / 100;
        const total = Math.round((subtotal + tax) * 100) / 100;
        const newInvoice = {
            id: `inv-${Date.now()}`,
            invoiceNumber: `INV-2026-${String(invoices.length + 101).padStart(3, '0')}`,
            salesOrderId: order.id,
            customerId: order.customerId,
            customer: order.customer,
            linkedSo: order.orderNumber,
            date: getCurrentDateFormatted(),
            dueDate: '30 Days from now',
            status: 'Unpaid',
            items: itemsList,
            lineItems: itemsList,
            subtotal,
            tax,
            total,
            amount: total,
            paidAmount: 0,
            amountPaid: 0,
            balanceDue: total,
            notes: `Tax invoice automatically generated for Sales Order ${order.orderNumber}.`,
        };
        setInvoices((prev) => [newInvoice, ...prev]);
        // Update customer outstanding balance
        if (order.customer) {
            setCustomers((prev) => prev.map((c) => c.name.toLowerCase() === order.customer.toLowerCase() || (order.customerId && c.id === order.customerId)
                ? { ...c, balance: c.balance + newInvoice.total }
                : c));
        }
        // Auto-create Journal Entry
        const je = {
            id: `je-${Date.now()}`,
            entryNumber: `JE-2026-${String(journalEntries.length + 81).padStart(3, '0')}`,
            date: 'Today',
            description: `Sales Invoice - ${order.customer} (${order.orderNumber})`,
            reference: newInvoice.invoiceNumber,
            debitAccount: '1210 - Accounts Receivable',
            creditAccount: '4010 - Sales Revenue',
            amount: newInvoice.total,
            status: 'Posted',
        };
        setJournalEntries((prev) => [je, ...prev]);
        showToast(`Generated invoice ${newInvoice.invoiceNumber} for ${order.orderNumber}`);
        return newInvoice;
    };
    const addDeliveryChallan = (challan) => {
        const challanItems = challan.items || challan.lineItems || [];
        const newChallan = {
            id: challan.id || `dc-${Date.now()}`,
            challanNumber: challan.challanNumber ||
                `DC-2026-${String(deliveryChallans.length + 80).padStart(3, '0')}`,
            salesOrderId: challan.salesOrderId,
            salesOrderNumber: challan.salesOrderNumber || challan.linkedSo || 'SO-2026-0102',
            linkedSo: challan.salesOrderNumber || challan.linkedSo || 'SO-2026-0102',
            customerId: challan.customerId,
            customer: challan.customer || 'Acme Corp',
            date: challan.date || 'Today',
            dispatchDate: challan.dispatchDate || 'Today',
            transporter: challan.transporter || 'FedEx Freight',
            vehicleNo: challan.vehicleNo || 'TRK-9041-WA',
            status: challan.status || 'In Transit',
            items: challanItems,
            lineItems: challanItems,
        };
        setDeliveryChallans((prev) => [newChallan, ...prev]);
        // Record SALE movement
        if (newChallan.items && newChallan.items.length > 0) {
            newChallan.items.forEach((line) => {
                const targetSku = line.sku || line.itemSku;
                const item = items.find((i) => i.id === line.itemId || (targetSku && i.sku?.toLowerCase() === targetSku.toLowerCase()));
                recordMovement({
                    itemId: item?.id || line.itemId || `itm-${Date.now()}`,
                    itemSku: item?.sku || targetSku || 'GEN-SKU',
                    itemName: item?.name || line.name || line.description,
                    type: 'SALE',
                    quantity: -line.qty,
                    unitCost: item?.costPrice || line.rate,
                    referenceType: 'DeliveryChallan',
                    referenceId: newChallan.id,
                    referenceNumber: newChallan.challanNumber,
                    notes: `Dispatched to ${newChallan.customer} via ${newChallan.challanNumber}`,
                });
            });
        }
        showToast(`Delivery Challan ${newChallan.challanNumber} issued.`);
        return newChallan;
    };
    const updateDeliveryChallanStatus = (id, status) => {
        setDeliveryChallans((prev) => prev.map((c) => {
            if (c.id !== id)
                return c;
            if (status === 'Delivered') {
                const soNum = c.salesOrderNumber || c.linkedSo;
                if (soNum) {
                    setSalesOrders((orders) => orders.map((o) => o.orderNumber === soNum && o.stage !== 'Invoiced'
                        ? { ...o, stage: 'Delivered', status: 'Delivered' }
                        : o));
                }
            }
            return { ...c, status };
        }));
        showToast(`Challan updated to ${status}.`);
    };
    const addPaymentIn = (pay) => {
        const payAmt = Number(pay.amount) || 1000;
        const newPay = {
            id: pay.id || `pay-${Date.now()}`,
            receiptNumber: pay.receiptNumber ||
                `RCP-2026-${String(paymentIns.length + 90).padStart(3, '0')}`,
            customerId: pay.customerId,
            customer: pay.customer || 'Acme Corp',
            invoiceId: pay.invoiceId,
            invoiceNumber: pay.invoiceNumber || 'INV-2026-001',
            date: pay.date || 'Today',
            mode: pay.mode || 'Bank Transfer',
            amount: payAmt,
            reference: pay.reference || 'WIRE-49821',
            status: 'Paid',
        };
        setPaymentIns((prev) => [newPay, ...prev]);
        // Update invoice payment tracking and dynamic status
        if (newPay.invoiceNumber || newPay.invoiceId) {
            setInvoices((prev) => prev.map((inv) => {
                if (inv.invoiceNumber === newPay.invoiceNumber || (newPay.invoiceId && inv.id === newPay.invoiceId)) {
                    const currentPaid = Number(inv.amountPaid ?? inv.paidAmount ?? 0);
                    const updatedPaid = currentPaid + payAmt;
                    const totalInvoice = Number(inv.total ?? inv.amount ?? 0);
                    const isFull = updatedPaid >= (totalInvoice - 0.01);
                    const derivedStatus = updatedPaid <= 0 ? 'Unpaid' : isFull ? 'Paid' : 'Partially Paid';
                    return {
                        ...inv,
                        paidAmount: updatedPaid,
                        amountPaid: updatedPaid,
                        balanceDue: Math.max(0, totalInvoice - updatedPaid),
                        status: derivedStatus,
                    };
                }
                return inv;
            }));
        }
        // Adjust customer balance
        if (newPay.customer) {
            setCustomers((prev) => prev.map((c) => c.name.toLowerCase() === newPay.customer?.toLowerCase() || (newPay.customerId && c.id === newPay.customerId)
                ? { ...c, balance: Math.max(0, c.balance - payAmt) }
                : c));
        }
        // Add to Operating Bank Account
        setBankAccounts((prev) => prev.map((acc, idx) => idx === 0 ? { ...acc, balance: acc.balance + payAmt } : acc));
        // Auto-create Journal Entry
        const newJe = {
            id: `je-${Date.now()}`,
            entryNumber: `JE-2026-${String(journalEntries.length + 85).padStart(3, '0')}`,
            date: newPay.date,
            description: `Payment Received from ${newPay.customer} against ${newPay.invoiceNumber || 'Account'}`,
            reference: newPay.receiptNumber,
            debitAccount: '1010 - Cash & Bank',
            creditAccount: '1210 - Accounts Receivable',
            amount: payAmt,
            status: 'Posted',
        };
        setJournalEntries((prev) => [newJe, ...prev]);
        showToast(`Recorded receipt of $${payAmt.toLocaleString()} from ${newPay.customer}`);
        return newPay;
    };
    const addSalesReturn = (ret) => {
        const retAmt = ret.amount ?? 500;
        const returnLines = ret.items || ret.lineItems || [];
        const newRet = {
            id: ret.id || `sr-${Date.now()}`,
            returnNumber: ret.returnNumber ||
                `SR-2026-${String(salesReturns.length + 13).padStart(3, '0')}`,
            customerId: ret.customerId,
            customer: ret.customer || 'Cyberdyne Systems',
            invoiceId: ret.invoiceId,
            invoiceRef: ret.invoiceRef || 'INV-2026-002',
            itemSku: ret.itemSku || (returnLines[0]?.sku || returnLines[0]?.itemSku || ''),
            qty: ret.qty || (returnLines[0]?.qty || 1),
            date: ret.date || 'Today',
            amount: retAmt,
            reason: ret.reason || 'Client order modification',
            restocked: ret.restocked ?? true,
            status: ret.status || 'Approved',
            items: returnLines,
            lineItems: returnLines,
        };
        setSalesReturns((prev) => [newRet, ...prev]);
        // If restocked, record SALES_RETURN movement (increases stock)
        if (newRet.restocked) {
            if (returnLines.length > 0) {
                returnLines.forEach((line) => {
                    const targetSku = line.sku || line.itemSku;
                    const item = items.find((i) => i.id === line.itemId || (targetSku && i.sku?.toLowerCase() === targetSku.toLowerCase()));
                    recordMovement({
                        itemId: item?.id || line.itemId || `itm-${Date.now()}`,
                        itemSku: item?.sku || targetSku || 'GEN-SKU',
                        itemName: item?.name || line.name || line.description,
                        type: 'SALES_RETURN',
                        quantity: line.qty || 1,
                        unitCost: item?.costPrice || line.rate || 0,
                        referenceType: 'SalesReturn',
                        referenceId: newRet.id,
                        referenceNumber: newRet.returnNumber,
                        notes: `Restocked per ${newRet.returnNumber}: ${newRet.reason}`,
                    });
                });
            }
            else if (newRet.itemSku) {
                const targetItem = items.find((i) => i.sku?.toLowerCase() === newRet.itemSku.toLowerCase() || i.id === newRet.itemSku);
                if (targetItem) {
                    recordMovement({
                        itemId: targetItem.id,
                        itemSku: targetItem.sku,
                        itemName: targetItem.name,
                        type: 'SALES_RETURN',
                        quantity: newRet.qty || 1,
                        unitCost: targetItem.costPrice,
                        referenceType: 'SalesReturn',
                        referenceId: newRet.id,
                        referenceNumber: newRet.returnNumber,
                        notes: `Restocked SKU ${targetItem.sku} per ${newRet.returnNumber}`,
                    });
                }
            }
        }
        // Reduce customer receivable balance
        if (newRet.customer) {
            setCustomers((prev) => prev.map((c) => c.name.toLowerCase() === newRet.customer?.toLowerCase() || (newRet.customerId && c.id === newRet.customerId)
                ? { ...c, balance: Math.max(0, c.balance - retAmt) }
                : c));
        }
        // Auto-create Journal Entry (Sales Returns and Allowances / AR)
        const newJe = {
            id: `je-${Date.now()}`,
            entryNumber: `JE-2026-${String(journalEntries.length + 86).padStart(3, '0')}`,
            date: newRet.date,
            description: `Sales Return / Credit Note - ${newRet.customer}`,
            reference: newRet.returnNumber,
            debitAccount: '4090 - Sales Returns & Allowances',
            creditAccount: '1210 - Accounts Receivable',
            amount: retAmt,
            status: 'Posted',
        };
        setJournalEntries((prev) => [newJe, ...prev]);
        showToast(`Credit Note ${newRet.returnNumber} created.`);
        return newRet;
    };
    const addPurchaseOrder = (po) => {
        const poLines = po.items || po.lineItems || [];
        const poAmt = po.amount ||
            (poLines.length > 0 ? poLines.reduce((acc, it) => acc + (it.amount || it.qty * it.rate), 0) : 0) || 2500;
        const newPo = {
            id: po.id || `po-${Date.now()}`,
            poNumber: po.poNumber ||
                `PO-2026-${String(purchaseOrders.length + 201).padStart(4, '0')}`,
            vendorId: po.vendorId,
            vendor: po.vendor || 'Arrow Electronics Supply',
            date: formatDateDDMMYYYY(po.date || 'Today'),
            expectedDate: po.expectedDate || 'In 10 days',
            amount: poAmt,
            total: poAmt,
            status: po.status || 'Draft',
            items: poLines,
            lineItems: poLines,
            notes: po.notes || '',
        };
        setPurchaseOrders((prev) => [newPo, ...prev]);
        showToast(`Purchase Order ${newPo.poNumber} saved.`);
        return newPo;
    };
    const updatePurchaseOrderStatus = (id, status) => {
        setPurchaseOrders((prev) => prev.map((po) => (po.id === id ? { ...po, status } : po)));
        showToast(`PO updated to ${status}.`);
    };
    const deletePurchaseOrder = (id) => {
        const po = purchaseOrders.find((p) => p.id === id);
        if (!po) return;
        if (po.status !== 'Draft') {
            showToast(`Only Draft Purchase Orders can be deleted.`);
            return;
        }
        setPurchaseOrders((prev) => prev.filter((p) => p.id !== id));
        showToast(`Draft Purchase Order ${po.poNumber || ''} deleted.`);
    };
    const convertPurchaseOrderToBill = (poId) => {
        const po = purchaseOrders.find((p) => p.id === poId);
        if (!po)
            return undefined;
        updatePurchaseOrderStatus(poId, 'Issued');
        const poLines = po.items || po.lineItems || [];
        const billAmt = po.amount ?? (po.total ?? 5000);
        const newBill = {
            id: `pb-${Date.now()}`,
            billNumber: `PB-2026-${String(purchaseBills.length + 16).padStart(3, '0')}`,
            purchaseOrderId: po.id,
            poRef: po.poNumber,
            linkedPo: po.poNumber,
            vendorId: po.vendorId,
            vendor: po.vendor,
            billDate: 'Today',
            date: 'Today',
            dueDate: '30 Days from now',
            amount: billAmt,
            total: billAmt,
            paidAmount: 0,
            amountPaid: 0,
            balanceDue: billAmt,
            status: 'Unpaid',
            items: poLines,
            lineItems: poLines,
        };
        setPurchaseBills((prev) => [newBill, ...prev]);
        // Increase vendor AP liability
        if (po.vendor) {
            setVendors((prev) => prev.map((v) => v.name.toLowerCase() === po.vendor.toLowerCase() || (po.vendorId && v.id === po.vendorId)
                ? { ...v, balance: v.balance + billAmt }
                : v));
        }
        // Auto-create Journal Entry (Inventory Asset / Accounts Payable)
        const newJe = {
            id: `je-${Date.now()}`,
            entryNumber: `JE-2026-${String(journalEntries.length + 87).padStart(3, '0')}`,
            date: 'Today',
            description: `Purchase Bill Intake - ${po.vendor} (${po.poNumber})`,
            reference: newBill.billNumber,
            debitAccount: '1410 - Inventory Asset',
            creditAccount: '2010 - Accounts Payable',
            amount: billAmt,
            status: 'Posted',
        };
        setJournalEntries((prev) => [newJe, ...prev]);
        // Automatically receive inventory from line items (increases stock)
        if (poLines.length > 0) {
            poLines.forEach((line) => {
                const targetSku = line.sku || line.itemSku;
                const item = items.find((i) => i.id === line.itemId || (targetSku && i.sku?.toLowerCase() === targetSku.toLowerCase()));
                recordMovement({
                    itemId: item?.id || line.itemId || `itm-${Date.now()}`,
                    itemSku: item?.sku || targetSku || 'GEN-SKU',
                    itemName: item?.name || line.name || line.description,
                    type: 'PURCHASE',
                    quantity: line.qty || 1,
                    unitCost: line.rate || item?.costPrice || 0,
                    referenceType: 'PurchaseBill',
                    referenceId: newBill.id,
                    referenceNumber: newBill.billNumber,
                    notes: `Goods received via ${newBill.billNumber}`,
                });
            });
        }
        showToast(`Purchase Bill ${newBill.billNumber} created from ${po.poNumber}`);
        return newBill;
    };
    const addPurchaseBill = (bill) => {
        const billLines = bill.items || bill.lineItems || [];
        const billAmt = bill.total || bill.amount ||
            (billLines.length > 0 ? billLines.reduce((acc, it) => acc + (it.amount || it.qty * it.rate), 0) : 0) || 5000;
        const newBill = {
            id: bill.id || `pb-${Date.now()}`,
            billNumber: bill.billNumber ||
                `PB-2026-${String(purchaseBills.length + 16).padStart(3, '0')}`,
            purchaseOrderId: bill.purchaseOrderId,
            poRef: bill.poRef || 'PO-2026-0210',
            linkedPo: bill.linkedPo || bill.poRef || 'PO-2026-0210',
            vendorId: bill.vendorId,
            vendor: bill.vendor || 'Cisco Systems Direct',
            billDate: bill.billDate || 'Today',
            date: bill.date || 'Today',
            dueDate: bill.dueDate || '30 Days from now',
            amount: billAmt,
            total: billAmt,
            paidAmount: bill.paidAmount || bill.amountPaid || 0,
            amountPaid: bill.amountPaid || bill.paidAmount || 0,
            balanceDue: Math.max(0, billAmt - (bill.paidAmount || bill.amountPaid || 0)),
            status: bill.status || 'Unpaid',
            items: billLines,
            lineItems: billLines,
            notes: bill.notes || '',
        };
        setPurchaseBills((prev) => [newBill, ...prev]);
        // Increase vendor AP liability
        if (newBill.vendor) {
            setVendors((prev) => prev.map((v) => v.name.toLowerCase() === newBill.vendor.toLowerCase() || (newBill.vendorId && v.id === newBill.vendorId)
                ? { ...v, balance: v.balance + billAmt }
                : v));
        }
        // Auto-create Journal Entry
        const newJe = {
            id: `je-${Date.now()}`,
            entryNumber: `JE-2026-${String(journalEntries.length + 87).padStart(3, '0')}`,
            date: newBill.billDate,
            description: `Vendor Bill Intake - ${newBill.vendor}`,
            reference: newBill.billNumber,
            debitAccount: '1410 - Inventory Asset',
            creditAccount: '2010 - Accounts Payable',
            amount: billAmt,
            status: 'Posted',
        };
        setJournalEntries((prev) => [newJe, ...prev]);
        // Auto-record PURCHASE movements for items (increases stock)
        if (billLines.length > 0) {
            billLines.forEach((line) => {
                const targetSku = line.sku || line.itemSku;
                const item = items.find((i) => i.id === line.itemId || (targetSku && i.sku?.toLowerCase() === targetSku.toLowerCase()));
                recordMovement({
                    itemId: item?.id || line.itemId || `itm-${Date.now()}`,
                    itemSku: item?.sku || targetSku || 'GEN-SKU',
                    itemName: item?.name || line.name || line.description,
                    type: 'PURCHASE',
                    quantity: line.qty || 1,
                    unitCost: line.rate || item?.costPrice || 0,
                    referenceType: 'PurchaseBill',
                    referenceId: newBill.id,
                    referenceNumber: newBill.billNumber,
                    notes: `Goods intake via ${newBill.billNumber}`,
                });
            });
        }
        showToast(`Vendor Bill ${newBill.billNumber} recorded.`);
        return newBill;
    };
    const receivePurchaseBillGoods = (billId) => {
        const bill = purchaseBills.find((b) => b.id === billId);
        if (!bill)
            return;
        const billLines = bill.items || bill.lineItems || [];
        if (billLines.length > 0) {
            billLines.forEach((line) => {
                const targetSku = line.sku || line.itemSku;
                const item = items.find((i) => i.id === line.itemId || (targetSku && i.sku?.toLowerCase() === targetSku.toLowerCase()));
                recordMovement({
                    itemId: item?.id || line.itemId || `itm-${Date.now()}`,
                    itemSku: item?.sku || targetSku || 'GEN-SKU',
                    itemName: item?.name || line.name || line.description,
                    type: 'PURCHASE',
                    quantity: line.qty || 1,
                    unitCost: line.rate || item?.costPrice || 0,
                    referenceType: 'PurchaseBill',
                    referenceId: bill.id,
                    referenceNumber: bill.billNumber,
                    notes: `Manual goods receipt for bill ${bill.billNumber}`,
                });
            });
            showToast(`Stock received and added to inventory from bill ${bill.billNumber}`);
        }
    };
    const updatePurchaseBillStatus = (id, status) => {
        setPurchaseBills((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
        showToast(`Vendor bill marked as ${status}.`);
    };
    const addPaymentOut = (pay) => {
        const payAmt = Number(pay.amount) || 1000;
        const newPay = {
            id: pay.id || `pout-${Date.now()}`,
            voucherNumber: pay.voucherNumber ||
                `VOU-2026-${String(paymentOuts.length + 93).padStart(3, '0')}`,
            vendorId: pay.vendorId,
            vendor: pay.vendor || 'Arrow Electronics Supply',
            billId: pay.billId,
            billNumber: pay.billNumber || 'PB-2026-015',
            date: pay.date || 'Today',
            mode: pay.mode || 'ACH',
            amount: payAmt,
            reference: pay.reference || 'ACH-994821',
            status: 'Paid',
        };
        setPaymentOuts((prev) => [newPay, ...prev]);
        // Update vendor bill payment tracking and dynamic status
        if (newPay.billNumber || newPay.billId) {
            setPurchaseBills((prev) => prev.map((b) => {
                if (b.billNumber === newPay.billNumber || (newPay.billId && b.id === newPay.billId)) {
                    const currentPaid = Number(b.amountPaid ?? b.paidAmount ?? 0);
                    const updatedPaid = currentPaid + payAmt;
                    const totalBill = Number(b.total || b.amount || 0);
                    const isFull = updatedPaid >= (totalBill - 0.01);
                    const derivedStatus = updatedPaid <= 0 ? 'Unpaid' : isFull ? 'Paid' : 'Partially Paid';
                    return {
                        ...b,
                        paidAmount: updatedPaid,
                        amountPaid: updatedPaid,
                        balanceDue: Math.max(0, totalBill - updatedPaid),
                        status: derivedStatus,
                    };
                }
                return b;
            }));
        }
        // Decrease vendor balance liability
        if (newPay.vendor) {
            setVendors((prev) => prev.map((v) => v.name.toLowerCase() === newPay.vendor?.toLowerCase() || (newPay.vendorId && v.id === newPay.vendorId)
                ? { ...v, balance: Math.max(0, v.balance - payAmt) }
                : v));
        }
        // Deduct from Operating Bank Account
        setBankAccounts((prev) => prev.map((acc, idx) => idx === 0
            ? { ...acc, balance: Math.max(0, acc.balance - payAmt) }
            : acc));
        // Auto-create Journal Entry
        const newJe = {
            id: `je-${Date.now()}`,
            entryNumber: `JE-2026-${String(journalEntries.length + 88).padStart(3, '0')}`,
            date: newPay.date,
            description: `Disbursement to Vendor ${newPay.vendor}`,
            reference: newPay.voucherNumber || 'VOU-PAID',
            debitAccount: '2010 - Accounts Payable',
            creditAccount: '1010 - Cash & Bank',
            amount: payAmt,
            status: 'Posted',
        };
        setJournalEntries((prev) => [newJe, ...prev]);
        showToast(`Disbursed $${payAmt.toLocaleString()} to ${newPay.vendor}`);
        return newPay;
    };
    const addPurchaseReturn = (ret) => {
        const retAmt = ret.amount ?? 500;
        const newDebit = {
            id: ret.id || `prt-${Date.now()}`,
            debitNoteNumber: ret.debitNoteNumber ||
                `DN-2026-${String(purchaseReturns.length + 10).padStart(3, '0')}`,
            vendorId: ret.vendorId,
            vendor: ret.vendor || 'Delta Controls & Hydraulics',
            billId: ret.billId,
            billRef: ret.billRef || 'PB-2026-015',
            date: ret.date || 'Today',
            amount: retAmt,
            reason: ret.reason || 'Damaged goods on intake inspection',
            status: ret.status || 'Pending Credit',
            items: ret.items || [],
        };
        setPurchaseReturns((prev) => [newDebit, ...prev]);
        // Record PURCHASE_RETURN movement (removes returned inventory)
        if (newDebit.items && newDebit.items.length > 0) {
            newDebit.items.forEach((line) => {
                const targetSku = line.sku || line.itemSku;
                const item = items.find((i) => i.id === line.itemId || (targetSku && i.sku?.toLowerCase() === targetSku.toLowerCase()));
                recordMovement({
                    itemId: item?.id || line.itemId || `itm-${Date.now()}`,
                    itemSku: item?.sku || targetSku || 'GEN-SKU',
                    itemName: item?.name || line.name || line.description,
                    type: 'PURCHASE_RETURN',
                    quantity: -(line.qty || 1),
                    unitCost: item?.costPrice || line.rate || 0,
                    referenceType: 'PurchaseReturn',
                    referenceId: newDebit.id,
                    referenceNumber: newDebit.debitNoteNumber,
                    notes: `Returned to ${newDebit.vendor}: ${newDebit.reason}`,
                });
            });
        }
        else if (newDebit.itemSku || newDebit.itemId) {
            const targetItem = items.find((i) => (newDebit.itemId && i.id === newDebit.itemId) || (newDebit.itemSku && i.sku?.toLowerCase() === newDebit.itemSku.toLowerCase()));
            if (targetItem) {
                recordMovement({
                    itemId: targetItem.id,
                    itemSku: targetItem.sku,
                    itemName: targetItem.name,
                    type: 'PURCHASE_RETURN',
                    quantity: -(newDebit.qty || 1),
                    unitCost: targetItem.costPrice,
                    referenceType: 'PurchaseReturn',
                    referenceId: newDebit.id,
                    referenceNumber: newDebit.debitNoteNumber,
                    notes: `Returned to ${newDebit.vendor}: ${newDebit.reason}`,
                });
            }
        }
        // Reduce vendor liability balance
        if (newDebit.vendor) {
            setVendors((prev) => prev.map((v) => v.name.toLowerCase() === newDebit.vendor?.toLowerCase() || (newDebit.vendorId && v.id === newDebit.vendorId)
                ? { ...v, balance: Math.max(0, v.balance - retAmt) }
                : v));
        }
        // Auto-create Journal Entry
        const newJe = {
            id: `je-${Date.now()}`,
            entryNumber: `JE-2026-${String(journalEntries.length + 89).padStart(3, '0')}`,
            date: newDebit.date,
            description: `Purchase Return / Debit Note - ${newDebit.vendor}`,
            reference: newDebit.debitNoteNumber,
            debitAccount: '2010 - Accounts Payable',
            creditAccount: '1410 - Inventory Asset',
            amount: retAmt,
            status: 'Posted',
        };
        setJournalEntries((prev) => [newJe, ...prev]);
        showToast(`Debit Note ${newDebit.debitNoteNumber} issued.`);
        return newDebit;
    };
    const updatePurchaseReturnStatus = (id, status) => {
        setPurchaseReturns((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    };
    const addExpense = (exp) => {
        const newExp = {
            id: exp.id || `exp-${Date.now()}`,
            expenseNumber: exp.expenseNumber ||
                `EXP-2026-${String(expenses.length + 119).padStart(3, '0')}`,
            category: exp.category || 'Logistics',
            date: exp.date || 'Today',
            payee: exp.payee || 'Freight Logistics Inc',
            amount: exp.amount ?? 150,
            paidVia: exp.paidVia || 'Corporate Card',
            taxDeductible: exp.taxDeductible ?? true,
        };
        setExpenses((prev) => [newExp, ...prev]);
        // Deduct from Operating Bank Account
        setBankAccounts((prev) => prev.map((acc, idx) => idx === 0
            ? { ...acc, balance: Math.max(0, acc.balance - (newExp.amount || 0)) }
            : acc));
        // Auto-create Journal Entry
        const newJe = {
            id: `je-${Date.now()}`,
            entryNumber: `JE-2026-${String(journalEntries.length + 90).padStart(3, '0')}`,
            date: newExp.date,
            description: `Expense: ${newExp.category} - ${newExp.payee}`,
            reference: newExp.expenseNumber,
            debitAccount: '5020 - Logistics & Operating Expense',
            creditAccount: '1010 - Cash & Bank',
            amount: newExp.amount,
            status: 'Posted',
        };
        setJournalEntries((prev) => [newJe, ...prev]);
        showToast(`Expense voucher ${newExp.expenseNumber} recorded.`);
        return newExp;
    };
    const addLocation = (loc) => {
        const newLoc = {
            id: loc.id || `loc-${Date.now()}`,
            code: loc.code || `LOC-${String(locations.length + 1).padStart(2, '0')}`,
            name: loc.name || 'New Facility Zone',
            type: loc.type || 'Assembly Bay',
            capacityPct: loc.capacityPct ?? 15,
            totalSkus: 0,
            manager: loc.manager || 'Operations Lead',
        };
        setLocations((prev) => [...prev, newLoc]);
        showToast(`Location ${newLoc.name} established.`);
        return newLoc;
    };
    const addTransfer = (tr) => {
        const newTr = {
            id: tr.id || `tr-${Date.now()}`,
            transferNumber: tr.transferNumber || `TR-${Math.floor(9900 + Math.random() * 90)}`,
            sourceLocationId: tr.sourceLocationId,
            sourceLocation: tr.sourceLocation || 'Main Central Warehouse',
            destLocationId: tr.destLocationId,
            destLocation: tr.destLocation || 'Assembly Bay Zone A',
            date: tr.date || 'Today',
            itemsCount: tr.itemsCount ?? 1,
            status: tr.status || 'In Transit',
            shippedBy: tr.shippedBy || 'Logistics Clerk',
            items: tr.items || [],
        };
        setTransfers((prev) => [newTr, ...prev]);
        // Record TRANSFER_OUT and TRANSFER_IN movements
        if (newTr.items && newTr.items.length > 0) {
            newTr.items.forEach((line) => {
                const item = items.find((i) => i.id === line.itemId || i.sku?.toLowerCase() === line.itemSku?.toLowerCase());
                // Transfer Out
                recordMovement({
                    itemId: item?.id || line.itemId || `itm-${Date.now()}`,
                    itemSku: item?.sku || line.itemSku || 'GEN-SKU',
                    itemName: item?.name || line.description,
                    locationId: newTr.sourceLocationId || 'loc-1',
                    locationName: newTr.sourceLocation,
                    type: 'TRANSFER_OUT',
                    quantity: -line.qty,
                    unitCost: item?.costPrice || line.rate,
                    referenceType: 'StockTransfer',
                    referenceId: newTr.id,
                    referenceNumber: newTr.transferNumber,
                    notes: `Transfer OUT to ${newTr.destLocation}`,
                });
                // Transfer In
                recordMovement({
                    itemId: item?.id || line.itemId || `itm-${Date.now()}`,
                    itemSku: item?.sku || line.itemSku || 'GEN-SKU',
                    itemName: item?.name || line.description,
                    locationId: newTr.destLocationId || 'loc-2',
                    locationName: newTr.destLocation,
                    type: 'TRANSFER_IN',
                    quantity: line.qty,
                    unitCost: item?.costPrice || line.rate,
                    referenceType: 'StockTransfer',
                    referenceId: newTr.id,
                    referenceNumber: newTr.transferNumber,
                    notes: `Transfer IN from ${newTr.sourceLocation}`,
                });
            });
        }
        showToast(`Transfer manifest ${newTr.transferNumber} created.`);
        return newTr;
    };
    const updateTransferStatus = (id, status) => {
        setTransfers((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
        showToast(`Stock transfer marked as ${status}.`);
    };
    const addServiceUsage = (usage) => {
        const newUsage = {
            id: usage.id || `su-${Date.now()}`,
            ticketNumber: usage.ticketNumber || `TKT-${Math.floor(9000 + Math.random() * 900)}`,
            technician: usage.technician || 'Liam Vance',
            itemId: usage.itemId,
            sku: usage.sku || 'CAB-6-01',
            qtyUsed: usage.qtyUsed ?? 1,
            date: usage.date || 'Today',
            purpose: usage.purpose || 'Rack cabling replacement',
        };
        setServiceUsages((prev) => [newUsage, ...prev]);
        // Record SERVICE_USAGE movement
        const targetItem = items.find((i) => i.id === newUsage.itemId || i.sku?.toLowerCase() === newUsage.sku?.toLowerCase());
        if (targetItem) {
            recordMovement({
                itemId: targetItem.id,
                itemSku: targetItem.sku,
                itemName: targetItem.name,
                type: 'SERVICE_USAGE',
                quantity: -newUsage.qtyUsed,
                unitCost: targetItem.costPrice,
                referenceType: 'ServiceUsage',
                referenceId: newUsage.id,
                referenceNumber: newUsage.ticketNumber,
                notes: `Technician: ${newUsage.technician} - ${newUsage.purpose}`,
            });
        }
        showToast(`Consumed ${newUsage.qtyUsed}x ${newUsage.sku} on ${newUsage.ticketNumber}`);
        return newUsage;
    };
    const addBankAccount = (acc) => {
        const newAcc = {
            id: acc.id || `ba-${Date.now()}`,
            accountName: acc.accountName || 'Operating Account',
            bankName: acc.bankName || 'Commercial Bank',
            accountNumber: acc.accountNumber || `•••• ${Math.floor(1000 + Math.random() * 9000)}`,
            balance: acc.balance ?? 10000,
            currency: acc.currency || 'USD',
        };
        setBankAccounts((prev) => [...prev, newAcc]);
        showToast(`Bank Account ${newAcc.bankName} added.`);
        return newAcc;
    };
    const addJournalEntry = (entry) => {
        const newEntry = {
            id: entry.id || `je-${Date.now()}`,
            entryNumber: entry.entryNumber || `JE-2026-${String(journalEntries.length + 81).padStart(3, '0')}`,
            date: entry.date || 'Today',
            description: entry.description || 'General Ledger Adjusting Entry',
            reference: entry.reference || 'MANUAL-ADJ',
            debitAccount: entry.debitAccount || '1010 - Cash & Bank',
            creditAccount: entry.creditAccount || '4010 - Sales Revenue',
            amount: entry.amount ?? 1000,
            status: 'Posted',
        };
        setJournalEntries((prev) => [newEntry, ...prev]);
        showToast(`Journal entry ${newEntry.entryNumber} posted to GL.`);
        return newEntry;
    };
    return (<ERPContext.Provider value={{
            faultyParts,
            invoices,
            zoneRequests,
            customers,
            vendors,
            parties,
            addParty,
            updateParty,
            units,
            addUnit,
            categoryParts,
            addCategoryPart,
            removeCategoryPart,
            itemParts,
            addItemPart,
            updateItemPart,
            removeItemPart,
            customersFromParties,
            vendorsFromParties,
            addSerialNumbers,
            removeSerialNumbers,
            items,
            categories,
            quotations,
            salesOrders,
            deliveryChallans,
            paymentIns,
            salesReturns,
            purchaseOrders,
            purchaseBills,
            paymentOuts,
            purchaseReturns,
            expenses,
            locations,
            transfers,
            serviceUsages,
            valuationItems,
            monthEndAudits,
            bankAccounts,
            journalEntries,
            inventoryMovements,
            currency,
            setCurrency,
            formatCurrency,
            currencySymbol,
            formatDateDDMMYYYY,
            getCurrentDateFormatted,
            toastMessage,
            showToast,
            calculateItemStock,
            getItemMovements,
            getCustomerLedger,
            getVendorLedger,
            getInvoiceOutstanding,
            getBillOutstanding,
            recordMovement,
            addFaultyPart,
            updateFaultyPartStatus,
            updateFaultyPartNotes,
            createInvoice,
            updateInvoiceStatus,
            addZoneRequest,
            updateZoneRequest,
            updateZoneRequestStatus,
            addInventoryItem,
            updateInventoryItem,
            adjustItemStock,
            addCustomer,
            updateCustomer,
            addVendor,
            updateVendor,
            addCategory,
            updateCategory,
            addQuotation,
            updateQuotationStatus,
            convertQuotationToSalesOrder,
            addSalesOrder,
            updateSalesOrderStage,
            convertSalesOrderToInvoice,
            convertSalesOrderToChallan,
            addDeliveryChallan,
            updateDeliveryChallanStatus,
            addPaymentIn,
            addSalesReturn,
            addPurchaseOrder,
            updatePurchaseOrderStatus,
            deletePurchaseOrder,
            convertPurchaseOrderToBill,
            addPurchaseBill,
            updatePurchaseBillStatus,
            receivePurchaseBillGoods,
            addPaymentOut,
            addPurchaseReturn,
            updatePurchaseReturnStatus,
            addExpense,
            addLocation,
            addTransfer,
            updateTransferStatus,
            addServiceUsage,
            addBankAccount,
            addJournalEntry,
            resetDemoData,
        }}>
      {children}
      {/* Global Toast Banner */}
      {toastMessage && (
        <div className="toast" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </ERPContext.Provider>);
};
export const useERP = () => {
    const context = useContext(ERPContext);
    if (!context) {
        throw new Error('useERP must be used within an ERPProvider');
    }
    return context;
};
