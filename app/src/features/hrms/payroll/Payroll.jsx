import { useState, useMemo } from "react";
import {
  Lock,
  Download,
  Plus,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  Users,
  ShieldCheck,
  Building2,
  Calendar,
} from "lucide-react";
import { useAppStore } from "../../../stores/appStore";

const WORKFLOW_STEPS = [
  { id: "Draft", label: "Draft" },
  { id: "Processing", label: "Processing" },
  { id: "Review", label: "Review" },
  { id: "Approved", label: "Approved" },
  { id: "Completed", label: "Completed" },
];

const INITIAL_STRUCTURES = [
  { id: 1, name: "Engineering — L4", employees: 42, status: "Active" },
  { id: 2, name: "Engineering — L3", employees: 38, status: "Active" },
  { id: 3, name: "Design — L2", employees: 18, status: "Active" },
  { id: 4, name: "Sales — L3", employees: 35, status: "Active" },
  { id: 5, name: "HR & Admin — L1", employees: 15, status: "Active" },
];

const PAYSLIPS_DATA = [
  {
    id: "PAY-101",
    name: "Priya Patel",
    role: "HR Lead",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    netPay: "$5,420",
    basic: "$4,200",
    hra: "$1,150",
    allowances: "$450",
    deductions: "$380",
    tax: "$400",
    status: "Generated",
    month: "Oct 2024",
  },
  {
    id: "PAY-102",
    name: "Arjun Sharma",
    role: "Senior Software Engineer",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    netPay: "$6,250",
    basic: "$5,000",
    hra: "$1,200",
    allowances: "$600",
    deductions: "$420",
    tax: "$530",
    status: "Generated",
    month: "Oct 2024",
  },
  {
    id: "PAY-103",
    name: "Liam Cooper",
    role: "Product Designer",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    netPay: "$4,800",
    basic: "$3,900",
    hra: "$950",
    allowances: "$400",
    deductions: "$310",
    tax: "$340",
    status: "Generated",
    month: "Oct 2024",
  },
  {
    id: "PAY-104",
    name: "Meera Nair",
    role: "Financial Analyst",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    netPay: "$5,100",
    basic: "$4,100",
    hra: "$1,000",
    allowances: "$420",
    deductions: "$330",
    tax: "$390",
    status: "Generated",
    month: "Oct 2024",
  },
  {
    id: "PAY-105",
    name: "Rohan Verma",
    role: "DevOps Engineer",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
    netPay: "$4,950",
    basic: "$4,000",
    hra: "$980",
    allowances: "$390",
    deductions: "$300",
    tax: "$370",
    status: "Generated",
    month: "Oct 2024",
  },
];

export default function Payroll() {
  const storeLeaves = useAppStore((s) => s.leaves || []);
  const [activeStep, setActiveStep] = useState("Draft");
  const [structures, setStructures] = useState(INITIAL_STRUCTURES);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showRunModal, setShowRunModal] = useState(false);
  const [showAddStructureModal, setShowAddStructureModal] = useState(false);
  const [newStructureName, setNewStructureName] = useState("");
  const [newStructureEmployees, setNewStructureEmployees] = useState("");
  const [runSuccess, setRunSuccess] = useState(false);

  // Compute dynamic payslips with connected leaves and LOP
  const payslips = useMemo(() => {
    return PAYSLIPS_DATA.map((p) => {
      const empLeaves = storeLeaves.filter(
        (l) => l.employee?.toLowerCase() === p.name.toLowerCase() && l.status?.includes("Approved")
      );
      const leaveDays = empLeaves.reduce((sum, l) => sum + (Number(l.days) || 1), 0);
      const baseDeductionsNum = parseInt(p.deductions.replace(/[^0-9]/g, ""), 10) || 380;
      const lopDeduction = leaveDays > 2 ? (leaveDays - 2) * 120 : 0; // Unpaid leave penalty
      const totalDeductions = baseDeductionsNum + lopDeduction;

      const basicNum = parseInt(p.basic.replace(/[^0-9]/g, ""), 10) || 4000;
      const hraNum = parseInt(p.hra.replace(/[^0-9]/g, ""), 10) || 1000;
      const allowancesNum = parseInt(p.allowances.replace(/[^0-9]/g, ""), 10) || 400;
      const taxNum = parseInt(p.tax.replace(/[^0-9]/g, ""), 10) || 400;
      const computedNet = basicNum + hraNum + allowancesNum - totalDeductions - taxNum;

      return {
        ...p,
        leaveDays,
        lopDeduction: lopDeduction > 0 ? `$${lopDeduction}` : null,
        deductions: `$${totalDeductions}`,
        netPay: `$${computedNet.toLocaleString()}`,
      };
    });
  }, [storeLeaves]);

  const handleAddStructure = (e) => {
    e.preventDefault();
    if (!newStructureName) return;
    setStructures([
      ...structures,
      {
        id: Date.now(),
        name: newStructureName,
        employees: Number(newStructureEmployees) || 0,
        status: "Active",
      },
    ]);
    setNewStructureName("");
    setNewStructureEmployees("");
    setShowAddStructureModal(false);
  };

  const handleRunPayroll = () => {
    setRunSuccess(true);
    setTimeout(() => {
      setRunSuccess(false);
      setShowRunModal(false);
      setActiveStep("Processing");
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Breadcrumb & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[12px] font-medium text-slate-400 flex items-center gap-1">
            <span>Home</span>
            <span>&gt;</span>
            <span className="text-slate-600">Payroll</span>
          </div>
          <div className="mt-1">
            <h1 className="text-[24px] font-extrabold text-slate-900 tracking-tight">Payroll</h1>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Separate module • Permission-controlled sensitive data
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowRunModal(true)}
          className="bg-[#1b2b4a] hover:bg-[#111f36] text-white rounded-xl px-5 py-2.5 font-bold text-[13.5px] transition shadow-2xs flex items-center gap-2 cursor-pointer"
        >
          <span>Run Payroll — Oct 2024</span>
        </button>
      </div>

      {/* Top 6 Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-2xs">
          <div className="text-[12px] font-medium text-slate-500 mb-1">Total Payroll</div>
          <div className="text-[20px] font-bold text-slate-900">$482,400</div>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-2xs">
          <div className="text-[12px] font-medium text-slate-500 mb-1">Net Payroll</div>
          <div className="text-[20px] font-bold text-slate-900">$398,200</div>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-2xs">
          <div className="text-[12px] font-medium text-slate-500 mb-1">Deductions</div>
          <div className="text-[20px] font-bold text-slate-900">$84,200</div>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-2xs">
          <div className="text-[12px] font-medium text-slate-500 mb-1">Employees</div>
          <div className="text-[20px] font-bold text-slate-900">248</div>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-2xs">
          <div className="text-[12px] font-medium text-slate-500 mb-1">Processed</div>
          <div className="text-[20px] font-bold text-slate-900">210</div>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-2xs">
          <div className="text-[12px] font-medium text-slate-500 mb-1">Pending</div>
          <div className="text-[20px] font-bold text-slate-900">38</div>
        </div>
      </div>

      {/* Payroll Processing Workflow */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-2xs flex flex-col gap-4">
        <h2 className="text-[15px] font-bold text-slate-800">Payroll Processing Workflow</h2>

        {/* Workflow Steps Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {WORKFLOW_STEPS.map((step, idx) => {
            const isActive = activeStep === step.id;
            return (
              <div key={step.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(step.id)}
                  className={`px-4 py-1.5 rounded-full text-[12px] transition cursor-pointer ${
                    isActive
                      ? "bg-[#1b2b4a] text-white font-semibold shadow-2xs"
                      : "bg-[#f8fafc] border border-[#e2e8f0] text-slate-600 font-medium hover:bg-slate-100"
                  }`}
                >
                  {step.label}
                </button>
                {idx < WORKFLOW_STEPS.length - 1 && (
                  <span className="text-slate-400 text-[12px] font-bold">→</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Workflow Info Sub-pills (6 items) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-1">
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3 text-center">
            <div className="text-[11px] font-medium text-slate-400 mb-0.5">Period</div>
            <div className="text-[13px] font-bold text-slate-800">Oct 01–31</div>
          </div>

          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3 text-center">
            <div className="text-[11px] font-medium text-slate-400 mb-0.5">Gross</div>
            <div className="text-[13px] font-bold text-slate-800">$482,400</div>
          </div>

          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3 text-center">
            <div className="text-[11px] font-medium text-slate-400 mb-0.5">Deductions</div>
            <div className="text-[13px] font-bold text-slate-800">$84,200</div>
          </div>

          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3 text-center">
            <div className="text-[11px] font-medium text-slate-400 mb-0.5">Net</div>
            <div className="text-[13px] font-bold text-slate-800">$398,200</div>
          </div>

          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3 text-center">
            <div className="text-[11px] font-medium text-slate-400 mb-0.5">Exceptions</div>
            <div className="text-[13px] font-bold text-slate-800">3</div>
          </div>

          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3 text-center">
            <div className="text-[11px] font-medium text-slate-400 mb-0.5">Approval</div>
            <div className="text-[13px] font-bold text-slate-800">Pending CFO</div>
          </div>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Salary Structure */}
        <div className="lg:col-span-6 bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <h3 className="text-[15px] font-bold text-slate-800">Salary Structure</h3>
              <button
                type="button"
                onClick={() => setShowAddStructureModal(true)}
                className="bg-[#f8fafc] border border-[#e2e8f0] text-slate-700 hover:bg-slate-100 rounded-xl px-3 py-1.5 text-[12px] font-medium transition shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                Add Structure
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[#e2e8f0] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-2.5">STRUCTURE</th>
                    <th className="pb-2.5">EMPLOYEES</th>
                    <th className="pb-2.5 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {structures.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 font-semibold text-slate-800">{item.name}</td>
                      <td className="py-3 text-slate-600 font-medium">{item.employees}</td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#e6f4ea] text-[#15803d] border border-[#a7f3d0]">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Yellow Sensitive Banner */}
          <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-3 text-[12px] text-[#b45309] font-medium flex items-center gap-2 mt-5">
            <Lock size={15} className="text-[#b45309] flex-shrink-0" />
            <span>Salary data is sensitive and permission-controlled</span>
          </div>
        </div>

        {/* Right Column: Payslips — Oct 2024 */}
        <div className="lg:col-span-6 bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <h3 className="text-[15px] font-bold text-slate-800">Payslips — Oct 2024</h3>
              <button
                type="button"
                onClick={() => alert("Exporting Oct 2024 Payslips CSV/PDF...")}
                className="bg-[#f8fafc] border border-[#e2e8f0] text-slate-700 hover:bg-slate-100 rounded-xl px-3 py-1.5 text-[12px] font-medium transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={13} className="text-slate-500" />
                <span>Export</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[#e2e8f0] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-2.5">EMPLOYEE</th>
                    <th className="pb-2.5">NET PAY</th>
                    <th className="pb-2.5 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payslips.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.avatar}
                            alt={p.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <span>{p.name}</span>
                              {p.leaveDays > 0 && (
                                <span className="text-[10px] font-medium px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                                  {p.leaveDays}d leave
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">{p.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 font-bold text-slate-800">{p.netPay}</td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedPayslip(p)}
                          className="text-[#1e3a8a] hover:text-[#111f36] font-semibold text-[12.5px] hover:underline transition cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Payslip View Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xl w-full max-w-md p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedPayslip.avatar}
                  alt={selectedPayslip.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h3 className="font-bold text-[16px] text-slate-900">{selectedPayslip.name}</h3>
                  <p className="text-[12px] text-slate-500">{selectedPayslip.role} • {selectedPayslip.month}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayslip(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Basic Salary</span>
                <span className="font-medium text-slate-800">{selectedPayslip.basic}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">HRA</span>
                <span className="font-medium text-slate-800">{selectedPayslip.hra}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Special Allowances</span>
                <span className="font-medium text-slate-800">{selectedPayslip.allowances}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Deductions (PF/Insurance)</span>
                <span className="font-medium text-red-600">-{selectedPayslip.deductions}</span>
              </div>
              {selectedPayslip.lopDeduction && (
                <div className="flex justify-between py-1 border-b border-amber-100 bg-amber-50/60 px-2 rounded-lg text-amber-800 text-[12px]">
                  <span>Loss of Pay ({selectedPayslip.leaveDays} approved leave days)</span>
                  <span className="font-bold text-red-600">-{selectedPayslip.lopDeduction}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Tax Withholding</span>
                <span className="font-medium text-red-600">-{selectedPayslip.tax}</span>
              </div>
              <div className="flex justify-between py-2 font-bold text-[15px] text-slate-900 bg-slate-50 rounded-xl px-3 mt-2">
                <span>Net Payable</span>
                <span className="text-[#10b981]">{selectedPayslip.netPay}</span>
              </div>
            </div>

            <div className="flex gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => {
                  alert(`Downloading Payslip for ${selectedPayslip.name}...`);
                  setSelectedPayslip(null);
                }}
                className="flex-1 bg-[#1b2b4a] hover:bg-[#111f36] text-white rounded-xl py-2.5 font-bold text-[13px] transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download size={14} />
                Download Payslip
              </button>
              <button
                type="button"
                onClick={() => setSelectedPayslip(null)}
                className="px-4 bg-[#f8fafc] border border-[#e2e8f0] text-slate-700 hover:bg-slate-100 rounded-xl py-2.5 font-medium text-[13px] transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Run Payroll Confirmation Modal */}
      {showRunModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xl w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-[16px] text-slate-900">Run Payroll — Oct 2024</h3>
              <button
                type="button"
                onClick={() => setShowRunModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {runSuccess ? (
              <div className="py-6 text-center flex flex-col items-center gap-2">
                <CheckCircle2 size={42} className="text-emerald-500" />
                <h4 className="font-bold text-[16px] text-slate-800">Payroll Cycle Triggered!</h4>
                <p className="text-[13px] text-slate-500">248 employee calculations initiated for Oct 2024.</p>
              </div>
            ) : (
              <>
                <p className="text-[13.5px] text-slate-600 leading-relaxed">
                  Are you sure you want to process monthly payroll for <strong>248 employees</strong> totaling <strong>$482,400</strong> for period Oct 01–31, 2024?
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[12.5px] text-slate-600 space-y-1">
                  <div>• Gross Amount: <strong>$482,400</strong></div>
                  <div>• Deductions & Tax: <strong>$84,200</strong></div>
                  <div>• Net Payout: <strong>$398,200</strong></div>
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleRunPayroll}
                    className="flex-1 bg-[#1b2b4a] hover:bg-[#111f36] text-white rounded-xl py-2.5 font-bold text-[13px] transition cursor-pointer"
                  >
                    Confirm & Run
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRunModal(false)}
                    className="px-4 bg-[#f8fafc] border border-[#e2e8f0] text-slate-700 hover:bg-slate-100 rounded-xl py-2.5 font-medium text-[13px] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Structure Modal */}
      {showAddStructureModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddStructure}
            className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xl w-full max-w-md p-6 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-[16px] text-slate-900">Add Salary Structure</h3>
              <button
                type="button"
                onClick={() => setShowAddStructureModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                  Structure Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engineering — L5"
                  value={newStructureName}
                  onChange={(e) => setNewStructureName(e.target.value)}
                  className="w-full h-9 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[13px] focus:outline-none focus:border-[#1e3a8a]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1">
                  Number of Employees
                </label>
                <input
                  type="number"
                  placeholder="e.g. 25"
                  value={newStructureEmployees}
                  onChange={(e) => setNewStructureEmployees(e.target.value)}
                  className="w-full h-9 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[13px] focus:outline-none focus:border-[#1e3a8a]"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                className="flex-1 bg-[#1b2b4a] hover:bg-[#111f36] text-white rounded-xl py-2.5 font-bold text-[13px] transition cursor-pointer"
              >
                Save Structure
              </button>
              <button
                type="button"
                onClick={() => setShowAddStructureModal(false)}
                className="px-4 bg-[#f8fafc] border border-[#e2e8f0] text-slate-700 hover:bg-slate-100 rounded-xl py-2.5 font-medium text-[13px] transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
