import { useState } from "react";
import { X, Download, BookOpen } from "lucide-react";
import { guideImageUrl } from "../../../utils/guideImageUrl";

const LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "gu", label: "ગુજરાતી" },
];

const GUIDES = {
  en: {
    title: "How to Create Lead Stage Tasks",
    subtitle: "Use this guide to create tasks for all lead stages with clear descriptions.",
    steps: [
      "Open the Lead Stage Tasks page and choose the pipeline.",
      "Expand the Task Roles section to see the task library, and use its \"+ Add Task\" button to create a new task type. It joins the library only — it does not enter any stage on its own.",
      "Choose a stage such as New Lead, Details Collected, Quotation Shared, Demo Pending, Demo Done, Negotiation, Won, or Lost.",
      "Click \"+ Add Task\" inside that stage, pick the task from the library, choose the lead stage, and confirm. Only now does the task appear in that stage.",
      "For New Lead, add a task like \"Call\" with a description such as \"Initial call to understand requirement and qualify the lead.\" For Details Collected, add \"Send email\" to share the brochure and confirm the collected details.",
      "Set Order, Required, Auto Create, Max Repeats, and Due In Days on the stage task, then click Save.",
      "Repeat this for all stages. The saved tasks appear under each stage and auto-create when a lead moves into that stage.",
    ],
  },
  hi: {
    title: "लीड स्टेज टास्क कैसे बनाएं",
    subtitle: "हर लीड स्टेज में टास्क map करने के लिए ये स्टेप अपनाएं।",
    steps: [
      "Lead Stage Tasks पेज पर Pipeline चुनें.",
      "Task Roles सेक्शन expand करके task library देखें, फिर \"+ Add Task\" पर क्लिक करके नया task बनाएं. यह सिर्फ library में जुड़ता है, किसी stage में अपने आप नहीं.",
      "New Lead, Details Collected, Quotation Shared, Demo Pending जैसे stage पर क्लिक करके स्टेज खोलें.",
      "स्टेज में \"+ Add Task\" पर क्लिक करें, library से task चुनें, stage चुनें और Create दबाएं. तभी वह task उस stage में दिखेगा.",
      "Create या Save पर क्लिक करें। टास्क उस स्टेज के नीचे दिखेगा और लीड के स्टेज में आते ही auto-create होगा।",
    ],
  },
  gu: {
    title: "લીડ સ્ટેજ ટાસ્ક કેવી રીતે બનાવવું",
    subtitle: "દરેક લીડ સ્ટેજમાં ટાસ્ક map કરવા માટે આ સ્ટેપ અનુસરો.",
    steps: [
      "Lead Stage Tasks પેજ પર Pipeline પસંદ કરો.",
      "Task Roles સેક્શન expand કરીને task library જુઓ, પછી \"+ Add Task\" પર ક્લિક કરીને નવો task બનાવો. તે ફક્ત library માં જોડાય છે, કોઈ stage માં આપોઆપ નહીં.",
      "New Lead, Details Collected, Quotation Shared, Demo Pending જેવા stage પર ક્લિક કરીને સ્ટેજ ખોલો.",
      "સ્ટેજ માં \"+ Add Task\" પર ક્લિક કરો, library માંથી task પસંદ કરો, stage પસંદ કરો અને Create દબાવો. ત્યાર બાદ જ તે task એ stage માં દેખાશે.",
      "Create અથવા Save પર ક્લિક કરો. ટાસ્ક તે સ્ટેજ નીચે દેખાશે અને લીડ સ્ટેજમાં આવે ત્યારે auto-create થશે.",
    ],
  },
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const STEP_IMAGES = {
  0: "stage-1.png",
  1: "stage-2.png",
  2: "stage-3.png",
  3: "stage-4.png",
  4: "stage-5.png",
};

function downloadGuidePdf(lang) {
  const guide = GUIDES[lang] || GUIDES.en;
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return;
  const items = guide.steps
    .map((step, i) => {
      const img = STEP_IMAGES[i] ? `<br /><img src="${guideImageUrl(STEP_IMAGES[i])}" style="width:100%;border:1px solid #e2e8f0;border-radius:10px;margin-top:8px;" />` : "";
      return `<li><strong>Step ${i + 1}:</strong> ${escapeHtml(step)}${img}</li>`;
    })
    .join("");
  const today = new Date().toLocaleDateString("en-GB");
  printWindow.document.write(
    `<!doctype html><html><head><title>${escapeHtml(guide.title)}</title><style>body{font-family:Arial,Nirmala UI,Noto Sans Gujarati,sans-serif;color:#172033;padding:40px;max-width:760px;margin:0 auto}h1{font-size:24px;margin:0 0 6px}p.sub{color:#64748b;margin:0 0 20px;font-size:14px}ol{padding-left:20px}li{font-size:14px;line-height:1.7;margin-bottom:10px}.foot{margin-top:28px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8}</style></head><body><h1>${escapeHtml(guide.title)}</h1><p class="sub">${escapeHtml(guide.subtitle)} | Evenmore CRM</p><ol>${items}</ol><p class="foot">Generated on ${today} | Evenmore CRM - Stage Task Guide</p></body></html>`
  );
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 350);
}

export default function StageTasksGuideModal({ isOpen, onClose }) {
  const [lang, setLang] = useState("en");
  if (!isOpen) return null;
  const guide = GUIDES[lang] || GUIDES.en;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-slate-950/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="How to create lead stage tasks guide"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen size={18} />
            </span>
            <div>
              <h2 className="text-[15px] font-bold text-slate-800">How to create lead stage tasks?</h2>
              <p className="text-[11px] text-slate-500">Stage-wise guide with descriptions</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto">
          <div className="flex gap-2">
            {LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLang(l.code)}
                className={
                  lang === l.code ? "btn-primary flex-1" : "btn-outline flex-1"
                }
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="mt-4 border border-slate-200 rounded-xl p-4 bg-slate-50/60">
            <p className="text-sm font-bold text-slate-800">{guide.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{guide.subtitle}</p>
            <ol className="mt-3 space-y-3.5">
              {guide.steps.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-[#1f6bff] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    {step}
                    {STEP_IMAGES[i] && (
                      <img
                        src={guideImageUrl(STEP_IMAGES[i])}
                        alt={`Demo step ${i + 1}`}
                        className="mt-2 w-full rounded-lg border border-slate-200 shadow-sm"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="btn-outline"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => downloadGuidePdf(lang)}
            className="btn-primary flex items-center gap-1.5"
          >
            <Download size={15} /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
