import PageHeader from "../../../components/ui/PageHeader";
import DataTable from "../../../components/ui/DataTable";
import StatusBadge from "../../../components/ui/StatusBadge";
const MOCK_CANDIDATES = [
  { id: "REC001", name: "Vikram Singh", role: "Senior Frontend Dev", dept: "Engineering", stage: "Technical Round", applied: "Oct 01, 2026", source: "LinkedIn", status: "Active" },
  { id: "REC002", name: "Aisha Rao", role: "Data Analyst", dept: "Finance", stage: "HR Interview", applied: "Sep 28, 2026", source: "Naukri", status: "Active" },
  { id: "REC003", name: "Tom Bradley", role: "Sales Manager", dept: "Sales", stage: "Offer Issued", applied: "Sep 20, 2026", source: "Referral", status: "Active" },
  { id: "REC004", name: "Deepa Menon", role: "UI Designer", dept: "Design", stage: "Rejected", applied: "Sep 15, 2026", source: "Website", status: "Inactive" }
];
const COLUMNS = [
  { key: "id", label: "Candidate ID" },
  { key: "name", label: "Candidate", sortable: true },
  { key: "role", label: "Applied Role", sortable: true },
  { key: "dept", label: "Department", sortable: true },
  { key: "stage", label: "Stage" },
  { key: "applied", label: "Applied On" },
  { key: "source", label: "Source" },
  { key: "status", label: "Status", render: (val) => <StatusBadge status={val} /> }
];
export default function Recruitment() {
  return <>
      <PageHeader
    title="Recruitment"
    subtitle="Manage candidate pipeline and hiring stages."
    breadcrumb={[{ label: "HRMS" }, { label: "Recruitment" }]}
    actions={<button type="button" className="btn-primary btn-sm">+ Add Candidate</button>}
  />
      <div className="section-wrap">
        <DataTable
    columns={COLUMNS}
    data={MOCK_CANDIDATES}
    rowKey="id"
    searchable
    searchPlaceholder="Search candidates..."
    emptyMessage="No candidates found."
    pageSize={10}
  />
      </div>
    </>;
}
