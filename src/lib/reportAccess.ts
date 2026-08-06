import type { UserDto, UserSecurityRole } from '../types';

/** Role gates for implemented report pages (Access permission table §5). */
export const REPORT_ROLES = {
  companyBalance: ['Actuarial', 'CRM', 'Operations', 'Tech'] as UserSecurityRole[],
  employeeBalance: ['Actuarial', 'Operations', 'Tech'] as UserSecurityRole[],
  employeeExtractApp: ['CRM', 'Investment', 'Tech'] as UserSecurityRole[],
  companiesFunds: ['Actuarial'] as UserSecurityRole[],
  companyTransactions: ['Actuarial', 'Operations'] as UserSecurityRole[],
  employeeTransactions: ['Actuarial', 'Operations'] as UserSecurityRole[],
  transactionsBetweenDates: ['Actuarial', 'Operations'] as UserSecurityRole[],
  employeeRecords: ['Actuarial', 'Operations'] as UserSecurityRole[],
  aggregatedEmployeeBalance: ['Operations'] as UserSecurityRole[],
  movementSummaryBetweenDates: ['Actuarial', 'Investment'] as UserSecurityRole[],
  invoiceDetails: ['Actuarial', 'Operations'] as UserSecurityRole[],
  movementSummaryForDay: ['Actuarial', 'Investment'] as UserSecurityRole[],
  /** Access §5.10 — also listed under Actions as Run Balance Dashboard */
  hrBalanceDashboard: ['Operations', 'Investment', 'Tech'] as UserSecurityRole[],
} as const;

export function canAccessReport(
  user: Pick<UserDto, 'isSuperuser' | 'userSecurity'> | null | undefined,
  roles: UserSecurityRole[],
): boolean {
  if (!user) return false;
  if (user.isSuperuser) return true;
  return roles.includes(user.userSecurity);
}

/** First allowed report route for landing redirect (Access-ish order among implemented pages). */
export const REPORT_LANDING_ORDER: { to: string; roles: UserSecurityRole[] }[] = [
  { to: '/reporting-operations/company-transactions', roles: REPORT_ROLES.companyTransactions },
  { to: '/reporting-operations/employee-transactions', roles: REPORT_ROLES.employeeTransactions },
  { to: '/reporting-operations/transactions-between-dates', roles: REPORT_ROLES.transactionsBetweenDates },
  { to: '/reporting-operations/movement-summary-between-dates', roles: REPORT_ROLES.movementSummaryBetweenDates },
  { to: '/reporting-operations/movement-summary-for-day', roles: REPORT_ROLES.movementSummaryForDay },
  { to: '/reporting-operations/invoice-details', roles: REPORT_ROLES.invoiceDetails },
  { to: '/reporting-operations/companies-funds', roles: REPORT_ROLES.companiesFunds },
  { to: '/reporting-operations/employee-extract-app', roles: REPORT_ROLES.employeeExtractApp },
  { to: '/reporting-operations/company-balance', roles: REPORT_ROLES.companyBalance },
  { to: '/reporting-operations/employee-balance', roles: REPORT_ROLES.employeeBalance },
  { to: '/reporting-operations/employee-records', roles: REPORT_ROLES.employeeRecords },
  { to: '/reporting-operations/aggregated-employee-balance', roles: REPORT_ROLES.aggregatedEmployeeBalance },
];

