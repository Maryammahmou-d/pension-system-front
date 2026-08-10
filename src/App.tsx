import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactElement } from 'react';
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
import UpdateUnitPrice from './pages/Financial/UnitPrices/UpdateUnitPrice';
import NetCompanyFundsModifiedDate from './pages/Financial/Reports/NetCompanyFundsModifiedDate';
import NetCompanyFundsPaymentDate from './pages/Financial/Reports/NetCompanyFundsPaymentDate';
import NetEmployeeFunds from './pages/Financial/Reports/NetEmployeeFunds';
import NetFunds from './pages/Financial/Reports/NetFunds';
import NetUnits from './pages/Financial/Reports/NetUnits';
import RunMonthlyCharges from './pages/Financial/RunMonthlyCharges';
import AddVestingRules from './pages/Financial/AddVestingRules';
import EditVestingRules from './pages/Financial/EditVestingRules';
import EmployeeFundsWithdrawal from './pages/Financial/EmployeeFundsWithdrawal';
import EstimateEmployeeTermination from './pages/Financial/Reports/EstimateEmployeeTermination';
import CompanyBalanceReport from './pages/Reporting Operations/CompanyBalanceReport';
import EmployeeBalanceReport from './pages/Reporting Operations/EmployeeBalanceReport';
import EmployeeExtractAppReport from './pages/Reporting Operations/EmployeeExtractAppReport';
import CompaniesFundsReport from './pages/Reporting Operations/CompaniesFundsReport';
import CompanyTransactionsReport from './pages/Reporting Operations/CompanyTransactionsReport';
import EmployeeTransactionsReport from './pages/Reporting Operations/EmployeeTransactionsReport';
import TransactionsBetweenDatesReport from './pages/Reporting Operations/TransactionsBetweenDatesReport';
import EmployeeRecordsReport from './pages/Reporting Operations/EmployeeRecordsReport';
import AggregatedEmployeeBalanceReport from './pages/Reporting Operations/AggregatedEmployeeBalanceReport';
import MovementSummaryBetweenDatesReport from './pages/Reporting Operations/MovementSummaryBetweenDatesReport';
import InvoiceDetailsReport from './pages/Reporting Operations/InvoiceDetailsReport';
import MovementSummaryForDayReport from './pages/Reporting Operations/MovementSummaryForDayReport';
import RunHrBalanceDashboard from './pages/Reporting Operations/RunHrBalanceDashboard';
import { canAccess, LANDING_ORDER, PAGE_ROUTES } from './lib/access';
import type { PageKey } from './lib/access';
import { useAuth } from './lib/auth';
import { ThemeProvider } from './lib/theme';
import { AuthProvider } from './lib/auth';

/**
 * Screen for every guarded page. Paths and role gates both come from
 * `access.ts`, so the router and the sidebar can never disagree.
 */
const PAGE_ELEMENTS: Record<PageKey, ReactElement> = {
  userManagement: <UserManagement />,

  addCompany: <AddCompany />,
  editCompany: <EditCompany />,
  terminateCompany: <TerminateCompany />,
  addContributions: <AddContributions />,
  editContributions: <EditContributions />,
  addEmployee: <AddEmployee />,
  importEmployees: <ImportEmployees />,
  editEmployee: <EditEmployee />,
  terminateEmployee: <TerminateEmployee />,
  terminateEmployeesBulk: <TerminateEmployeesBulk />,

  createInvoice: <CreateInvoice />,
  settleInvoice: <SettleInvoice />,
  cancelInvoice: <CancelInvoice />,
  addTopUp: <AddTopUp />,
  bulkTopUp: <BulkTopUp />,

  updateUnitPrice: <UpdateUnitPrice />,
  runMonthlyCharges: <RunMonthlyCharges />,
  addVestingRules: <AddVestingRules />,
  editVestingRules: <EditVestingRules />,
  employeeFundsWithdrawal: <EmployeeFundsWithdrawal />,
  estimateEmployeeTermination: <EstimateEmployeeTermination />,
  netCompanyFundsModifiedDate: <NetCompanyFundsModifiedDate />,
  netCompanyFundsPaymentDate: <NetCompanyFundsPaymentDate />,
  netEmployeeFunds: <NetEmployeeFunds />,
  netFunds: <NetFunds />,
  netUnits: <NetUnits />,

  hrBalanceDashboard: <RunHrBalanceDashboard />,
  companyTransactions: <CompanyTransactionsReport />,
  employeeTransactions: <EmployeeTransactionsReport />,
  transactionsBetweenDates: <TransactionsBetweenDatesReport />,
  invoiceDetails: <InvoiceDetailsReport />,
  movementSummaryBetweenDates: <MovementSummaryBetweenDatesReport />,
  movementSummaryForDay: <MovementSummaryForDayReport />,
  companiesFunds: <CompaniesFundsReport />,
  employeeExtractApp: <EmployeeExtractAppReport />,
  companyBalance: <CompanyBalanceReport />,
  employeeBalance: <EmployeeBalanceReport />,
  employeeRecords: <EmployeeRecordsReport />,
  aggregatedEmployeeBalance: <AggregatedEmployeeBalanceReport />,
};

const PAGE_KEYS = Object.keys(PAGE_ELEMENTS) as PageKey[];

function DefaultRoute() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  const landing = LANDING_ORDER.find((page) => canAccess(user, page));
  if (landing) return <Navigate to={PAGE_ROUTES[landing]} replace />;

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
              {PAGE_KEYS.map((page) => (
                <Route
                  key={page}
                  path={PAGE_ROUTES[page].replace(/^\//, '')}
                  element={
                    <ProtectedRoute page={page}>
                      {PAGE_ELEMENTS[page]}
                    </ProtectedRoute>
                  }
                />
              ))}
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
