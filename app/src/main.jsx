import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
const App = lazy(() => import('./App.jsx'));
const PublicContractSigningPage = lazy(() => import('./features/crm/contracts/PublicContractSigningPage.jsx'));
const signingPage = window.location.pathname.startsWith('/contracts/sign/');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={<p className="p-8">Loading…</p>}>{signingPage ? <PublicContractSigningPage /> : <App />}</Suspense>
  </StrictMode>
);
