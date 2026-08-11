// ── Auth & users ────────────────────────────────────────────────

/** Access UserSecurity roles */
export type UserSecurityRole =
  | 'Admin'
  | 'Investment'
  | 'Operations'
  | 'Actuarial'
  | 'Tech'
  | 'CRM';

export const USER_SECURITY_ROLES: UserSecurityRole[] = [
  'Admin',
  'Investment',
  'Operations',
  'Actuarial',
  'Tech',
  'CRM',
];

/** Access default password for newly created users */
export const DEFAULT_USER_PASSWORD = 'Password';

/**
 * Mirrors the backend `User` entity. `isSuperuser` is derived
 * (`userSecurity === 'Admin'`); everything else is a real column.
 */
export interface UserDto {
  id: number;
  username: string;
  fullName?: string | null;
  userSecurity: UserSecurityRole;
  isSuperuser: boolean;
  /** True when the stored password is still the default. */
  mustChangePassword: boolean;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface CreateUserRequest {
  username: string;
  fullName: string;
  userSecurity: UserSecurityRole;
  /** Optional; defaults to Access default `Password` when omitted. */
  password?: string;
}

/** Matches the backend `UpdateUser` DTO — only non-null fields are applied. */
export interface UpdateUserRequest {
  fullName?: string;
  userLogin?: string;
  userSecurity?: UserSecurityRole;
}

export interface PagedRecordsResponse<T> {
  records: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  listType: 'TERRORISM' | 'PROSECUTION';
}

// ── Rubix domain (Section 3) ────────────────────────────────────

export type InvoiceStatus = 'Unsettled' | 'Paid' | 'Cancelled';

export interface CompanySummary {
  companyNumber: string;
  companyName: string;
  active: boolean;
}

export interface EmployeeSummary {
  employeeNumber: string;
  fullName: string;
  companyNumber: string;
  active: boolean;
}

export interface UnitPriceRow {
  priceDate: string; // yyyy-mm-dd
  fund1: number;
  fund2: number;
  fund3: number;
  fund4: number;
  fund5: number;
  fund6: number;
  fund7: number;
  fund8: number;
  fund9: number;
  fund10: number;
}

export interface Invoice {
  invoiceNumber: string;
  companyNumber: string;
  companyName: string;
  invoiceDate: string;
  dateFrom: string;
  dateTo: string;
  status: InvoiceStatus;
  paymentDate: string | null;
  egpAmount: number;
  usdAmount: number;
  eurAmount: number;
  employeeLineCount: number;
}

export interface InvoiceEmployeeLine {
  invoiceNumber: string;
  employeeNumber: string;
  fullName: string;
  companyNumber: string;
  currency: string;
  employeeContribution: number;
  veeContribution: number;
  employerContribution: number;
  totalContribution: number;
  grandTotal: number;
  status: InvoiceStatus;
}

export interface CreateInvoiceRequest {
  companyNumber: string;
  year: number;
  month: number;
  dateFrom: string;
  dateTo: string;
  path?: string;
}

export interface CreateInvoiceResult {
  invoiceNumber: string;
  employeeLineCount: number;
  egpAmount: number;
  usdAmount: number;
  eurAmount: number;
}

export interface SettleInvoiceRequest {
  invoiceNumber: string;
  paymentDate: string;
  /** Access UserSecurity: 1 Admin, 5 Tech bypass 7-day rule */
  userSecurityLevel?: number;
}

export interface CancelInvoiceRequest {
  invoiceNumber: string;
  cancellationDate: string;
}

export interface TopUpRequest {
  companyNumber: string;
  employeeNumber: string;
  topUpDate: string;
  topUpEE: number;
  topUpVEE: number;
  topUpER: number;
  path?: string;
}

export interface TopUpResult {
  employeeNumber: string;
  topUpDate: string;
  total: number;
}

export interface BulkTopUpRow {
  employeeNumber: string;
  ee: number;
  er: number;
  vee: number;
  unitPriceDate: string;
}

export interface BulkTopUpRequest {
  companyNumber: string;
  rows: BulkTopUpRow[];
  path?: string;
}

export interface BulkTopUpRowResult {
  employeeNumber: string;
  ok: boolean;
  message: string;
  total?: number;
}

export interface BulkTopUpResult {
  processed: number;
  succeeded: number;
  failed: number;
  rows: BulkTopUpRowResult[];
}

export interface FundNetSummary {
  fund: number;
  eeUnits: number;
  veeUnits: number;
  erUnits: number;
  totalUnits: number;
  unitPrice: number;
  eeFunds: number;
  veeFunds: number;
  erFunds: number;
  totalFunds: number;
}

export interface NetCompanyFundsResult {
  companyNumber: string;
  companyName: string;
  valuationDate: string;
  rows: FundNetSummary[];
  totalEEFunds: number;
  totalVEEFunds: number;
  totalERFunds: number;
  totalFunds: number;
}

export interface NetEmployeeFundsResult {
  companyNumber: string;
  companyName: string;
  employeeNumber: string;
  employeeName: string;
  valuationDate: string;
  rows: FundNetSummary[];
  totalEEFunds: number;
  totalVEEFunds: number;
  totalERFunds: number;
  totalFunds: number;
}

export interface NetFundsResult {
  valuationDate: string;
  rows: FundNetSummary[];
  totalEEFunds: number;
  totalVEEFunds: number;
  totalERFunds: number;
  totalFunds: number;
}

export interface FundUnitRow {
  fund: number;
  eeUnits: number;
  veeUnits: number;
  erUnits: number;
  totalUnits: number;
}

export interface NetUnitsResult {
  valuationDate: string;
  rows: FundUnitRow[];
  totalEEUnits: number;
  totalVEEUnits: number;
  totalERUnits: number;
  totalUnits: number;
}

export interface MonthlyChargeRun {
  paymentDate: string;
  runDate: string;
  month: number;
  year: number;
  processedCount: number;
}

export interface MonthlyChargesResult {
  run: MonthlyChargeRun;
  previousRuns: MonthlyChargeRun[];
}

export interface VestingRule {
  companyNumber: string;
  year1: number;
  year2: number;
  year3: number;
  year4: number;
  year5: number;
  year6: number;
  year7: number;
  year8: number;
  year9: number;
  year10: number;
}

export interface VestingRuleSummary extends VestingRule {}

export interface WithdrawalRow {
  fund: number;
  employeeFundUnits: number;
  voluntaryEmployeeFundUnits: number;
  employerFundUnits: number;
  unitPrice: number;
  employeeFundTotal: number;
  voluntaryEmployeeFundTotal: number;
  employerFundTotal: number;
  availableEmployeeFund: number;
  availableVoluntaryEmployeeFund: number;
  availableEmployerFund: number;
}

export interface EmployeeFundsWithdrawalEstimate {
  companyNumber: string;
  companyName: string;
  employeeNumber: string;
  employeeName: string;
  withdrawalDate: string;
  rows: WithdrawalRow[];
  charges: {
    ee: number;
    voluntaryEE: number;
    er: number;
  };
  maximumWithdrawalPercentage: number;
  maximumWithdrawalCount: number;
  withdrawalCountInPast365Days: number;
  vestingRulePercentage: number;
  totalEmployeeFund: number;
  totalVoluntaryEmployeeFund: number;
  totalEmployerFund: number;
  availableEmployeeFund: number;
  availableVoluntaryEmployeeFund: number;
  availableEmployerFund: number;
}

export interface EmployeeFundsWithdrawalResult {
  reference: string;
  message: string;
}

export interface TerminationFundRow {
  fund: number;
  employeeFund: number;
  voluntaryEmployeeFund: number;
  employerFund: number;
  unitPrice: number;
  total: number;
}

export interface EmployeeTerminationEstimate {
  companyNumber: string;
  companyName: string;
  employeeNumber: string;
  employeeName: string;
  terminationDate: string;
  path: string;
  rows: TerminationFundRow[];
  totalEmployeeFund: number;
  totalVoluntaryEmployeeFund: number;
  totalEmployerFund: number;
  total: number;
}
