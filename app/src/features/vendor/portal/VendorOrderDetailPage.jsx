import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useVendorStore } from '../../../stores/vendorStore';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { Button } from '../../../components/ui/Button';
import { VendorStageUpdateModal } from './components/VendorStageUpdateModal';
import {
  ArrowLeft,
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  FileText,
  UploadCloud,
  Eye,
  History,
  ShieldCheck,
  Building2,
  ExternalLink,
  ChevronRight,
  User,
  Info,
  Check,
  XCircle,
} from 'lucide-react';

export function VendorOrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const getCurrentVendor = useVendorStore((s) => s.getCurrentVendor);
  const orders = useVendorStore((s) => s.orders);
  const startStage = useVendorStore((s) => s.startStage);
  const acceptOrder = useVendorStore((s) => s.acceptOrder);

  const currentVendor = getCurrentVendor();

  // Find order and enforce strict vendor scoping
  const order = orders.find((o) => (o.id === orderId || o.orderNumber === orderId));

  const [activeTab, setActiveTab] = useState('stages'); // 'stages', 'history', 'proofs', 'activity'
  const [selectedStageForUpdate, setSelectedStageForUpdate] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Unauthorized or non-existent order guard
  if (!order || order.vendorId !== currentVendor?.id || order.isShared === false) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center max-w-lg mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
          <AlertTriangle size={24} />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Order Not Accessible</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          This order was not found or is no longer shared with your vendor account ({currentVendor?.name}).
        </p>
        <Button variant="primary" onClick={() => navigate('/vendor/orders')}>
          Back to My Orders
        </Button>
      </div>
    );
  }

  // Active / current stage
  const currentActiveStage =
    order.stages?.find((s) => s.status === 'Submitted' || s.status === 'In Progress' || s.status === 'Started') ||
    order.stages?.find((s) => s.status === 'Not Started') ||
    order.stages?.[order.stages.length - 1];

  const handleOpenUpdate = (stageToUpdate) => {
    setSelectedStageForUpdate(stageToUpdate || currentActiveStage);
    setIsUpdateModalOpen(true);
  };

  const handleStart = (stageId) => {
    startStage(order.id, stageId);
    setFeedbackMsg('Stage commenced successfully!');
    setTimeout(() => setFeedbackMsg(''), 3500);
  };

  // Collect all uploaded proofs across all stages
  const allProofFiles = [];
  (order.stages || []).forEach((stg) => {
    (stg.proofFiles || []).forEach((pf) => {
      allProofFiles.push({
        ...pf,
        stageName: stg.name,
      });
    });
  });

  return (
    <div className="space-y-6">
      {/* Back button & top crumbs */}
      <div className="flex items-center justify-between">
        <Link
          to="/vendor/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Assigned Orders</span>
        </Link>

        {order.status === 'New' && (
          <Button
            variant="primary"
            size="sm"
            icon={Check}
            onClick={() => acceptOrder(order.id)}
          >
            Accept Order Assignment
          </Button>
        )}
      </div>

      {/* Success notification banner */}
      {feedbackMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg('')} className="text-emerald-600 hover:text-emerald-900">
            ✕
          </button>
        </div>
      )}

      {/* ── Order Header Summary Card ─────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xl font-black text-slate-900 dark:text-white">
                {order.orderNumber}
              </span>
              <StatusBadge status={order.status} />
              {order.riskStatus && order.riskStatus !== 'On Track' && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  order.riskStatus === 'Delayed' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                }`}>
                  {order.riskStatus}
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {order.product}
            </h2>
            <p className="text-xs text-slate-500">
              Client: <span className="font-semibold text-slate-700 dark:text-slate-300">{order.customer}</span> • Template:{' '}
              <span className="font-medium text-slate-600 dark:text-slate-400">{order.templateName}</span>
            </p>
          </div>

          {/* Quick action button */}
          <div className="flex items-center gap-3">
            {order.status !== 'Completed' && (
              <Button
                variant="primary"
                icon={Layers}
                onClick={() => handleOpenUpdate(currentActiveStage)}
              >
                Update Current Stage ({currentActiveStage?.name})
              </Button>
            )}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Allocated Quantity
            </span>
            <p className="text-lg font-black font-mono text-slate-900 dark:text-white mt-0.5">
              {order.quantity} <span className="text-xs font-normal text-slate-500">{order.uom || 'Units'}</span>
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Assigned Date
            </span>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
              {order.assignedDate}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Expected Delivery
            </span>
            <p className={`text-sm font-bold mt-1 ${order.riskStatus === 'Delayed' ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}`}>
              {order.dueDate || order.expectedEndDate}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wider">
                Overall Progress
              </span>
              <span className="font-mono font-black text-sm text-primary">
                {order.overallProgress}%
              </span>
            </div>
            <div className="mt-1.5">
              <ProgressBar value={order.overallProgress} max={100} height={6} color="blue" />
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
            <Info size={15} className="text-primary shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <span className="font-semibold text-slate-900 dark:text-white">Admin Notes: </span>
              {order.notes}
            </p>
          </div>
        )}
      </div>

      {/* ── Tabs Navigation ───────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        {[
          { id: 'stages', label: 'Process Timeline & Stages', count: order.stages?.length },
          { id: 'history', label: 'Update History', count: order.updateHistory?.length },
          { id: 'proofs', label: 'Uploaded Verification Proof', count: allProofFiles.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-4 border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content: Stages Timeline ──────────────────────────── */}
      {activeTab === 'stages' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <p className="text-slate-500">
              Each stage contributes a defined weight percentage to the final order completion.
            </p>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              Total Stage Weight: 100%
            </span>
          </div>

          {/* Stepper Timeline List */}
          <div className="space-y-3">
            {order.stages?.map((stage, idx) => {
              const isCurrent = stage.id === currentActiveStage?.id;
              const isApproved = stage.status === 'Approved' || stage.status === 'Completed';
              const isSubmitted = stage.status === 'Submitted';
              const isRejected = stage.status === 'Rejected';
              const isStarted = stage.status === 'Started' || stage.status === 'In Progress';
              const isNotStarted = stage.status === 'Not Started';

              return (
                <div
                  key={stage.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isApproved
                      ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/50 shadow-2xs'
                      : isSubmitted
                      ? 'bg-amber-50/20 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 shadow-xs'
                      : isRejected
                      ? 'bg-rose-50/20 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60 shadow-xs'
                      : isStarted
                      ? 'bg-white dark:bg-slate-900 border-primary shadow-xs ring-1 ring-primary/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-90'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Stage Header Info */}
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            : isSubmitted
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                            : isRejected
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                            : isStarted
                            ? 'bg-primary text-white shadow-xs'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                        }`}
                      >
                        {isApproved ? <CheckCircle2 size={18} /> : stage.sequence}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Stage {stage.sequence}: {stage.name}
                          </h3>
                          <StatusBadge status={stage.status} />
                          {stage.proofRequired && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              Proof Required
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                          <span>
                            Weight Contribution: <strong className="text-slate-800 dark:text-slate-200">{stage.weight}%</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Expected Duration: <strong className="text-slate-800 dark:text-slate-200">{stage.expectedDays} days</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Responsible: <strong className="text-slate-800 dark:text-slate-200">{stage.responsibleParty}</strong>
                          </span>
                        </div>

                        {stage.instructions && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                            {stage.instructions}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Progress / Status / Actions */}
                    <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                      {/* Dates & Quantities */}
                      <div className="text-left lg:text-right text-[11px] space-y-0.5">
                        {stage.actualStartDate && (
                          <p className="text-slate-400">
                            Started: <span className="font-semibold text-slate-700 dark:text-slate-300">{stage.actualStartDate}</span>
                          </p>
                        )}
                        {stage.actualCompletionDate && (
                          <p className="text-emerald-600 font-semibold">
                            Completed: {stage.actualCompletionDate}
                          </p>
                        )}
                        {stage.quantityCompleted > 0 && (
                          <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                            Qty: {stage.quantityCompleted} / {order.quantity}
                          </p>
                        )}
                      </div>

                      {/* Interactive Buttons */}
                      <div className="flex items-center gap-2">
                        {isNotStarted && (
                          <button
                            type="button"
                            onClick={() => handleStart(stage.id)}
                            className="px-3 py-1.5 rounded-xl border border-primary text-primary hover:bg-primary/5 font-semibold text-xs cursor-pointer transition-colors"
                          >
                            Start Stage
                          </button>
                        )}

                        {!isApproved && (
                          <button
                            type="button"
                            onClick={() => handleOpenUpdate(stage)}
                            className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-2xs cursor-pointer transition-all active:scale-[0.99]"
                          >
                            {isSubmitted ? 'Resubmit / Edit' : isStarted ? 'Update Progress' : 'Update Stage'}
                          </button>
                        )}

                        {isApproved && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                            <CheckCircle2 size={13} /> Verified & Closed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rejection Alert Notice if rejected */}
                  {isRejected && stage.rejectionReason && (
                    <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                      <XCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
                      <div>
                        <p className="font-bold">Stage Update Rejected by Admin</p>
                        <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                          Reason: "{stage.rejectionReason}". Please review this feedback, make corrections, and click "Update Stage" to resubmit.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Pending Approval Notice if submitted */}
                  {isSubmitted && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-800 text-[11px] flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-amber-600" />
                        <span>Submitted for in-house engineering verification. Remarks: "{stage.remarks}"</span>
                      </div>
                      <span className="font-bold text-amber-700">Waiting for Sign-Off</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tab Content: Update History ───────────────────────────── */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <History size={16} className="text-primary" />
              <span>Full Stage Submission & Verification Audit Trail</span>
            </h3>
            <span className="text-xs text-slate-500">{order.updateHistory?.length || 0} Events Logged</span>
          </div>

          {(!order.updateHistory || order.updateHistory.length === 0) ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-xs">No stage update submissions have been recorded yet.</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {order.updateHistory.map((item, idx) => (
                <div key={item.id || idx} className="relative text-xs space-y-2">
                  {/* Dot */}
                  <div
                    className={`absolute -left-[27px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                      item.approvalStatus === 'Approved'
                        ? 'bg-emerald-500'
                        : item.approvalStatus === 'Rejected'
                        ? 'bg-rose-500'
                        : 'bg-amber-500'
                    }`}
                  />

                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{item.stage}</span>
                        <StatusBadge status={item.newStatus || 'Submitted'} />
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.approvalStatus === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.approvalStatus === 'Rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.approvalStatus || 'Pending Approval'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">{item.submittedDate}</span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      <strong className="text-slate-900 dark:text-white">Remarks:</strong> "{item.remarks}"
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span>Submitted By: <strong>{item.submittedBy}</strong></span>
                      {item.quantity !== undefined && (
                        <span>Quantity Reported: <strong>{item.quantity}</strong></span>
                      )}
                      {item.reviewedBy && (
                        <span>Reviewed By: <strong className="text-slate-800 dark:text-slate-200">{item.reviewedBy}</strong> ({item.reviewedDate})</span>
                      )}
                    </div>

                    {item.approvalRemarks && (
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-medium">
                        Approval Notes: {item.approvalRemarks}
                      </div>
                    )}

                    {item.rejectionReason && (
                      <div className="p-2 rounded-lg bg-rose-50 text-rose-800 text-[11px] font-medium">
                        Rejection Reason: {item.rejectionReason}
                      </div>
                    )}

                    {/* Proof files attached in this event */}
                    {item.proofFiles && item.proofFiles.length > 0 && (
                      <div className="pt-1">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Attached Proof Files ({item.proofFiles.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {item.proofFiles.map((pf, pIdx) => (
                            <span
                              key={pIdx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
                            >
                              <FileText size={12} className="text-primary" />
                              <span>{pf.name}</span>
                              <span className="text-[10px] text-slate-400">({pf.size || '1 MB'})</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab Content: Uploaded Proof Gallery ─────────────────────── */}
      {activeTab === 'proofs' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <UploadCloud size={16} className="text-primary" />
              <span>Uploaded Verification Proofs & Inspection Certificates</span>
            </h3>
            <span className="text-xs text-slate-500">{allProofFiles.length} Total Documents</span>
          </div>

          {allProofFiles.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-xs">No proof documents or photographs uploaded yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Upload proof when submitting stage completion updates.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allProofFiles.map((file, idx) => {
                const isPdf = file.name?.endsWith('.pdf') || file.type === 'application/pdf';
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:shadow-xs transition-shadow space-y-2.5 text-xs"
                  >
                    {file.url && !isPdf ? (
                      <div className="h-36 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-36 rounded-lg bg-rose-50 text-rose-600 flex flex-col items-center justify-center border border-rose-100 gap-1.5">
                        <FileText size={32} />
                        <span className="font-mono text-xs font-bold uppercase">PDF Inspection Certificate</span>
                      </div>
                    )}

                    <div>
                      <p className="font-bold text-slate-900 dark:text-white truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center justify-between mt-0.5">
                        <span>Stage: <strong>{file.stageName}</strong></span>
                        <span className="text-slate-400 font-mono">{file.size || '1.5 MB'}</span>
                      </p>
                    </div>

                    <a
                      href={file.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      View / Download File
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Stage Update Modal Component ───────────────────────────── */}
      {isUpdateModalOpen && (
        <VendorStageUpdateModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          order={order}
          stage={selectedStageForUpdate}
          onSuccess={(msg) => {
            setFeedbackMsg(msg);
            setTimeout(() => setFeedbackMsg(''), 4000);
          }}
        />
      )}
    </div>
  );
}

export default VendorOrderDetailPage;
