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
    showToast("Settings saved");
  }
  function reset() {
    setForm(flexibility);
    showToast("Restored previous values");
  }
  const Section = ({ title, children }) => <div className="bg-white border border-bdr rounded-xl p-5 shadow-subtle">
      <h3 className="font-semibold text-[14px]">{title}</h3>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>;
  const Field = ({ label, value, onChange }) => <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium text-muted uppercase tracking-wide">{label}</span>
      <input disabled={!canEdit} value={value} onChange={(e) => onChange(e.target.value)} className="h-9 px-3 bg-white border border-bdr rounded-xl text-[13px] disabled:bg-off focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10" />
    </label>;
  return <div className="flex flex-col gap-5 max-w-[900px]">
      <div><h1 className="text-[24px] font-bold">Attendance Flexibility</h1><p className="text-[13px] text-muted">Configure attendance rules, grace periods and overtime. Frontend-only.</p></div>
      {!canEdit && <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[13px] text-amber-800">View-only — switch role to HR/Admin to edit.</div>}

      <Section title="Late Arrival Rules">
        <Field label="Grace Period" value={form.gracePeriod} onChange={(v) => setForm({ ...form, gracePeriod: v })} />
        <Field label="Late After" value={form.lateAfter} onChange={(v) => setForm({ ...form, lateAfter: v })} />
        <Field label="Half-Day Threshold" value={form.halfDayThreshold} onChange={(v) => setForm({ ...form, halfDayThreshold: v })} />
      </Section>

      <Section title="Early Clock-Out Rules">
        <Field label="Early Clock-Out Requires Approval" value={form.earlyClockOutRequiresApproval ? "Yes" : "No"} onChange={(v) => setForm({ ...form, earlyClockOutRequiresApproval: v === "Yes" })} />
        <div className="text-[12px] text-muted self-end">If enabled, early clock-out creates a request in Attendance Requests.</div>
      </Section>

      <Section title="Working Hours">
        <Field label="Minimum Working Hours" value={form.minimumWorkingHours} onChange={(v) => setForm({ ...form, minimumWorkingHours: v })} />
        <Field label="Flexible Working Hours" value={form.flexibleWorkingHours} onChange={(v) => setForm({ ...form, flexibleWorkingHours: v })} />
      </Section>

      <Section title="Overtime Rules">
        <Field label="Overtime Starts After" value={form.overtimeStartsAfter} onChange={(v) => setForm({ ...form, overtimeStartsAfter: v })} />
        <Field label="Overtime Requires Approval" value={form.overtimeRequiresApproval ? "Yes" : "No"} onChange={(v) => setForm({ ...form, overtimeRequiresApproval: v === "Yes" })} />
      </Section>

      <Section title="Flexible Working">
        <Field label="Grace Period" value={form.gracePeriod} onChange={(v) => setForm({ ...form, gracePeriod: v })} />
        <Field label="Minimum Working Hours" value={form.minimumWorkingHours} onChange={(v) => setForm({ ...form, minimumWorkingHours: v })} />
      </Section>

      <div className="flex justify-end gap-2">
        <button onClick={reset} className="px-5 py-2 bg-white border border-bdr rounded-xl text-[13.5px]">Cancel</button>
        <button onClick={save} className="px-6 py-2 bg-navy text-white rounded-xl text-[13.5px] font-medium">Save Changes</button>
      </div>
    </div>;
}
