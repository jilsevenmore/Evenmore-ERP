/**
 * @typedef {'Customer' | 'Vendor' | 'Both'} PartyType
 */

/**
 * @typedef {'Registered Business' | 'Unregistered Business' | 'Consumer' | 'Overseas' | 'SEZ' | 'Deemed Export'} GstTreatment
 */

/**
 * @typedef {Object} PartyContact
 * @property {string} id
 * @property {string} name
 * @property {string} role
 * @property {string} phone
 * @property {string} email
 */

/**
 * @typedef {Object} PartyAddress
 * @property {string} line1
 * @property {string} [line2]
 * @property {string} city
 * @property {string} state
 * @property {string} pincode
 */

/**
 * @typedef {Object} Party
 * @property {string} id
 * @property {string} code
 * @property {PartyType} type
 * @property {string} name
 * @property {string} phone
 * @property {string} email
 * @property {GstTreatment} gstTreatment
 * @property {string} [gstin]
 * @property {string} [placeOfSupply]
 * @property {string} [gstNotes]
 * @property {boolean} tdsApplicable
 * @property {string} [tdsSection]
 * @property {number} [tdsRate]
 * @property {boolean} tcsApplicable
 * @property {number} [tcsRate]
 * @property {string} ledgerAccount
 * @property {number} [creditLimit]
 * @property {string} [paymentTerms]
 * @property {string} [bankAccountNumber]
 * @property {string} [ifscCode]
 * @property {string} [bankName]
 * @property {string} [accountHolderName]
 * @property {number} openingBalance
 * @property {number} balance
 * @property {PartyAddress} billingAddress
 * @property {PartyAddress} shippingAddress
 * @property {PartyContact[]} contacts
 * @property {'Active' | 'On Hold' | 'Inactive'} status
 */

/**
 * @typedef {Object} UnitOfMeasure
 * @property {string} id
 * @property {string} code
 * @property {string} label
 */

/**
 * @typedef {Object} CategoryPart
 * @property {string} id
 * @property {string} categoryId
 * @property {string} itemId
 * @property {number} defaultQty
 */

/**
 * @typedef {Object} ItemPart
 * @property {string} id
 * @property {string} parentItemId - The machine InventoryItem.id
 * @property {string} partItemId - Existing Stock/InventoryItem.id used as a component
 * @property {number} requiredQty - Required quantity for ONE machine
 */

/**
 * @typedef {'Quantity' | 'Serial'} TrackingMode
 */

/**
 * @typedef {'Machine' | 'Part' | 'Standalone'} ItemKind
 */

/**
 * @typedef {'mm' | 'cm' | 'm' | 'in'} DimensionUnit
 */

/**
 * @typedef {Object} DocumentLineItem
 * @property {string} id
 * @property {string} itemId - InventoryItem.id
 * @property {string} sku - denormalized for display/search convenience
 * @property {string} [itemSku] - alias for SKU
 * @property {string} name - denormalized for display convenience
 * @property {string} [description] - alias for item name / description
 * @property {number} qty
 * @property {number} rate
 * @property {number} amount - qty * rate, computed on add/edit
 * @property {number} [discount] - discount percentage (0-100)
 * @property {number} [tax] - tax percentage (0-100)
 * @property {boolean} [isBomGenerated]
 * @property {string} [bomSourceItemId]
 * @property {boolean} [isUserModified]
 * @property {string} [parentLineId]
 * @property {boolean} [isBomPart]
 * @property {string} [parentSku]
 */

/**
 * @typedef {Object} CategoryCustomField
 * @property {string} id
 * @property {string} name
 * @property {'text' | 'number' | 'dropdown' | 'boolean'} type
 * @property {string[]} [options] - only for 'dropdown'
 */

/**
 * @typedef {Object} InventoryItem
 * @property {string} id
 * @property {string} sku
 * @property {string} name
 * @property {string} category
 * @property {string} [categoryId]
 * @property {ItemKind} [itemKind] - 'Machine' | 'Part' | 'Standalone'
 * @property {string} [vendor]
 * @property {string} [description]
 * @property {string} uom
 * @property {number} availableQty
 * @property {number} reservedQty
 * @property {number} reorderLevel
 * @property {number} costPrice
 * @property {number} sellingPrice
 * @property {string} location
 * @property {'Optimal' | 'Low Stock' | 'Critical'} status
 * @property {'Active' | 'Draft' | 'Archived'} [lifecycleStatus]
 * @property {Record<string, string | number | boolean>} [customFieldValues]
 * @property {string} [purchaseUnit]
 * @property {string} [salesUnit]
 * @property {number} [unitConversionFactor]
 * @property {TrackingMode} [trackingMode]
 * @property {string[]} [serialNumbers]
 * @property {boolean} [hasSheetSpec] - true when the part carries a physical sheet size
 * @property {number} [sheetHeight] - height / thickness of one piece, in sheetHeightUnit
 * @property {DimensionUnit} [sheetHeightUnit]
 * @property {number} [sheetWidth] - width of one piece, in sheetWidthUnit
 * @property {DimensionUnit} [sheetWidthUnit]
 * @property {number} [sheetLength] - length of one piece, in sheetLengthUnit
 * @property {DimensionUnit} [sheetLengthUnit]
 * @property {number} [sheetWeightKg] - weight of one piece, always kilograms
 * @property {DimensionUnit} [dimensionUnit] - legacy: single unit for all three axes,
 *   still read as a fallback on records saved before per-axis units
 */

/**
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} name
 * @property {string} code
 * @property {number} [itemCount]
 * @property {number} [itemsCount]
 * @property {number} [totalValuation]
 * @property {number} leadTimeDays
 * @property {string} [description]
 * @property {boolean} [hasSubParts]
 * @property {CategoryCustomField[]} [customFields]
 */

/**
 * @typedef {Object} PurchaseOrder
 * @property {string} id
 * @property {string} poNumber
 * @property {string} [vendorId]
 * @property {string} vendor
 * @property {string} date
 * @property {string} [expectedDate]
 * @property {number} amount
 * @property {number} [total]
 * @property {string} status
 * @property {DocumentLineItem[]} lineItems
 * @property {DocumentLineItem[]} [items]
 * @property {string} [notes]
 */

/**
 * @typedef {Object} PurchaseBill
 * @property {string} id
 * @property {string} billNumber
 * @property {string} [purchaseOrderId]
 * @property {string} [linkedPo]
 * @property {string} [poRef]
 * @property {string} [vendorId]
 * @property {string} vendor
 * @property {string} [billDate]
 * @property {string} [date]
 * @property {string} [dueDate]
 * @property {number} amount
 * @property {number} [total]
 * @property {number} [amountPaid]
 * @property {number} [paidAmount]
 * @property {string} status
 * @property {DocumentLineItem[]} lineItems
 * @property {DocumentLineItem[]} [items]
 */

/**
 * @typedef {Object} Quotation
 * @property {string} id
 * @property {string} quoteNumber
 * @property {string} [customerId]
 * @property {string} customer
 * @property {string} date
 * @property {string} [validUntil]
 * @property {number} amount
 * @property {number} [total]
 * @property {string} status
 * @property {DocumentLineItem[]} lineItems
 * @property {DocumentLineItem[]} [items]
 */

/**
 * @typedef {Object} SalesOrder
 * @property {string} id
 * @property {string} orderNumber
 * @property {string} [quotationId]
 * @property {string} [quotationNumber]
 * @property {string} [customerId]
 * @property {string} customer
 * @property {string} date
 * @property {string} [deliveryDate]
 * @property {number} amount
 * @property {number} [total]
 * @property {string} stage
 * @property {string} status
 * @property {string} paymentStatus
 * @property {DocumentLineItem[]} lineItems
 * @property {DocumentLineItem[]} [items]
 */

export {};


