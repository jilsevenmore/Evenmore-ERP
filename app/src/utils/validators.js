/**
 * Evenmore ERP — Statutory & Format Validation Utilities
 */
import { sheetAutoDescription } from './salesLineMetal';


/**
 * Validates Indian 15-character GSTIN format
 * Format: 2 digits (State) + 5 letters (PAN) + 4 digits (PAN) + 1 letter (PAN) + 1 digit/letter (Entity) + 'Z' + 1 checksum
 * Example: 29AABCU8912E1ZB
 */
export const validateGSTIN = (gstin) => {
  if (!gstin) return { isValid: false, message: 'GSTIN is required' };
  const clean = gstin.trim().toUpperCase();
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(clean)) {
    return { isValid: false, message: 'Invalid GSTIN format (e.g. 29AABCU8912E1ZB)' };
  }
  return { isValid: true, cleanValue: clean };
};

/**
 * Validates Indian 10-character PAN format
 * Format: 5 letters + 4 digits + 1 letter
 * Example: AABCU8912E
 */
export const validatePAN = (pan) => {
  if (!pan) return { isValid: false, message: 'PAN is required' };
  const clean = pan.trim().toUpperCase();
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(clean)) {
    return { isValid: false, message: 'Invalid PAN format (e.g. AABCU8912E)' };
  }
  return { isValid: true, cleanValue: clean };
};

/**
 * Validates Indian 11-character IFSC Code
 * Format: 4 letters + 0 + 6 alphanumeric
 * Example: HDFC0001245
 */
export const validateIFSC = (ifsc) => {
  if (!ifsc) return { isValid: false, message: 'IFSC is required' };
  const clean = ifsc.trim().toUpperCase();
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifscRegex.test(clean)) {
    return { isValid: false, message: 'Invalid IFSC format (e.g. HDFC0001245)' };
  }
  return { isValid: true, cleanValue: clean };
};

/**
 * Validates Bank Account Number
 * Bank account numbers are numeric strings between 9 and 18 digits.
 * @param {string|number} accountNo
 * @param {boolean} required
 */
export const validateAccountNumber = (accountNo, required = false) => {
  if (!accountNo || !String(accountNo).trim()) {
    if (required) return { isValid: false, message: 'Bank account number is required' };
    return { isValid: true, cleanValue: '' };
  }
  const clean = String(accountNo).trim().replace(/[\s-]/g, '');
  const accRegex = /^\d{9,18}$/;
  if (!accRegex.test(clean)) {
    return { isValid: false, message: 'Bank account number must be between 9 and 18 digits' };
  }
  return { isValid: true, cleanValue: clean };
};

/**
 * Validates Standard Email Address
 * @param {string} email
 * @param {boolean} required
 */
export const validateEmail = (email, required = false) => {
  if (!email || !String(email).trim()) {
    if (required) return { isValid: false, message: 'Email address is required' };
    return { isValid: true, cleanValue: '' };
  }
  const clean = String(email).trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(clean)) {
    return { isValid: false, message: 'Please enter a valid email address (e.g. name@example.com)' };
  }
  return { isValid: true, cleanValue: clean };
};

/**
 * Validates Mobile or Phone Number
 * Allowed characters: digits, spaces, hyphens, parentheses, optional leading +
 * Must contain between 10 and 15 digits.
 * @param {string} phone
 * @param {boolean} required
 */
export const validatePhone = (phone, required = false) => {
  if (!phone || !String(phone).trim() || String(phone).trim() === '+91') {
    if (required) return { isValid: false, message: 'Phone number is required' };
    return { isValid: true, cleanValue: '' };
  }
  const raw = String(phone).trim();
  const allowedRegex = /^\+?[0-9\s\-()]+$/;
  if (!allowedRegex.test(raw)) {
    return { isValid: false, message: "Phone number can only contain digits, spaces, hyphens, and optional leading '+'" };
  }
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    return { isValid: false, message: 'Phone number must contain between 10 and 15 digits' };
  }
  return { isValid: true, cleanValue: raw };
};

/**
 * Validates 6-Digit Indian Pincode
 * @param {string|number} pincode
 * @param {boolean} required
 */
export const validatePincode = (pincode, required = false) => {
  if (!pincode || !String(pincode).trim()) {
    if (required) return { isValid: false, message: 'Postal Pincode is required' };
    return { isValid: true, cleanValue: '' };
  }
  const clean = String(pincode).trim();
  const pinRegex = /^[1-9][0-9]{5}$/;
  if (!pinRegex.test(clean)) {
    return { isValid: false, message: 'Pincode must be a 6-digit number (e.g. 560100)' };
  }
  return { isValid: true, cleanValue: clean };
};

/**
 * Validates Address Dictionary (including embedded pincode)
 * @param {object} address
 * @param {object} options
 */
export const validateAddress = (address, { requiredPincode = false } = {}) => {
  if (!address || typeof address !== 'object') {
    return { isValid: true, cleanValue: address };
  }
  const pincode = address.pincode || address.pin_code || address.postal_code;
  if (pincode || requiredPincode) {
    const pinRes = validatePincode(pincode, requiredPincode);
    if (!pinRes.isValid) return pinRes;
  }
  return { isValid: true, cleanValue: address };
};

/**
 * Validates that line items contain at least one valid selected product / line item
 * (either linked to an inventory item, or with a custom item name / description or metal spec)
 * @param {Array} items
 * @param {string} docType
 */
export const validateLineProducts = (items = [], docType = 'document') => {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      isValid: false,
      message: `Please select at least one product before generating the ${docType}.`,
      validItems: [],
    };
  }

  const validItems = items
    .map((it) => {
      if (!it) return null;
      if (!it.itemId && !String(it.description || it.name || '').trim() && it.sheetSpec && sheetAutoDescription(it.sheetSpec) && Number(it.rate)) {
        return { ...it, description: sheetAutoDescription(it.sheetSpec) };
      }
      return it;
    })
    .filter((it) => it && (Boolean(it.itemId) || Boolean(String(it.description || it.name || '').trim()) || (it.sheetSpec && sheetAutoDescription(it.sheetSpec))));

  if (validItems.length === 0) {
    return {
      isValid: false,
      message: `Please select at least one product before generating the ${docType}.`,
      validItems: [],
    };
  }

  const unnamedIdx = validItems.findIndex((it) => !it.itemId && !String(it.description || it.name || '').trim());
  if (unnamedIdx !== -1) {
    return {
      isValid: false,
      message: `Line ${unnamedIdx + 1} needs a product name or description (or select an inventory item).`,
      validItems,
    };
  }

  return { isValid: true, message: '', validItems };
};
