import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRecruitmentStore } from "../../../stores/recruitmentStore";
import { useAppStore } from "../../../stores/appStore";
import { Button } from "../../../components/hrms/Button";
import { StatusBadge } from "../../../components/hrms/StatusBadge";
import { ArrowLeft, FileText, CheckCircle } from "lucide-react";
import OfferLetterModal from "../organization/OfferLetterModal";

export default function CandidateDetails() {
  const { id } = useParams();
  const candidates = useRecruitmentStore((s) => s.candidates);
  const interviews = useRecruitmentStore((s) => s.interviews);
  const offers = useRecruitmentStore((s) => s.offers || []);
  const addOffer = useRecruitmentStore((s) => s.addOffer);
  const updateOffer = useRecruitmentStore((s) => s.updateOffer);
  const changeStage = useRecruitmentStore((s) => s.changeStage);
  const showToast = useAppStore((s) => s.showToast);
  const navigate = useNavigate();

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [activeOffer, setActiveOffer] = useState(null);

  const c = candidates.find((x) => x.id === id);
  if (!c) return <div className="py-10 text-center">Candidate not found <Button variant="secondary" onClick={() => navigate("/hrms/recruitment/candidates")}>Back</Button></div>;
  const history = interviews.filter((i) => i.candidateId === c.id);

  const openOfferLetter = () => {
    const existing = offers.find((o) => o.candidateId === c.id);
    if (existing) {
      setActiveOffer(existing);
    } else {
      let dept = "Engineering";
      const pos = (c.position || "").toLowerCase();
      if (pos.includes("design") || pos.includes("ui")) dept = "Design";
      else if (pos.includes("hr") || pos.includes("people")) dept = "HR";
      else if (pos.includes("finance")) dept = "Finance";
      else if (pos.includes("marketing")) dept = "Sales & Marketing";

      setActiveOffer({
        id: `OFF-${Math.floor(100 + Math.random() * 900)}`,
        candidateId: c.id,
        candidateName: c.name,
        email: c.email,
        position: c.position,
        jobType: "Full-time",
        dept,
        salary: "$95,000 / annum",
        location: c.location || "New York HQ",
        workMode: "Hybrid",
        sentDate: new Date().toISOString().split("T")[0],
        joiningDate: new Date(Date.now() + 21 * 86400000).toISOString().split("T")[0],
        reportingManager: "David Park (CTO)",
        probationPeriod: "3 Months",
        status: "Pending",
      });
    }
    setIsOfferModalOpen(true);
  };

  const handleConfirmOffer = (offerData) => {
    addOffer(offerData);
    changeStage(c.id, "Offer");
    showToast(`Offer letter confirmed and generated for ${c.name}`);
  };

  const handleUpdateOffer = (offerData) => {
    updateOffer(offerData.id, offerData);
    showToast(`Offer letter updated for ${c.name}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate-500 hover:text-navy transition w-fit cursor-pointer group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to Candidates</span>
      </button>

      <div className="bg-white border border-bdr rounded-xl p-5 shadow-sm flex flex-wrap gap-4 items-center">
        <img src={c.avatar} alt="" className="w-14 h-14 rounded-full" />
        <div>
          <div className="font-bold text-[18px]">{c.name}</div>
          <div className="text-[13px] text-muted">
            {c.position} • {c.stage} • <StatusBadge status={c.stage === "Hired" ? "Active" : c.stage === "Rejected" ? "Cancelled" : c.stage} />
          </div>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <select
            value={c.stage}
            onChange={(e) => {
              const newStage = e.target.value;
              changeStage(c.id, newStage);
              showToast("Stage changed to " + newStage);
              if (newStage === "Offer") {
                openOfferLetter();
              }
            }}
            className="h-9 px-3 bg-off border border-bdr rounded-xl text-[13px]"
          >
            <option>Applied</option>
            <option>Screening</option>
            <option>Interview</option>
            <option>Shortlisted</option>
            <option>Offer</option>
            <option>Hired</option>
            <option>Rejected</option>
          </select>
          <Button size="sm" onClick={() => navigate("/hrms/recruitment/interviews")}>Schedule Interview</Button>
          <Button size="sm" variant="secondary" onClick={() => {
            changeStage(c.id, "Shortlisted");
            showToast("Shortlisted");
          }}>Shortlist</Button>
          <Button size="sm" variant="secondary" onClick={openOfferLetter}>
            <FileText size={14} className="inline mr-1" />
            {c.stage === "Offer" || c.stage === "Hired" ? "View Offer Letter" : "Generate Offer Letter"}
          </Button>
          <Button size="sm" variant="danger" onClick={() => {
            changeStage(c.id, "Rejected");
            showToast("Rejected");
          }}>Reject</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border border-bdr rounded-xl p-5 shadow-sm"><h3 className="font-semibold">Personal Information</h3><div className="text-[13px] text-muted mt-2 space-y-1"><div>Email: {c.email}</div><div>Phone: {c.phone}</div><div>Location: {c.location}</div></div></div>
        <div className="bg-white border border-bdr rounded-xl p-5 shadow-sm"><h3 className="font-semibold">Professional Information</h3><div className="text-[13px] text-muted mt-2 space-y-1"><div>Position: {c.position}</div><div>Experience: {c.experience}</div><div>Skills: {c.skills}</div><div>Recruiter: {c.recruiter}</div><div>Source: {c.source}</div></div></div>
      </div>

      <div className="bg-white border border-bdr rounded-xl p-5 shadow-sm"><h3 className="font-semibold">Resume</h3><div className="mt-2 border border-dashed border-bdr rounded-xl p-4 bg-off text-[13px] text-muted flex items-center gap-2"><span className="material-symbols-outlined">description</span>Resume file UI (mock) — {c.name}_Resume.pdf <Button size="sm" variant="secondary" onClick={() => showToast("Download started")}>Download</Button></div></div>

      <div className="bg-white border border-bdr rounded-xl p-5 shadow-sm"><h3 className="font-semibold">Interview History & Scores</h3>
        {history.length === 0 ? <div className="text-[13px] text-muted mt-2">No interviews yet</div> : <div className="mt-2 space-y-2">
            {history.map((h) => <div key={h.id} className="border border-bdr rounded-xl p-3 bg-off/30">
                <div className="text-[13px] font-medium">{h.type} — {h.date} {h.start}-{h.end} • {h.interviewer} • {h.mode}</div>
                {h.score && <div className="text-[12px] mt-1">Score: <b>{h.score}</b> • Feedback: {h.feedback}</div>}
              </div>)}
          </div>}
        {c.technicalScore ? <div className="mt-3 text-[13px]">Technical: <b>{c.technicalScore}%</b> • HR: <b>{c.hrScore}%</b> • <span className="px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700">{c.recommendation}</span></div> : null}
      </div>

      <div className="bg-white border border-bdr rounded-xl p-5 shadow-sm"><h3 className="font-semibold">Candidate Timeline</h3>
        <div className="mt-3 relative pl-6 border-l border-bdr space-y-3 text-[13px]">
          {["Applied", "Screening", "Interview Scheduled", "Interview Completed", "Shortlisted", "Offer", "Hired"].map((s, i) => <div key={s} className="relative"><span className={`absolute -left-[25px] top-1 w-3 h-3 rounded-full border-2 ${["Applied", "Screening"].includes(c.stage) || i === 0 ? "bg-navy border-navy" : "bg-white border-bdr"}`} /><div className={`${s === c.stage ? "font-semibold text-navy" : "text-muted"}`}>{s} {s === c.stage && "\u2022 Current"}</div></div>)}
        </div>
      </div>

      {/* Offer Letter Live Editor & PDF Modal */}
      <OfferLetterModal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        offer={activeOffer}
        onConfirmOffer={handleConfirmOffer}
        onUpdateOffer={handleUpdateOffer}
      />
    </div>
  );
}
