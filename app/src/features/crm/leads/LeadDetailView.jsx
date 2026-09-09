import { useMemo, useState } from "react";
import { useERP } from "../../../context/ERPContext";
import {
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  FileStack,
  Info,
  ListChecks,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  CheckCircle,
} from "lucide-react";
import LeadAvatar from "./LeadAvatar";

const DETAIL_TABS = [
  "General",
  "Users & Products",
  "Sources & Emails",
  "Discussion & Notes",
  "Files",
  "Tasks",
  "Calls",
  "Estimates",
  "Delivery Challans",
  "Activity",
];

function formatAmount(value) {
  return `Rs. ${value.toLocaleString("en-IN")}`;
}

function metricCards() {
  return [
    { label: "Products", value: 1, icon: BriefcaseBusiness, tone: "pink" },
    { label: "Source", value: 1, icon: ClipboardList, tone: "green" },
    { label: "Files", value: 0, icon: FileStack, tone: "purple" },
    { label: "Open Tasks", value: 2, icon: ListChecks, tone: "amber" },
    { label: "Calls", value: 0, icon: Phone, tone: "blue" },
    { label: "Estimates", value: 0, icon: CalendarDays, tone: "teal" },
    { label: "Delivery Challans", value: 0, icon: ClipboardList, tone: "orange" },
  ];
}

function fieldRows(lead) {
  return [
    ["Company", lead.company],
    ["First Name", lead.name.split(" ")[0]],
    ["Last Name", lead.name.split(" ")[1] ?? "-"],
    ["Title", lead.jobTitle],
    ["Email", lead.email],
    ["Phone", `+91 ${lead.phone}`],
    ["Mobile", `+91 ${lead.phone}`],
    ["Lead Source", lead.source],
    ["Lead Status", lead.status],
    ["Industry", lead.industry],
    ["Annual Revenue", formatAmount(lead.amount)],
    ["Website", `www.${lead.company.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`],
  ];
}

function addressRows(lead) {
  return [
    ["Address", `123, ${lead.city} Industrial Estate`],
    ["City", lead.city],
    ["State", lead.state],
    ["Country", lead.country],
    ["Zip Code", `39${String(4200 + lead.id).padStart(3, "0")}`],
  ];
}

const ACTIVITY = [
  { title: "Stage updated to Qualified", time: "2 hours ago", tone: "purple" },
  { title: "Task created - Follow up call", time: "5 hours ago", tone: "amber" },
  { title: "Email sent to lead", time: "1 day ago", tone: "blue" },
  { title: "Lead record updated", time: "2 days ago", tone: "green" },
];

function buildUsers(lead) {
  return [
    { id: 1, name: "Priya Patel", initials: "PP", email: "priya@company.com", role: "Sales Executive", status: "Active", color: "#d783f7" },
    { id: 2, name: "Jayesh Nair", initials: "JN", email: "jayesh@company.com", role: "Pre Sales", status: "Active", color: "#c7a93f" },
    { id: 3, name: "Chetan Chaudhari", initials: "CC", email: "chetan@company.com", role: "Technical", status: "Active", color: "#59a8ee" },
    { id: 4, name: "Anuska Shah", initials: "AS", email: "anuska@company.com", role: "Support", status: "Inactive", color: "#13b0b5" },
    { id: 5, name: "Utsav Faldu", initials: "UF", email: "utsav@company.com", role: "Manager", status: "Active", color: "#6da7ff" },
  ].map((user) => ({ ...user, leadCompany: lead.company }));
}

function buildProducts() {
  return [
    { id: 1, name: "Endoscopy Machine", sku: "END-001", price: 120000, qty: 1, status: "Active", category: "Machines" },
    { id: 2, name: "Monitor 4K", sku: "MON-004", price: 45000, qty: 2, status: "Active", category: "Accessories" },
    { id: 3, name: "Surgical Kit", sku: "SK-010", price: 25000, qty: 1, status: "Draft", category: "Accessories" },
  ];
}

function statusClass(value) {
  return value.toLowerCase() === "active" ? "green" : "amber";
}

function UsersProductsTab({ lead }) {
  const users = useMemo(() => buildUsers(lead), [lead]);
  const products = useMemo(() => buildProducts(), []);
  const [userSearch, setUserSearch] = useState("");
  const [userRole, setUserRole] = useState("All Users");
  const [productSearch, setProductSearch] = useState("");
  const [productCategory, setProductCategory] = useState("All Products");

  const userRoles = useMemo(
    () => ["All Users", ...new Set(users.map((user) => user.role))],
    [users],
  );
  const productCategories = useMemo(
    () => ["All Products", ...new Set(products.map((product) => product.category))],
    [products],
  );

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole = userRole === "All Users" || user.role === userRole;
      const matchesSearch =
        query.length === 0 ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query);

      return matchesRole && matchesSearch;
    });
  }, [userRole, userSearch, users]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        productCategory === "All Products" || product.category === productCategory;
      const matchesSearch =
        query.length === 0 ||
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [productCategory, productSearch, products]);

  return (
    <div className="lead-up-grid">
      <section className="lead-detail-card">
        <div className="lead-up-head">
          <h3>Users ({users.length})</h3>
          <button type="button" className="btn-primary">
            <Plus size={14} />
            Add User
          </button>
        </div>
        <div className="lead-up-filters">
          <label className="lead-up-search">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search users..."
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
            />
          </label>
          <select value={userRole} onChange={(event) => setUserRole(event.target.value)}>
            {userRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
        <div className="lead-up-table-wrap">
          <table className="lead-up-table">
            <thead>
              <tr>
                <th>#</th>
                <th>User Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length ? filteredUsers.map((user, index) => (
                <tr key={user.id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="lead-up-user-cell">
                      <span className="lead-up-initials" style={{ backgroundColor: user.color }}>
                        {user.initials}
                      </span>
                      <span>{user.name}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <span className={`lead-up-status ${statusClass(user.status)}`}>{user.status}</span>
                  </td>
                  <td>
                    <div className="lead-up-actions">
                      <button type="button" className="lead-up-icon-btn"><Pencil size={13} /></button>
                      <button type="button" className="lead-up-icon-btn danger">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="lead-up-empty">
                    No users found for this search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="lead-up-footer">
          Showing {filteredUsers.length ? 1 : 0} to {filteredUsers.length} of {users.length} entries
        </div>
      </section>

      <section className="lead-detail-card">
        <div className="lead-up-head">
          <h3>Products ({products.length})</h3>
          <button type="button" className="btn-primary">
            <Plus size={14} />
            Add Product
          </button>
        </div>
        <div className="lead-up-filters">
          <label className="lead-up-search">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search products..."
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
            />
          </label>
          <select
            value={productCategory}
            onChange={(event) => setProductCategory(event.target.value)}
          >
            {productCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div className="lead-up-table-wrap">
          <table className="lead-up-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length ? filteredProducts.map((product, index) => (
                <tr key={product.id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="lead-up-product-cell">
                      <span className="lead-up-product-thumb" />
                      <span>{product.name}</span>
                    </div>
                  </td>
                  <td>{product.sku}</td>
                  <td>{formatAmount(product.price)}</td>
                  <td>{product.qty}</td>
                  <td>
                    <span className={`lead-up-status ${statusClass(product.status)}`}>{product.status}</span>
                  </td>
                  <td>
                    <div className="lead-up-actions">
                      <button type="button" className="lead-up-icon-btn"><Pencil size={13} /></button>
                      <button type="button" className="lead-up-icon-btn danger">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="lead-up-empty">
                    No products found for this search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="lead-up-footer">
          Showing {filteredProducts.length ? 1 : 0} to {filteredProducts.length} of {products.length} entries
        </div>
      </section>

      <div className="lead-up-note">
        <Info size={16} />
        <span>
          You can add multiple users and products related to this lead. These will help you track interactions, quotations and final conversion.
        </span>
      </div>
    </div>
  );
}

function GeneralTab({ lead }) {
  return (
    <div className="lead-detail-grid">
      <section className="lead-detail-card">
        <h3>Lead Information</h3>
        <div className="lead-detail-table">
          {fieldRows(lead).map(([label, value]) => (
            <div key={label} className="lead-detail-row">
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="lead-detail-card">
        <h3>Address Information</h3>
        <div className="lead-detail-table">
          {addressRows(lead).map(([label, value]) => (
            <div key={label} className="lead-detail-row">
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <div className="lead-detail-mini-map">
          <div className="lead-detail-mini-pin">
            <MapPin size={18} />
          </div>
          <button type="button" className="lead-map-link-btn">View on Map</button>
        </div>
      </section>

      <section className="lead-detail-card">
        <div className="lead-detail-card-head">
          <h3>Recent Activity</h3>
          <button type="button" className="btn-outline">
            <Plus size={14} />
            Add
          </button>
        </div>
        <div className="lead-detail-activity">
          {ACTIVITY.map((item) => (
            <div key={item.title} className="lead-detail-activity-item">
              <span className={`lead-detail-activity-dot ${item.tone}`} />
              <div>
                <strong>{item.title}</strong>
                <span>{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function LeadDetailView({ lead, onBackToLeads }) {
  const [activeTab, setActiveTab] = useState("General");
  const { addCustomer, showToast } = useERP();
  const [isConverted, setIsConverted] = useState(lead?.status === 'Converted');

  if (!lead) return null;

  const cards = metricCards();

  function handleConvert() {
    if (isConverted) {
      showToast?.(`Lead is already converted to a Customer.`);
      return;
    }
    const customerName = lead.company ? `${lead.company}` : lead.name;
    addCustomer?.({
      name: customerName,
      contactPerson: lead.name,
      email: lead.email,
      phone: `+91 ${lead.phone}`,
      balance: 0,
      status: 'Active',
    });
    setIsConverted(true);
    showToast?.(`Lead "${lead.name}" successfully converted to Customer "${customerName}".`);
  }

  return (
    <section className="lead-detail-page">
      <div className="lead-detail-head">
        <div>
          <div className="builder-breadcrumb">
            Dashboard &gt; Leads &gt; {lead.name.replace(" (Sample)", "")}
          </div>
          <h1>{lead.name.replace(" (Sample)", "")}</h1>
        </div>
        <div className="lead-detail-head-actions">
          <button type="button" className="btn-outline" onClick={onBackToLeads}>
            Back
          </button>
          <button
            type="button"
            className={isConverted ? "btn-primary" : "btn-outline"}
            onClick={handleConvert}
          >
            <CheckCircle size={15} />
            {isConverted ? "Converted to Customer" : "Convert to Customer"}
          </button>
        </div>
      </div>

      <div className="lead-detail-hero">
        <div className="lead-detail-profile">
          <LeadAvatar lead={lead} className="lead-detail-main-avatar" />
          <div className="lead-detail-profile-copy">
            <div className="lead-detail-name-row">
              <strong>{lead.name.replace(" (Sample)", "")}</strong>
              <span className={`lead-status-chip ${isConverted ? 'green' : 'purple'}`}>
                {isConverted ? 'Converted' : (lead.status || 'Qualified')}
              </span>
            </div>
            <span>{lead.company}</span>
            <div className="lead-detail-inline">
              <span><Phone size={14} /> +91 {lead.phone}</span>
              <span><Mail size={14} /> {lead.email}</span>
              <span><MapPin size={14} /> {lead.city}, {lead.state}, {lead.country}</span>
            </div>
          </div>
        </div>

        <div className="lead-detail-side-meta">
          <div><span>Lead Number</span><strong>L00000{lead.id + 175}</strong></div>
          <div><span>Source</span><strong>{lead.source}</strong></div>
          <div><span>Created On</span><strong>{lead.createdOn}</strong></div>
        </div>
      </div>

      <div className="lead-detail-metrics">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className={`lead-detail-metric ${card.tone}`}>
              <span className="lead-detail-metric-icon">
                <Icon size={16} />
              </span>
              <div>
                <strong>{card.label}</strong>
                <span>{card.value}</span>
              </div>
            </article>
          );
        })}
      </div>

      <div className="lead-detail-tabs">
        {DETAIL_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Users & Products" ? <UsersProductsTab lead={lead} /> : <GeneralTab lead={lead} />}
    </section>
  );
}
