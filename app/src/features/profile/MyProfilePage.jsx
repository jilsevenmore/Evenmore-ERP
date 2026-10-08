/**
 * My Profile — every signed-in employee's own HR record.
 *
 * Self-service: it reads `GET /hrms/employees/me/`, which only ever returns the
 * record linked to this login, so it needs no HRMS permission and cannot be
 * pointed at a colleague. Everything here is what HR keeps on file; the only
 * thing the employee edits themselves is their phone number (`PATCH /auth/me/`,
 * which the server copies onto the employee record). Anything else goes
 * through HR.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  Briefcase, Building2, Calendar, CreditCard, Droplet, Hash, IdCard, Loader2,
  Mail, MapPin, Pencil, Phone, ShieldCheck, User, UserCheck, Users, X, Check,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { api } from '../../services/api';
import { updateProfile } from '../../services/authService';
import { useAppStore } from '../../stores/appStore';
import { formatDateDDMMYYYY } from '../../utils/dateUtils';

/** `XXXX1234` — the full number stays off screen. */
function masked(value, visible = 4) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.length <= visible ? text : `${'•'.repeat(Math.min(8, text.length - visible))}${text.slice(-visible)}`;
}

/** Address and emergency contact are stored as objects; show their parts. */
function joinParts(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return Object.values(value).filter((part) => part && typeof part !== 'object').join(', ');
}

function Field({ icon: Icon, label, value, children }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
        <Icon size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</div>
        {children || (
          <div className="text-[13.5px] font-medium text-slate-900 break-words">{value || '—'}</div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="bg-white border border-bdr rounded-2xl p-5 shadow-xs">
      <h3 className="font-bold text-[15px] text-slate-900 pb-2 mb-1 border-b border-bdr/60">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">{children}</div>
    </section>
  );
}

export default function MyProfilePage() {
  const currentUser = useAppStore((s) => s.currentUser);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const showToast = useAppStore((s) => s.showToast);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProfile(await api.get('/hrms/employees/me/'));
    } catch (err) {
      setProfile(null);
      setError(err?.payload?.message || err?.message || 'Your profile could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, currentUser?.id]);

  async function savePhone() {
    setSavingPhone(true);
    try {
      const user = await updateProfile({ phone: phoneDraft.trim() });
      if (user) setCurrentUser({ ...currentUser, ...user });
      setProfile((p) => (p ? { ...p, phone: phoneDraft.trim() } : p));
      setEditingPhone(false);
      showToast?.('Phone number updated');
    } catch (err) {
      showToast?.(`Phone not saved — ${err?.payload?.message || err?.message || 'try again'}`);
    } finally {
      setSavingPhone(false);
    }
  }

  const header = (
    <PageHeader
      title="My Profile"
      subtitle="Your details as HR has them on file"
      breadcrumb={[{ label: 'Dashboard', path: '/' }, { label: 'My Profile' }]}
    />
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <div className="flex items-center gap-2 text-[13px] text-muted py-10 justify-center">
          <Loader2 size={16} className="animate-spin" /> Loading your profile…
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <div className="bg-white border border-bdr rounded-2xl p-8 text-center shadow-xs">
          <User size={28} className="mx-auto text-slate-400" />
          <p className="mt-3 text-[14px] font-semibold text-slate-900">No employee profile to show</p>
          <p className="mt-1 text-[13px] text-muted">{error}</p>
        </div>
      </div>
    );
  }

  const initials = (profile.name || currentUser?.name || '?')
    .split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  const emergency = profile.emergencyContact || {};
  const emergencyText = joinParts(emergency);

  return (
    <div className="flex flex-col gap-6">
      {header}

      {/* Identity card */}
      <div className="bg-white border border-bdr rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center gap-4">
        {profile.avatar ? (
          <img src={profile.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover border border-slate-200" />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-black text-xl flex items-center justify-center">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-[20px] font-bold text-slate-900 truncate">{profile.name}</h2>
          <p className="text-[13px] text-muted">
            {[profile.designation, profile.department].filter(Boolean).join(' • ') || '—'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-[11.5px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
            {profile.employeeCode}
          </span>
          <span className={`text-[11.5px] font-semibold px-2.5 py-1 rounded-lg ${
            profile.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}>
            {profile.status || '—'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Section title="Job">
          <Field icon={Briefcase} label="Designation" value={profile.designation} />
          <Field icon={Building2} label="Department" value={profile.department} />
          <Field icon={UserCheck} label="Reporting Manager" value={profile.manager} />
          <Field icon={MapPin} label="Location" value={profile.location} />
          <Field icon={Calendar} label="Joining Date" value={formatDateDDMMYYYY(profile.joining)} />
          <Field icon={IdCard} label="Employment Type" value={profile.employmentType} />
          <Field icon={Users} label="Shift" value={profile.shift} />
          <Field icon={ShieldCheck} label="Login Role" value={currentUser?.role} />
        </Section>

        <Section title="Contact">
          <Field icon={Mail} label="Work Email" value={profile.email} />
          <Field icon={Phone} label="Phone">
            {editingPhone ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <input
                  value={phoneDraft}
                  onChange={(e) => setPhoneDraft(e.target.value)}
                  className="h-8 px-2.5 w-full max-w-[180px] bg-off border border-bdr rounded-lg text-[13px] focus:outline-none focus:border-navy"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={savePhone}
                  disabled={savingPhone}
                  className="h-8 w-8 rounded-lg bg-primary text-white flex items-center justify-center disabled:opacity-50 cursor-pointer"
                  aria-label="Save phone"
                >
                  {savingPhone ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPhone(false)}
                  className="h-8 w-8 rounded-lg border border-bdr flex items-center justify-center cursor-pointer"
                  aria-label="Cancel"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[13.5px] font-medium text-slate-900">{profile.phone || '—'}</span>
                <button
                  type="button"
                  onClick={() => { setPhoneDraft(profile.phone || ''); setEditingPhone(true); }}
                  className="text-primary hover:text-primary-dark cursor-pointer"
                  aria-label="Edit phone"
                  title="Edit phone"
                >
                  <Pencil size={13} />
                </button>
              </div>
            )}
          </Field>
          <Field icon={Mail} label="Personal Email" value={profile.personalEmail} />
          <Field icon={Phone} label="Emergency Contact" value={emergencyText} />
          <Field icon={MapPin} label="Address" value={joinParts(profile.address)} />
        </Section>

        <Section title="Personal">
          <Field icon={Calendar} label="Date of Birth" value={formatDateDDMMYYYY(profile.dateOfBirth)} />
          <Field icon={User} label="Gender" value={profile.gender} />
          <Field icon={Droplet} label="Blood Group" value={profile.bloodGroup} />
        </Section>

        <Section title="Bank & Statutory">
          <Field icon={CreditCard} label="Bank Account" value={masked(profile.bankAccountNumber)} />
          <Field icon={Hash} label="IFSC" value={profile.ifscCode} />
          <Field icon={IdCard} label="PAN" value={masked(profile.pan)} />
          <Field icon={Hash} label="UAN" value={profile.uan} />
          <Field icon={IdCard} label="Aadhaar" value={profile.aadhaarLast4 ? `•••• •••• ${profile.aadhaarLast4}` : ''} />
        </Section>
      </div>

      <p className="text-[12px] text-muted">
        Something wrong here? Ask HR to update it — only your phone number can be changed from this page.
      </p>
    </div>
  );
}
