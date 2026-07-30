import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import UserManagement from './pages/UserManagement';
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
import { ThemeProvider } from './lib/theme';
import { AuthProvider } from './lib/auth';

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
              <Route index element={<Home />} />
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
