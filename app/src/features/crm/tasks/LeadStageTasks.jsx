import { ChevronDown, ChevronRight, ClipboardCheck, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

const STAGE_COLORS = ["blue", "green", "amber", "pink", "purple", "indigo", "teal", "red"];
const INITIAL_STAGES = [
  { id: "new", name: "New Lead", tasks: [{ id: 1, name: "Call customer", description: "Initial call to understand requirements", role: "Tele Caller Executive", order: 1, required: true, autoCreate: true, repeats: 14, dueIn: 0 }] },
  { id: "details", name: "Details Collected", tasks: [{ id: 2, name: "Send email", description: "Share company brochure", role: "Sales Support Executive", order: 1, required: true, autoCreate: true, repeats: 6, dueIn: 0 }] },
  { id: "quotation", name: "Quotation Shared", tasks: [{ id: 3, name: "Send quotation", description: "Share quotation with client", role: "BDE", order: 1, required: true, autoCreate: true, repeats: 10, dueIn: 1 }, { id: 4, name: "Schedule demo", description: "Arrange product demo", role: "Area Sales Manager", order: 2, required: true, autoCreate: true, repeats: 6, dueIn: 2 }] },
  { id: "demo", name: "Demo Pending", tasks: [{ id: 5, name: "Client meeting", description: "Meeting at client office", role: "Sales Support Executive", order: 1, required: false, autoCreate: true, repeats: 6, dueIn: 3 }] },
  { id: "done", name: "Demo Done", tasks: [] },
  { id: "negotiation", name: "Negotiation", tasks: [{ id: 6, name: "Negotiate pricing", description: "Confirm commercial terms", role: "BDE", order: 1, required: true, autoCreate: false, repeats: 3, dueIn: 2 }] },
  { id: "won", name: "Won", tasks: [] },
  { id: "lost", name: "Lost", tasks: [] },
];

const EMPTY_MASTER_TASK = {
  name: "",
  role: "",
  priority: "Medium",
  dueIn: 0,
  time: "",
  department: "Any",
  repeats: 6,
  form: "None",
  description: "",
};

export default function LeadStageTasks({ leadForms = [] }) {
  const [stages, setStages] = useState(INITIAL_STAGES);
  const [openStages, setOpenStages] = useState(["new", "details"]);
  const [isTaskRolesOpen, setIsTaskRolesOpen] = useState(true);
  const [taskModalStageId, setTaskModalStageId] = useState(null);
  const [masterTask, setMasterTask] = useState(EMPTY_MASTER_TASK);

  function addTask(stageId) {
    setTaskModalStageId(stageId);
    setMasterTask(EMPTY_MASTER_TASK);
  }

  function closeTaskModal() {
    setTaskModalStageId(null);
  }

  function updateMasterTask(key, value) {
    setMasterTask((current) => ({ ...current, [key]: value }));
  }

  function createMasterTask(event) {
    event.preventDefault();
    if (!masterTask.name.trim()) return;
    setStages((current) => current.map((stage) => stage.id === taskModalStageId ? {
      ...stage,
      tasks: [...stage.tasks, {
        id: Date.now(),
        name: masterTask.name.trim(),
        description: masterTask.description.trim() || "New stage task",
        role: masterTask.role || "Sales Executive",
        department: masterTask.department,
        priority: masterTask.priority,
        time: masterTask.time,
        form: masterTask.form,
        order: stage.tasks.length + 1,
        required: true,
        autoCreate: true,
        repeats: Number(masterTask.repeats) || 0,
        dueIn: Number(masterTask.dueIn) || 0,
      }],
    } : stage));
    closeTaskModal();
  }

  function editTask(stageId, task) {
    const name = window.prompt("Enter task name", task.name);
    if (!name?.trim()) return;
    setStages((current) => current.map((stage) => stage.id === stageId ? { ...stage, tasks: stage.tasks.map((item) => item.id === task.id ? { ...item, name: name.trim() } : item) } : stage));
  }

  function deleteTask(stageId, taskId) {
    setStages((current) => current.map((stage) => stage.id === stageId ? { ...stage, tasks: stage.tasks.filter((task) => task.id !== taskId) } : stage));
  }

  function updateTask(stageId, taskId, key, value) {
    setStages((current) => current.map((stage) => stage.id === stageId ? { ...stage, tasks: stage.tasks.map((task) => task.id === taskId ? { ...task, [key]: value } : task) } : stage));
  }

  function toggleStage(stageId) {
    setOpenStages((current) => (current.includes(stageId) ? current.filter((id) => id !== stageId) : [...current, stageId]));
  }

  const tasks = stages.flatMap((stage) => stage.tasks.map((task) => ({ ...task, stageId: stage.id })));
  const taskFormOptions = [{ id: "", name: "None" }, ...leadForms];

  return (
    <section className="stage-tasks-page">
      <div className="stage-tasks-head">
        <div>
          <h1>Lead Stage Tasks</h1>
          <div className="stage-tasks-breadcrumb">Dashboard <span>&gt;</span> Lead Stage Tasks</div>
          <p>Assign and manage tasks for each lead stage. When a lead moves to a stage, selected tasks are created automatically.</p>
        </div>
        <div className="stage-tasks-head-actions">
          <label>Pipeline <select><option>Sales</option><option>Support</option></select></label>
          <button type="button" className="btn-primary" onClick={() => addTask(stages[0].id)}><Plus size={15} /> Add Stage Task</button>
        </div>
      </div>

      <section className="task-roles-panel">
        <button type="button" className="task-roles-head" onClick={() => setIsTaskRolesOpen((current) => !current)}>
          <span className="task-roles-chevron">{isTaskRolesOpen ? <ChevronDown size={17} /> : <ChevronRight size={17} />}</span>
          <div>
            <h2>Task Roles <small>{tasks.length} Tasks</small></h2>
            <p>Each task is done by one role. When a task is created on a lead it goes to whoever owns that role on the lead.</p>
          </div>
          <span className="task-roles-add" onClick={(event) => { event.stopPropagation(); addTask(stages[0].id); }}><Plus size={15} /> Add Task</span>
        </button>
        {isTaskRolesOpen && <div className="stage-task-table-wrap">
          <table className="task-roles-table">
            <thead><tr><th>Task</th><th>Role</th><th>Department</th><th>Max Repeats</th><th>Action</th></tr></thead>
            <tbody>{tasks.map((task) => <tr key={task.id}>
              <td><strong>{task.name}</strong></td>
              <td><select value={task.role} onChange={(event) => updateTask(task.stageId, task.id, "role", event.target.value)}><option>Tele Caller Executive</option><option>Sales Support Executive</option><option>Area Sales Manager</option><option>BDE</option></select></td>
              <td><select defaultValue="Any"><option>Any</option><option>Sales</option><option>Support</option></select></td>
              <td><input type="number" value={task.repeats} onChange={(event) => updateTask(task.stageId, task.id, "repeats", Number(event.target.value))} /></td>
              <td><button type="button" className="task-role-save" onClick={() => editTask(task.stageId, task)}>Save</button><button type="button" className="stage-task-icon danger" onClick={() => deleteTask(task.stageId, task.id)} aria-label="Delete task"><Trash2 size={14} /></button></td>
            </tr>)}</tbody>
          </table>
        </div>}
        {isTaskRolesOpen && tasks.length === 0 && <div className="task-roles-empty">No tasks added yet.</div>}
      </section>

      <section className="stage-tasks-under-roles">
        <div className="stage-tasks-subhead">
          <div><h2>Lead Stage Tasks</h2><p>Configure the tasks that are created when a lead enters each stage.</p></div>
        </div>
        <div className="stage-flow">
          {stages.map((stage, index) => <button type="button" key={stage.id} className={`stage-flow-item ${STAGE_COLORS[index]}`} onClick={() => toggleStage(stage.id)}><b>{index + 1}</b><span>{stage.name}</span></button>)}
        </div>
        <div className="stage-task-list">
          {stages.map((stage, index) => {
            const isOpen = openStages.includes(stage.id);
            return <section key={stage.id} className={`stage-task-section ${STAGE_COLORS[index]}`}>
              <button type="button" className="stage-task-section-head" onClick={() => toggleStage(stage.id)}>
                {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}<b>{index + 1}</b><strong>{stage.name}</strong><span>{stage.tasks.length} Tasks</span><em onClick={(event) => { event.stopPropagation(); addTask(stage.id); }}><Plus size={13} /> Add Task</em>
              </button>
              {isOpen && stage.tasks.length > 0 && <div className="stage-task-table-wrap"><table className="stage-task-table"><thead><tr><th>#</th><th>Task</th><th>Role</th><th>Order</th><th>Required</th><th>Auto Create</th><th>Max Repeats</th><th>Due In (Days)</th><th>Actions</th></tr></thead><tbody>{stage.tasks.map((task, taskIndex) => <tr key={task.id}><td>{taskIndex + 1}</td><td><strong><ClipboardCheck size={14} /> {task.name}</strong><small>{task.description}</small></td><td><select value={task.role} onChange={(event) => updateTask(stage.id, task.id, "role", event.target.value)}><option>Tele Caller Executive</option><option>Sales Executive</option><option>Sales Support Executive</option><option>BDE</option><option>Area Sales Manager</option></select></td><td><input type="number" value={task.order} onChange={(event) => updateTask(stage.id, task.id, "order", Number(event.target.value))} /></td><td><input type="checkbox" checked={task.required} onChange={(event) => updateTask(stage.id, task.id, "required", event.target.checked)} /></td><td><input type="checkbox" checked={task.autoCreate} onChange={(event) => updateTask(stage.id, task.id, "autoCreate", event.target.checked)} /></td><td><input type="number" value={task.repeats} onChange={(event) => updateTask(stage.id, task.id, "repeats", Number(event.target.value))} /></td><td><input type="number" value={task.dueIn} onChange={(event) => updateTask(stage.id, task.id, "dueIn", Number(event.target.value))} /></td><td><button type="button" className="stage-task-icon" onClick={() => editTask(stage.id, task)} aria-label="Edit task"><Pencil size={14} /></button><button type="button" className="stage-task-icon danger" onClick={() => deleteTask(stage.id, task.id)} aria-label="Delete task"><Trash2 size={14} /></button></td></tr>)}</tbody></table></div>}
            </section>;
          })}
        </div>
      </section>

      {taskModalStageId && <div className="modal-overlay master-task-overlay" role="presentation" onMouseDown={closeTaskModal}>
        <form className="master-task-modal" onSubmit={createMasterTask} onMouseDown={(event) => event.stopPropagation()}>
          <div className="master-task-modal-head">
            <h2>Create New Master Task</h2>
            <button type="button" className="modal-close" onClick={closeTaskModal} aria-label="Close task form"><X size={20} /></button>
          </div>
          <div className="master-task-modal-body">
            <label className="master-task-field master-task-name-field"><span>Task Name<sup>*</sup></span><input autoFocus value={masterTask.name} onChange={(event) => updateMasterTask("name", event.target.value)} placeholder="Enter Task Name" required /></label>
            <label className="master-task-field"><span>Performed By (Role)</span><select value={masterTask.role} onChange={(event) => updateMasterTask("role", event.target.value)}><option value="">Not set</option><option>Tele Caller Executive</option><option>Sales Executive</option><option>Sales Support Executive</option><option>BDE</option><option>Area Sales Manager</option></select><small>The task goes to whoever on the lead holds this role.</small></label>
            <label className="master-task-field"><span>Default Priority</span><select value={masterTask.priority} onChange={(event) => updateMasterTask("priority", event.target.value)}><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select></label>
            <label className="master-task-field"><span>Due In (days)</span><input type="number" min="0" value={masterTask.dueIn} onChange={(event) => updateMasterTask("dueIn", event.target.value)} /><small>0 means due today.</small></label>
            <label className="master-task-field"><span>Default Time</span><input type="time" value={masterTask.time} onChange={(event) => updateMasterTask("time", event.target.value)} /></label>
            <label className="master-task-field"><span>Department</span><select value={masterTask.department} onChange={(event) => updateMasterTask("department", event.target.value)}><option>Any</option><option>Sales</option><option>Support</option><option>Operations</option></select></label>
            <label className="master-task-field"><span>Max Repeats</span><input type="number" min="0" value={masterTask.repeats} onChange={(event) => updateMasterTask("repeats", event.target.value)} /><small>How many times this task may repeat in one stage.</small></label>
            <label className="master-task-field"><span>Default Task Form</span><select value={masterTask.form} onChange={(event) => updateMasterTask("form", event.target.value)}>{taskFormOptions.map((form) => <option key={form.id || "none"} value={form.id}>{form.name}</option>)}</select><small>Opened when the task is completed.</small></label>
            <label className="master-task-field master-task-field-wide"><span>Description</span><textarea rows={3} value={masterTask.description} onChange={(event) => updateMasterTask("description", event.target.value)} placeholder="Enter Description" /></label>
          </div>
          <div className="master-task-modal-actions"><button type="button" className="master-task-cancel" onClick={closeTaskModal}>Cancel</button><button type="submit" className="btn-primary">Create</button></div>
        </form>
      </div>}
    </section>
  );
}
