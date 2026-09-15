/**
 * Evenmore ERP — Statutory & Format Validation Utilities
 */

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
 * Validates Standard Email Address
 */
export const validateEmail = (email) => {
  if (!email) return { isValid: false, message: 'Email address is required' };
  const clean = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clean)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  return { isValid: true, cleanValue: clean };
};

/**
 * Validates 10-Digit Mobile Phone Number
 */
export const validatePhone = (phone) => {
  if (!phone) return { isValid: false, message: 'Phone number is required' };
  const clean = phone.replace(/[^0-9+]/g, '');
  if (clean.length < 10 || clean.length > 13) {
    return { isValid: false, message: 'Phone number must be 10-12 digits' };
  }
  return { isValid: true, cleanValue: clean };
};

/**
 * Validates 6-Digit Indian Pincode
 */
export const validatePincode = (pincode) => {
  if (!pincode) return { isValid: false, message: 'Postal Pincode is required' };
  const clean = String(pincode).trim();
  const pinRegex = /^[1-9][0-9]{5}$/;
  if (!pinRegex.test(clean)) {
    return { isValid: false, message: 'Pincode must be 6 digits (e.g. 560100)' };
  }
  return { isValid: true, cleanValue: clean };
};
