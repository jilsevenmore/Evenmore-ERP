import { ERPProvider } from './context/ERPContext';
import AppRouter from './routes/index';

/**
 * Evenmore Unified Application
 * 
 * Architecture:
 *   ERPProvider (ERP global state — context API)
 *   └── AppRouter (react-router-dom v7)
 *        └── MainLayout (CRM-styled shell)
 *             ├── Sidebar (unified navigation)
 *             ├── Topbar (search + profile)
 *             └── Routes (all CRM + HRMS + ERP pages)
 * 
 * Global UI state (auth, toast, sidebar) is in Zustand (appStore).
 * ERP domain data is in ERPContext (Context API, localStorage persisted).
 * HRMS data is mock-driven + hrmsStore (Zustand).
 * CRM data is mock-driven (mockLeads, leadFormSchema).
 */
export default function App() {
  return (
    <ERPProvider>
      <AppRouter />
    </ERPProvider>
  );
}
