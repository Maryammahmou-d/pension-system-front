import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AddEmployee from './pages/Employee and Company Mangment/AddEmployee';
import ImportEmployees from './pages/Employee and Company Mangment/ImportEmployees';
import EditEmployee from './pages/Employee and Company Mangment/EditEmployee';
import TerminateEmployee from './pages/Employee and Company Mangment/TerminateEmployee';
import TerminateEmployeesBulk from './pages/Employee and Company Mangment/TerminateEmployeesBulk';
import AddContributions from './pages/Employee and Company Mangment/AddContributions';
import EditContributions from './pages/Employee and Company Mangment/EditContributions';
import AddCompany from './pages/Employee and Company Mangment/AddCompany';
import EditCompany from './pages/Employee and Company Mangment/EditCompany';
import TerminateCompany from './pages/Employee and Company Mangment/TerminateCompany';
import Login from './pages/System Management/Login';
import ChangePassword from './pages/System Management/ChangePassword';
import UserManagement from './pages/System Management/UserManagement';
import CreateInvoice from './pages/Invoicing & Top up Operations/CreateInvoice';
import SettleInvoice from './pages/Invoicing & Top up Operations/SettleInvoice';
import CancelInvoice from './pages/Invoicing & Top up Operations/CancelInvoice';
import AddTopUp from './pages/Invoicing & Top up Operations/AddTopUp';
import BulkTopUp from './pages/Invoicing & Top up Operations/BulkTopUp';
import { useAuth } from './lib/auth';
import { ThemeProvider } from './lib/theme';
import { AuthProvider } from './lib/auth';

function DefaultRoute() {
  const { user, has } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (has('permCreateInvoice')) return <Navigate to="/billing/create-invoice" replace />;
  if (has('permSettleInvoice')) return <Navigate to="/billing/settle-invoice" replace />;
  if (has('permCancelInvoice')) return <Navigate to="/billing/cancel-invoice" replace />;
  if (has('permAddTopUp')) return <Navigate to="/top-ups/add" replace />;
  if (has('permBulkTopUp')) return <Navigate to="/top-ups/bulk" replace />;
  if (user.isSuperuser) return <Navigate to="/users" replace />;
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DefaultRoute />} />
              <Route
                path="billing/create-invoice"
                element={
                  <ProtectedRoute permission="permCreateInvoice">
                    <CreateInvoice />
                  </ProtectedRoute>
                }
              />
              <Route
                path="billing/settle-invoice"
                element={
                  <ProtectedRoute permission="permSettleInvoice">
                    <SettleInvoice />
                  </ProtectedRoute>
                }
              />
              <Route
                path="billing/cancel-invoice"
                element={
                  <ProtectedRoute permission="permCancelInvoice">
                    <CancelInvoice />
                  </ProtectedRoute>
                }
              />
              <Route
                path="top-ups/add"
                element={
                  <ProtectedRoute permission="permAddTopUp">
                    <AddTopUp />
                  </ProtectedRoute>
                }
              />
              <Route
                path="top-ups/bulk"
                element={
                  <ProtectedRoute permission="permBulkTopUp">
                    <BulkTopUp />
                  </ProtectedRoute>
                }
              />
              <Route path="users" element={<ProtectedRoute superuserOnly><UserManagement /></ProtectedRoute>} />
              <Route path="employees/add" element={<ProtectedRoute superuserOnly><AddEmployee /></ProtectedRoute>} />
              <Route path="employees/import" element={<ProtectedRoute superuserOnly><ImportEmployees /></ProtectedRoute>} />
              <Route path="employees/edit" element={<ProtectedRoute superuserOnly><EditEmployee /></ProtectedRoute>} />
              <Route path="employees/terminate" element={<ProtectedRoute superuserOnly><TerminateEmployee /></ProtectedRoute>} />
              <Route path="employees/terminate-bulk" element={<ProtectedRoute superuserOnly><TerminateEmployeesBulk /></ProtectedRoute>} />
              <Route path="contributions/add" element={<ProtectedRoute superuserOnly><AddContributions /></ProtectedRoute>} />
              <Route path="contributions/edit" element={<ProtectedRoute superuserOnly><EditContributions /></ProtectedRoute>} />
              <Route path="companies/add" element={<ProtectedRoute superuserOnly><AddCompany /></ProtectedRoute>} />
              <Route path="companies/edit" element={<ProtectedRoute superuserOnly><EditCompany /></ProtectedRoute>} />
              <Route path="companies/terminate" element={<ProtectedRoute superuserOnly><TerminateCompany /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
