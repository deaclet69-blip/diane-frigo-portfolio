import { createBrowserRouter } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
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
import AiChatPage from './pages/assistant/AiChatPage';
import NotificationsPage from './pages/notifications/NotificationsPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'stock', element: <StockListPage /> },
      { path: 'stock/entree', element: <StockEntryPage /> },
      { path: 'stock/:id', element: <ProductDetailPage /> },
      { path: 'clients', element: <ClientsListPage /> },
      { path: 'clients/:id', element: <ClientDetailPage /> },
      { path: 'ventes', element: <SalesListPage /> },
      { path: 'ventes/nouvelle', element: <NewSalePage /> },
      { path: 'ventes/:id', element: <InvoiceDetailPage /> },
      { path: 'depots', element: <DepositsPage /> },
      { path: 'finances', element: <FinancesPage /> },
      { path: 'finances/tarification', element: <PricingPage /> },
      { path: 'finances/pertes', element: <LossesPage /> },
      { path: 'finances/investissement', element: <LoansPage /> },
      { path: 'charges', element: <ChargesPage /> },
      { path: 'rapports', element: <ReportsPage /> },
      { path: 'assistant', element: <AiChatPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      {
        path: 'parametres',
        element: <ParametresLayout />,
        children: [
          { path: 'produits', element: <ProductsSettingsPage /> },
          { path: 'utilisateurs', element: <UsersSettingsPage /> },
          { path: 'import', element: <ImportExcelPage /> },
          { path: 'audit', element: <AuditLogsPage /> },
        ],
      },
    ],
  },
]);
