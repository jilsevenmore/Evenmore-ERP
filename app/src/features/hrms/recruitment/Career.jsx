import { useState, useMemo } from "react";
import { careerJobsMock } from "../../../data/hrms/data/recruitmentData";
import { Button } from "../../../components/hrms/Button";
import { useAppStore } from "../../../stores/appStore";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock } from "lucide-react";

export default function Career() {
  const showToast = useAppStore((s) => s.showToast);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");
  const [loc, setLoc] = useState("All");
  const [type, setType] = useState("All");

  const filtered = useMemo(() => careerJobsMock.filter((j) => {
    if (search && !`${j.title} ${j.department}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (dept !== "All" && j.department !== dept) return false;
    if (loc !== "All" && j.location !== loc) return false;
    if (type !== "All" && j.type !== type) return false;
    return true;
  }), [search, dept, loc, type]);

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white border border-bdr rounded-xl p-8 shadow-sm text-center">
        <h1 className="text-[24px] font-bold">Join Our Team</h1><p className="text-[13px] text-muted mt-1">Candidate-facing career portal — explore open roles and apply.</p>
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <div className="relative"><span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-muted text-[16px]">search</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search jobs..." className="pl-8 h-9 w-64 bg-off border border-bdr rounded-xl text-[13px]" /></div>
          <select value={dept} onChange={(e) => setDept(e.target.value)} className="h-9 px-3 bg-off border border-bdr rounded-xl text-[13px]"><option>All</option><option>Engineering</option><option>Design</option><option>HR</option><option>Finance</option><option>Marketing</option></select>
          <select value={loc} onChange={(e) => setLoc(e.target.value)} className="h-9 px-3 bg-off border border-bdr rounded-xl text-[13px]"><option>All</option><option>New York</option><option>London</option><option>Dubai</option></select>
          <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 px-3 bg-off border border-bdr rounded-xl text-[13px]"><option>All</option><option>Full-time</option><option>Part-time</option><option>Contract</option></select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((j) => (
          <div key={j.id} className="bg-white border border-bdr rounded-xl p-5 shadow-sm flex flex-col">
            <div className="font-semibold text-slate">{j.title}</div>
            <div className="flex flex-wrap gap-1.5 mt-2 text-[11px]">
              <span className="px-2 py-1 bg-off border border-bdr rounded-full flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">apartment</span>{j.department}</span>
              <span className="px-2 py-1 bg-off border border-bdr rounded-full flex items-center gap-1"><MapPin size={12} />{j.location}</span>
              <span className="px-2 py-1 bg-off border border-bdr rounded-full flex items-center gap-1"><Clock size={12} />{j.type}</span>
            </div>
            <p className="text-[13px] text-muted mt-3 line-clamp-3">{j.description}</p>
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="secondary" onClick={() => navigate(`/hrms/recruitment/jobs/${j.id}`)}>View Job</Button>
              <Button size="sm" onClick={() => showToast("Application submitted for " + j.title)}>Apply Now</Button>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <div className="bg-white border border-bdr rounded-xl p-10 text-center text-muted">No jobs match your search.</div>}
    </div>
  );
}