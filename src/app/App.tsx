import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { FullPageSpinner } from '@/components/common/states';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ChangePasswordPage } from '@/features/auth/pages/ChangePasswordPage';
import { useAuth } from '@/features/auth/hooks/useAuth';

const DashboardPage = lazy(() =>
  import('@/features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const ProspectsPage = lazy(() =>
  import('@/features/prospects/pages/ProspectsPage').then((m) => ({ default: m.ProspectsPage })),
);
const ProspectDetailPage = lazy(() =>
  import('@/features/prospects/pages/ProspectDetailPage').then((m) => ({
    default: m.ProspectDetailPage,
  })),
);
const OpportunitiesPage = lazy(() =>
  import('@/features/opportunities/pages/OpportunitiesPage').then((m) => ({
    default: m.OpportunitiesPage,
  })),
);
const ClientsPage = lazy(() =>
  import('@/features/clients/pages/ClientsPage').then((m) => ({ default: m.ClientsPage })),
);
const ClientDetailPage = lazy(() =>
  import('@/features/clients/pages/ClientDetailPage').then((m) => ({
    default: m.ClientDetailPage,
  })),
);
const EmailsPage = lazy(() =>
  import('@/features/emails/pages/EmailsPage').then((m) => ({ default: m.EmailsPage })),
);
const InvoicesPage = lazy(() =>
  import('@/features/invoices/pages/InvoicesPage').then((m) => ({ default: m.InvoicesPage })),
);
const TaxObligationsPage = lazy(() =>
  import('@/features/tax/pages/TaxObligationsPage').then((m) => ({
    default: m.TaxObligationsPage,
  })),
);
const AlertsPage = lazy(() =>
  import('@/features/alerts/pages/AlertsPage').then((m) => ({ default: m.AlertsPage })),
);
const UsersPage = lazy(() =>
  import('@/features/admin/users/UsersPage').then((m) => ({ default: m.UsersPage })),
);
const RolesPage = lazy(() =>
  import('@/features/admin/roles/RolesPage').then((m) => ({ default: m.RolesPage })),
);
const AuditPage = lazy(() =>
  import('@/features/admin/audit/AuditPage').then((m) => ({ default: m.AuditPage })),
);
const ServicesPage = lazy(() =>
  import('@/features/admin/services/ServicesPage').then((m) => ({ default: m.ServicesPage })),
);

export function App() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <FullPageSpinner />;

  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route path="/change-password" element={user ? <ChangePasswordPage /> : <Navigate to="/login" replace />} />

        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route
            path="/"
            element={
              <ProtectedRoute requires="dashboard.view">
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prospects"
            element={
              <ProtectedRoute requires="prospects.view">
                <ProspectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/prospects/:id"
            element={
              <ProtectedRoute requires="prospects.view">
                <ProspectDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/opportunities"
            element={
              <ProtectedRoute requires="opportunities.view">
                <OpportunitiesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute requires="clients.view">
                <ClientsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients/:id"
            element={
              <ProtectedRoute requires="clients.view">
                <ClientDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices"
            element={
              <ProtectedRoute requires="invoices.view">
                <InvoicesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tax"
            element={
              <ProtectedRoute requires="tax.view">
                <TaxObligationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute requires="dashboard.view">
                <AlertsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emails"
            element={
              <ProtectedRoute requires="emails.send">
                <EmailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requires="users.view">
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <ProtectedRoute requires="roles.view">
                <RolesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <ProtectedRoute requires="audit.view">
                <AuditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/services"
            element={
              <ProtectedRoute requires="services.view">
                <ServicesPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
