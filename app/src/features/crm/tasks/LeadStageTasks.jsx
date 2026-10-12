import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  CheckCircle2,
} from "lucide-react";
import InfoBanner from "../common/InfoBanner";
import StageTasksGuideModal from "./StageTasksGuideModal";
import { useCrmStore } from "../../../stores/crmStore";
import { syncCollection } from "../../../services/crmCollections";

const STAGE_THEMES = [
  {
    headerBg: "bg-[#eff6ff] border-[#dbeafe]",
    badgeBg: "bg-blue-600 text-white",
    ribbonBg: "bg-blue-600 text-white shadow-xs",
    badgeNumber: 1,
  },
  {
    headerBg: "bg-[#f0fdf4] border-[#bbf7d0]",
    badgeBg: "bg-emerald-600 text-white",
    ribbonBg: "bg-[#ccfbf1] text-[#0f766e]",
    badgeNumber: 2,
  },
  {
    headerBg: "bg-[#fefce8] border-[#fef08a]",
    badgeBg: "bg-amber-500 text-white",
    ribbonBg: "bg-[#fef9c3] text-[#a16207]",
    badgeNumber: 3,
  },
  {
    headerBg: "bg-[#faf5ff] border-[#f3e8ff]",
    badgeBg: "bg-purple-600 text-white",
    ribbonBg: "bg-[#f3e8ff] text-[#7e22ce]",
    badgeNumber: 4,
  },
  {
    headerBg: "bg-[#eef2ff] border-[#e0e7ff]",
    badgeBg: "bg-indigo-600 text-white",
    ribbonBg: "bg-[#e0e7ff] text-[#4338ca]",
    badgeNumber: 5,
  },
  {
    headerBg: "bg-[#eff6ff] border-[#dbeafe]",
    badgeBg: "bg-sky-600 text-white",
    ribbonBg: "bg-[#dbeafe] text-[#1d4ed8]",
    badgeNumber: 6,
  },
  {
    headerBg: "bg-[#f0fdf4] border-[#dcfce7]",
    badgeBg: "bg-teal-600 text-white",
    ribbonBg: "bg-[#dcfce7] text-[#15803d]",
    badgeNumber: 7,
  },
  {
    headerBg: "bg-[#fff1f2] border-[#ffe4e6]",
    badgeBg: "bg-rose-500 text-white",
    ribbonBg: "bg-[#ffe4e6] text-[#be123c]",
    badgeNumber: 8,
  },
];

const TASK_ROLE_MAP = {
  "Call": "Tele Caller Executive",
  "Call customer": "Tele Caller Executive",
  "Send email": "Sales Support Executive",
  "Send quotation": "BDE",
  "Schedule demo": "Area Sales Manager",
  "Client meeting": "Sales Support Executive",
  "Negotiate pricing": "BDE",
};

/**
 * A master task the Task Name pickers may offer: active, named, and saved on the
 * server (an unsaved row has no id a stage task could link to).
 */
function isEligibleMaster(master) {
  return Boolean(
    master &&
      !master._pending &&
      master.status !== 'Inactive' &&
      master.isActive !== false &&
      (master.name || master.title)
  );
}

/**
 * The Task Name options: the master task library by id. `current` is the row's
 * own task when it is no longer offered (retired master, or an old row saved by
 * name only), so the select still shows what the row holds.
 */
function TaskNameOptions({ options, status, current, emptyLabel = 'No active master tasks' }) {
  const showCurrent = current && !options.some((m) => String(m.id) === current.value);
  let placeholder = 'Select Task Name';
  if (!options.length) {
    if (status === 'loading') placeholder = 'Loading tasks...';
    else if (status === 'error') placeholder = 'Could not load tasks';
    else placeholder = emptyLabel;
  }
  return (
    <>
      {showCurrent ? (
        <option value={current.value} disabled>
          {current.label}
        </option>
      ) : (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((master) => (
        <option key={master.id} value={String(master.id)}>
          {master.name || master.title}
        </option>
      ))}
    </>
  );
}

/** Shown under a Task Name picker when the master task library failed to load. */
function LibraryError({ status, onRetry }) {
  if (status !== 'error') return null;
  return (
    <p className="text-[10px] text-rose-500 mt-1">
      Could not load the Master Lead Tasks library.{' '}
      <button type="button" onClick={onRetry} className="font-semibold underline cursor-pointer">
        Retry
      </button>
    </p>
  );
}

// Which pipeline the screen is looking at is a view preference, not data.
const PIPELINE_KEY = 'leadStageTasksPipelineV1';

/** A blank stage task, as the "add task" form opens it. */
const EMPTY_MASTER_TASK = {
  name: '',
  // The picked master task's id, as the Task Name select holds it.
  masterTaskId: '',
  description: '',
  role: 'Tele Caller Executive',
  department: 'Any',
  priority: 'Medium',
  dueIn: 1,
  repeats: '',
  time: '',
  autoCreate: true,
  isActive: true,
};

function getStoredPipeline() {
  try {
    return localStorage.getItem(PIPELINE_KEY) || 'Sales';
  } catch { /* ignore */ }
  return 'Sales';
}

/**
 * The screen renders a stage with its tasks nested. The API keeps them apart
 * (`/crm/stages/` and `/crm/stage-tasks/`), so they are joined here.
 */
function stagesWithTasks(stages, stageTasks) {
  return stages.map((stage) => ({
    ...stage,
    tasks: stageTasks
      .filter((task) => task.stageId === stage.id)
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)),
  }));
}

export default function LeadStageTasks({ leadForms = [] }) {
  const storeStages = useCrmStore((s) => s.stages);
  const storeStageTasks = useCrmStore((s) => s.stageTasks);
  const [stages, setStages] = useState([]);

  useEffect(() => {
    setStages(stagesWithTasks(storeStages, storeStageTasks));
  }, [storeStages, storeStageTasks]);
  const [openStages, setOpenStages] = useState([]);
  const [isTaskRolesOpen, setIsTaskRolesOpen] = useState(false);
  const [pipeline, setPipeline] = useState(getStoredPipeline);
  const [taskModalStageId, setTaskModalStageId] = useState(null);
  const [masterTask, setMasterTask] = useState(EMPTY_MASTER_TASK);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [stageDrafts, setStageDrafts] = useState({});
  const [formError, setFormError] = useState('');
  const [warning, setWarning] = useState('');
  const [showStageHint, setShowStageHint] = useState(false);
  const stageSectionRef = useRef(null);
  const masterTasks = useCrmStore((s) => s.masterTasks);

  // The library is re-read on open, so a master task created or re-activated
  // on the Tasks Master page since sign-in is offered here too.
  const [libraryStatus, setLibraryStatus] = useState('loading');
  function loadLibrary() {
    setLibraryStatus('loading');
    return useCrmStore.getState().refresh('masterTasks')
      .then((rows) => {
        const loaded = rows || useCrmStore.getState().masterTasks.length > 0;
        setLibraryStatus(loaded ? 'ready' : 'error');
      })
      .catch(() => setLibraryStatus('error'));
  }
  useEffect(() => {
    loadLibrary();
  }, []);

  const masterById = useMemo(
    () => new Map(masterTasks.map((m) => [String(m.id), m])),
    [masterTasks]
  );
  const masterOptions = useMemo(
    () =>
      masterTasks
        .filter(isEligibleMaster)
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)),
    [masterTasks]
  );

  // Task Roles lists the master tasks the user picked into it with its Add
  // Task -- not the whole library, which a new master task joins on its own.
  const roleTasks = useMemo(() => masterTasks.filter((m) => m.inTaskRoles), [masterTasks]);
  // Unsaved Task Roles edits, by master task id, until that row's Save.
  const [roleDrafts, setRoleDrafts] = useState({});

  /**
   * A master task picked by id: the stage task links to it and starts from its
   * role, department, priority, due days and form. `null` when the id is not in
   * the library.
   */
  function fieldsForMaster(masterId, fallbackRole) {
    const master = masterById.get(String(masterId));
    if (!master) return null;
    const name = master.name || master.title;
    return {
      name,
      masterTaskId: master.id,
      role: master.role || TASK_ROLE_MAP[name] || fallbackRole,
      department: master.department || undefined,
      priority: master.priority || undefined,
      dueIn: master.dueIn ?? undefined,
    };
  }

  /** A stage holds each master task once; `exceptTaskId` is the row being edited. */
  function stageHasMaster(stage, masterId, exceptTaskId) {
    return (stage?.tasks || []).some(
      (task) =>
        task.id !== exceptTaskId &&
        task.masterTaskId != null &&
        String(task.masterTaskId) === String(masterId)
    );
  }

  function showWarning(text) {
    setWarning(text);
    setTimeout(() => setWarning(''), 3000);
  }


  // An edit anywhere in the tree is written back as the flat task collection
  // the API stores, with each task carrying the stage it belongs to. Only on a
  // user edit: syncing from an effect on [stages, storeStageTasks] compared a
  // local copy one render behind the store and wrote again on every reply.
  function commitStages(update) {
    const next = typeof update === 'function' ? update(stages) : update;
    setStages(next);
    // A typed ORDER wins; rows without one take their list position.
    const flat = next.flatMap((stage) =>
      (stage.tasks || []).map((task, index) => ({
        ...task,
        stageId: stage.id,
        order: task.order !== '' && Number.isFinite(Number(task.order)) && Number(task.order) > 0 ? Number(task.order) : index + 1,
      }))
    );
    syncCollection('stageTasks', flat, storeStageTasks);
  }

  /**
   * The server keeps a master task's "used in stages" in step with the stage
   * tasks, so the library behind Task Roles is re-read after a task is put into
   * a stage or taken out of one. Not on every keystroke in the stage tables,
   * which would pull the library per character.
   */
  function refreshRoleTasks() {
    useCrmStore.getState().refresh('masterTasks').catch(() => {});
  }

  useEffect(() => {
    try {
      localStorage.setItem(PIPELINE_KEY, pipeline);
    } catch { /* ignore */ }
  }, [pipeline]);

  /** Re-read the configured stages and their tasks from the server. */
  function resetToDefaults() {
    const store = useCrmStore.getState();
    Promise.all([store.refresh('stages'), store.refresh('stageTasks')]).catch((err) => {
      console.warn('[CRM] could not reload stage tasks:', err?.message || err);
    });
  }

  const EMPTY_DRAFT = {
    masterTaskId: "",
    order: 0,
    required: true,
    autoCreate: true,
    repeats: "",
    dueIn: "",
  };

  function getDraft(stageId) {
    return stageDrafts[stageId] || EMPTY_DRAFT;
  }

  function updateDraft(stageId, key, value) {
    setStageDrafts((prev) => ({
      ...prev,
      [stageId]: {
        ...getDraft(stageId),
        [key]: value,
      },
    }));
  }

  function addDraftTask(stageId) {
    const draft = getDraft(stageId);
    const linked = fieldsForMaster(draft.masterTaskId, "Tele Caller Executive");
    if (!linked) {
      showWarning("Select a task name first.");
      return;
    }
    const target = stages.find((stage) => stage.id === stageId);
    if (stageHasMaster(target, linked.masterTaskId)) {
      showWarning(`${linked.name} is already in ${target.name}.`);
      return;
    }
    const master = masterById.get(String(linked.masterTaskId));
    commitStages((current) =>
      current.map((stage) => {
        if (stage.id !== stageId) return stage;
        return {
          ...stage,
          tasks: [
            ...stage.tasks,
            {
              id: Date.now(),
              description: master?.description || `${linked.name} task`,
              department: "Any",
              ...linked,
              order: Number(draft.order) || 0,
              required: draft.required ?? true,
              autoCreate: draft.autoCreate ?? true,
              repeats: draft.repeats === "" ? 14 : Number(draft.repeats) || 0,
              dueIn: draft.dueIn === "" ? linked.dueIn ?? 0 : Number(draft.dueIn) || 0,
            },
          ],
        };
      })
    );
    setStageDrafts((prev) => ({ ...prev, [stageId]: EMPTY_DRAFT }));
    refreshRoleTasks();
    triggerSaveToast();
  }

  /**
   * Opens the "add to a stage" form for one stage. The stage comes from the
   * stage's own Add Task button, so the form has no stage picker and a task
   * can never land in a stage the user did not open.
   */
  function addTask(stageId) {
    setTaskModalStageId(stageId);
    setMasterTask(EMPTY_MASTER_TASK);
    setFormError('');
    setShowStageHint(false);
  }

  /**
   * The header's Add Stage Task has no stage of its own: it adds to the only
   * stage there is, or the only one open; otherwise it points the user at the
   * stages rather than guess one.
   */
  function addTaskFromHeader() {
    if (stages.length === 1) {
      addTask(stages[0].id);
      return;
    }
    if (openStages.length === 1) {
      addTask(openStages[0]);
      return;
    }
    setShowStageHint(true);
    stageSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function closeTaskModal() {
    setTaskModalStageId(null);
    setFormError('');
  }

  function updateMasterTask(key, value) {
    setMasterTask((current) => ({ ...current, [key]: value }));
  }

  /**
   * Picking a task in either form copies the master task's role, department,
   * priority, due days, form and description onto it, so the mapping starts
   * from its template. The fields stay editable afterwards.
   */
  function pickMasterForForm(masterId) {
    const master = masterById.get(String(masterId));
    if (!master) return;
    const name = master.name || master.title;
    setFormError('');
    setMasterTask((current) => ({
      ...current,
      name,
      masterTaskId: String(master.id),
      role: master.role || TASK_ROLE_MAP[name] || current.role,
      department: master.department || current.department,
      priority: master.priority || current.priority,
      dueIn: master.dueIn ?? current.dueIn,
      description: master.description || current.description,
    }));
  }

  /**
   * Puts the picked master task into the stage the form was opened for -- and
   * only that stage. It is the deliberate "Add Task" step that assigns a task to
   * a stage; nothing else on this page adds one behind the user's back.
   */
  function createMasterTask(event) {
    event.preventDefault();
    const stageId = taskModalStageId;
    const target = stages.find((stage) => stage.id === stageId);
    if (!target) {
      setFormError("Open a lead stage and use its Add Task to add a task to it.");
      return;
    }
    const master = masterById.get(String(masterTask.masterTaskId));
    if (!master) {
      setFormError("Select a task name.");
      return;
    }
    const name = master.name || master.title;
    if (stageHasMaster(target, master.id)) {
      setFormError(`${name} is already in ${target.name}.`);
      return;
    }

    commitStages((current) =>
      current.map((stage) => {
        if (stage.id !== stageId) return stage;
        return {
          ...stage,
          tasks: [
            ...stage.tasks,
            {
              id: Date.now(),
              name,
              // The link the server's stage automation reads.
              masterTaskId: master.id,
              description: masterTask.description.trim() || "New stage task",
              role: masterTask.role || "Tele Caller Executive",
              department: masterTask.department || "Any",
              priority: masterTask.priority,
              time: masterTask.time,
              order: stage.tasks.length,
              required: true,
              autoCreate: true,
              repeats: Number(masterTask.repeats) || 1,
              dueIn: Number(masterTask.dueIn) || 0,
            },
          ],
        };
      })
    );
    refreshRoleTasks();
    closeTaskModal();
    triggerSaveToast();
  }

  function deleteTask(stageId, taskId) {
    commitStages((current) =>
      current.map((stage) =>
        stage.id === stageId
          ? {
              ...stage,
              tasks: stage.tasks.filter((task) => task.id !== taskId),
            }
          : stage
      )
    );
    refreshRoleTasks();
    triggerSaveToast();
  }

  /**
   * Task Roles rows are master tasks (`/crm/master-tasks/`), so a save rewrites
   * the library row -- the same one the Tasks Master page lists. The server
   * keeps each master's linked stage tasks in step, hence the re-read.
   */
  function saveMaster(masterId, patch) {
    return useCrmStore
      .getState()
      .updateRecord('masterTasks', masterId, patch)
      .then(() => useCrmStore.getState().refresh('stageTasks'))
      .catch((err) => {
        console.warn('[CRM] could not save master task:', err?.message || err);
        showWarning("Could not save the task. Please try again.");
        throw err;
      });
  }

  function updateRoleTask(taskId, patch) {
    setRoleDrafts((prev) => ({ ...prev, [taskId]: { ...prev[taskId], ...patch } }));
  }

  function saveRoleTask(taskId) {
    const patch = roleDrafts[taskId];
    const task = masterById.get(String(taskId));
    if (!patch || !task) {
      triggerSaveToast();
      return;
    }
    saveMaster(taskId, { ...task, ...patch })
      .then(() => {
        setRoleDrafts((prev) => {
          const next = { ...prev };
          delete next[taskId];
          return next;
        });
        triggerSaveToast();
      })
      .catch(() => {});
  }

  function updateTask(stageId, taskId, key, value) {
    updateTaskFields(stageId, taskId, { [key]: value });
  }

  /** Several fields in one save (two separate saves raced and reverted). */
  function updateTaskFields(stageId, taskId, patch) {
    commitStages((current) =>
      current.map((stage) =>
        stage.id === stageId
          ? {
              ...stage,
              tasks: stage.tasks.map((task) =>
                task.id === taskId ? { ...task, ...patch } : task
              ),
            }
          : stage
      )
    );
  }

  function toggleStage(stageId) {
    setOpenStages((current) =>
      current.includes(stageId)
        ? current.filter((id) => id !== stageId)
        : [...current, stageId]
    );
  }

  function triggerSaveToast() {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  }

  /** The stages a master task is already used in, for the Task Roles table. */
  const roleStageNames = useMemo(() => {
    const byId = new Map(stages.map((stage) => [String(stage.id), stage.name]));
    return (task) =>
      (task.stages || [])
        .map((id) => byId.get(String(id)) || String(id))
        .filter(Boolean)
        .join(', ');
  }, [stages]);

  return (
    <section className="w-full space-y-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Leads</h2>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
          <div>
            <div className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
              <span>CRM</span>
              <span>&gt;</span>
              <span>Leads</span>
              <span>&gt;</span>
              <span className="text-slate-600 font-semibold">Lead Stage Tasks</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Lead Stage Tasks
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Assign and manage tasks for each lead stage. When a lead moves to a stage, selected tasks are created automatically.
            </p>
          </div>

          <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="btn-outline h-9 px-3.5 rounded-xl text-xs font-semibold inline-flex items-center gap-2"
              aria-label="How to create lead stage tasks"
            >
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#1f6bff] text-[11px] font-bold text-white">?</span>
              <span>How to create lead stage tasks?</span>
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <span>Pipeline</span>
              <select
                value={pipeline}
                onChange={(e) => setPipeline(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 h-9 text-xs text-slate-700 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
              >
                <option>Sales</option>
                <option>Support</option>
              </select>
            </div>
            <button
              type="button"
              onClick={addTaskFromHeader}
              className="btn-primary h-9 px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus size={15} />
              Add Stage Task
            </button>
          </div>
        </div>
      </div>

      <InfoBanner
        storageKey="infoBannerLeadStageTasksV1"
        title="Why use Lead Stage Tasks?"
        text="These auto-create the right tasks when a lead enters a stage. You map tasks once, then every stage change creates follow-ups automatically."
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs mb-8 overflow-hidden">
        <div
          onClick={() => setIsTaskRolesOpen((prev) => !prev)}
          className="flex items-center justify-between gap-3 lg:gap-0 p-4 sm:p-5 cursor-pointer hover:bg-slate-50/50 transition select-none"
        >
          <div className="flex items-start gap-3">
            <span className="text-slate-500 mt-0.5">
              {isTaskRolesOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Task Roles</h3>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {roleTasks.length} Tasks
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tasks picked from the Master Lead Tasks library, each done by one role. A task
                only enters a lead stage when you add it there with that stage&apos;s Add Task.
              </p>
            </div>
          </div>
        </div>

        {isTaskRolesOpen && (
          <div className="border-t border-slate-100 overflow-x-auto">
            <table className="w-full min-w-[640px] lg:min-w-0 text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3">TASK</th>
                  <th className="px-4 py-3">ROLE</th>
                  <th className="px-4 py-3">DEPARTMENT</th>
                  <th className="px-4 py-3">DUE IN (DAYS)</th>
                  <th className="px-4 py-3">USED IN STAGES</th>
                  <th className="px-5 py-3 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roleTasks.map((saved) => {
                  const task = { ...saved, ...roleDrafts[saved.id] };
                  return (
                  <tr key={task.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5">
                      {/* The task's name is its identity here, so it is shown as
                          plain text rather than a picker over the shared list. */}
                      <div className="w-full max-w-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs truncate">
                        {task.name || task.title}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <select
                        value={task.role}
                        onChange={(e) => updateRoleTask(task.id, { role: e.target.value })}
                        className="w-full max-w-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                      >
                        <option>Tele Caller Executive</option>
                        <option>Sales Support Executive</option>
                        <option>BDE</option>
                        <option>Area Sales Manager</option>
                      </select>
                    </td>
                    <td className="px-4 py-3.5">
                      <select
                        value={task.department || "Any"}
                        onChange={(e) => updateRoleTask(task.id, { department: e.target.value })}
                        className="w-full max-w-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                      >
                        <option>Any</option>
                        <option>Sales</option>
                        <option>Support</option>
                      </select>
                    </td>
                    <td className="px-4 py-3.5">
                      <input
                        type="number"
                        min="0"
                        value={task.dueIn ?? 0}
                        onChange={(e) =>
                          updateRoleTask(task.id, { dueIn: Number(e.target.value) || 0 })
                        }
                        className="w-24 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 shadow-2xs"
                      />
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {roleStageNames(task) || <span className="text-slate-300">Not added to a stage yet</span>}
                    </td>
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => saveRoleTask(task.id)}
                          className="btn-primary btn-sm"
                        >
                          Save
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
                {roleTasks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                      No tasks in Task Roles yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mb-4 scroll-mt-4" ref={stageSectionRef}>
        <h3 className="text-sm font-bold text-slate-900">Lead Stage Tasks</h3>
        <p className="text-xs text-slate-500 mt-0.5 mb-3.5">
          Configure the tasks that are created when a lead enters each stage.
        </p>
        {showStageHint && (
          <div className="mb-3.5 px-3.5 py-2.5 rounded-xl border border-blue-100 bg-blue-50 text-xs text-blue-700">
            Open a stage below and use its Add Task to add a task to that stage.
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 p-1 bg-slate-50/50 rounded-2xl border border-slate-200/80 mb-5">
          {stages.map((stage, idx) => {
            const theme = STAGE_THEMES[idx] ?? STAGE_THEMES[0];
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => toggleStage(stage.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer select-none truncate ${theme.ribbonBg}`}
              >
                <span className="w-4.5 h-4.5 rounded-full bg-white/25 flex items-center justify-center text-[10px] shrink-0 font-bold">
                  {idx + 1}
                </span>
                <span className="truncate">{stage.name}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-3.5">
          {stages.map((stage, idx) => {
            const isOpen = openStages.includes(stage.id);
            const theme = STAGE_THEMES[idx] ?? STAGE_THEMES[0];
            const draft = getDraft(stage.id);

            return (
              <div
                key={stage.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition"
              >
                <div
                  onClick={() => toggleStage(stage.id)}
                  className={`flex items-center justify-between gap-2 lg:gap-0 px-4 sm:px-5 py-3 cursor-pointer transition select-none ${theme.headerBg}`}
                >
                  <div className="flex flex-wrap lg:flex-nowrap items-center gap-2.5 min-w-0 lg:min-w-auto">
                    <span className="text-slate-600">
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${theme.badgeBg}`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-sm font-bold text-slate-900">{stage.name}</span>
                    <span className="text-xs text-slate-400 font-normal">
                      {stage.tasks.length} Tasks
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      addTask(stage.id);
                    }}
                    className="btn-outline h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} />
                    Add Task
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-slate-100 overflow-x-auto">
                    <table className="w-full min-w-[900px] lg:min-w-0 text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-white border-b border-slate-100 text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                          <th className="px-3 py-3 w-64">TASK</th>
                          <th className="px-3 py-3">ROLE</th>
                          <th className="px-3 py-3 w-28">ORDER</th>
                          <th className="px-3 py-3 w-24 text-center">REQUIRED</th>
                          <th className="px-3 py-3 w-28 text-center">
                            <div>AUTO CREATE</div>
                            <div className="text-[9px] font-normal text-slate-400 normal-case tracking-normal mt-0.5">Auto-created when lead enters stage</div>
                          </th>
                          <th className="px-3 py-3 w-32">MAX REPEATS</th>
                          <th className="px-3 py-3 w-32">DUE IN (DAYS)</th>
                          <th className="px-3 py-3 w-40 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {stage.tasks.map((task) => {
                          const currentRole = task.role || TASK_ROLE_MAP[task.name] || "Tele Caller Executive";
                          return (
                            <tr key={task.id} className="hover:bg-slate-50/50 transition">
                              <td className="px-3 py-2.5">
                                <select
                                  value={task.masterTaskId != null ? String(task.masterTaskId) : ""}
                                  onChange={(e) => {
                                    const linked = fieldsForMaster(e.target.value, task.role);
                                    if (!linked) return;
                                    if (stageHasMaster(stage, linked.masterTaskId, task.id)) {
                                      showWarning(`${linked.name} is already in ${stage.name}.`);
                                      return;
                                    }
                                    updateTaskFields(stage.id, task.id, linked);
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                                >
                                  <TaskNameOptions
                                    options={masterOptions}
                                    status={libraryStatus}
                                    current={{
                                      value: task.masterTaskId != null ? String(task.masterTaskId) : "",
                                      label: task.name || task.title,
                                    }}
                                  />
                                </select>
                              </td>
                              <td className="px-3 py-2.5 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-1 bg-[#22b7c6] text-white text-xs font-semibold rounded-md shadow-2xs">
                                  {currentRole}
                                </span>
                              </td>
                              <td className="px-3 py-2.5">
                                <input
                                  type="number"
                                  value={task.order}
                                  onChange={(e) =>
                                    updateTask(stage.id, task.id, "order", Number(e.target.value))
                                  }
                                  className="w-20 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 text-center focus:outline-none focus:border-blue-500 shadow-2xs"
                                />
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={task.required}
                                  onChange={(e) =>
                                    updateTask(stage.id, task.id, "required", e.target.checked)
                                  }
                                  className="w-4 h-4 text-[#0f4c81] rounded border-slate-300 cursor-pointer"
                                />
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={task.autoCreate}
                                  onChange={(e) =>
                                    updateTask(stage.id, task.id, "autoCreate", e.target.checked)
                                  }
                                  className="w-4 h-4 text-[#0f4c81] rounded border-slate-300 cursor-pointer"
                                />
                              </td>
                              <td className="px-3 py-2.5">
                                <input
                                  type="text"
                                  value={task.repeats ?? ""}
                                  onChange={(e) =>
                                    updateTask(stage.id, task.id, "repeats", e.target.value)
                                  }
                                  className="w-24 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
                                />
                              </td>
                              <td className="px-3 py-2.5">
                                <input
                                  type="text"
                                  value={task.dueIn ?? ""}
                                  onChange={(e) =>
                                    updateTask(stage.id, task.id, "dueIn", e.target.value)
                                  }
                                  className="w-24 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
                                />
                              </td>
                              <td className="px-3 py-2.5 whitespace-nowrap text-right">
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => triggerSaveToast()}
                                    className="btn-primary btn-sm"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteTask(stage.id, task.id)}
                                    className="btn-danger btn-sm"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        <tr className="bg-white hover:bg-slate-50/50 transition">
                          <td className="px-3 py-2.5">
                            <select
                              value={draft.masterTaskId}
                              onChange={(e) => updateDraft(stage.id, "masterTaskId", e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
                            >
                              <TaskNameOptions options={masterOptions} status={libraryStatus} />
                            </select>
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-1 bg-transparent text-transparent text-xs font-semibold rounded-md min-w-[20px]">
                              &nbsp;
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              type="number"
                              value={draft.order}
                              onChange={(e) =>
                                updateDraft(stage.id, "order", Number(e.target.value))
                              }
                              className="w-20 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 text-center focus:outline-none focus:border-blue-500 shadow-2xs"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={draft.required}
                              onChange={(e) => updateDraft(stage.id, "required", e.target.checked)}
                              className="w-4 h-4 text-[#0f4c81] rounded border-slate-300 cursor-pointer"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={draft.autoCreate}
                              onChange={(e) =>
                                updateDraft(stage.id, "autoCreate", e.target.checked)
                              }
                              className="w-4 h-4 text-[#0f4c81] rounded border-slate-300 cursor-pointer"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              type="text"
                              placeholder="default"
                              value={draft.repeats}
                              onChange={(e) => updateDraft(stage.id, "repeats", e.target.value)}
                              className="w-24 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              type="text"
                              placeholder="default"
                              value={draft.dueIn}
                              onChange={(e) => updateDraft(stage.id, "dueIn", e.target.value)}
                              className="w-24 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
                            />
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-right">
                            <button
                              type="button"
                              onClick={() => addDraftTask(stage.id)}
                              className="btn-primary btn-sm inline-flex items-center gap-1"
                            >
                              <Plus size={13} /> Add
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {taskModalStageId !== null && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4"
          role="presentation"
          onMouseDown={closeTaskModal}
        >
          <form
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden"
            onSubmit={createMasterTask}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                Add Task to {stages.find((stage) => stage.id === taskModalStageId)?.name || "a Lead Stage"}
              </h2>
              <button
                type="button"
                onClick={closeTaskModal}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-1"
                aria-label="Close task form"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Name <span className="text-rose-500">*</span>
                </label>
                <select
                  autoFocus
                  value={masterTask.masterTaskId}
                  onChange={(e) => pickMasterForForm(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 shadow-2xs text-slate-800 cursor-pointer"
                >
                  <TaskNameOptions options={masterOptions} status={libraryStatus} />
                </select>
                <LibraryError status={libraryStatus} onRetry={loadLibrary} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Performed By (Role)
                  </label>
                  <select
                    value={masterTask.role}
                    onChange={(e) => updateMasterTask("role", e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 shadow-2xs text-slate-800"
                  >
                    <option>Tele Caller Executive</option>
                    <option>Sales Support Executive</option>
                    <option>BDE</option>
                    <option>Area Sales Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={masterTask.department}
                    onChange={(e) => updateMasterTask("department", e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 shadow-2xs text-slate-800"
                  >
                    <option>Any</option>
                    <option>Sales</option>
                    <option>Support</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Priority
                  </label>
                  <select
                    value={masterTask.priority}
                    onChange={(e) => updateMasterTask("priority", e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 shadow-2xs text-slate-800"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Due In (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={masterTask.dueIn}
                    onChange={(e) => updateMasterTask("dueIn", e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 shadow-2xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Repeats
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={masterTask.repeats}
                    onChange={(e) => updateMasterTask("repeats", e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 shadow-2xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Time
                  </label>
                  <input
                    type="time"
                    value={masterTask.time}
                    onChange={(e) => updateMasterTask("time", e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 shadow-2xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={masterTask.description}
                  onChange={(e) => updateMasterTask("description", e.target.value)}
                  placeholder="Enter Description"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 shadow-2xs text-slate-800 resize-none"
                />
              </div>
              {formError && (
                <p className="text-xs font-medium text-rose-600" role="alert">{formError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-slate-50/70 border-t border-slate-100">
              <button
                type="button"
                onClick={closeTaskModal}
                className="btn-outline h-9 px-4 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary h-9 px-4 rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {saveSuccess && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl shadow-lg text-xs font-semibold">
          <CheckCircle2 size={16} />
          <span>Stage tasks updated successfully!</span>
        </div>
      )}
      {warning && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-rose-600 text-white rounded-xl shadow-lg text-xs font-semibold" role="alert">
          {warning}
        </div>
      )}
      <StageTasksGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </section>
  );
}
