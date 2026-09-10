import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

// ── CRM ─────────────────────────────────────────────────────
import LeadsPage from '../features/crm/leads/LeadsPage';
import LeadDetailPage from '../features/crm/leads/LeadDetailPage';
import LeadFormBuilderPage from '../features/crm/leads/LeadFormBuilderPage';
import DynamicLeadFormPage from '../features/crm/leads/DynamicLeadFormPage';
import TasksPage from '../features/crm/tasks/TasksPage';
import CRMDashboard from '../features/crm/dashboard/CRMDashboard';
import DealsPage from '../features/crm/deals/DealsPage';
import UserAllocationPage from '../features/crm/allocation/UserAllocationPage';
import CRMSystemSetupPage from '../features/crm/setup/CRMSystemSetupPage';

// ── HRMS ─────────────────────────────────────────────────────
import HRMSDashboard from '../features/hrms/dashboard/Dashboard';
import Employees from '../features/hrms/employees/Employees';
import AttendanceOverview from '../features/hrms/attendance/Overview';
import MarkAttendance from '../features/hrms/attendance/MarkAttendance';
import IndividualAttendance from '../features/hrms/attendance/IndividualAttendance';
import BulkAttendance from '../features/hrms/attendance/BulkAttendance';
import Requests from '../features/hrms/attendance/Requests';
import Flexibility from '../features/hrms/attendance/Flexibility';
import Leave from '../features/hrms/leave/Leave';
import Payroll from '../features/hrms/payroll/Payroll';
import RecruitmentDashboard from '../features/hrms/recruitment/RecruitmentDashboard';
import Jobs from '../features/hrms/recruitment/Jobs';
import JobDetails from '../features/hrms/recruitment/JobDetails';
import Candidates from '../features/hrms/recruitment/Candidates';
import CandidateDetails from '../features/hrms/recruitment/CandidateDetails';
import Interviews from '../features/hrms/recruitment/Interviews';
import InterviewDetails from '../features/hrms/recruitment/InterviewDetails';
import Applications from '../features/hrms/recruitment/Applications';
import Offers from '../features/hrms/recruitment/Offers';
import Onboarding from '../features/hrms/recruitment/Onboarding';
import Career from '../features/hrms/recruitment/Career';
import CustomQuestions from '../features/hrms/recruitment/CustomQuestions';
import RecruitmentFunnel from '../features/hrms/recruitment/RecruitmentFunnel';
import PerformanceDashboard from '../features/hrms/performance/Dashboard';
import Indicators from '../features/hrms/performance/Indicators';
import KpiData from '../features/hrms/performance/KpiData';
import Appraisal from '../features/hrms/performance/Appraisal';
import AppraisalFunnel from '../features/hrms/performance/AppraisalFunnel';
import GoalTracking from '../features/hrms/performance/GoalTracking';
import GoalFunnel from '../features/hrms/performance/GoalFunnel';
import TrainingList from '../features/hrms/performance/TrainingList';
import TrainingFunnel from '../features/hrms/performance/TrainingFunnel';
import Trainers from '../features/hrms/performance/Trainers';
import TrainingDashboard from '../features/hrms/performance/TrainingDashboard';
import OrgChartPage from '../features/hrms/organization/OrgChartPage';
import DepartmentsPage from '../features/hrms/organization/DepartmentsPage';
import DesignationsPage from '../features/hrms/organization/DesignationsPage';
import LocationsPage from '../features/hrms/organization/LocationsPage';
import AssetsPage from '../features/hrms/organization/AssetsPage';
import DocumentsPage from '../features/hrms/organization/DocumentsPage';
import { CompanyPolicy, CalendarPage, HrmsSetup, HRAdminPage } from '../features/hrms/organization/SimplePages';
import { Generic } from '../features/hrms/Generic';

// ── ERP — Sales ───────────────────────────────────────────────
import { QuotationsPage } from '../features/sales/QuotationsPage';
import { SalesOrdersPage } from '../features/sales/SalesOrdersPage';
import { SalesInvoicesPage } from '../features/sales/SalesInvoicesPage';
import { SalesReturnsPage } from '../features/sales/SalesReturnsPage';
import { PaymentInPage } from '../features/sales/PaymentInPage';
import { DeliveryChallansPage } from '../features/sales/DeliveryChallansPage';

// ── ERP — Purchase ────────────────────────────────────────────
import { PurchaseOrdersPage } from '../features/purchase/PurchaseOrdersPage';
import { PurchaseBillsPage } from '../features/purchase/PurchaseBillsPage';
import { PurchaseReturnsPage } from '../features/purchase/PurchaseReturnsPage';
import { PaymentOutPage } from '../features/purchase/PaymentOutPage';
import { ExpensesPage } from '../features/purchase/ExpensesPage';

// ── ERP — Inventory ───────────────────────────────────────────
import { ItemsMasterPage } from '../features/inventory/ItemsMasterPage';
import { AddEditItemPage } from '../features/inventory/AddEditItemPage';
import { CategoriesPage } from '../features/inventory/CategoriesPage';
import { StockPositionPage } from '../features/inventory/StockPositionPage';
import { TransfersPage } from '../features/inventory/TransfersPage';
import { LocationsPage as ERPLocationsPage } from '../features/inventory/LocationsPage';
import { FaultyPartsPage } from '../features/inventory/FaultyPartsPage';
import { ServiceUsagePage } from '../features/inventory/ServiceUsagePage';
import { ZoneRequestsPage } from '../features/inventory/ZoneRequestsPage';
import { ValuationAgeingPage } from '../features/inventory/ValuationAgeingPage';
import { MonthEndAuditPage } from '../features/inventory/MonthEndAuditPage';

// ── ERP — Parties ─────────────────────────────────────────────
import PartiesPage from '../features/parties/PartiesPage';
import { CustomersPage } from '../features/parties/CustomersPage';
import { VendorsPage } from '../features/parties/VendorsPage';

// ── ERP — Accounts ───────────────────────────────────────────
import { CashBankPage } from '../features/accounts/CashBankPage';
import { GeneralLedgerPage } from '../features/accounts/GeneralLedgerPage';
import FinancialReportsPage from '../features/accounts/FinancialReportsPage';

// ── ERP — Reports & Settings ──────────────────────────────────
import { ReportsPage } from '../features/reports/ReportsPage';
import { SettingsPage } from '../features/settings/SettingsPage';

// ── Administration ────────────────────────────────────────────
import UsersPage from '../features/administration/UsersPage';
import RolesPage from '../features/administration/RolesPage';

// ── Main Dashboard ────────────────────────────────────────────
import { DashboardPage } from '../features/sales/DashboardPage';

function Page({ component: Component }) {
  return (
    <ErrorBoundary>
      <Component />
    </ErrorBoundary>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 32, maxWidth: 480, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <h2 style={{ color: '#0f172a', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Application Encountered an Issue</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>An unexpected error occurred while loading this view.</p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            style={{ background: '#1f6bff', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    ),
    children: [
      // Root redirect
      { index: true, element: <Navigate to="/dashboard" replace /> },

      // ── Main Dashboard ─────────────────────────────────────
      { path: 'dashboard', element: <Page component={DashboardPage} /> },

      // ── CRM ───────────────────────────────────────────────
      { path: 'crm', element: <Navigate to="/crm/leads" replace /> },
      { path: 'crm/dashboard', element: <Page component={CRMDashboard} /> },
      { path: 'crm/leads', element: <Page component={LeadsPage} /> },
      { path: 'crm/leads/:id', element: <Page component={LeadDetailPage} /> },
      { path: 'crm/leads/form-builder', element: <Page component={LeadFormBuilderPage} /> },
      { path: 'crm/leads/create-form', element: <Page component={DynamicLeadFormPage} /> },
      { path: 'crm/customers', element: <Page component={CustomersPage} /> },
      { path: 'crm/tasks', element: <Page component={TasksPage} /> },
      { path: 'crm/deals', element: <Page component={DealsPage} /> },
      { path: 'crm/user-allocation', element: <Page component={UserAllocationPage} /> },
      { path: 'crm/system-setup', element: <Page component={CRMSystemSetupPage} /> },
      { path: 'crm/quotations', element: <Page component={QuotationsPage} /> },

      // ── Sales ─────────────────────────────────────────────
      { path: 'sales', element: <Navigate to="/sales/quotations" replace /> },
      { path: 'sales/quotations', element: <Page component={QuotationsPage} /> },
      { path: 'sales/orders', element: <Page component={SalesOrdersPage} /> },
      { path: 'sales/invoices', element: <Page component={SalesInvoicesPage} /> },
      { path: 'sales/returns', element: <Page component={SalesReturnsPage} /> },
      { path: 'sales/payments', element: <Page component={PaymentInPage} /> },
      { path: 'sales/delivery', element: <Page component={DeliveryChallansPage} /> },

      // ── Purchase ──────────────────────────────────────────
      { path: 'purchase', element: <Navigate to="/purchase/orders" replace /> },
      { path: 'purchase/vendors', element: <Page component={VendorsPage} /> },
      { path: 'purchase/orders', element: <Page component={PurchaseOrdersPage} /> },
      { path: 'purchase/bills', element: <Page component={PurchaseBillsPage} /> },
      { path: 'purchase/returns', element: <Page component={PurchaseReturnsPage} /> },
      { path: 'purchase/payments', element: <Page component={PaymentOutPage} /> },
      { path: 'purchase/expenses', element: <Page component={ExpensesPage} /> },

      // ── Parties Directory ──────────────────────────────────
      { path: 'parties', element: <Page component={PartiesPage} /> },

      // ── Inventory ─────────────────────────────────────────
      { path: 'inventory', element: <Navigate to="/inventory/items" replace /> },
      { path: 'inventory/items', element: <Page component={ItemsMasterPage} /> },
      { path: 'inventory/items/machines', element: <Page component={ItemsMasterPage} /> },
      { path: 'inventory/items/stock', element: <Page component={ItemsMasterPage} /> },
      { path: 'inventory/machines', element: <Navigate to="/inventory/items/machines" replace /> },
      { path: 'inventory/items/new', element: <Page component={AddEditItemPage} /> },
      { path: 'inventory/items/edit/:id', element: <Page component={AddEditItemPage} /> },
      { path: 'inventory/categories', element: <Page component={CategoriesPage} /> },
      { path: 'inventory/categories/machines', element: <Page component={CategoriesPage} /> },
      { path: 'inventory/categories/machine', element: <Navigate to="/inventory/categories/machines" replace /> },
      { path: 'inventory/categories/stock', element: <Page component={CategoriesPage} /> },
      { path: 'inventory/stock-position', element: <Page component={StockPositionPage} /> },
      { path: 'inventory/stock', element: <Navigate to="/inventory/stock-position" replace /> },
      { path: 'inventory/transfers', element: <Page component={TransfersPage} /> },
      { path: 'inventory/locations', element: <Page component={ERPLocationsPage} /> },
      { path: 'inventory/faulty-parts', element: <Page component={FaultyPartsPage} /> },
      { path: 'inventory/service-usage', element: <Page component={ServiceUsagePage} /> },
      { path: 'inventory/zone-requests', element: <Page component={ZoneRequestsPage} /> },
      { path: 'inventory/valuation', element: <Page component={ValuationAgeingPage} /> },
      { path: 'inventory/audit', element: <Page component={MonthEndAuditPage} /> },

      // ── Legacy Root Aliases ───────────────────────────────
      { path: 'items', element: <Navigate to="/inventory/items" replace /> },
      { path: 'items/machines', element: <Navigate to="/inventory/items/machines" replace /> },
      { path: 'items/stock', element: <Navigate to="/inventory/items/stock" replace /> },
      { path: 'items/new', element: <Navigate to="/inventory/items/new" replace /> },
      { path: 'items/edit/:id', element: <Page component={AddEditItemPage} /> },
      { path: 'categories', element: <Navigate to="/inventory/categories" replace /> },
      { path: 'categories/machine', element: <Navigate to="/inventory/categories/machines" replace /> },
      { path: 'categories/machines', element: <Navigate to="/inventory/categories/machines" replace /> },
      { path: 'categories/stock', element: <Navigate to="/inventory/categories/stock" replace /> },
      { path: 'stock', element: <Navigate to="/inventory/stock-position" replace /> },

      // ── Accounts ──────────────────────────────────────────
      { path: 'accounts', element: <Navigate to="/accounts/cash-bank" replace /> },
      { path: 'accounts/cash-bank', element: <Page component={CashBankPage} /> },
      { path: 'accounts/general-ledger', element: <Page component={GeneralLedgerPage} /> },
      { path: 'accounts/reports', element: <Page component={FinancialReportsPage} /> },

      // ── HRMS ──────────────────────────────────────────────
      { path: 'hrms', element: <Navigate to="/hrms/dashboard" replace /> },
      { path: 'hrms/dashboard', element: <Page component={HRMSDashboard} /> },
      { path: 'hrms/employees', element: <Page component={Employees} /> },
      { path: 'hrms/attendance', element: <Page component={AttendanceOverview} /> },
      { path: 'hrms/attendance/mark', element: <Page component={MarkAttendance} /> },
      { path: 'hrms/attendance/individual', element: <Page component={IndividualAttendance} /> },
      { path: 'hrms/attendance/bulk', element: <Page component={BulkAttendance} /> },
      { path: 'hrms/attendance/requests', element: <Page component={Requests} /> },
      { path: 'hrms/attendance/flexibility', element: <Page component={Flexibility} /> },
      { path: 'hrms/leave', element: <Page component={Leave} /> },
      { path: 'hrms/payroll', element: <Page component={Payroll} /> },
      { path: 'hrms/recruitment', element: <Page component={RecruitmentDashboard} /> },
      { path: 'hrms/recruitment/jobs', element: <Page component={Jobs} /> },
      { path: 'hrms/recruitment/jobs/:id', element: <Page component={JobDetails} /> },
      { path: 'hrms/recruitment/candidates', element: <Page component={Candidates} /> },
      { path: 'hrms/recruitment/candidates/:id', element: <Page component={CandidateDetails} /> },
      { path: 'hrms/recruitment/interviews', element: <Page component={Interviews} /> },
      { path: 'hrms/recruitment/interviews/:id', element: <Page component={InterviewDetails} /> },
      { path: 'hrms/recruitment/applications', element: <Page component={Applications} /> },
      { path: 'hrms/recruitment/offers', element: <Page component={Offers} /> },
      { path: 'hrms/recruitment/onboarding', element: <Page component={Onboarding} /> },
      { path: 'hrms/recruitment/career', element: <Page component={Career} /> },
      { path: 'hrms/recruitment/questions', element: <Page component={CustomQuestions} /> },
      { path: 'hrms/recruitment/funnel', element: <Page component={RecruitmentFunnel} /> },
      { path: 'hrms/performance', element: <Page component={PerformanceDashboard} /> },
      { path: 'hrms/performance/indicators', element: <Page component={Indicators} /> },
      { path: 'hrms/performance/kpi-data', element: <Page component={KpiData} /> },
      { path: 'hrms/performance/appraisal', element: <Page component={Appraisal} /> },
      { path: 'hrms/performance/appraisal-funnel', element: <Page component={AppraisalFunnel} /> },
      { path: 'hrms/performance/goal-tracking', element: <Page component={GoalTracking} /> },
      { path: 'hrms/performance/goal-funnel', element: <Page component={GoalFunnel} /> },
      { path: 'hrms/training', element: <Page component={TrainingDashboard} /> },
      { path: 'hrms/training/list', element: <Page component={TrainingList} /> },
      { path: 'hrms/training/training-funnel', element: <Page component={TrainingFunnel} /> },
      { path: 'hrms/training/trainers', element: <Page component={Trainers} /> },
      { path: 'hrms/training/funnel', element: <Page component={TrainingFunnel} /> },
      { path: 'hrms/org-chart', element: <Page component={OrgChartPage} /> },
      { path: 'hrms/departments', element: <Page component={DepartmentsPage} /> },
      { path: 'hrms/designations', element: <Page component={DesignationsPage} /> },
      { path: 'hrms/locations', element: <Page component={LocationsPage} /> },
      { path: 'hrms/assets', element: <Page component={AssetsPage} /> },
      { path: 'hrms/documents', element: <Page component={DocumentsPage} /> },
      { path: 'hrms/company-policy', element: <Page component={CompanyPolicy} /> },
      { path: 'hrms/calendar', element: <Page component={CalendarPage} /> },
      { path: 'hrms/hrms-setup', element: <Page component={HrmsSetup} /> },
      { path: 'hrms/hr-admin', element: <Page component={HRAdminPage} /> },
      { path: 'hrms/hr-admin/terminations', element: <Page component={() => <HRAdminPage defaultTab="terminations" />} /> },
      { path: 'hrms/hr-admin/resignations', element: <Page component={() => <HRAdminPage defaultTab="resignations" />} /> },
      { path: 'hrms/hr-admin/complaints', element: <Page component={() => <HRAdminPage defaultTab="complaints" />} /> },
      { path: 'hrms/hr-admin/holidays', element: <Page component={() => <HRAdminPage defaultTab="holidays" />} /> },

      // ── Reports ───────────────────────────────────────────
      { path: 'reports', element: <Page component={ReportsPage} /> },

      // ── Administration ────────────────────────────────────
      { path: 'administration', element: <Navigate to="/administration/settings" replace /> },
      { path: 'administration/users', element: <Page component={UsersPage} /> },
      { path: 'administration/roles', element: <Page component={RolesPage} /> },
      { path: 'administration/settings', element: <Page component={SettingsPage} /> },

      // ── Catch-all ─────────────────────────────────────────
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
