import type { UserDto, UserSecurityRole } from '../types';

/**
 * Single source of truth for page-level access (Access permission matrix).
 *
 * `Admin` is intentionally absent from every row: Admin users are flagged
 * `isSuperuser` and bypass the matrix entirely.
 */
export type PageKey =
  // System management
  | 'userManagement'
  // Company / employee / contribution management
  | 'addCompany'
  | 'editCompany'
  | 'terminateCompany'
  | 'addContributions'
  | 'editContributions'
  | 'addEmployee'
  | 'importEmployees'
  | 'editEmployee'
  | 'terminateEmployee'
  | 'terminateEmployeesBulk'
  // Invoicing & top-ups
  | 'createInvoice'
  | 'settleInvoice'
  | 'cancelInvoice'
  | 'addTopUp'
  | 'bulkTopUp'
  // Financial
  | 'updateUnitPrice'
  | 'runMonthlyCharges'
  | 'addVestingRules'
  | 'editVestingRules'
  | 'employeeFundsWithdrawal'
  | 'estimateEmployeeTermination'
  | 'netCompanyFundsModifiedDate'
  | 'netCompanyFundsPaymentDate'
  | 'netEmployeeFunds'
  | 'netFunds'
  | 'netUnits'
  // Reporting operations
  | 'hrBalanceDashboard'
  | 'companyTransactions'
  | 'employeeTransactions'
  | 'transactionsBetweenDates'
  | 'invoiceDetails'
  | 'movementSummaryBetweenDates'
  | 'movementSummaryForDay'
  | 'companiesFunds'
  | 'employeeExtractApp'
  | 'companyBalance'
  | 'employeeBalance'
  | 'employeeRecords'
  | 'aggregatedEmployeeBalance';

export const PAGE_ROLES: Record<PageKey, UserSecurityRole[]> = {
  userManagement: ['Tech'],

  addCompany: ['Operations'],
  editCompany: ['Operations'],
  terminateCompany: ['Operations'],
  addContributions: ['Operations'],
  editContributions: ['Operations'],
  addEmployee: ['Operations'],
  importEmployees: ['Operations'],
  editEmployee: ['Operations'],
  terminateEmployee: ['Operations'],
  terminateEmployeesBulk: ['Operations'],

  createInvoice: ['Operations'],
  settleInvoice: ['CRM', 'Investment'],
  cancelInvoice: ['Tech'],
  addTopUp: ['Operations'],
  bulkTopUp: ['Operations'],

  updateUnitPrice: ['Investment'],
  runMonthlyCharges: ['Operations'],
  addVestingRules: ['Operations'],
  editVestingRules: ['Operations'],
  employeeFundsWithdrawal: ['Operations'],
  estimateEmployeeTermination: ['Operations'],
  netCompanyFundsModifiedDate: ['Operations', 'Actuarial'],
  netCompanyFundsPaymentDate: ['Operations', 'Actuarial'],
  netEmployeeFunds: ['Operations', 'Actuarial'],
  netFunds: ['Operations', 'Investment', 'Actuarial'],
  netUnits: ['Investment', 'Actuarial'],

  hrBalanceDashboard: ['Tech', 'Operations', 'Investment'],
  companyTransactions: ['Operations', 'Actuarial'],
  employeeTransactions: ['Operations', 'Actuarial'],
  transactionsBetweenDates: ['Operations', 'Actuarial'],
  invoiceDetails: ['Operations', 'Actuarial'],
  movementSummaryBetweenDates: ['Investment', 'Actuarial'],
  movementSummaryForDay: ['Investment', 'Actuarial'],
  companiesFunds: ['Actuarial'],
  employeeExtractApp: ['CRM', 'Investment'],
  companyBalance: ['Tech', 'Operations', 'CRM', 'Actuarial'],
  employeeBalance: ['Tech', 'Operations', 'Actuarial'],
  employeeRecords: ['Operations', 'Actuarial'],
  aggregatedEmployeeBalance: ['Operations'],
};

/** Route path for each page — keeps the router and the sidebar from drifting. */
export const PAGE_ROUTES: Record<PageKey, string> = {
  userManagement: '/users',

  addCompany: '/companies/add',
  editCompany: '/companies/edit',
  terminateCompany: '/companies/terminate',
  addContributions: '/contributions/add',
  editContributions: '/contributions/edit',
  addEmployee: '/employees/add',
  importEmployees: '/employees/import',
  editEmployee: '/employees/edit',
  terminateEmployee: '/employees/terminate',
  terminateEmployeesBulk: '/employees/terminate-bulk',

  createInvoice: '/billing/create-invoice',
  settleInvoice: '/billing/settle-invoice',
  cancelInvoice: '/billing/cancel-invoice',
  addTopUp: '/top-ups/add',
  bulkTopUp: '/top-ups/bulk',

  updateUnitPrice: '/unit-prices/update',
  runMonthlyCharges: '/financial/run-monthly-charges',
  addVestingRules: '/financial/add-vesting-rules',
  editVestingRules: '/financial/edit-vesting-rules',
  employeeFundsWithdrawal: '/financial/employee-funds-withdrawal',
  estimateEmployeeTermination: '/financial/estimate-employee-termination',
  netCompanyFundsModifiedDate: '/reports/net-company-funds-modified-date',
  netCompanyFundsPaymentDate: '/financial/net-company-funds-payment-date',
  netEmployeeFunds: '/financial/net-employee-funds',
  netFunds: '/financial/net-funds',
  netUnits: '/financial/net-units',

  hrBalanceDashboard: '/reporting-operations/hr-balance-dashboard',
  companyTransactions: '/reporting-operations/company-transactions',
  employeeTransactions: '/reporting-operations/employee-transactions',
  transactionsBetweenDates: '/reporting-operations/transactions-between-dates',
  invoiceDetails: '/reporting-operations/invoice-details',
  movementSummaryBetweenDates: '/reporting-operations/movement-summary-between-dates',
  movementSummaryForDay: '/reporting-operations/movement-summary-for-day',
  companiesFunds: '/reporting-operations/companies-funds',
  employeeExtractApp: '/reporting-operations/employee-extract-app',
  companyBalance: '/reporting-operations/company-balance',
  employeeBalance: '/reporting-operations/employee-balance',
  employeeRecords: '/reporting-operations/employee-records',
  aggregatedEmployeeBalance: '/reporting-operations/aggregated-employee-balance',
};

/** Role-only check — used to derive the stored `perm*` flags at login time. */
export function canAccessRole(role: UserSecurityRole, page: PageKey): boolean {
  if (role === 'Admin') return true;
  return PAGE_ROLES[page].includes(role);
}

export function canAccess(
  user: Pick<UserDto, 'isSuperuser' | 'userSecurity'> | null | undefined,
  page: PageKey,
): boolean {
  if (!user) return false;
  if (user.isSuperuser) return true;
  return PAGE_ROLES[page].includes(user.userSecurity);
}

/**
 * Sidebar order, used by the `/` redirect to land the user on the first page
 * their role can actually open.
 */
export const LANDING_ORDER: PageKey[] = [
  'userManagement',
  'updateUnitPrice',
  'runMonthlyCharges',
  'hrBalanceDashboard',
  'addCompany',
  'editCompany',
  'addContributions',
  'editContributions',
  'addVestingRules',
  'editVestingRules',
  'addEmployee',
  'importEmployees',
  'editEmployee',
  'createInvoice',
  'settleInvoice',
  'cancelInvoice',
  'addTopUp',
  'employeeFundsWithdrawal',
  'terminateEmployee',
  'terminateCompany',
  'terminateEmployeesBulk',
  'bulkTopUp',
  'companyTransactions',
  'employeeTransactions',
  'transactionsBetweenDates',
  'invoiceDetails',
  'movementSummaryBetweenDates',
  'movementSummaryForDay',
  'companiesFunds',
  'netCompanyFundsModifiedDate',
  'netCompanyFundsPaymentDate',
  'netEmployeeFunds',
  'netFunds',
  'netUnits',
  'estimateEmployeeTermination',
  'employeeExtractApp',
  'companyBalance',
  'employeeBalance',
  'employeeRecords',
  'aggregatedEmployeeBalance',
];
