# Graph Report - frontend  (2026-09-10)

## Corpus Check
- Corpus is ~14,892 words - fits in a single context window. You may not need a graph.

## Summary
- 236 nodes · 358 edges · 14 communities (13 shown, 1 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- App Shell & Lead Modals
- Lead Data Operations
- Lead Detail Workspace
- Project Dependencies
- Custom Form Builder
- Lead Tabs & Sorting UI
- Notes & Discussions
- Stage & Task Kanban
- Lead Creation Modal
- Filtering & Mock Data
- Dashboard Analytics
- Navigation Sidebar
- Inline Table Editing
- Stat Cards

## God Nodes (most connected - your core abstractions)
1. `App()` - 39 edges
2. `lucide-react` - 24 edges
3. `DiscussionNotesTab()` - 14 edges
4. `react` - 13 edges
5. `LeadStageTasks()` - 10 edges
6. `LeadAvatar()` - 9 edges
7. `UsersProductsTab()` - 9 edges
8. `FilesTab()` - 6 edges
9. `LeadFormBuilder()` - 6 edges
10. `ColumnSelect()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `addLeadFormField()` --calls--> `createFieldFromType()`  [EXTRACTED]
  src/App.jsx → src/data/leadFormSchema.js
- `LeadAvatar()` --calls--> `initials()`  [EXTRACTED]
  src/components/LeadAvatar.jsx → src/data/mockLeads.js

## Import Cycles
- None detected.

## Communities (14 total, 1 thin omitted)

### Community 0 - "App Shell & Lead Modals"
Cohesion: 0.10
Nodes (24): lucide-react, react, getSortValue(), INITIAL_FILTERS, INITIAL_SORT, SORT_OPTIONS, DynamicLeadFormPage(), renderInput() (+16 more)

### Community 1 - "Lead Data Operations"
Cohesion: 0.06
Nodes (7): App(), closeDeleteLead(), deleteAllLeads(), deleteLead(), openCreateLeadModal(), openLeadCreateForm(), pinLead()

### Community 2 - "Lead Detail Workspace"
Cohesion: 0.09
Nodes (20): ACTIVITY, addressRows(), buildDiscussionThreads(), buildProducts(), buildSentFiles(), buildUsers(), DETAIL_TABS, DiscussionAvatar() (+12 more)

### Community 3 - "Project Dependencies"
Cohesion: 0.11
Nodes (18): dependencies, lucide-react, react, react-dom, devDependencies, vite, @vitejs/plugin-react, name (+10 more)

### Community 4 - "Custom Form Builder"
Cohesion: 0.17
Nodes (12): addLeadFormField(), FIELD_ICONS, FieldPreview(), handleDrop(), LeadFormBuilder(), handleDrop(), readDragPayload(), createField() (+4 more)

### Community 5 - "Lead Tabs & Sorting UI"
Cohesion: 0.16
Nodes (7): LeadsTabs(), RecordActionPanel(), ColumnSelect(), SortPopover(), handleEscape(), handleOutside(), tabs

### Community 6 - "Notes & Discussions"
Cohesion: 0.22
Nodes (9): DiscussionNotesTab(), appendSystemMessage(), handleCallAction(), handleMailAction(), handleNoteFormatting(), handleSendMessage(), handleUserAction(), updateThreadMessages() (+1 more)

### Community 7 - "Stage & Task Kanban"
Cohesion: 0.17
Nodes (6): EMPTY_MASTER_TASK, INITIAL_STAGES, LeadStageTasks(), closeTaskModal(), createMasterTask(), STAGE_COLORS

### Community 8 - "Lead Creation Modal"
Cohesion: 0.18
Nodes (4): CreateLeadModal(), MultiValueSelect(), PRODUCT_OPTIONS, USER_OPTIONS

### Community 9 - "Filtering & Mock Data"
Cohesion: 0.24
Nodes (9): CheckboxSection(), FilterPanel(), SYSTEM_DEFINED_FILTERS, toggleValue(), avatarPalette, leads, sourceFilters, stats (+1 more)

### Community 10 - "Dashboard Analytics"
Cohesion: 0.29
Nodes (8): ACTIVITY_ICONS, buildChart(), CARD_STYLES, DashboardView(), describeArc(), ICONS, polarToCartesian(), dashboardData

### Community 11 - "Navigation Sidebar"
Cohesion: 0.22
Nodes (3): ExpandableRow(), NAV, Sidebar()

### Community 12 - "Inline Table Editing"
Cohesion: 0.67
Nodes (3): EditableCell(), handleKeyDown(), save()

## Knowledge Gaps
- **33 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+28 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 106 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `App()` connect `Lead Data Operations` to `App Shell & Lead Modals`, `Custom Form Builder`?**
  _High betweenness centrality (0.280) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `App Shell & Lead Modals` to `Lead Detail Workspace`, `Project Dependencies`, `Custom Form Builder`, `Lead Tabs & Sorting UI`, `Stage & Task Kanban`, `Lead Creation Modal`, `Filtering & Mock Data`, `Dashboard Analytics`, `Navigation Sidebar`, `Stat Cards`?**
  _High betweenness centrality (0.212) - this node is a cross-community bridge._
- **Why does `react` connect `App Shell & Lead Modals` to `Lead Detail Workspace`, `Project Dependencies`, `Custom Form Builder`, `Lead Tabs & Sorting UI`, `Stage & Task Kanban`, `Lead Creation Modal`, `Filtering & Mock Data`, `Navigation Sidebar`?**
  _High betweenness centrality (0.172) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _33 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Shell & Lead Modals` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Lead Data Operations` be split into smaller, more focused modules?**
  _Cohesion score 0.06190476190476191 - nodes in this community are weakly interconnected._
- **Should `Lead Detail Workspace` be split into smaller, more focused modules?**
  _Cohesion score 0.08870967741935484 - nodes in this community are weakly interconnected._