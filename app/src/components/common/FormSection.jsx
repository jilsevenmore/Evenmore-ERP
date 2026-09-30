// Form section heading for the sales forms, styled after the reference
// letterpad (documents/sewen letter pad.pdf): numbered, spaced small caps and a
// short blue gradient accent bar.
export const FormSection = ({ number, title, hint }) => (
    <div className="pt-2">
        <p className="font-mono text-[10px] tracking-[0.2em] text-blue-700 dark:text-blue-300 uppercase">
            {number ? `${number} · ` : ''}{title}
        </p>
        <div className="h-1 w-12 mt-1.5 rounded-full bg-gradient-to-r from-[#1F3A6E] to-[#29A8E0]" />
        {hint && <p className="text-[11px] text-slate-500 mt-1.5">{hint}</p>}
    </div>
);
