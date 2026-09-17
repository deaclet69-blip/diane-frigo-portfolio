import { createHashRouter } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import RequirePermission from './components/RequirePermission';
import RequireAdmin from './components/RequireAdmin';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import StockListPage from './pages/stock/StockListPage';
import ProductDetailPage from './pages/stock/ProductDetailPage';
import StockEntryPage from './pages/stock/StockEntryPage';
import ProductsSettingsPage from './pages/parametres/ProductsSettingsPage';
import ClientsListPage from './pages/clients/ClientsListPage';
import ClientDetailPage from './pages/clients/ClientDetailPage';
import NewSalePage from './pages/ventes/NewSalePage';
import SalesListPage from './pages/ventes/SalesListPage';
import InvoiceDetailPage from './pages/ventes/InvoiceDetailPage';
import DepositsPage from './pages/depots/DepositsPage';
import FinancesPage from './pages/finances/FinancesPage';
import ChargesPage from './pages/finances/ChargesPage';
import PricingPage from './pages/finances/PricingPage';
import LossesPage from './pages/finances/LossesPage';
import LoansPage from './pages/finances/LoansPage';
import ReportsPage from './pages/rapports/ReportsPage';
import ParametresLayout from './pages/parametres/ParametresLayout';
import UsersSettingsPage from './pages/parametres/UsersSettingsPage';
import ImportExcelPage from './pages/parametres/ImportExcelPage';
import AuditLogsPage from './pages/parametres/AuditLogsPage';
import DangerZonePage from './pages/parametres/DangerZonePage';
import AiChatPage from './pages/assistant/AiChatPage';
import NotificationsPage from './pages/notifications/NotificationsPage';

export const router = createHashRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <RequirePermission perm="dashboard">
            <DashboardPage />
          </RequirePermission>
        ),
      },
      {
        path: 'stock',
        element: (
          <RequirePermission perm="stock">
            <StockListPage />
          </RequirePermission>
        ),
      },
      {
        path: 'stock/entree',
        element: (
          <RequirePermission perm="achats">
            <StockEntryPage />
          </RequirePermission>
        ),
      },
      {
        path: 'stock/:id',
        element: (
          <RequirePermission perm="stock">
            <ProductDetailPage />
          </RequirePermission>
        ),
      },
      {
        path: 'clients',
        element: (
          <RequirePermission perm="clients">
            <ClientsListPage />
          </RequirePermission>
        ),
      },
      {
        path: 'clients/:id',
        element: (
          <RequirePermission perm="clients">
            <ClientDetailPage />
          </RequirePermission>
        ),
      },
      {
        path: 'ventes',
        element: (
          <RequirePermission perm="ventes">
            <SalesListPage />
          </RequirePermission>
        ),
      },
      {
        path: 'ventes/nouvelle',
        element: (
          <RequirePermission perm="ventes">
            <NewSalePage />
          </RequirePermission>
        ),
      },
      {
        path: 'ventes/:id',
        element: (
          <RequirePermission perm="ventes">
            <InvoiceDetailPage />
          </RequirePermission>
        ),
      },
      {
        path: 'depots',
        element: (
          <RequirePermission perm="depots">
            <DepositsPage />
          </RequirePermission>
        ),
      },
      { path: 'finances', element: <FinancesPage /> },
      {
        path: 'finances/tarification',
        element: (
          <RequirePermission perm="rentabilite">
            <PricingPage />
          </RequirePermission>
        ),
      },
      {
        path: 'finances/pertes',
        element: (
          <RequirePermission perm="pertes">
            <LossesPage />
          </RequirePermission>
        ),
      },
      {
        path: 'finances/investissement',
        element: (
          <RequirePermission perm="investissement">
            <LoansPage />
          </RequirePermission>
        ),
      },
      {
        path: 'charges',
        element: (
          <RequirePermission perm="charges">
            <ChargesPage />
          </RequirePermission>
        ),
      },
      {
        path: 'rapports',
        element: (
          <RequirePermission perm="rapports">
            <ReportsPage />
          </RequirePermission>
        ),
      },
      {
        path: 'assistant',
        element: (
          <RequirePermission perm="assistant">
            <AiChatPage />
          </RequirePermission>
        ),
      },
      { path: 'notifications', element: <NotificationsPage /> },
      {
        path: 'parametres',
        element: <ParametresLayout />,
        children: [
          {
            path: 'produits',
            element: (
              <RequirePermission perm="produits">
                <ProductsSettingsPage />
              </RequirePermission>
            ),
          },
          {
            path: 'utilisateurs',
            element: (
              <RequirePermission perm="utilisateurs">
                <UsersSettingsPage />
              </RequirePermission>
            ),
          },
          {
            path: 'import',
            element: (
              <RequirePermission perm="parametres">
                <ImportExcelPage />
              </RequirePermission>
            ),
          },
          {
            path: 'audit',
            element: (
              <RequirePermission perm="parametres">
                <AuditLogsPage />
              </RequirePermission>
            ),
          },
          {
            path: 'danger',
            element: (
              <RequireAdmin>
                <DangerZonePage />
              </RequireAdmin>
            ),
          },
        ],
      },
    ],
  },
]);
