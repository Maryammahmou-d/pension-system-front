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
import { canAccessReport, REPORT_LANDING_ORDER, REPORT_ROLES } from './lib/reportAccess';
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

  const firstReport = REPORT_LANDING_ORDER.find((r) => canAccessReport(user, r.roles));
  if (firstReport) return <Navigate to={firstReport.to} replace />;

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
              <Route
                path="unit-prices/update"
                element={
                  <ProtectedRoute>
                    <UpdateUnitPrice />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reports/net-company-funds-modified-date"
                element={
                  <ProtectedRoute>
                    <NetCompanyFundsModifiedDate />
                  </ProtectedRoute>
                }
              />
              <Route
                path="financial/net-company-funds-payment-date"
                element={
                  <ProtectedRoute>
                    <NetCompanyFundsPaymentDate />
                  </ProtectedRoute>
                }
              />
              <Route
                path="financial/net-employee-funds"
                element={
                  <ProtectedRoute>
                    <NetEmployeeFunds />
                  </ProtectedRoute>
                }
              />
              <Route
                path="financial/net-funds"
                element={
                  <ProtectedRoute>
                    <NetFunds />
                  </ProtectedRoute>
                }
              />
              <Route
                path="financial/net-units"
                element={
                  <ProtectedRoute>
                    <NetUnits />
                  </ProtectedRoute>
                }
              />
              <Route
                path="financial/run-monthly-charges"
                element={
                  <ProtectedRoute>
                    <RunMonthlyCharges />
                  </ProtectedRoute>
                }
              />
              <Route
                path="financial/add-vesting-rules"
                element={
                  <ProtectedRoute>
                    <AddVestingRules />
                  </ProtectedRoute>
                }
              />
              <Route
                path="financial/edit-vesting-rules"
                element={
                  <ProtectedRoute>
                    <EditVestingRules />
                  </ProtectedRoute>
                }
              />
              <Route
                path="financial/employee-funds-withdrawal"
                element={
                  <ProtectedRoute>
                    <EmployeeFundsWithdrawal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="financial/estimate-employee-termination"
                element={
                  <ProtectedRoute>
                    <EstimateEmployeeTermination />
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
              <Route
                path="reporting-operations/hr-balance-dashboard"
                element={
                  <ProtectedRoute roles={[...REPORT_ROLES.hrBalanceDashboard]}>
                    <RunHrBalanceDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="reporting-operations/company-balance"
                element={
                  <ProtectedRoute roles={[...REPORT_ROLES.companyBalance]}>
                    <CompanyBalanceReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reporting-operations/employee-balance"
                element={
                  <ProtectedRoute roles={[...REPORT_ROLES.employeeBalance]}>
                    <EmployeeBalanceReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reporting-operations/employee-extract-app"
                element={
                  <ProtectedRoute roles={[...REPORT_ROLES.employeeExtractApp]}>
                    <EmployeeExtractAppReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reporting-operations/companies-funds"
                element={
                  <ProtectedRoute roles={[...REPORT_ROLES.companiesFunds]}>
                    <CompaniesFundsReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reporting-operations/company-transactions"
                element={
                  <ProtectedRoute roles={[...REPORT_ROLES.companyTransactions]}>
                    <CompanyTransactionsReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reporting-operations/employee-transactions"
                element={
                  <ProtectedRoute roles={[...REPORT_ROLES.employeeTransactions]}>
                    <EmployeeTransactionsReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reporting-operations/transactions-between-dates"
                element={
                  <ProtectedRoute roles={[...REPORT_ROLES.transactionsBetweenDates]}>
                    <TransactionsBetweenDatesReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reporting-operations/employee-records"
                element={
                  <ProtectedRoute roles={[...REPORT_ROLES.employeeRecords]}>
                    <EmployeeRecordsReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reporting-operations/aggregated-employee-balance"
                element={
                  <ProtectedRoute roles={[...REPORT_ROLES.aggregatedEmployeeBalance]}>
                    <AggregatedEmployeeBalanceReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reporting-operations/movement-summary-between-dates"
                element={
                  <ProtectedRoute roles={[...REPORT_ROLES.movementSummaryBetweenDates]}>
                    <MovementSummaryBetweenDatesReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reporting-operations/invoice-details"
                element={
                  <ProtectedRoute roles={[...REPORT_ROLES.invoiceDetails]}>
                    <InvoiceDetailsReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reporting-operations/movement-summary-for-day"
                element={
                  <ProtectedRoute roles={[...REPORT_ROLES.movementSummaryForDay]}>
                    <MovementSummaryForDayReport />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;


