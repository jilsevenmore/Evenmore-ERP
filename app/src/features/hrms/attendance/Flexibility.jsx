import { useState } from "react";
import { useAttendanceStore } from "../../../stores/attendanceStore";
import { useAppStore } from "../../../stores/appStore";

export default function Flexibility() {
  const flexibility = useAttendanceStore((s) => s.flexibility);
  const saveFlexibility = useAttendanceStore((s) => s.saveFlexibility);
  const role = useAttendanceStore((s) => s.role);
  const showToast = useAppStore((s) => s.showToast);

  const [form, setForm] = useState(flexibility);
  const canEdit = role === "HR" || role === "Admin";

  function save() {
    if (!canEdit) {
      showToast("Only HR/Admin can change settings");
      return;
    }
    saveFlexibility(form);
    showToast("Settings saved successfully");
  }

  function reset() {
    setForm(flexibility);
    showToast("Restored previous values");
  }

  return (
    <div className="flex flex-col gap-5 max-w-[1000px]">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col gap-1">
        <div className="text-[12px] font-medium text-slate-400 flex items-center gap-1">
          <span>Home</span>
          <span>&gt;</span>
          <span className="text-slate-600">Attendance / Attendance Flexibility</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-1">
          <div>
            <h1 className="text-[22px] font-bold text-slate-800">Attendance Flexibility</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Configure attendance rules, grace periods and overtime. Frontend-only.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={reset}
              className="px-4 py-2 bg-white border border-[#e2e8f0] rounded-xl text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition shadow-2xs"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="px-5 py-2 bg-[#1e3a8a] text-white rounded-xl text-[13px] font-medium hover:bg-[#1e40af] transition shadow-2xs"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {!canEdit && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[13px] text-amber-800">
          View-only — switch role to HR/Admin to edit settings.
        </div>
      )}

      {/* Late Arrival Rules */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-2xs flex flex-col gap-4">
        <h3 className="font-bold text-[15px] text-slate-800">Late Arrival Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              GRACE PERIOD
            </span>
            <input
              disabled={!canEdit}
              value={form.gracePeriod || "10 minutes"}
              onChange={(e) => setForm({ ...form, gracePeriod: e.target.value })}
              className="h-10 px-4 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-slate-700 disabled:bg-[#f8fafc] focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              LATE AFTER
            </span>
            <input
              disabled={!canEdit}
              value={form.lateAfter || "09:10"}
              onChange={(e) => setForm({ ...form, lateAfter: e.target.value })}
              className="h-10 px-4 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-slate-700 disabled:bg-[#f8fafc] focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]"
            />
          </label>
          <label className="flex flex-col md:col-span-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              HALF-DAY THRESHOLD
            </span>
            <input
              disabled={!canEdit}
              value={form.halfDayThreshold || "4 hours"}
              onChange={(e) => setForm({ ...form, halfDayThreshold: e.target.value })}
              className="h-10 px-4 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-slate-700 disabled:bg-[#f8fafc] focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]"
            />
          </label>
        </div>
      </div>

      {/* Early Clock-Out Rules */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-2xs flex flex-col gap-4">
        <h3 className="font-bold text-[15px] text-slate-800">Early Clock-Out Rules</h3>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <label className="flex flex-col min-w-[260px]">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              EARLY CLOCK-OUT REQUIRES APPROVAL
            </span>
            <select
              disabled={!canEdit}
              value={form.earlyClockOutRequiresApproval ? "Yes" : "No"}
              onChange={(e) => setForm({ ...form, earlyClockOutRequiresApproval: e.target.value === "Yes" })}
              className="h-10 px-4 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-slate-700 disabled:bg-[#f8fafc] focus:outline-none focus:border-[#1e3a8a]"
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </label>
          <span className="text-[13px] text-slate-400 sm:self-end sm:mb-2.5">
            If enabled, early clock-out creates a request in Attendance Requests.
          </span>
        </div>
      </div>

      {/* Working Hours */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-2xs flex flex-col gap-4">
        <h3 className="font-bold text-[15px] text-slate-800">Working Hours</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              MINIMUM WORKING HOURS
            </span>
            <input
              disabled={!canEdit}
              value={form.minimumWorkingHours || "8 hours"}
              onChange={(e) => setForm({ ...form, minimumWorkingHours: e.target.value })}
              className="h-10 px-4 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-slate-700 disabled:bg-[#f8fafc] focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              FLEXIBLE WORKING HOURS
            </span>
            <input
              disabled={!canEdit}
              value={form.flexibleWorkingHours || "09:00 - 18:00 (Flexible)"}
              onChange={(e) => setForm({ ...form, flexibleWorkingHours: e.target.value })}
              className="h-10 px-4 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-slate-700 disabled:bg-[#f8fafc] focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]"
            />
          </label>
        </div>
      </div>

      {/* Overtime Rules */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-2xs flex flex-col gap-4">
        <h3 className="font-bold text-[15px] text-slate-800">Overtime Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              OVERTIME STARTS AFTER
            </span>
            <input
              disabled={!canEdit}
              value={form.overtimeStartsAfter || "8 hours"}
              onChange={(e) => setForm({ ...form, overtimeStartsAfter: e.target.value })}
              className="h-10 px-4 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-slate-700 disabled:bg-[#f8fafc] focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a]"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              OVERTIME REQUIRES APPROVAL
            </span>
            <select
              disabled={!canEdit}
              value={form.overtimeRequiresApproval ? "Yes" : "No"}
              onChange={(e) => setForm({ ...form, overtimeRequiresApproval: e.target.value === "Yes" })}
              className="h-10 px-4 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-slate-700 disabled:bg-[#f8fafc] focus:outline-none focus:border-[#1e3a8a]"
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
