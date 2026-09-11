import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockCustomers, mockVendors, mockInventoryItems, mockCategories, mockQuotations, mockSalesOrders, mockDeliveryChallans, mockPaymentIns, mockSalesReturns, mockPurchaseOrders, mockPurchaseBills, mockPaymentOuts, mockPurchaseReturns, mockExpenses, mockLocations, mockTransfers, mockServiceUsages, mockValuationItems, mockMonthEndAudits, mockBankAccounts, initialFaultyParts, initialSalesInvoices, initialZoneRequests, mockInventoryMovements, mockParties, mockUnits, mockCategoryParts, mockItemParts, mockProformaInvoices, mockEstimates } from '../data/erp/mockData';
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
                const existingNames = new Set(parsed.parties.map(p => (p.name || '').toLowerCase()));
                const missingMockParties = mockParties.filter(mp => !existingNames.has((mp.name || '').toLowerCase()));
                parsed.parties = [
                    ...parsed.parties.map((p, idx) => {
                        const fallback = mockParties.find(mp => mp.name?.toLowerCase() === (p.name || '').toLowerCase()) || mockParties[idx] || mockParties[0] || {};
                        return {
                            ...fallback,
                            ...p,
                            name: p.name || p.companyName || p.company || fallback.name || `Partner ${idx + 1}`,
                        };
                    }),
                    ...missingMockParties,
                ];
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
            if (Array.isArray(parsed?.proformaInvoices) && parsed.proformaInvoices.length > 0) {
                const existingNumbers = new Set(parsed.proformaInvoices.map(p => (p.proformaNumber || '').toLowerCase()));
                const missingMockPIs = mockProformaInvoices.filter(mp => !existingNumbers.has((mp.proformaNumber || '').toLowerCase()));
                parsed.proformaInvoices = [...parsed.proformaInvoices, ...missingMockPIs];
            }
            if (Array.isArray(parsed?.estimates) && parsed.estimates.length > 0) {
                const existingNumbers = new Set(parsed.estimates.map(e => (e.estimateNumber || '').toLowerCase()));
                const missingMockEstimates = mockEstimates.filter(me => !existingNumbers.has((me.estimateNumber || '').toLowerCase()));
                parsed.estimates = [...parsed.estimates, ...missingMockEstimates];
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
    const [estimates, setEstimates] = useState(initial?.estimates || mockEstimates);
    const [faultyParts, setFaultyParts] = useState(initial?.faultyParts || initialFaultyParts);
    const [invoices, setInvoices] = useState(initial?.invoices || initialSalesInvoices);
    const [proformaInvoices, setProformaInvoices] = useState(initial?.proformaInvoices || mockProformaInvoices);
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
                estimates,
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
                proformaInvoices,
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
        estimates,
        faultyParts,
        invoices,
        proformaInvoices,
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
    ]);
    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage((prev) => (prev === msg ? null : prev));
        }, 3500);
    };
    const resetDemoData = () => {
        localStorage.removeItem(STORAGE_KEY);
        setEstimates(mockEstimates);
        setFaultyParts(initialFaultyParts);
        setInvoices(initialSalesInvoices);
        setProformaInvoices(mockProformaInvoices);
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
            sourceDocumentType: mov.sourceDocumentType || mov.referenceType,
            sourceDocumentId: mov.sourceDocumentId || mov.referenceId,
            originalMovementId: mov.originalMovementId || null,
            reversalMovementId: mov.reversalMovementId || null,
            batchNumber: mov.batchNumber || null,
            serials: Array.isArray(mov.serials) ? mov.serials : (mov.selectedSerials || []),
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

    // ── ADDRESS SNAPSHOT HELPERS ──────────────────────────────────────────────
    const createAddressSnapshot = (addr) => {
        if (!addr) return null;
        if (typeof addr === 'string') return { line1: addr, line2: '', city: '', state: '', pincode: '', country: 'India' };
        return {
            line1: addr.line1 || '',
            line2: addr.line2 || '',
            city: addr.city || '',
            state: addr.state || '',
            pincode: addr.pincode || '',
            country: addr.country || 'India',
        };
    };

    const resolvePartyAddresses = (customerId, customerName) => {
        const cust = customers.find((c) => (customerId && c.id === customerId) || (customerName && c.name?.toLowerCase() === customerName?.toLowerCase()));
        const party = parties.find((p) => (customerId && p.id === customerId) || (customerName && p.name?.toLowerCase() === customerName?.toLowerCase()));
        const billing = createAddressSnapshot(party?.billingAddress || cust?.billingAddress || cust?.address || null);
        const shipping = createAddressSnapshot(party?.shippingAddress || cust?.shippingAddress || party?.billingAddress || cust?.billingAddress || cust?.address || null);
        return { billing, shipping };
    };

    const resolveVendorPartyAddresses = (vendorId, vendorName) => {
        const ven = vendors.find((v) => (vendorId && v.id === vendorId) || (vendorName && v.name?.toLowerCase() === vendorName?.toLowerCase()));
        const party = parties.find((p) => (vendorId && p.id === vendorId) || (vendorName && p.name?.toLowerCase() === vendorName?.toLowerCase()));
        const billing = createAddressSnapshot(party?.billingAddress || ven?.billingAddress || ven?.address || null);
        const shipping = createAddressSnapshot(party?.shippingAddress || ven?.shippingAddress || party?.billingAddress || ven?.billingAddress || ven?.address || null);
        return { billing, shipping };
    };

    const syncVendorBalance = (vendorId, vendorName, deltaAmount) => {
        if (!deltaAmount) return;
        setVendors((prev) => prev.map((v) => {
            const match = (vendorId && v.id === vendorId) || (vendorName && v.name?.toLowerCase() === vendorName?.toLowerCase());
            return match ? { ...v, balance: Math.max(0, (v.balance || 0) + deltaAmount) } : v;
        }));
        setParties((prev) => prev.map((p) => {
            const match = (vendorId && p.id === vendorId) || (vendorName && p.name?.toLowerCase() === vendorName?.toLowerCase());
            return match ? { ...p, balance: Math.max(0, (p.balance || 0) + deltaAmount) } : p;
        }));
    };

    const createInvoice = (newInvoice) => {
        const invItems = newInvoice.items && newInvoice.items.length > 0
            ? newInvoice.items
            : [
                {
                    id: `item-${Date.now()}`,
                    description: 'Standard Order Merchandise',
                    qty: 1,
                    rate: newInvoice.subtotal || newInvoice.total || 1000,
                    amount: newInvoice.subtotal || newInvoice.total || 1000,
                },
            ];

        // Dynamic tax calculation
        let subtotal = 0;
        let discountTotal = Number(newInvoice.discountTotal || 0);
        let totalTax = 0;

        invItems.forEach((it) => {
            const lineSub = Number(it.rate || 0) * Number(it.qty || 1);
            const lineDisc = Number(it.discount || it.discountPercent || 0);
            const discAmt = (lineSub * lineDisc) / 100;
            const taxable = Math.max(0, lineSub - discAmt);
            const taxRate = it.tax !== undefined ? Number(it.tax) : (it.taxRate !== undefined ? Number(it.taxRate) : 18);
            const lineTax = Math.round(taxable * (taxRate / 100) * 100) / 100;
            subtotal += lineSub;
            if (lineDisc > 0 && !newInvoice.discountTotal) {
                discountTotal += discAmt;
            }
            totalTax += lineTax;
        });

        if (newInvoice.subtotal !== undefined) subtotal = Number(newInvoice.subtotal);
        const taxableAmount = Math.max(0, subtotal - discountTotal);

        // Find customer / party place of supply to determine GST split
        const cust = customers.find((c) => c.id === newInvoice.customerId || c.name?.toLowerCase() === newInvoice.customer?.toLowerCase());
        const party = parties.find((p) => p.id === newInvoice.customerId || p.name?.toLowerCase() === newInvoice.customer?.toLowerCase());
        const pos = party?.placeOfSupply || cust?.placeOfSupply || 'Maharashtra (27)';
        const isInterState = !pos.toLowerCase().includes('maharashtra') && !pos.includes('27');

        let cgst = 0;
        let sgst = 0;
        let igst = 0;
        if (newInvoice.cgst !== undefined || newInvoice.sgst !== undefined || newInvoice.igst !== undefined) {
            cgst = Number(newInvoice.cgst || 0);
            sgst = Number(newInvoice.sgst || 0);
            igst = Number(newInvoice.igst || 0);
            totalTax = cgst + sgst + igst;
        } else if (isInterState) {
            igst = totalTax;
        } else {
            cgst = Math.round((totalTax / 2) * 100) / 100;
            sgst = Math.round((totalTax - cgst) * 100) / 100;
        }

        const otherCharges = Number(newInvoice.otherCharges || 0);
        const roundOff = Number(newInvoice.roundOff || 0);
        const calculatedGrandTotal = Math.round((taxableAmount + totalTax + otherCharges + roundOff) * 100) / 100;
        const total = Number(newInvoice.grandTotal || newInvoice.total) || calculatedGrandTotal;

        const defaultAddresses = resolvePartyAddresses(newInvoice.customerId, newInvoice.customer);
        const billingAddress = createAddressSnapshot(newInvoice.billingAddress) || defaultAddresses.billing;
        const shippingAddress = createAddressSnapshot(newInvoice.shippingAddress) || defaultAddresses.shipping;

        const isDraft = newInvoice.status === 'Draft' || newInvoice.isDraft === true || newInvoice.finalized === false;
        const isPaid = newInvoice.status === 'Paid';
        const finalStatus = isDraft ? 'Draft' : isPaid ? 'Paid' : (newInvoice.status || 'Unpaid');
        const isFinalized = !isDraft;

        const invoice = {
            id: newInvoice.id || `inv-${Date.now()}`,
            invoiceNumber: newInvoice.invoiceNumber || `INV-2026-${String(invoices.length + 101).padStart(3, '0')}`,
            customerId: newInvoice.customerId || cust?.id,
            customer: newInvoice.customer || cust?.name || 'Acme Corp',
            billingAddress,
            shippingAddress,
            linkedSo: newInvoice.linkedSo || newInvoice.salesOrderId,
            salesOrderId: newInvoice.salesOrderId || newInvoice.linkedSo,
            proformaInvoiceId: newInvoice.proformaInvoiceId,
            linkedPi: newInvoice.linkedPi,
            date: formatDateDDMMYYYY(newInvoice.date || 'Today'),
            dueDate: newInvoice.dueDate || '30 Days from now',
            status: finalStatus,
            finalized: isFinalized,
            items: invItems,
            lineItems: invItems,
            subtotal,
            discountTotal,
            taxableAmount,
            cgst,
            sgst,
            igst,
            tax: totalTax,
            otherCharges,
            roundOff,
            total,
            grandTotal: total,
            amount: total,
            paidAmount: isPaid ? total : (newInvoice.paidAmount || 0),
            amountPaid: isPaid ? total : (newInvoice.paidAmount || 0),
            balanceDue: isPaid ? 0 : Math.max(0, total - (newInvoice.paidAmount || 0)),
            notes: newInvoice.notes || 'Sales Invoice',
            dispatchedViaChallan: Boolean(newInvoice.dispatchedViaChallan),
        };

        setInvoices((prev) => [invoice, ...prev]);

        // If finalized, post financial records and inventory
        if (isFinalized) {
            // Inventory Safe Handling (Case A, B, C):
            const soId = invoice.salesOrderId || invoice.linkedSo;
            const hasChallan = Boolean(
                invoice.dispatchedViaChallan ||
                (soId && deliveryChallans.some((dc) => dc.salesOrderId === soId || dc.salesOrderNumber === soId || dc.linkedSo === soId))
            );

            if (!hasChallan) {
                // Direct Invoice: Deduct inventory stock
                invItems.forEach((line) => {
                    const targetSku = line.sku || line.itemSku;
                    const item = items.find((i) => i.id === line.itemId || (targetSku && i.sku?.toLowerCase() === targetSku.toLowerCase()));
                    if (item || line.itemId) {
                        recordMovement({
                            itemId: item?.id || line.itemId || `itm-${Date.now()}`,
                            itemSku: item?.sku || targetSku || 'GEN-SKU',
                            itemName: item?.name || line.name || line.description,
                            type: 'SALE',
                            quantity: -(Number(line.qty) || 1),
                            unitCost: item?.costPrice || line.rate || 0,
                            referenceType: 'SalesInvoice',
                            referenceId: invoice.id,
                            referenceNumber: invoice.invoiceNumber,
                            notes: `Direct sale to ${invoice.customer} per ${invoice.invoiceNumber}`,
                        });
                    }
                });
            }

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
            showToast(`Invoice ${invoice.invoiceNumber} created and finalized.`);
        } else {
            showToast(`Draft Invoice ${invoice.invoiceNumber} saved.`);
        }

        return invoice;
    };

    const updateDraftInvoice = (invoiceId, updates) => {
        const target = invoices.find((i) => i.id === invoiceId);
        if (!target) return undefined;
        if (target.status === 'Cancelled') {
            showToast('Cannot edit a cancelled invoice.');
            return undefined;
        }
        if (target.finalized) {
            showToast(`Cannot edit finalized invoice ${target.invoiceNumber}.`);
            return target;
        }

        let updatedInv = null;
        setInvoices((prev) => prev.map((inv) => {
            if (inv.id !== invoiceId) return inv;
            if (inv.finalized) return inv;

            const invItems = updates.items || updates.lineItems || inv.items || [];
            let subtotal = 0;
            let discountTotal = Number(updates.discountTotal !== undefined ? updates.discountTotal : (inv.discountTotal || 0));
            let totalTax = 0;

            invItems.forEach((it) => {
                const lineSub = Number(it.rate || 0) * Number(it.qty || 1);
                const lineDisc = Number(it.discount || it.discountPercent || 0);
                const discAmt = (lineSub * lineDisc) / 100;
                const taxable = Math.max(0, lineSub - discAmt);
                const taxRate = it.tax !== undefined ? Number(it.tax) : (it.taxRate !== undefined ? Number(it.taxRate) : 18);
                const lineTax = Math.round(taxable * (taxRate / 100) * 100) / 100;
                subtotal += lineSub;
                if (lineDisc > 0 && updates.discountTotal === undefined) {
                    discountTotal += discAmt;
                }
                totalTax += lineTax;
            });

            if (updates.subtotal !== undefined) subtotal = Number(updates.subtotal);
            const taxableAmount = Math.max(0, subtotal - discountTotal);

            const cust = customers.find((c) => c.id === (updates.customerId || inv.customerId) || c.name?.toLowerCase() === (updates.customer || inv.customer)?.toLowerCase());
            const party = parties.find((p) => p.id === (updates.customerId || inv.customerId) || p.name?.toLowerCase() === (updates.customer || inv.customer)?.toLowerCase());
            const pos = party?.placeOfSupply || cust?.placeOfSupply || 'Maharashtra (27)';
            const isInterState = !pos.toLowerCase().includes('maharashtra') && !pos.includes('27');

            let cgst = 0;
            let sgst = 0;
            let igst = 0;
            if (updates.cgst !== undefined || updates.sgst !== undefined || updates.igst !== undefined) {
                cgst = Number(updates.cgst || 0);
                sgst = Number(updates.sgst || 0);
                igst = Number(updates.igst || 0);
                totalTax = cgst + sgst + igst;
            } else if (isInterState) {
                igst = totalTax;
            } else {
                cgst = Math.round((totalTax / 2) * 100) / 100;
                sgst = Math.round((totalTax - cgst) * 100) / 100;
            }

            const otherCharges = Number(updates.otherCharges !== undefined ? updates.otherCharges : (inv.otherCharges || 0));
            const roundOff = Number(updates.roundOff !== undefined ? updates.roundOff : (inv.roundOff || 0));
            const calculatedGrandTotal = Math.round((taxableAmount + totalTax + otherCharges + roundOff) * 100) / 100;
            const total = Number(updates.grandTotal || updates.total) || calculatedGrandTotal;

            updatedInv = {
                ...inv,
                ...updates,
                items: invItems,
                lineItems: invItems,
                subtotal,
                discountTotal,
                taxableAmount,
                cgst,
                sgst,
                igst,
                tax: totalTax,
                otherCharges,
                roundOff,
                total,
                grandTotal: total,
                amount: total,
                balanceDue: total,
                billingAddress: updates.billingAddress ? createAddressSnapshot(updates.billingAddress) : inv.billingAddress,
                shippingAddress: updates.shippingAddress ? createAddressSnapshot(updates.shippingAddress) : inv.shippingAddress,
            };
            return updatedInv;
        }));
        if (updatedInv) showToast(`Draft Invoice ${updatedInv.invoiceNumber} updated.`);
        return updatedInv;
    };

    const finalizeInvoice = (invoiceId) => {
        const target = invoices.find((i) => i.id === invoiceId);
        if (!target) return undefined;
        if (target.status === 'Cancelled') {
            showToast('Cannot finalize a cancelled invoice.');
            return undefined;
        }
        if (target.finalized) {
            showToast(`Invoice ${target.invoiceNumber} is already finalized.`);
            return target;
        }

        let finalized = null;
        setInvoices((prev) => prev.map((inv) => {
            if (inv.id !== invoiceId) return inv;
            if (inv.finalized) return inv; // Idempotent

            const updated = {
                ...inv,
                status: inv.status === 'Draft' ? 'Unpaid' : inv.status,
                finalized: true,
            };
            finalized = updated;
            return updated;
        }));

        if (!finalized) return undefined;

        // Inventory Safe Handling (Case A, B, C):
        const soId = finalized.salesOrderId || finalized.linkedSo;
        const hasChallan = Boolean(
            finalized.dispatchedViaChallan ||
            (soId && deliveryChallans.some((dc) => dc.salesOrderId === soId || dc.salesOrderNumber === soId || dc.linkedSo === soId))
        );

        if (!hasChallan) {
            // Direct Invoice: Deduct inventory stock
            (finalized.items || []).forEach((line) => {
                const targetSku = line.sku || line.itemSku;
                const item = items.find((i) => i.id === line.itemId || (targetSku && i.sku?.toLowerCase() === targetSku.toLowerCase()));
                if (item || line.itemId) {
                    recordMovement({
                        itemId: item?.id || line.itemId || `itm-${Date.now()}`,
                        itemSku: item?.sku || targetSku || 'GEN-SKU',
                        itemName: item?.name || line.name || line.description,
                        type: 'SALE',
                        quantity: -(Number(line.qty) || 1),
                        unitCost: item?.costPrice || line.rate || 0,
                        referenceType: 'SalesInvoice',
                        referenceId: finalized.id,
                        referenceNumber: finalized.invoiceNumber,
                        notes: `Direct sale to ${finalized.customer} per ${finalized.invoiceNumber}`,
                    });
                }
            });
        }

        // Update customer outstanding balance
        if (finalized.customer) {
            setCustomers((prev) => prev.map((c) => c.name.toLowerCase() === finalized.customer.toLowerCase() || (finalized.customerId && c.id === finalized.customerId)
                ? { ...c, balance: c.balance + finalized.total }
                : c));
        }

        // Auto-create Journal Entry for Revenue & AR
        const je = {
            id: `je-${Date.now()}`,
            entryNumber: `JE-2026-${String(journalEntries.length + 81).padStart(3, '0')}`,
            date: finalized.date,
            description: `Sales Invoice - ${finalized.customer}`,
            reference: finalized.invoiceNumber,
            debitAccount: '1210 - Accounts Receivable',
            creditAccount: '4010 - Sales Revenue',
            amount: finalized.total,
            status: 'Posted',
        };
        setJournalEntries((prev) => [je, ...prev]);
        showToast(`Invoice ${finalized.invoiceNumber} finalized and posted to General Ledger.`);
        return finalized;
    };

    const cancelSalesInvoice = (invoiceId) => {
        const inv = invoices.find((i) => i.id === invoiceId);
        if (!inv) return { success: false, reason: 'not_found', message: 'Invoice not found.' };
        if (inv.status === 'Cancelled') return { success: true, message: 'Already cancelled.' };

        // Guard against cancelling invoice with recorded payments
        const paid = Number(inv.paidAmount || inv.amountPaid || 0);
        if (paid > 0) {
            return {
                success: false,
                reason: 'has_payments',
                message: `Cannot cancel invoice with received payments (${formatCurrency(paid)}). Please reverse payments first.`,
            };
        }

        // If invoice was finalized / posted, reverse GL, AR balance, and stock movement (if direct)
        if (inv.finalized !== false && inv.status !== 'Draft') {
            // Reversal of customer balance
            if (inv.customer) {
                setCustomers((prev) => prev.map((c) => c.name.toLowerCase() === inv.customer.toLowerCase() || (inv.customerId && c.id === inv.customerId)
                    ? { ...c, balance: Math.max(0, c.balance - inv.total) }
                    : c));
            }

            // Auto-create Reversal Journal Entry
            const jeReversal = {
                id: `je-${Date.now()}`,
                entryNumber: `JE-2026-${String(journalEntries.length + 82).padStart(3, '0')}`,
                date: getCurrentDateFormatted(),
                description: `Invoice Cancellation Reversal - ${inv.invoiceNumber} (${inv.customer})`,
                reference: `REV-${inv.invoiceNumber}`,
                debitAccount: '4010 - Sales Revenue',
                creditAccount: '1210 - Accounts Receivable',
                amount: inv.total,
                status: 'Posted',
            };
            setJournalEntries((prev) => [jeReversal, ...prev]);

            // Reversal of physical stock movement if Direct Invoice (Case B/C without DC)
            const soId = inv.salesOrderId || inv.linkedSo;
            const hasChallan = Boolean(
                inv.dispatchedViaChallan ||
                (soId && deliveryChallans.some((dc) => dc.salesOrderId === soId || dc.salesOrderNumber === soId || dc.linkedSo === soId))
            );

            if (!hasChallan && inv.items) {
                inv.items.forEach((line) => {
                    const targetSku = line.sku || line.itemSku;
                    const item = items.find((i) => i.id === line.itemId || (targetSku && i.sku?.toLowerCase() === targetSku.toLowerCase()));
                    const revQty = Number(line.qty) || 1;
                    recordMovement({
                        itemId: item?.id || line.itemId || `itm-${Date.now()}`,
                        itemSku: item?.sku || targetSku || 'GEN-SKU',
                        itemName: item?.name || line.name || line.description,
                        type: 'SALE_REVERSAL',
                        quantity: revQty,
                        unitCost: item?.costPrice || line.rate || 0,
                        referenceType: 'SalesInvoiceCancellation',
                        referenceId: inv.id,
                        referenceNumber: inv.invoiceNumber,
                        notes: `Stock reversal on Invoice ${inv.invoiceNumber} cancellation`,
                    });
                });
            }
        }

        setInvoices((prev) => prev.map((i) => i.id === invoiceId ? { ...i, status: 'Cancelled' } : i));
        showToast(`Invoice ${inv.invoiceNumber} cancelled.`);
        return { success: true, message: `Invoice ${inv.invoiceNumber} cancelled.` };
    };

    const updateInvoiceStatus = (id, newStatus) => {
        setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status: newStatus } : inv)));
        showToast(`Invoice status updated to ${newStatus}.`);
    };

    // ── PROFORMA INVOICES ACTIONS ──────────────────────────────────────────────
    const addProformaInvoice = (pi) => {
        const subtotal = Number(pi.subtotal) || (pi.items ? pi.items.reduce((sum, it) => sum + (Number(it.rate || 0) * Number(it.qty || 1)), 0) : 0) || 5000;
        const discountTotal = Number(pi.discountTotal) || 0;
        const taxableAmount = Math.max(0, subtotal - discountTotal);
        const cgst = pi.cgst !== undefined ? Number(pi.cgst) : Math.round(taxableAmount * 0.09 * 100) / 100;
        const sgst = pi.sgst !== undefined ? Number(pi.sgst) : Math.round(taxableAmount * 0.09 * 100) / 100;
        const igst = Number(pi.igst) || 0;
        const otherCharges = Number(pi.otherCharges) || 0;
        const roundOff = Number(pi.roundOff) || 0;
        const grandTotal = Number(pi.grandTotal || pi.total) || Math.round((taxableAmount + cgst + sgst + igst + otherCharges + roundOff) * 100) / 100;

        const nextNumber = pi.proformaNumber || `PI-2026-${String(proformaInvoices.length + 5).padStart(3, '0')}`;
        const newPI = {
            id: pi.id || `pi-${Date.now()}`,
            proformaNumber: nextNumber,
            customerId: pi.customerId,
            customer: pi.customer || 'Acme Corp',
            customerContact: pi.customerContact || '',
            billingAddress: pi.billingAddress || null,
            shippingAddress: pi.shippingAddress || null,
            salesOrderId: pi.salesOrderId || null,
            linkedSo: pi.linkedSo || null,
            quotationId: pi.quotationId || null,
            linkedQuote: pi.linkedQuote || null,
            date: formatDateDDMMYYYY(pi.date || 'Today'),
            validUntil: formatDateDDMMYYYY(pi.validUntil || 'In 30 days'),
            status: pi.status || 'Draft',
            paymentTerms: pi.paymentTerms || '50% Advance • 50% Before Dispatch',
            paymentSchedule: pi.paymentSchedule || [
                { milestone: 'Advance Booking Deposit', pct: 50, amount: grandTotal * 0.5, due: 'Upon Acceptance' },
                { milestone: 'Pre-Dispatch Balance', pct: 50, amount: grandTotal * 0.5, due: 'Before Dispatch' },
            ],
            items: pi.items && pi.items.length > 0 ? pi.items : [
                {
                    id: `li-pi-${Date.now()}`,
                    description: 'Standard Commercial Quotation Package',
                    qty: 1,
                    unit: 'Unit',
                    rate: subtotal,
                    discount: 0,
                    tax: 18,
                    taxAmount: Math.round(subtotal * 0.18 * 100) / 100,
                    amount: Math.round(subtotal * 1.18 * 100) / 100,
                },
            ],
            subtotal,
            discountTotal,
            taxableAmount,
            cgst,
            sgst,
            igst,
            tax: cgst + sgst + igst,
            otherCharges,
            roundOff,
            grandTotal,
            total: grandTotal,
            notes: pi.notes || 'Commercial Proforma Invoice.',
            termsAndConditions: pi.termsAndConditions || '',
        };
        setProformaInvoices((prev) => [newPI, ...prev]);
        showToast(`Proforma Invoice ${newPI.proformaNumber} created.`);
        return newPI;
    };

    const updateProformaInvoice = (id, updates) => {
        setProformaInvoices((prev) => prev.map((pi) => (pi.id === id ? { ...pi, ...updates } : pi)));
        showToast(`Proforma Invoice updated.`);
    };

    const updateProformaInvoiceStatus = (id, status) => {
        setProformaInvoices((prev) => prev.map((pi) => (pi.id === id ? { ...pi, status } : pi)));
        showToast(`Proforma status updated to ${status}.`);
    };

    const deleteProformaInvoice = (id) => {
        setProformaInvoices((prev) => prev.filter((pi) => pi.id !== id));
        showToast(`Proforma Invoice deleted.`);
    };

    const convertProformaToInvoice = (proformaId, invoiceOverrides = {}) => {
        const pi = proformaInvoices.find((p) => p.id === proformaId);
        if (!pi) return undefined;

        const targetItems = invoiceOverrides.items || pi.items || [];
        const subtotal = invoiceOverrides.subtotal ?? (targetItems.reduce((sum, item) => sum + (Number(item.amount || 0) || (Number(item.qty || 1) * Number(item.rate || 0))), 0) || pi.subtotal);
        const tax = invoiceOverrides.tax ?? (pi.cgst + pi.sgst + pi.igst || Math.round(subtotal * 0.18 * 100) / 100);
        const grandTotal = invoiceOverrides.total ?? Math.round((subtotal + tax) * 100) / 100;
        const nextInvNumber = `INV-2026-${String(invoices.length + 101).padStart(3, '0')}`;

        const newInvoice = {
            id: `inv-${Date.now()}`,
            invoiceNumber: nextInvNumber,
            customerId: pi.customerId,
            customer: pi.customer,
            billingAddress: createAddressSnapshot(pi.billingAddress),
            shippingAddress: createAddressSnapshot(pi.shippingAddress),
            salesOrderId: pi.salesOrderId,
            linkedSo: pi.linkedSo || (pi.salesOrderId ? `SO-2026-${String(invoices.length + 101).padStart(4, '0')}` : 'Direct Proforma'),
            proformaInvoiceId: pi.id,
            linkedPi: pi.proformaNumber,
            date: getCurrentDateFormatted(),
            dueDate: 'In 30 days',
            status: 'Draft',
            finalized: false,
            items: targetItems,
            lineItems: targetItems,
            subtotal,
            tax,
            total: grandTotal,
            paidAmount: 0,
            balanceDue: grandTotal,
            notes: invoiceOverrides.notes || `Draft Sales Invoice generated against Proforma ${pi.proformaNumber}. ${pi.notes || ''}`,
            paymentTerms: pi.paymentTerms || 'Net 30',
        };

        createInvoice(newInvoice);

        // Update Proforma status to Converted
        setProformaInvoices((prev) => prev.map((p) => (p.id === proformaId ? {
            ...p,
            status: 'Converted',
            convertedInvoiceId: newInvoice.id,
            convertedInvoiceNumber: newInvoice.invoiceNumber,
        } : p)));

        showToast(`Proforma ${pi.proformaNumber} converted to Draft Invoice ${newInvoice.invoiceNumber}!`);
        return newInvoice;
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
        const isService = item.itemKind === 'Service';
        const isSerial = item.trackingMode === 'Serial';
        const serials = Array.isArray(item.serialNumbers) ? item.serialNumbers : [];
        const calculatedQty = isService ? 0 : (isSerial ? serials.length : (item.availableQty ?? 10));
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
            trackingMode: isService ? 'None' : (item.trackingMode || 'Quantity'),
            serialNumbers: serials,
            batchNumber: item.batchNumber || undefined,
            lotNumber: item.lotNumber || undefined,
            manufactureDate: item.manufactureDate || undefined,
            expiryDate: item.expiryDate || undefined,
            taxRate: Number(item.taxRate !== undefined ? item.taxRate : 18),
            availableQty: calculatedQty,
            reservedQty: item.reservedQty ?? 0,
            reorderLevel: item.reorderLevel ?? 5,
            costPrice: item.costPrice ?? 50,
            sellingPrice: item.sellingPrice ?? 90,
            location: item.location || 'Main Central Warehouse',
            status: isService ? 'Optimal' : (calculatedQty <= (item.reorderLevel ?? 5) / 2 ? 'Critical' : calculatedQty <= (item.reorderLevel ?? 5) ? 'Low Stock' : 'Optimal'),
            customFieldValues: item.customFieldValues || {},
        };
        setItems((prev) => [newItem, ...prev]);
        // Record initial movement seed for physical items
        if (!isService && newItem.availableQty > 0) {
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
                serials: newItem.serialNumbers,
                notes: `Initial master catalog stock intake${newItem.batchNumber ? ` (Batch: ${newItem.batchNumber})` : ''}`,
            });
        }
        showToast(`SKU ${newItem.sku} added to Master.`);
        return newItem;
    };
    const updateInventoryItem = (id, updates) => {
        setItems((prev) => prev.map((item) => {
            if (item.id !== id && item.sku !== id)
                return item;
            const isService = updates.itemKind ? updates.itemKind === 'Service' : item.itemKind === 'Service';
            const isSerial = updates.trackingMode ? updates.trackingMode === 'Serial' : item.trackingMode === 'Serial';
            const serials = updates.serialNumbers !== undefined ? (Array.isArray(updates.serialNumbers) ? updates.serialNumbers : []) : (item.serialNumbers || []);
            const updatedAvailableQty = isService ? 0 : (isSerial ? serials.length : (updates.availableQty !== undefined ? updates.availableQty : item.availableQty));
            const reorderLvl = updates.reorderLevel !== undefined ? updates.reorderLevel : item.reorderLevel;
            const computedStatus = isService
                ? 'Optimal'
                : updatedAvailableQty <= reorderLvl / 2
                ? 'Critical'
                : updatedAvailableQty <= reorderLvl
                ? 'Low Stock'
                : 'Optimal';
            const updated = {
                ...item,
                ...updates,
                serialNumbers: serials,
                availableQty: updatedAvailableQty,
                status: computedStatus,
            };
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
    // ── ESTIMATES ACTIONS ──────────────────────────────────────────────
    const addEstimate = (est) => {
        const estAmount = est.amount ||
            (est.items ? est.items.reduce((acc, it) => acc + (it.amount || it.qty * it.rate), 0) : 0) || 5000;
        const defaultAddresses = resolvePartyAddresses(est.customerId, est.customer);
        const newEst = {
            id: est.id || `est-${Date.now()}`,
            estimateNumber: est.estimateNumber || `EST-2026-${String(estimates.length + 1).padStart(3, '0')}`,
            customerId: est.customerId,
            customer: est.customer || 'Acme Corp',
            billingAddress: createAddressSnapshot(est.billingAddress) || defaultAddresses.billing,
            shippingAddress: createAddressSnapshot(est.shippingAddress) || defaultAddresses.shipping,
            date: formatDateDDMMYYYY(est.date || 'Today'),
            validUntil: est.validUntil || '15 Days',
            amount: estAmount,
            status: est.status || 'Draft',
            items: est.items || [],
            notes: est.notes || 'Preliminary cost estimate',
        };
        setEstimates((prev) => [newEst, ...prev]);
        showToast(`Estimate ${newEst.estimateNumber} created.`);
        return newEst;
    };
    const updateEstimate = (id, updates) => {
        setEstimates((prev) => prev.map((e) => (e.id === id ? {
            ...e,
            ...updates,
            billingAddress: updates.billingAddress ? createAddressSnapshot(updates.billingAddress) : e.billingAddress,
            shippingAddress: updates.shippingAddress ? createAddressSnapshot(updates.shippingAddress) : e.shippingAddress,
        } : e)));
        showToast(`Estimate updated.`);
    };
    const deleteEstimate = (id) => {
        setEstimates((prev) => prev.filter((e) => e.id !== id));
        showToast(`Estimate deleted.`);
    };
    const convertEstimateToQuotation = (estimateId) => {
        const est = estimates.find((e) => e.id === estimateId);
        if (!est) return undefined;
        if (est.status === 'Converted') {
            showToast(`Estimate ${est.estimateNumber} has already been converted.`);
            return undefined;
        }
        setEstimates((prev) => prev.map((e) => (e.id === estimateId ? { ...e, status: 'Converted' } : e)));
        const newQuote = {
            customerId: est.customerId,
            customer: est.customer,
            billingAddress: createAddressSnapshot(est.billingAddress),
            shippingAddress: createAddressSnapshot(est.shippingAddress),
            date: getCurrentDateFormatted(),
            validUntil: 'In 30 days',
            amount: est.amount,
            status: 'Draft',
            items: est.items || [],
            sourceEstimateId: est.id,
            sourceEstimateNumber: est.estimateNumber,
            notes: `Converted from Estimate ${est.estimateNumber}. ${est.notes || ''}`,
        };
        const created = addQuotation(newQuote);
        showToast(`Estimate ${est.estimateNumber} converted to Quotation ${created.quoteNumber}!`);
        return created;
    };

    const addQuotation = (quote) => {
        const totalAmount = quote.amount ||
            (quote.items ? quote.items.reduce((acc, it) => acc + (it.amount || it.qty * it.rate), 0) : 0) || 5000;
        const defaultAddresses = resolvePartyAddresses(quote.customerId, quote.customer);
        const newQ = {
            id: quote.id || `q-${Date.now()}`,
            quoteNumber: quote.quoteNumber || `EST-2026-${String(quotations.length + 91).padStart(3, '0')}`,
            sourceEstimateId: quote.sourceEstimateId,
            sourceEstimateNumber: quote.sourceEstimateNumber,
            customerId: quote.customerId,
            customer: quote.customer || 'Acme Corp',
            billingAddress: createAddressSnapshot(quote.billingAddress) || defaultAddresses.billing,
            shippingAddress: createAddressSnapshot(quote.shippingAddress) || defaultAddresses.shipping,
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
        const orderItems = quote.items && quote.items.length > 0 ? quote.items.map((line, idx) => ({
            id: line.id || `item-${Date.now()}-${idx}`,
            itemId: line.itemId || '',
            sku: line.sku || line.itemSku || '',
            itemSku: line.sku || line.itemSku || '',
            name: line.name || line.description || `Deliverable Item ${idx + 1}`,
            description: line.name || line.description || `Deliverable Item ${idx + 1}`,
            orderedQty: Number(line.qty) || 1,
            qty: Number(line.qty) || 1,
            deliveredQty: 0,
            invoicedQty: 0,
            remainingQty: Number(line.qty) || 1,
            rate: Number(line.rate) || 0,
            discount: Number(line.discount) || 0,
            tax: Number(line.tax) || 18,
            amount: Number(line.amount) || ((Number(line.qty) || 1) * (Number(line.rate) || 0)),
        })) : [
            {
                id: `item-${Date.now()}`,
                description: `Deliverables per ${quote.quoteNumber}`,
                orderedQty: 1,
                qty: 1,
                deliveredQty: 0,
                invoicedQty: 0,
                remainingQty: 1,
                rate: quote.amount,
                amount: quote.amount,
            },
        ];
        const newOrder = {
            id: `so-${Date.now()}`,
            orderNumber: `SO-2026-${String(salesOrders.length + 101).padStart(4, '0')}`,
            quotationId: quote.id,
            quotationNumber: quote.quoteNumber,
            sourceQuotationId: quote.id,
            sourceQuotationNumber: quote.quoteNumber,
            sourceEstimateId: quote.sourceEstimateId,
            sourceEstimateNumber: quote.sourceEstimateNumber,
            customerId: quote.customerId,
            customer: quote.customer,
            billingAddress: createAddressSnapshot(quote.billingAddress),
            shippingAddress: createAddressSnapshot(quote.shippingAddress),
            date: getCurrentDateFormatted(),
            deliveryDate: 'In 14 days',
            amount: quote.amount,
            stage: 'Confirmed',
            status: 'Confirmed',
            paymentStatus: 'Unpaid',
            items: orderItems,
            lineItems: orderItems,
        };
        setSalesOrders((prev) => [newOrder, ...prev]);
        showToast(`Quote ${quote.quoteNumber} converted to Sales Order ${newOrder.orderNumber}!`);
        return newOrder;
    };
    const addSalesOrder = (order) => {
        const orderAmt = order.amount ||
            (order.items ? order.items.reduce((acc, it) => acc + (it.amount || it.qty * it.rate), 0) : 0) || 5000;
        const defaultAddresses = resolvePartyAddresses(order.customerId, order.customer);
        const formattedItems = (order.items || []).map((line, idx) => ({
            ...line,
            id: line.id || `item-${Date.now()}-${idx}`,
            orderedQty: Number(line.orderedQty ?? line.qty ?? 1),
            qty: Number(line.qty ?? line.orderedQty ?? 1),
            deliveredQty: Number(line.deliveredQty ?? 0),
            invoicedQty: Number(line.invoicedQty ?? 0),
            remainingQty: Math.max(0, Number(line.orderedQty ?? line.qty ?? 1) - Number(line.deliveredQty ?? 0)),
            rate: Number(line.rate ?? 0),
            amount: Number(line.amount ?? (Number(line.qty ?? 1) * Number(line.rate ?? 0))),
        }));
        const newOrder = {
            id: order.id || `so-${Date.now()}`,
            orderNumber: order.orderNumber ||
                `SO-2026-${String(salesOrders.length + 101).padStart(4, '0')}`,
            quotationId: order.quotationId,
            quotationNumber: order.quotationNumber,
            sourceQuotationId: order.sourceQuotationId || order.quotationId,
            sourceQuotationNumber: order.sourceQuotationNumber || order.quotationNumber,
            sourceEstimateId: order.sourceEstimateId,
            sourceEstimateNumber: order.sourceEstimateNumber,
            customerId: order.customerId,
            customer: order.customer || 'Acme Corp',
            billingAddress: createAddressSnapshot(order.billingAddress) || defaultAddresses.billing,
            shippingAddress: createAddressSnapshot(order.shippingAddress) || defaultAddresses.shipping,
            date: formatDateDDMMYYYY(order.date || 'Today'),
            deliveryDate: order.deliveryDate || 'In 10 days',
            amount: orderAmt,
            stage: order.stage || 'Draft',
            status: order.stage || 'Draft',
            paymentStatus: order.paymentStatus || 'Unpaid',
            items: formattedItems,
            lineItems: formattedItems,
            notes: order.notes || '',
        };
        setSalesOrders((prev) => [newOrder, ...prev]);
        showToast(`Sales Order ${newOrder.orderNumber} created.`);
        return newOrder;
    };
    const updateSalesOrderStage = (id, stage) => {
        setSalesOrders((prev) => prev.map((o) => (o.id === id ? { ...o, stage, status: stage } : o)));
    };
    const cancelSalesOrder = (orderId) => {
        const order = salesOrders.find((o) => o.id === orderId);
        if (!order) return { success: false, message: 'Order not found.' };
        if (order.stage === 'Cancelled' || order.status === 'Cancelled') {
            return { success: true, message: 'Already cancelled.' };
        }
        setSalesOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, stage: 'Cancelled', status: 'Cancelled' } : o)));
        showToast(`Sales Order ${order.orderNumber} cancelled.`);
        return { success: true, message: `Sales Order ${order.orderNumber} cancelled.` };
    };
    const convertSalesOrderToChallan = (orderId) => {
        const order = salesOrders.find((o) => o.id === orderId);
        if (!order)
            return undefined;
        if (order.stage === 'Cancelled') {
            showToast(`Cannot create Challan from Cancelled Sales Order.`);
            return undefined;
        }
        
        // Prepare line items for delivery (dispatch remaining quantities)
        const dispatchLines = (order.items || []).map((line) => {
            const ordQty = Number(line.orderedQty ?? line.qty ?? 1);
            const delQty = Number(line.deliveredQty ?? 0);
            const remQty = Math.max(0, ordQty - delQty);
            return {
                ...line,
                qty: remQty > 0 ? remQty : ordQty,
                dispatchedQty: remQty > 0 ? remQty : ordQty,
            };
        });

        const newChallan = {
            id: `dc-${Date.now()}`,
            challanNumber: `DC-2026-${String(deliveryChallans.length + 80).padStart(3, '0')}`,
            salesOrderId: order.id,
            salesOrderNumber: order.orderNumber,
            sourceSalesOrderId: order.id,
            sourceSalesOrderNumber: order.orderNumber,
            linkedSo: order.orderNumber,
            customerId: order.customerId,
            customer: order.customer,
            billingAddress: createAddressSnapshot(order.billingAddress),
            shippingAddress: createAddressSnapshot(order.shippingAddress),
            date: getCurrentDateFormatted(),
            dispatchDate: getCurrentDateFormatted(),
            transporter: 'FedEx Freight Direct',
            vehicleNo: 'TRK-8821-WA',
            status: 'In Transit',
            items: dispatchLines,
            lineItems: dispatchLines,
        };

        return addDeliveryChallan(newChallan);
    };
    const convertSalesOrderToInvoice = (orderId) => {
        const order = salesOrders.find((o) => o.id === orderId);
        if (!order)
            return undefined;
        if (order.stage === 'Cancelled') {
            showToast(`Cannot create Invoice from Cancelled Sales Order.`);
            return undefined;
        }
        
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
                qty: line.qty || line.orderedQty || 1,
                rate: line.rate || 0,
                discount: line.discount || line.discountPercent || 0,
                tax: line.tax !== undefined ? line.tax : (line.taxRate !== undefined ? line.taxRate : 18),
                amount: line.amount || (line.qty || 1) * (line.rate || 0),
            }))
            : [
                {
                    id: `item-${Date.now()}`,
                    description: `Fulfillment of ${order.orderNumber}`,
                    name: `Fulfillment of ${order.orderNumber}`,
                    qty: 1,
                    rate: order.amount ?? 1000,
                    discount: 0,
                    tax: 18,
                    amount: order.amount ?? 1000,
                },
            ];

        // Check if Delivery Challan exists for this SO
        const hasChallan = deliveryChallans.some((dc) => dc.salesOrderId === order.id || dc.salesOrderNumber === order.orderNumber || dc.linkedSo === order.orderNumber);

        const newInvoice = {
            id: `inv-${Date.now()}`,
            invoiceNumber: `INV-2026-${String(invoices.length + 101).padStart(3, '0')}`,
            salesOrderId: order.id,
            sourceSalesOrderId: order.id,
            customerId: order.customerId,
            customer: order.customer,
            billingAddress: createAddressSnapshot(order.billingAddress),
            shippingAddress: createAddressSnapshot(order.shippingAddress),
            linkedSo: order.orderNumber,
            date: getCurrentDateFormatted(),
            dueDate: '30 Days from now',
            status: 'Unpaid',
            items: itemsList,
            lineItems: itemsList,
            notes: `Tax invoice generated for Sales Order ${order.orderNumber}.`,
            dispatchedViaChallan: hasChallan,
        };

        const createdInvoice = createInvoice(newInvoice);

        // Update SO line items invoicedQty and stage
        setSalesOrders((prev) => prev.map((o) => {
            if (o.id !== orderId) return o;
            const updatedItems = (o.items || []).map((line) => ({
                ...line,
                invoicedQty: (line.invoicedQty || 0) + (Number(line.qty || line.orderedQty) || 1),
            }));
            return {
                ...o,
                stage: 'Invoiced',
                status: 'Invoiced',
                items: updatedItems,
                lineItems: updatedItems,
            };
        }));

        showToast(`Generated invoice ${createdInvoice.invoiceNumber} for ${order.orderNumber}`);
        return createdInvoice;
    };
    const addDeliveryChallan = (challan) => {
        const challanItems = challan.items || challan.lineItems || [];
        const defaultAddresses = resolvePartyAddresses(challan.customerId, challan.customer);
        const newChallan = {
            id: challan.id || `dc-${Date.now()}`,
            challanNumber: challan.challanNumber ||
                `DC-2026-${String(deliveryChallans.length + 80).padStart(3, '0')}`,
            salesOrderId: challan.salesOrderId,
            sourceSalesOrderId: challan.salesOrderId,
            salesOrderNumber: challan.salesOrderNumber || challan.linkedSo || 'SO-2026-0102',
            linkedSo: challan.salesOrderNumber || challan.linkedSo || 'SO-2026-0102',
            customerId: challan.customerId,
            customer: challan.customer || 'Acme Corp',
            billingAddress: createAddressSnapshot(challan.billingAddress) || defaultAddresses.billing,
            shippingAddress: createAddressSnapshot(challan.shippingAddress) || defaultAddresses.shipping,
            date: challan.date || 'Today',
            dispatchDate: challan.dispatchDate || 'Today',
            transporter: challan.transporter || 'FedEx Freight',
            vehicleNo: challan.vehicleNo || 'TRK-9041-WA',
            status: challan.status || 'In Transit',
            items: challanItems,
            lineItems: challanItems,
        };
        setDeliveryChallans((prev) => [newChallan, ...prev]);

        // Record SALE movement and handle serial numbers
        if (newChallan.items && newChallan.items.length > 0) {
            newChallan.items.forEach((line) => {
                const targetSku = line.sku || line.itemSku;
                const item = items.find((i) => i.id === line.itemId || (targetSku && i.sku?.toLowerCase() === targetSku.toLowerCase()));
                const dispatchQty = Number(line.qty || line.dispatchedQty) || 1;
                recordMovement({
                    itemId: item?.id || line.itemId || `itm-${Date.now()}`,
                    itemSku: item?.sku || targetSku || 'GEN-SKU',
                    itemName: item?.name || line.name || line.description,
                    type: 'SALE',
                    quantity: -dispatchQty,
                    unitCost: item?.costPrice || line.rate || 0,
                    referenceType: 'DeliveryChallan',
                    referenceId: newChallan.id,
                    referenceNumber: newChallan.challanNumber,
                    notes: `Dispatched to ${newChallan.customer} via ${newChallan.challanNumber}`,
                });

                // Serial numbers removal
                const serialsToDispatch = line.selectedSerials || line.serialNumbers || (line.serialNumber ? [line.serialNumber] : []);
                if (serialsToDispatch.length > 0 && item) {
                    removeSerialNumbers(item.id, serialsToDispatch);
                }
            });
        }

        // Update linked Sales Order line fulfillment (deliveredQty, remainingQty, stage)
        const linkedSoId = newChallan.salesOrderId;
        const linkedSoNum = newChallan.salesOrderNumber || newChallan.linkedSo;
        if (linkedSoId || linkedSoNum) {
            setSalesOrders((prev) => prev.map((order) => {
                if (order.id !== linkedSoId && order.orderNumber !== linkedSoNum) return order;

                let allDelivered = true;
                let anyDelivered = false;

                const updatedLines = (order.items || []).map((soLine) => {
                    const matchedChallanLine = newChallan.items.find((cl) => 
                        (cl.id && cl.id === soLine.id) ||
                        (cl.itemId && cl.itemId === soLine.itemId) ||
                        (cl.itemSku && cl.itemSku === soLine.itemSku) ||
                        (cl.sku && cl.sku === soLine.sku) ||
                        (cl.description && cl.description === soLine.description)
                    );

                    const dispatchedThisTime = matchedChallanLine ? Number(matchedChallanLine.qty || matchedChallanLine.dispatchedQty || 0) : 0;
                    const prevDelivered = Number(soLine.deliveredQty || 0);
                    const totalDelivered = prevDelivered + dispatchedThisTime;
                    const totalOrdered = Number(soLine.orderedQty ?? soLine.qty ?? 1);
                    const remaining = Math.max(0, totalOrdered - totalDelivered);

                    if (totalDelivered > 0) anyDelivered = true;
                    if (totalDelivered < totalOrdered) allDelivered = false;

                    return {
                        ...soLine,
                        deliveredQty: totalDelivered,
                        remainingQty: remaining,
                    };
                });

                const newStage = allDelivered ? 'Delivered' : anyDelivered ? 'Partially Dispatched' : order.stage;

                return {
                    ...order,
                    items: updatedLines,
                    lineItems: updatedLines,
                    stage: order.stage === 'Invoiced' ? 'Invoiced' : newStage,
                    status: order.stage === 'Invoiced' ? 'Invoiced' : newStage,
                };
            }));
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
    const cancelDeliveryChallan = (challanId) => {
        const challan = deliveryChallans.find((c) => c.id === challanId);
        if (!challan) return { success: false, message: 'Challan not found.' };
        if (challan.status === 'Cancelled') return { success: true, message: 'Already cancelled.' };

        // 1. Reverse stock movements and restore serial numbers
        if (challan.items && challan.items.length > 0) {
            challan.items.forEach((line) => {
                const targetSku = line.sku || line.itemSku;
                const item = items.find((i) => i.id === line.itemId || (targetSku && i.sku?.toLowerCase() === targetSku.toLowerCase()));
                const dispatchQty = Number(line.qty || line.dispatchedQty) || 1;
                recordMovement({
                    itemId: item?.id || line.itemId || `itm-${Date.now()}`,
                    itemSku: item?.sku || targetSku || 'GEN-SKU',
                    itemName: item?.name || line.name || line.description,
                    type: 'SALE_REVERSAL',
                    quantity: dispatchQty,
                    unitCost: item?.costPrice || line.rate || 0,
                    referenceType: 'DeliveryChallanCancellation',
                    referenceId: challan.id,
                    referenceNumber: challan.challanNumber,
                    notes: `Reversal on Delivery Challan ${challan.challanNumber} cancellation`,
                });

                // Restore serial numbers
                const serialsToRestore = line.selectedSerials || line.serialNumbers || (line.serialNumber ? [line.serialNumber] : []);
                if (serialsToRestore.length > 0 && item) {
                    addSerialNumbers(item.id, serialsToRestore);
                }
            });
        }

        // 2. Update linked Sales Order fulfillment lines
        const linkedSoId = challan.salesOrderId;
        const linkedSoNum = challan.salesOrderNumber || challan.linkedSo;
        if (linkedSoId || linkedSoNum) {
            setSalesOrders((prev) => prev.map((order) => {
                if (order.id !== linkedSoId && order.orderNumber !== linkedSoNum) return order;

                let anyDelivered = false;
                const updatedLines = (order.items || []).map((soLine) => {
                    const matchedChallanLine = (challan.items || []).find((cl) =>
                        (cl.id && cl.id === soLine.id) ||
                        (cl.itemId && cl.itemId === soLine.itemId) ||
                        (cl.itemSku && cl.itemSku === soLine.itemSku) ||
                        (cl.sku && cl.sku === soLine.sku) ||
                        (cl.description && cl.description === soLine.description)
                    );
                    const dispatchedThisTime = matchedChallanLine ? Number(matchedChallanLine.qty || matchedChallanLine.dispatchedQty || 0) : 0;
                    const prevDelivered = Number(soLine.deliveredQty || 0);
                    const totalDelivered = Math.max(0, prevDelivered - dispatchedThisTime);
                    const totalOrdered = Number(soLine.orderedQty ?? soLine.qty ?? 1);
                    const remaining = Math.max(0, totalOrdered - totalDelivered);

                    if (totalDelivered > 0) anyDelivered = true;

                    return {
                        ...soLine,
                        deliveredQty: totalDelivered,
                        remainingQty: remaining,
                    };
                });

                const newStage = anyDelivered ? 'Partially Dispatched' : 'Confirmed';

                return {
                    ...order,
                    items: updatedLines,
                    lineItems: updatedLines,
                    stage: order.stage === 'Invoiced' ? 'Invoiced' : newStage,
                    status: order.stage === 'Invoiced' ? 'Invoiced' : newStage,
                };
            }));
        }

        // 3. Mark Challan as Cancelled
        setDeliveryChallans((prev) => prev.map((c) => c.id === challanId ? { ...c, status: 'Cancelled' } : c));
        showToast(`Delivery Challan ${challan.challanNumber} cancelled and stock reversed.`);
        return { success: true, message: `Challan ${challan.challanNumber} cancelled.` };
    };
    const addPaymentIn = (pay) => {
        const payAmt = Number(pay.amount) || 0;
        if (payAmt <= 0) {
            showToast('Payment amount must be greater than zero.');
            return null;
        }

        let targetInv = null;
        if (pay.invoiceId || pay.invoiceNumber) {
            targetInv = invoices.find((i) => i.id === pay.invoiceId || i.invoiceNumber === pay.invoiceNumber);
            if (targetInv) {
                if (targetInv.status === 'Cancelled') {
                    showToast('Cannot record payment against a cancelled invoice.');
                    return null;
                }
                if (targetInv.status === 'Draft' || targetInv.finalized === false) {
                    showToast('Cannot record payment against a draft invoice. Please finalize the invoice first.');
                    return null;
                }
                if (targetInv.status === 'Paid' || (targetInv.balanceDue !== undefined && targetInv.balanceDue <= 0.01)) {
                    showToast('Invoice is already fully settled.');
                    return null;
                }
                const remainingBal = targetInv.balanceDue !== undefined ? targetInv.balanceDue : Math.max(0, targetInv.total - (targetInv.paidAmount || 0));
                if (payAmt > remainingBal + 0.01) {
                    showToast(`Payment amount (${formatCurrency(payAmt)}) exceeds remaining invoice balance (${formatCurrency(remainingBal)}).`);
                    return null;
                }
            }
        }

        const newPay = {
            id: pay.id || `pay-${Date.now()}`,
            receiptNumber: pay.receiptNumber ||
                `RCP-2026-${String(paymentIns.length + 90).padStart(3, '0')}`,
            customerId: pay.customerId || targetInv?.customerId,
            customer: pay.customer || targetInv?.customer || 'Acme Corp',
            invoiceId: pay.invoiceId || targetInv?.id,
            invoiceNumber: pay.invoiceNumber || targetInv?.invoiceNumber || 'INV-2026-001',
            date: pay.date || getCurrentDateFormatted(),
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
                    const derivedStatus = updatedPaid <= 0 ? (inv.status === 'Draft' ? 'Draft' : 'Unpaid') : isFull ? 'Paid' : 'Partially Paid';
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
        showToast(`Recorded receipt of ${formatCurrency(payAmt)} from ${newPay.customer}`);
        return newPay;
    };
    const addSalesReturn = (ret) => {
        const inv = invoices.find((i) => i.id === ret.invoiceId || i.invoiceNumber === ret.invoiceRef);
        if (inv) {
            if (inv.status === 'Cancelled') {
                showToast('Cannot create Sales Return against a cancelled invoice.');
                return null;
            }
            if (inv.status === 'Draft' || inv.finalized === false) {
                showToast('Cannot create Sales Return against a draft invoice. Please finalize the invoice first.');
                return null;
            }
        }

        // Find previously returned serials across all active returns for this invoice
        const previouslyReturnedSerials = salesReturns
            .filter((sr) => (sr.invoiceId === ret.invoiceId || sr.invoiceRef === ret.invoiceRef) && sr.status !== 'Cancelled')
            .flatMap((sr) => (sr.items || []).flatMap((it) => it.selectedSerials || []));

        const returnLines = (ret.items || ret.lineItems || []).map((line, idx) => {
            const invoicedQty = Number(line.invoicedQty ?? (inv?.items?.find((it) => (it.itemId && it.itemId === line.itemId) || (it.sku && it.sku === line.sku) || it.description === line.description)?.qty) ?? 1);
            
            // Calculate previously returned for this item on active returns
            const prevReturned = salesReturns
                .filter((sr) => (sr.invoiceId === ret.invoiceId || sr.invoiceRef === ret.invoiceRef) && sr.status !== 'Cancelled')
                .reduce((sum, sr) => {
                    const match = (sr.items || []).find((it) => (it.itemId && it.itemId === line.itemId) || (it.sku && it.sku === line.sku) || it.description === line.description);
                    return sum + Number(match?.qty || 0);
                }, 0);
            
            const returnableQty = Math.max(0, invoicedQty - prevReturned);
            const requestedQty = Math.max(0, Number(line.qty || 0));
            const qty = Math.min(requestedQty, returnableQty); // Over-return guard
            const condition = line.condition || ret.condition || 'Good';
            const rate = Number(line.rate || 0);
            const tax = Number(line.tax !== undefined ? line.tax : 18);
            const amount = Number(line.amount || Math.round(qty * rate * (1 + tax / 100) * 100) / 100);

            // Filter out serials that were already returned
            const validSerials = (line.selectedSerials || []).filter((s) => !previouslyReturnedSerials.includes(s));

            return {
                ...line,
                id: line.id || `sr-item-${Date.now()}-${idx}`,
                invoicedQty,
                previouslyReturnedQty: prevReturned,
                returnableQty,
                qty,
                condition,
                rate,
                tax,
                amount,
                selectedSerials: validSerials,
            };
        }).filter((l) => l.qty > 0);

        if (returnLines.length === 0) {
            showToast(`Cannot create return with 0 returnable quantity.`);
            return null;
        }

        const totalAmount = returnLines.reduce((sum, it) => sum + it.amount, 0);
        const defaultAddresses = resolvePartyAddresses(ret.customerId || inv?.customerId, ret.customer || inv?.customer);

        const newRet = {
            id: ret.id || `sr-${Date.now()}`,
            returnNumber: ret.returnNumber || `SR-2026-${String(salesReturns.length + 13).padStart(3, '0')}`,
            customerId: ret.customerId || inv?.customerId,
            customer: ret.customer || inv?.customer || 'Cyberdyne Systems',
            billingAddress: createAddressSnapshot(ret.billingAddress) || defaultAddresses.billing,
            shippingAddress: createAddressSnapshot(ret.shippingAddress) || defaultAddresses.shipping,
            invoiceId: ret.invoiceId || inv?.id,
            invoiceRef: ret.invoiceRef || inv?.invoiceNumber || 'INV-2026-002',
            date: ret.date || getCurrentDateFormatted(),
            amount: totalAmount,
            reason: ret.reason || 'Customer Return',
            restocked: ret.restocked ?? true,
            status: ret.status || 'Approved',
            items: returnLines,
            lineItems: returnLines,
        };

        setSalesReturns((prev) => [newRet, ...prev]);

        // Process inventory according to condition
        returnLines.forEach((line) => {
            const targetSku = line.sku || line.itemSku;
            const item = items.find((i) => i.id === line.itemId || (targetSku && i.sku?.toLowerCase() === targetSku.toLowerCase()));
            
            if (line.condition === 'Good' && newRet.restocked) {
                // Return to available inventory
                recordMovement({
                    itemId: item?.id || line.itemId || `itm-${Date.now()}`,
                    itemSku: item?.sku || targetSku || 'GEN-SKU',
                    itemName: item?.name || line.name || line.description,
                    type: 'SALES_RETURN',
                    quantity: line.qty,
                    unitCost: item?.costPrice || line.rate || 0,
                    referenceType: 'SalesReturn',
                    referenceId: newRet.id,
                    referenceNumber: newRet.returnNumber,
                    serials: line.selectedSerials,
                    notes: `Restocked (${line.condition}) per ${newRet.returnNumber}: ${newRet.reason}`,
                });

                // Restore serials if Good & restocked
                if (line.selectedSerials && line.selectedSerials.length > 0 && item) {
                    addSerialNumbers(item.id, line.selectedSerials);
                }
            } else {
                // Damaged or Scrap: Record quarantine return without increasing sellable stock
                recordMovement({
                    itemId: item?.id || line.itemId || `itm-${Date.now()}`,
                    itemSku: item?.sku || targetSku || 'GEN-SKU',
                    itemName: item?.name || line.name || line.description,
                    type: line.condition === 'Scrap' ? 'SCRAP_RETURN' : 'DAMAGED_RETURN',
                    quantity: 0, // Sellable stock unchanged
                    unitCost: item?.costPrice || line.rate || 0,
                    referenceType: 'SalesReturn',
                    referenceId: newRet.id,
                    referenceNumber: newRet.returnNumber,
                    serials: line.selectedSerials,
                    notes: `Quarantined/Inspection return (${line.condition}, Qty: ${line.qty}) per ${newRet.returnNumber}`,
                });
            }
        });

        // Reduce customer receivable balance
        if (newRet.customer) {
            setCustomers((prev) => prev.map((c) => c.name.toLowerCase() === newRet.customer?.toLowerCase() || (newRet.customerId && c.id === newRet.customerId)
                ? { ...c, balance: Math.max(0, c.balance - totalAmount) }
                : c));
        }

        // Auto-create Journal Entry (Sales Returns & Allowances / AR)
        const newJe = {
            id: `je-${Date.now()}`,
            entryNumber: `JE-2026-${String(journalEntries.length + 86).padStart(3, '0')}`,
            date: newRet.date,
            description: `Sales Return / Credit Note - ${newRet.customer}`,
            reference: newRet.returnNumber,
            debitAccount: '4090 - Sales Returns & Allowances',
            creditAccount: '1210 - Accounts Receivable',
            amount: totalAmount,
            status: 'Posted',
        };
        setJournalEntries((prev) => [newJe, ...prev]);
        showToast(`Credit Note ${newRet.returnNumber} issued for ${formatCurrency(totalAmount)}.`);
        return newRet;
    };

    const cancelSalesReturn = (returnId) => {
        const sr = salesReturns.find((r) => r.id === returnId);
        if (!sr) return { success: false, message: 'Return not found.' };
        if (sr.status === 'Cancelled') return { success: true, message: 'Already cancelled.' };

        // 1. Reverse inventory movements for Good/restocked items
        (sr.items || []).forEach((line) => {
            if (line.condition === 'Good' && sr.restocked) {
                const targetSku = line.sku || line.itemSku;
                const item = items.find((i) => i.id === line.itemId || (targetSku && i.sku?.toLowerCase() === targetSku.toLowerCase()));
                recordMovement({
                    itemId: item?.id || line.itemId || `itm-${Date.now()}`,
                    itemSku: item?.sku || targetSku || 'GEN-SKU',
                    itemName: item?.name || line.name || line.description,
                    type: 'RETURN_CANCELLATION',
                    quantity: -line.qty,
                    unitCost: item?.costPrice || line.rate || 0,
                    referenceType: 'SalesReturnCancellation',
                    referenceId: sr.id,
                    referenceNumber: sr.returnNumber,
                    notes: `Reversal of restock on Sales Return ${sr.returnNumber} cancellation`,
                });

                if (line.selectedSerials && line.selectedSerials.length > 0 && item) {
                    removeSerialNumbers(item.id, line.selectedSerials);
                }
            }
        });

        // 2. Reverse customer receivable balance adjustment
        if (sr.customer) {
            setCustomers((prev) => prev.map((c) => c.name.toLowerCase() === sr.customer.toLowerCase() || (sr.customerId && c.id === sr.customerId)
                ? { ...c, balance: c.balance + sr.amount }
                : c));
        }

        // 3. Reversal Journal Entry
        const jeReversal = {
            id: `je-${Date.now()}`,
            entryNumber: `JE-2026-${String(journalEntries.length + 87).padStart(3, '0')}`,
            date: getCurrentDateFormatted(),
            description: `Sales Return Cancellation Reversal - ${sr.returnNumber} (${sr.customer})`,
            reference: `REV-${sr.returnNumber}`,
            debitAccount: '1210 - Accounts Receivable',
            creditAccount: '4090 - Sales Returns & Allowances',
            amount: sr.amount,
            status: 'Posted',
        };
        setJournalEntries((prev) => [jeReversal, ...prev]);

        // 4. Mark status as Cancelled
        setSalesReturns((prev) => prev.map((r) => r.id === returnId ? { ...r, status: 'Cancelled' } : r));
        showToast(`Sales Return ${sr.returnNumber} cancelled.`);
        return { success: true, message: `Sales Return ${sr.returnNumber} cancelled.` };
    };
    const addPurchaseOrder = (po) => {
        const poLines = po.items || po.lineItems || [];
        const poAmt = po.amount ||
            (poLines.length > 0 ? poLines.reduce((acc, it) => acc + (it.amount || it.qty * it.rate), 0) : 0) || 2500;
        const defaultAddresses = resolveVendorPartyAddresses(po.vendorId, po.vendor);
        const newPo = {
            id: po.id || `po-${Date.now()}`,
            poNumber: po.poNumber ||
                `PO-2026-${String(purchaseOrders.length + 201).padStart(4, '0')}`,
            vendorId: po.vendorId,
            vendor: po.vendor || 'Arrow Electronics Supply',
            billingAddress: createAddressSnapshot(po.billingAddress) || defaultAddresses.billing,
            shippingAddress: createAddressSnapshot(po.shippingAddress) || defaultAddresses.shipping,
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
        const po = purchaseOrders.find((p) => p.id === id);
        if (!po) return;
        if (po.status === 'Cancelled' && status !== 'Cancelled') {
            showToast('Cannot modify a cancelled Purchase Order.');
            return;
        }
        setPurchaseOrders((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
        showToast(`PO updated to ${status}.`);
    };
    const getPoBilledStatus = (poId) => {
        const po = typeof poId === 'object' ? poId : purchaseOrders.find((p) => p.id === poId || p.poNumber === poId);
        if (!po) return { status: 'Draft', totalOrderedQty: 0, totalBilledQty: 0, totalRemainingQty: 0, lines: [], activeBills: [] };

        const activeBills = purchaseBills.filter((b) => (b.purchaseOrderId === po.id || b.poRef === po.poNumber || b.linkedPo === po.poNumber) && b.status !== 'Cancelled');
        const poLines = po.items || po.lineItems || [];

        let totalOrderedQty = 0;
        let totalBilledQty = 0;

        const lines = poLines.map((line) => {
            const orderedQty = Number(line.qty || 0);
            totalOrderedQty += orderedQty;
            const lineSku = line.sku || line.itemSku;
            const billedQty = activeBills.reduce((sum, bill) => {
                const match = (bill.items || bill.lineItems || []).find((it) => (line.itemId && it.itemId === line.itemId) || (lineSku && (it.sku === lineSku || it.itemSku === lineSku)));
                return sum + Number(match?.qty || 0);
            }, 0);
            totalBilledQty += billedQty;
            const remainingQty = Math.max(0, orderedQty - billedQty);
            return {
                ...line,
                orderedQty,
                billedQty,
                remainingQty,
            };
        });

        const totalRemainingQty = Math.max(0, totalOrderedQty - totalBilledQty);
        let dynamicStatus = po.status || 'Issued';
        if (po.status === 'Cancelled') {
            dynamicStatus = 'Cancelled';
        } else if (totalOrderedQty > 0 && totalBilledQty >= totalOrderedQty) {
            dynamicStatus = 'Billed';
        } else if (totalBilledQty > 0) {
            dynamicStatus = 'Partially Billed';
        }

        return {
            status: dynamicStatus,
            totalOrderedQty,
            totalBilledQty,
            totalRemainingQty,
            lines,
            activeBills,
        };
    };
    const cancelPurchaseOrder = (poId) => {
        const po = purchaseOrders.find((p) => p.id === poId);
        if (!po) return { success: false, message: 'Purchase Order not found.' };
        if (po.status === 'Cancelled') return { success: true, message: 'Already cancelled.' };

        const activeBill = purchaseBills.find((b) => (b.purchaseOrderId === poId || b.poRef === po.poNumber || b.linkedPo === po.poNumber) && b.status !== 'Cancelled');
        if (activeBill) {
            showToast(`Cannot cancel PO: active Bill ${activeBill.billNumber} exists. Cancel the bill first.`);
            return { success: false, message: `Active bill ${activeBill.billNumber} exists.` };
        }

        setPurchaseOrders((prev) => prev.map((p) => p.id === poId ? { ...p, status: 'Cancelled' } : p));
        showToast(`Purchase Order ${po.poNumber} cancelled.`);
        return { success: true, message: `Purchase Order ${po.poNumber} cancelled.` };
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
        if (po.status === 'Cancelled') {
            showToast('Cannot convert a cancelled Purchase Order.');
            return undefined;
        }
        
        const poStatusInfo = getPoBilledStatus(po.id);
        if (poStatusInfo.totalRemainingQty <= 0 && poStatusInfo.totalOrderedQty > 0) {
            showToast(`Purchase Order ${po.poNumber} is already fully billed.`);
            return poStatusInfo.activeBills[0];
        }

        // Bill only remaining quantities
        const billLines = poStatusInfo.lines
            .filter((l) => l.remainingQty > 0)
            .map((l) => ({
                ...l,
                qty: l.remainingQty,
                amount: Math.round(l.remainingQty * (l.rate || 0) * 100) / 100,
            }));

        const billAmt = billLines.reduce((sum, it) => sum + (it.amount || it.qty * (it.rate || 0)), 0) || (po.amount ?? 5000);
        const defaultAddresses = resolveVendorPartyAddresses(po.vendorId, po.vendor);
        const newBill = {
            id: `pb-${Date.now()}`,
            billNumber: `PB-2026-${String(purchaseBills.length + 16).padStart(3, '0')}`,
            purchaseOrderId: po.id,
            poRef: po.poNumber,
            linkedPo: po.poNumber,
            vendorId: po.vendorId,
            vendor: po.vendor,
            billingAddress: createAddressSnapshot(po.billingAddress) || defaultAddresses.billing,
            shippingAddress: createAddressSnapshot(po.shippingAddress) || defaultAddresses.shipping,
            billDate: getCurrentDateFormatted(),
            date: getCurrentDateFormatted(),
            dueDate: '30 Days from now',
            amount: billAmt,
            total: billAmt,
            paidAmount: 0,
            amountPaid: 0,
            balanceDue: billAmt,
            status: 'Unpaid',
            goodsReceived: true,
            items: billLines,
            lineItems: billLines,
        };
        setPurchaseBills((prev) => [newBill, ...prev]);

        // Update PO status to Partially Billed or Billed
        const willBeFullyBilled = poStatusInfo.totalRemainingQty <= billLines.reduce((s, it) => s + it.qty, 0);
        setPurchaseOrders((prev) => prev.map((p) => p.id === poId ? { ...p, status: willBeFullyBilled ? 'Billed' : 'Partially Billed' } : p));

        // Increase vendor AP liability across vendors and parties
        syncVendorBalance(po.vendorId, po.vendor, billAmt);
        // Auto-create Journal Entry (Inventory Asset / Accounts Payable)
        const newJe = {
            id: `je-${Date.now()}`,
            entryNumber: `JE-2026-${String(journalEntries.length + 87).padStart(3, '0')}`,
            date: getCurrentDateFormatted(),
            description: `Purchase Bill Intake - ${po.vendor} (${po.poNumber})`,
            reference: newBill.billNumber,
            debitAccount: '1410 - Inventory Asset',
            creditAccount: '2010 - Accounts Payable',
            amount: billAmt,
            status: 'Posted',
        };
        setJournalEntries((prev) => [newJe, ...prev]);
        // Automatically receive inventory from line items (increases stock and registers serials)
        if (billLines.length > 0) {
            billLines.forEach((line) => {
                const targetSku = line.sku || line.itemSku;
                const item = items.find((i) => i.id === line.itemId || (targetSku && i.sku?.toLowerCase() === targetSku.toLowerCase()));
                if (item && item.trackingMode === 'Serial') {
                    const serials = line.selectedSerials || line.serialNumbers || (line.serialNumber ? [line.serialNumber] : []);
                    if (serials.length > 0) {
                        addSerialNumbers(item.id, serials);
                    }
                }
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
                    serials: line.selectedSerials || line.serialNumbers || (line.serialNumber ? [line.serialNumber] : []),
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
        const defaultAddresses = resolveVendorPartyAddresses(bill.vendorId, bill.vendor);
        const newBill = {
            id: bill.id || `pb-${Date.now()}`,
            billNumber: bill.billNumber ||
                `PB-2026-${String(purchaseBills.length + 16).padStart(3, '0')}`,
            purchaseOrderId: bill.purchaseOrderId,
            poRef: bill.poRef || 'PO-2026-0210',
            linkedPo: bill.linkedPo || bill.poRef || 'PO-2026-0210',
            vendorId: bill.vendorId,
            vendor: bill.vendor || 'Cisco Systems Direct',
            billingAddress: createAddressSnapshot(bill.billingAddress) || defaultAddresses.billing,
            shippingAddress: createAddressSnapshot(bill.shippingAddress) || defaultAddresses.shipping,
            billDate: bill.billDate || getCurrentDateFormatted(),
            date: bill.date || getCurrentDateFormatted(),
            dueDate: bill.dueDate || '30 Days from now',
            amount: billAmt,
            total: billAmt,
            paidAmount: bill.paidAmount || bill.amountPaid || 0,
            amountPaid: bill.amountPaid || bill.paidAmount || 0,
            balanceDue: Math.max(0, billAmt - (bill.paidAmount || bill.amountPaid || 0)),
            status: bill.status || 'Unpaid',
            goodsReceived: true,
            items: billLines,
            lineItems: billLines,
            notes: bill.notes || '',
        };
        setPurchaseBills((prev) => [newBill, ...prev]);

        // If linked to a PO, update PO status to Partially Billed or Billed
        if (newBill.purchaseOrderId || newBill.poRef || newBill.linkedPo) {
            const targetPo = purchaseOrders.find((p) => p.id === newBill.purchaseOrderId || p.poNumber === newBill.poRef || p.poNumber === newBill.linkedPo);
            if (targetPo && targetPo.status !== 'Cancelled') {
                const poStatusInfo = getPoBilledStatus(targetPo.id);
                const currentBilledQty = poStatusInfo.totalBilledQty + billLines.reduce((s, it) => s + Number(it.qty || 0), 0);
                const isFullyBilled = poStatusInfo.totalOrderedQty > 0 && currentBilledQty >= poStatusInfo.totalOrderedQty;
                setPurchaseOrders((prev) => prev.map((p) => p.id === targetPo.id ? { ...p, status: isFullyBilled ? 'Billed' : 'Partially Billed' } : p));
            }
        }

        // Increase vendor AP liability across vendors and parties
        syncVendorBalance(newBill.vendorId, newBill.vendor, billAmt);
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
        // Auto-record PURCHASE movements for items (increases stock and registers serials)
        if (billLines.length > 0) {
            billLines.forEach((line) => {
                const targetSku = line.sku || line.itemSku;
                const item = items.find((i) => i.id === line.itemId || (targetSku && i.sku?.toLowerCase() === targetSku.toLowerCase()));
                if (item && item.trackingMode === 'Serial') {
                    const serials = line.selectedSerials || line.serialNumbers || (line.serialNumber ? [line.serialNumber] : []);
                    if (serials.length > 0) {
                        addSerialNumbers(item.id, serials);
                    }
                }
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
                    serials: line.selectedSerials || line.serialNumbers || (line.serialNumber ? [line.serialNumber] : []),
                    notes: `Goods intake via ${newBill.billNumber}`,
                });
            });
        }
        showToast(`Vendor Bill ${newBill.billNumber} recorded.`);
        return newBill;
    };
    const cancelPurchaseBill = (billId) => {
        const bill = purchaseBills.find((b) => b.id === billId);
        if (!bill) return { success: false, reason: 'not_found', message: 'Bill not found.' };
        if (bill.status === 'Cancelled') return { success: true, message: 'Already cancelled.' };

        const paid = Number(bill.paidAmount || bill.amountPaid || 0);
        if (paid > 0) {
            showToast(`Cannot cancel bill with recorded disbursements (${formatCurrency(paid)}). Please reverse payments first.`);
            return {
                success: false,
                reason: 'has_payments',
                message: `Cannot cancel bill with recorded disbursements (${formatCurrency(paid)}). Please reverse payments first.`,
            };
        }

        // Reverse inventory movements and deregister serials if goods were received
        if (bill.goodsReceived !== false && bill.items && bill.items.length > 0) {
            bill.items.forEach((line) => {
                const targetSku = line.sku || line.itemSku;
                const item = items.find((i) => i.id === line.itemId || (targetSku && i.sku?.toLowerCase() === targetSku.toLowerCase()));
                const revQty = Number(line.qty) || 1;
                if (item && item.trackingMode === 'Serial') {
                    const serials = line.selectedSerials || line.serialNumbers || (line.serialNumber ? [line.serialNumber] : []);
                    if (serials.length > 0) {
                        removeSerialNumbers(item.id, serials);
                    }
                }
                recordMovement({
                    itemId: item?.id || line.itemId || `itm-${Date.now()}`,
                    itemSku: item?.sku || targetSku || 'GEN-SKU',
                    itemName: item?.name || line.name || line.description,
                    type: 'PURCHASE_REVERSAL',
                    quantity: -revQty,
                    unitCost: line.rate || item?.costPrice || 0,
                    referenceType: 'PurchaseBillCancellation',
                    referenceId: bill.id,
                    referenceNumber: bill.billNumber,
                    serials: line.selectedSerials || line.serialNumbers || (line.serialNumber ? [line.serialNumber] : []),
                    notes: `Stock reversal on Purchase Bill ${bill.billNumber} cancellation`,
                });
            });
        }

        // Reverse vendor AP liability across vendors and parties
        syncVendorBalance(bill.vendorId, bill.vendor, -(bill.total || bill.amount || 0));

        // Auto-create Journal Entry reversal
        const jeReversal = {
            id: `je-${Date.now()}`,
            entryNumber: `JE-2026-${String(journalEntries.length + 88).padStart(3, '0')}`,
            date: getCurrentDateFormatted(),
            description: `Purchase Bill Cancellation Reversal - ${bill.billNumber} (${bill.vendor})`,
            reference: `REV-${bill.billNumber}`,
            debitAccount: '2010 - Accounts Payable',
            creditAccount: '1410 - Inventory Asset',
            amount: bill.total || bill.amount || 0,
            status: 'Posted',
        };
        setJournalEntries((prev) => [jeReversal, ...prev]);

        // Re-evaluate linked PO status
        if (bill.purchaseOrderId || bill.poRef || bill.linkedPo) {
            const targetPo = purchaseOrders.find((po) => po.id === bill.purchaseOrderId || po.poNumber === bill.poRef || po.poNumber === bill.linkedPo);
            if (targetPo && targetPo.status !== 'Cancelled') {
                const remainingActiveBills = purchaseBills.filter((b) => b.id !== billId && (b.purchaseOrderId === targetPo.id || b.poRef === targetPo.poNumber || b.linkedPo === targetPo.poNumber) && b.status !== 'Cancelled');
                const poLines = targetPo.items || targetPo.lineItems || [];
                const totalOrdered = poLines.reduce((s, it) => s + Number(it.qty || 0), 0);
                const totalBilled = poLines.reduce((sum, line) => {
                    const lSku = line.sku || line.itemSku;
                    const bQty = remainingActiveBills.reduce((bsum, b) => {
                        const m = (b.items || []).find((it) => (line.itemId && it.itemId === line.itemId) || (lSku && (it.sku === lSku || it.itemSku === lSku)));
                        return bsum + Number(m?.qty || 0);
                    }, 0);
                    return sum + bQty;
                }, 0);

                let newPoStatus = 'Issued';
                if (totalOrdered > 0 && totalBilled >= totalOrdered) {
                    newPoStatus = 'Billed';
                } else if (totalBilled > 0) {
                    newPoStatus = 'Partially Billed';
                }
                setPurchaseOrders((prev) => prev.map((p) => p.id === targetPo.id ? { ...p, status: newPoStatus } : p));
            }
        }

        setPurchaseBills((prev) => prev.map((b) => b.id === billId ? { ...b, status: 'Cancelled' } : b));
        showToast(`Purchase Bill ${bill.billNumber} cancelled.`);
        return { success: true, message: `Purchase Bill ${bill.billNumber} cancelled.` };
    };
    const receivePurchaseBillGoods = (billId) => {
        const bill = purchaseBills.find((b) => b.id === billId);
        if (!bill)
            return;
        if (bill.goodsReceived) {
            showToast('Goods have already been received for this bill.');
            return;
        }
        if (bill.status === 'Cancelled') {
            showToast('Cannot receive goods for a cancelled bill.');
            return;
        }
        const billLines = bill.items || bill.lineItems || [];
        if (billLines.length > 0) {
            billLines.forEach((line) => {
                const targetSku = line.sku || line.itemSku;
                const item = items.find((i) => i.id === line.itemId || (targetSku && i.sku?.toLowerCase() === targetSku.toLowerCase()));
                if (item && item.trackingMode === 'Serial') {
                    const serials = line.selectedSerials || line.serialNumbers || (line.serialNumber ? [line.serialNumber] : []);
                    if (serials.length > 0) {
                        addSerialNumbers(item.id, serials);
                    }
                }
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
                    serials: line.selectedSerials || line.serialNumbers || (line.serialNumber ? [line.serialNumber] : []),
                    notes: `Manual goods receipt for bill ${bill.billNumber}`,
                });
            });
            setPurchaseBills((prev) => prev.map((b) => b.id === billId ? { ...b, goodsReceived: true } : b));
            showToast(`Stock received and added to inventory from bill ${bill.billNumber}`);
        }
    };
    const updatePurchaseBillStatus = (id, status) => {
        setPurchaseBills((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
        showToast(`Vendor bill marked as ${status}.`);
    };
    const addPaymentOut = (pay) => {
        const payAmt = Number(pay.amount) || 1000;
        let targetBill = null;
        if (pay.billId || pay.billNumber) {
            targetBill = purchaseBills.find((b) => (pay.billId && b.id === pay.billId) || (pay.billNumber && b.billNumber === pay.billNumber));
            if (targetBill) {
                if (targetBill.status === 'Cancelled') {
                    showToast('Cannot record payment against a cancelled bill.');
                    return null;
                }
                if (targetBill.status === 'Paid' || (targetBill.balanceDue !== undefined && targetBill.balanceDue <= 0.01)) {
                    showToast('Bill is already fully settled.');
                    return null;
                }
                const remainingBal = targetBill.balanceDue !== undefined ? targetBill.balanceDue : Math.max(0, (targetBill.total || targetBill.amount || 0) - (targetBill.paidAmount || targetBill.amountPaid || 0));
                if (payAmt > remainingBal + 0.01) {
                    showToast(`Disbursement amount (${formatCurrency(payAmt)}) exceeds remaining bill balance (${formatCurrency(remainingBal)}).`);
                    return null;
                }
            }
        }

        const newPay = {
            id: pay.id || `pout-${Date.now()}`,
            voucherNumber: pay.voucherNumber ||
                `VOU-2026-${String(paymentOuts.length + 93).padStart(3, '0')}`,
            vendorId: pay.vendorId || targetBill?.vendorId,
            vendor: pay.vendor || targetBill?.vendor || 'Arrow Electronics Supply',
            billId: pay.billId || targetBill?.id,
            billNumber: pay.billNumber || targetBill?.billNumber || 'PB-2026-015',
            date: pay.date || getCurrentDateFormatted(),
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
        // Decrease vendor balance liability across vendors and parties
        syncVendorBalance(newPay.vendorId, newPay.vendor, -payAmt);
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
        showToast(`Disbursed ${formatCurrency(payAmt)} to ${newPay.vendor}`);
        return newPay;
    };
    const addPurchaseReturn = (ret) => {
        const bill = purchaseBills.find((b) => b.id === ret.billId || b.billNumber === ret.billRef);
        if (bill && bill.status === 'Cancelled') {
            showToast('Cannot create Purchase Return against a cancelled bill.');
            return null;
        }

        // Calculate line items with validation against previous returns
        const prevReturns = purchaseReturns.filter((pr) => (pr.billId === ret.billId || pr.billRef === ret.billRef) && pr.status !== 'Cancelled');
        
        let returnLines = [];
        if (ret.items && ret.items.length > 0) {
            returnLines = ret.items.map((line, idx) => {
                const billedQty = Number(line.billedQty ?? (bill?.items?.find((it) => (it.itemId && it.itemId === line.itemId) || (it.sku && it.sku === line.sku))?.qty) ?? line.qty ?? 1);
                const prevReturned = prevReturns.reduce((sum, pr) => {
                    const match = (pr.items || []).find((it) => (it.itemId && it.itemId === line.itemId) || (it.sku && it.sku === line.sku));
                    return sum + Number(match?.qty || 0);
                }, 0);
                const returnableQty = Math.max(0, billedQty - prevReturned);
                const requestedQty = Math.max(0, Number(line.qty || 0));
                const qty = Math.min(requestedQty, returnableQty);
                const condition = line.condition || ret.condition || 'Good';
                const rate = Number(line.rate || 0);
                const amount = Number(line.amount || Math.round(qty * rate * 100) / 100);

                return {
                    ...line,
                    id: line.id || `prt-item-${Date.now()}-${idx}`,
                    billedQty,
                    previouslyReturnedQty: prevReturned,
                    returnableQty,
                    qty,
                    condition,
                    rate,
                    amount,
                };
            }).filter((l) => l.qty > 0);
        }

        const calculatedTotal = returnLines.reduce((sum, it) => sum + it.amount, 0);
        const retAmt = calculatedTotal > 0 ? calculatedTotal : (ret.amount ?? 500);
        const defaultAddresses = resolveVendorPartyAddresses(ret.vendorId || bill?.vendorId, ret.vendor || bill?.vendor);

        const newDebit = {
            id: ret.id || `prt-${Date.now()}`,
            debitNoteNumber: ret.debitNoteNumber ||
                `DN-2026-${String(purchaseReturns.length + 10).padStart(3, '0')}`,
            vendorId: ret.vendorId || bill?.vendorId,
            vendor: ret.vendor || bill?.vendor || 'Delta Controls & Hydraulics',
            billingAddress: createAddressSnapshot(ret.billingAddress) || defaultAddresses.billing,
            shippingAddress: createAddressSnapshot(ret.shippingAddress) || defaultAddresses.shipping,
            billId: ret.billId || bill?.id,
            billRef: ret.billRef || bill?.billNumber || 'PB-2026-015',
            date: ret.date || getCurrentDateFormatted(),
            amount: retAmt,
            reason: ret.reason || 'Damaged goods on intake inspection',
            status: ret.status || 'Pending Credit',
            items: returnLines.length > 0 ? returnLines : (ret.items || []),
        };
        setPurchaseReturns((prev) => [newDebit, ...prev]);

        // Record movements: Good condition removes sellable inventory; Damaged/Scrap recorded without affecting sellable
        if (newDebit.items && newDebit.items.length > 0) {
            newDebit.items.forEach((line) => {
                const targetSku = line.sku || line.itemSku;
                const item = items.find((i) => i.id === line.itemId || (targetSku && i.sku?.toLowerCase() === targetSku.toLowerCase()));
                const isGood = line.condition === 'Good';
                if (isGood && item && item.trackingMode === 'Serial') {
                    const serials = line.selectedSerials || line.serialNumbers || (line.serialNumber ? [line.serialNumber] : []);
                    if (serials.length > 0) {
                        removeSerialNumbers(item.id, serials);
                    }
                }
                recordMovement({
                    itemId: item?.id || line.itemId || `itm-${Date.now()}`,
                    itemSku: item?.sku || targetSku || 'GEN-SKU',
                    itemName: item?.name || line.name || line.description,
                    type: isGood ? 'PURCHASE_RETURN' : (line.condition === 'Scrap' ? 'SCRAP_RETURN' : 'DAMAGED_RETURN'),
                    quantity: isGood ? -(line.qty || 1) : 0,
                    unitCost: item?.costPrice || line.rate || 0,
                    referenceType: 'PurchaseReturn',
                    referenceId: newDebit.id,
                    referenceNumber: newDebit.debitNoteNumber,
                    serials: line.selectedSerials || line.serialNumbers || (line.serialNumber ? [line.serialNumber] : []),
                    notes: `Returned to ${newDebit.vendor} (${line.condition || 'Good'}): ${newDebit.reason}`,
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
        // Reduce vendor liability balance across vendors and parties
        syncVendorBalance(newDebit.vendorId, newDebit.vendor, -retAmt);
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
    const cancelPurchaseReturn = (returnId) => {
        const pr = purchaseReturns.find((r) => r.id === returnId);
        if (!pr) return { success: false, message: 'Return not found.' };
        if (pr.status === 'Cancelled') return { success: true, message: 'Already cancelled.' };

        // 1. Reverse inventory movements for Good condition items (restore stock & serials)
        (pr.items || []).forEach((line) => {
            if (line.condition === 'Good') {
                const targetSku = line.sku || line.itemSku;
                const item = items.find((i) => i.id === line.itemId || (targetSku && i.sku?.toLowerCase() === targetSku.toLowerCase()));
                if (item && item.trackingMode === 'Serial') {
                    const serials = line.selectedSerials || line.serialNumbers || (line.serialNumber ? [line.serialNumber] : []);
                    if (serials.length > 0) {
                        addSerialNumbers(item.id, serials);
                    }
                }
                recordMovement({
                    itemId: item?.id || line.itemId || `itm-${Date.now()}`,
                    itemSku: item?.sku || targetSku || 'GEN-SKU',
                    itemName: item?.name || line.name || line.description,
                    type: 'PURCHASE_REVERSAL',
                    quantity: Number(line.qty) || 1,
                    unitCost: item?.costPrice || line.rate || 0,
                    referenceType: 'PurchaseReturnCancellation',
                    referenceId: pr.id,
                    referenceNumber: pr.debitNoteNumber,
                    serials: line.selectedSerials || line.serialNumbers || (line.serialNumber ? [line.serialNumber] : []),
                    notes: `Reversal of return on Debit Note ${pr.debitNoteNumber} cancellation`,
                });
            }
        });

        // 2. Reverse vendor AP reduction across vendors and parties
        syncVendorBalance(pr.vendorId, pr.vendor, pr.amount);

        // 3. Reversal Journal Entry
        const jeReversal = {
            id: `je-${Date.now()}`,
            entryNumber: `JE-2026-${String(journalEntries.length + 90).padStart(3, '0')}`,
            date: getCurrentDateFormatted(),
            description: `Purchase Return Cancellation Reversal - ${pr.debitNoteNumber} (${pr.vendor})`,
            reference: `REV-${pr.debitNoteNumber}`,
            debitAccount: '1410 - Inventory Asset',
            creditAccount: '2010 - Accounts Payable',
            amount: pr.amount,
            status: 'Posted',
        };
        setJournalEntries((prev) => [jeReversal, ...prev]);

        // 4. Mark status as Cancelled
        setPurchaseReturns((prev) => prev.map((r) => r.id === returnId ? { ...r, status: 'Cancelled' } : r));
        showToast(`Debit Note ${pr.debitNoteNumber} cancelled.`);
        return { success: true, message: `Debit Note ${pr.debitNoteNumber} cancelled.` };
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
    const addWarrantyCard = (cardData) => {
        const nextNum = `WC-2026-${String(warranties.length + 100).padStart(5, '0')}`;
        const newCard = {
            id: cardData.id || `wc-${Date.now()}`,
            cardNumber: cardData.cardNumber || nextNum,
            createdAt: new Date().toISOString().split('T')[0],
            generatedAt: cardData.documentStatus === 'Generated' ? new Date().toISOString().split('T')[0] : undefined,
            documentStatus: cardData.documentStatus || 'Generated',
            ...cardData,
        };
        // Compute coverage status dynamically if not set
        if (!newCard.coverageStatus || newCard.coverageStatus === 'Active' || newCard.coverageStatus === 'Pending Activation') {
            newCard.coverageStatus = calculateWarrantyCoverageStatus(newCard.startDate, newCard.expiryDate, newCard.documentStatus);
        }
        setWarranties((prev) => [newCard, ...prev]);
        showToast(`Warranty Card ${newCard.cardNumber} saved.`);
        return newCard;
    };

    const updateWarrantyCard = (id, updates) => {
        setWarranties((prev) => prev.map((w) => {
            if (w.id !== id && w.cardNumber !== id) return w;
            const updated = { ...w, ...updates };
            if (updates.startDate || updates.expiryDate || updates.documentStatus) {
                updated.coverageStatus = calculateWarrantyCoverageStatus(
                    updated.startDate,
                    updated.expiryDate,
                    updated.documentStatus || w.documentStatus
                );
            }
            return updated;
        }));
        showToast('Warranty Card updated successfully.');
    };

    const cancelWarrantyCard = (id) => {
        setWarranties((prev) => prev.map((w) => {
            if (w.id !== id && w.cardNumber !== id) return w;
            return {
                ...w,
                documentStatus: 'Cancelled',
                coverageStatus: 'Cancelled',
            };
        }));
        showToast('Warranty Card marked as Cancelled.');
    };

    const getWarrantyByChallanId = (challanId) => {
        return warranties.find((w) => (w.deliveryChallanId === challanId || w.challanNumber === challanId) && w.documentStatus !== 'Cancelled');
    };

    const getWarrantyBySerial = (serialNumber) => {
        if (!serialNumber) return null;
        const sNorm = String(serialNumber).trim().toLowerCase();
        return warranties.find((w) => {
            if (w.documentStatus === 'Cancelled') return false;
            const matchesItem = (w.items || []).some((it) => {
                if (Array.isArray(it.serialNumbers) && it.serialNumbers.some((s) => String(s).trim().toLowerCase() === sNorm)) return true;
                if (it.serialNumber && String(it.serialNumber).trim().toLowerCase() === sNorm) return true;
                if (it.components && it.components.some((c) => c.serialNumber && String(c.serialNumber).trim().toLowerCase() === sNorm)) return true;
                return false;
            });
            return matchesItem;
        });
    };

    return (<ERPContext.Provider value={{
            warranties,
            addWarrantyCard,
            updateWarrantyCard,
            cancelWarrantyCard,
            getWarrantyByChallanId,
            getWarrantyBySerial,
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
            estimates,
            addEstimate,
            updateEstimate,
            deleteEstimate,
            convertEstimateToQuotation,
            quotations,
            salesOrders,
            proformaInvoices,
            addProformaInvoice,
            updateProformaInvoice,
            updateProformaInvoiceStatus,
            convertProformaToInvoice,
            deleteProformaInvoice,
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
            createAddressSnapshot,
            resolvePartyAddresses,
            resolveVendorPartyAddresses,
            syncVendorBalance,
            createInvoice,
            updateDraftInvoice,
            finalizeInvoice,
            cancelSalesInvoice,
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
            cancelSalesOrder,
            convertSalesOrderToInvoice,
            convertSalesOrderToChallan,
            addDeliveryChallan,
            updateDeliveryChallanStatus,
            cancelDeliveryChallan,
            addPaymentIn,
            addSalesReturn,
            cancelSalesReturn,
            addPurchaseOrder,
            updatePurchaseOrderStatus,
            cancelPurchaseOrder,
            deletePurchaseOrder,
            getPoBilledStatus,
            convertPurchaseOrderToBill,
            addPurchaseBill,
            cancelPurchaseBill,
            updatePurchaseBillStatus,
            receivePurchaseBillGoods,
            addPaymentOut,
            addPurchaseReturn,
            cancelPurchaseReturn,
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
