// Shared helpers for printed documents: the letterhead and bank block come
// from the tenant's company profile and bank accounts, never hardcoded data.

export const companyInitial = (name) => (String(name || '').trim().charAt(0) || '').toUpperCase();

// The account to print on invoices: the one the company profile names, else
// the default bank account, else the first active one with an account number.
// Null when none is set up.
export const pickPrintBankAccount = (bankAccounts, preferredId) => {
    const banks = (bankAccounts || []).filter((a) => a && a.accountNumber && a.isActive !== false && (!a.type || a.type === 'Bank'));
    return (preferredId && banks.find((a) => String(a.id) === String(preferredId)))
        || banks.find((a) => a.isDefault) || banks[0] || null;
};

export const joinNonEmpty = (parts, sep = ' • ') => (parts || []).filter(Boolean).join(sep);

// A party address ({ line1/street, line2, city, state, pincode }) as printable
// lines, skipping whatever is blank.
export const addressLines = (addr) => {
    if (!addr) return [];
    if (typeof addr === 'string') return addr.trim() ? [addr.trim()] : [];
    const cityLine = joinNonEmpty([addr.city, addr.state], ', ');
    return [
        addr.line1 || addr.street,
        addr.line2,
        joinNonEmpty([cityLine, addr.pincode], ' - '),
    ].filter(Boolean);
};
