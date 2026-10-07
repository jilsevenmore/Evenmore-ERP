import { companyInitial, joinNonEmpty } from './printLetterhead';

// The printed letterpad for sales documents, laid out after the reference
// letterpad (documents/sewen letter pad.pdf): logo top-left, a short blue
// gradient accent bar, and a thin-rule footer carrying the contact line in
// small spaced type. Every value comes from the tenant's own company profile
// (Settings → Company Profile) — nothing is hardcoded.

const companyNameOf = (company) => company?.name || company?.tradeName || company?.legalName || '';

const addressOf = (company) => {
    const address = company?.address;
    if (!address) return '';
    if (typeof address === 'string') return address;
    return [address.line1, address.line2, address.city, address.state, address.pincode].filter(Boolean).join(', ');
};

export const LetterpadAccent = ({ className = '' }) => (
    <div className={`h-1 w-16 rounded-full bg-gradient-to-r from-[#1F3A6E] to-[#29A8E0] ${className}`} />
);

/** The left half of a document header: logo / name, address, tax ids, contact. */
export const LetterpadBrand = ({ company, contactLabel = '' }) => {
    const name = companyNameOf(company);
    const taxLine = joinNonEmpty([company?.gstin && `GSTIN: ${company.gstin}`, company?.pan && `PAN: ${company.pan}`]);
    const contactLine = joinNonEmpty([company?.phone, company?.email, company?.website], ' | ');
    const address = addressOf(company);
    return (
        <div className="space-y-1">
            {company?.logo ? (
                <img src={company.logo} alt={name} className="h-14 max-w-[220px] object-contain object-left" />
            ) : name && (
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1F3A6E] to-[#29A8E0] text-white flex items-center justify-center font-bold text-lg font-mono">
                        {companyInitial(name)}
                    </div>
                    <h1 className="text-xl font-extrabold text-[#1F2E4A] tracking-tight uppercase">{name}</h1>
                </div>
            )}
            {company?.logo && name && (
                <p className="text-sm font-extrabold text-[#1F2E4A] tracking-tight uppercase">{name}</p>
            )}
            <LetterpadAccent className="mt-1.5" />
            <div className="text-[11px] text-slate-500 space-y-0.5 pt-1.5">
                {address && <p>{address}</p>}
                {taxLine && <p>{taxLine}</p>}
                {contactLine && <p>{contactLabel ? `${contactLabel}: ` : ''}{contactLine}</p>}
            </div>
        </div>
    );
};

/** Thin-rule footer: address · website · email · phone, in small spaced type. */
export const LetterpadFooter = ({ company, note = '' }) => {
    const line = joinNonEmpty([addressOf(company), company?.website, company?.email, company?.phone], ' · ');
    if (!line && !note) return null;
    return (
        <div className="pt-3 mt-2 border-t border-slate-200 text-center space-y-0.5">
            {line && <p className="font-mono text-[9px] tracking-[0.12em] text-slate-400">{line}</p>}
            {note && <p className="font-mono text-[9px] tracking-[0.12em] text-slate-400 uppercase">{note}</p>}
        </div>
    );
};

/** The top-right document label, e.g. "QUOTATION · QT-2026-0001", spaced like the reference. */
export const LetterpadDocLabel = ({ children }) => (
    <p className="font-mono text-[10px] tracking-[0.25em] text-slate-400 uppercase">{children}</p>
);
