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

export type InvoiceStatus = 'Pending' | 'Paid' | 'Cancelled';

export interface CompanySummary {
  companyNumber: string;
  companyName: string;
  active: boolean;
}

export interface CreateCompanyRequest {
  kafsCompanyNumber: string;
  companyName: string;
  issueDate: string;
  frequency: string;
  address: string;
  contactPerson: string;
  mobileNumber: string;
  email: string;
  startingNumberOfEmployees: number;
  startingAverageSalary: number;
  startingFundValue: number;
  contributionCharges: number;
  contributionChargesVee: number;
  imc: number;
  withdrawalChargesEe: number;
  withdrawalChargesVee: number;
  withdrawalChargesEr: number;
  employeeSurrenderCharge: number;
  topUpCharges: number;
  adminCharges: number;
  portfolioSwitchingCharges: number;
  allocationRedirectionCharges: number;
  terminationDate?: string | null;
  newOrAcquired: number;
  vestingOnHire: boolean;
  maxWithdrawalPercentage: number;
  maxWithdrawalCount: number;
  salaryOrContribution: boolean;
  showAvailableWithdrawal: boolean;
}

export interface Company {
  id?: number;
  serial?: number;
  modifiedDate?: string | null;
  companyNumber: string;
  kafsCompanyNumber: string;
  companyName: string;
  issueDate: string;
  frequency: string;
  address: string;
  contactPerson: string;
  mobileNumber: string;
  email: string;
  startingNumberOfEmployees: number;
  startingAverageSalary: number;
  startingFundValue: number;
  contributionCharges: number;
  contributionChargesVee: number;
  imc: number;
  withdrawalChargesEe: number;
  withdrawalChargesVee: number;
  withdrawalChargesEr: number;
  employeeSurrenderCharge: number;
  topUpCharges: number;
  adminCharges: number;
  portfolioSwitchingCharges: number;
  allocationRedirectionCharges: number;
  terminationDate?: string | null;
  newOrAcquired: number;
  vestingOnHire: boolean;
  maxWithdrawalPercentage: number;
  maxWithdrawalCount: number;
  salaryOrContribution: boolean;
  showAvailableWithdrawal: boolean;
  userName?: string | null;
}

export interface CreateEmployeeRequest {
  companyId: number;
  nationalId: string;
  fullName: string;
  dob: string;
  gender: string;
  occupation: string;
  hireDate: string;
  ageAtHire: number;
  pensionStartDate: string;
  kafJoiningDate: string;
  category: string;
  grossSalary: number;
  salaryCurrency: string;
  contributionEe: number;
  contributionEr: number;
  email: string;
  startingEeValue: number;
  startingErValue: number;
  startingFundValue: number;
  terminationDate?: string | null;
  resignationDate?: string | null;
  vee: number;
  weightF1Ee: number;
  weightF2Ee: number;
  weightF3Ee: number;
  weightF4Ee: number;
  weightF5Ee: number;
  weightF6Ee: number;
  weightF7Ee: number;
  weightF8Ee: number;
  weightF9Ee: number;
  weightF10Ee: number;
  weightF1Er: number;
  weightF2Er: number;
  weightF3Er: number;
  weightF4Er: number;
  weightF5Er: number;
  weightF6Er: number;
  weightF7Er: number;
  weightF8Er: number;
  weightF9Er: number;
  weightF10Er: number;
}

export interface CreateContributionRequest {
  companyNumber: string;
  category: string;
  EE: number;
  ER: number;
}

export interface Contribution {
  companyNumber: string;
  category: string;
  ee: number;
  er: number;
}

export interface Employee {
  employeeId: number;
  employeeNumber: string;
  companyNumber: string;
  nationalId: string;
  fullName: string;
  dob: string;
  gender: string;
  occupation: string;
  hireDate: string;
  ageAtHire: number;
  pensionStartDate: string;
  kafJoiningDate: string;
  category: string;
  grossSalary: number;
  salaryCurrency: string;
  contributionEe: number;
  contributionEr: number;
  email: string;
  startingEeValue: number;
  startingErValue: number;
  startingFundValue: number;
  terminationDate?: string | null;
  resignationDate?: string | null;
  vee: number;
  weightF1Ee: number;
  weightF2Ee: number;
  weightF3Ee: number;
  weightF4Ee: number;
  weightF5Ee: number;
  weightF6Ee: number;
  weightF7Ee: number;
  weightF8Ee: number;
  weightF9Ee: number;
  weightF10Ee: number;
  weightF1Er: number;
  weightF2Er: number;
  weightF3Er: number;
  weightF4Er: number;
  weightF5Er: number;
  weightF6Er: number;
  weightF7Er: number;
  weightF8Er: number;
  weightF9Er: number;
  weightF10Er: number;
}

export interface EmployeeNumberResponse {
  employeeId: number;
  employeeNumber: string;
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
  userName?: string | null;
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

export interface InvoiceCategorySummary {
  category: number;
  employeeCount: number;
  currency: string;
  employeeContribution: number;
  veeContribution: number;
  employerContribution: number;
  totalContribution: number;
  stampDuty: number;
  supervisoryFees: number;
  fraApprovalFees: number;
  fraProvisionFees: number;
  grandTotal: number;
}

export interface InvoiceDetails {
  invoiceNumber: string;
  companyNumber: string;
  companyName: string;
  invoiceDate: string;
  dateFrom: string;
  dateTo: string;
  status: InvoiceStatus;
  paymentDate: string | null;
  currency: string;
  categories: InvoiceCategorySummary[];
}

export interface CreateInvoiceRequest {
  companyNumber: string;
  year: number;
  month: number;
  dateFrom: string;
  dateTo: string;
  path?: string;
  userName?: string;
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
  userName?: string;
}

export interface CancelInvoiceRequest {
  invoiceNumber: string;
  cancellationDate: string;
  userName?: string;
}

export interface TopUpRequest {
  companyNumber: string;
  employeeNumber: string;
  topUpDate: string;
  topUpEE: number;
  topUpVEE: number;
  topUpER: number;
  path?: string;
  userName?: string;
}

export interface TopUpResult {
  employeeNumber: string;
  employeeName: string;
  companyNumber: string;
  topUpDate: string;
  modifiedDate?: string | null;
  transactionId?: number | null;
  serial?: number | null;
  employeeId?: number | null;
  nationalId?: string | null;
  category?: string | null;
  pensionStartDate?: string | null;
  currency?: string | null;
  topUpEE: number;
  topUpVEE: number;
  topUpER: number;
  total: number;
  chargesEe: number;
  chargesVee: number;
  chargesEr: number;
  imcEe: number;
  imcVee: number;
  imcEr: number;
  transactionalEe: number;
  transactionalVee: number;
  transactionalEr: number;
  transactionalTotal: number;
  totalEeValue: number;
  totalVeeValue: number;
  totalErValue: number;
  funds: TopUpFundAllocation[];
}

export interface TopUpFundAllocation {
  fund: number;
  unitPrice: number;
  eeValue: number;
  veeValue: number;
  erValue: number;
  eeUnits: number;
  veeUnits: number;
  erUnits: number;
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
  userName?: string;
}

export interface BulkTopUpRowResult {
  employeeNumber: string;
  ok: boolean;
  message: string;
  total?: number;
  report?: TopUpResult | null;
}

export interface BulkTopUpResult {
  processed: number;
  succeeded: number;
  failed: number;
  rows: BulkTopUpRowResult[];
  posted: TopUpResult[];
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

export interface NetCompanyFundRow {
  fund: number;
  eeUnits: number | null;
  veeUnits: number | null;
  erUnits: number | null;
  totalUnits: number;
  unitPrice: number | null;
  eeFunds: number | null;
  veeFunds: number | null;
  erFunds: number | null;
  totalFunds: number;
}

export interface NetCompanyFundsResult {
  companyNumber: string;
  companyName: string;
  valuationDate: string;
  dateFinal: string | null;
  rows: NetCompanyFundRow[];
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
  employeeId: number | null;
  currency: string;
  withdrawalDate: string;
  pensionStartDate?: string | null;
  terminationDate?: string | null;
  nationalId?: string | null;
  category?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
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

export interface WithdrawalAmount {
  fund: number;
  employeeFund: number;
  voluntaryEmployeeFund: number;
  employerFund: number;
}

export interface EmployeeFundsWithdrawalResult {
  reference: string;
  message: string;
}

export interface TerminationFundRow {
  fund: number;
  eeUnits: number;
  veeUnits: number;
  erUnits: number;
  terminatedErUnits: number;
  totalUnits: number;
  unitPrice: number;
}

export interface EmployeeTerminationEstimate {
  companyNumber: string;
  companyName: string;
  employeeId: number | null;
  employeeNumber: string;
  employeeName: string;
  currency: string;
  paymentDate: string;
  terminationDate: string;
  rows: TerminationFundRow[];
}

export interface AggregatedBalanceRow {
  fullName: string;
  employeeNumber: string;
  currency: string;
  grossContributionEe: number;
  grossContributionVee: number;
  grossContributionEr: number;
  netContributionEe: number;
  netContributionVee: number;
  netContributionEr: number;
  investmentReturnEe: number;
  investmentReturnVee: number;
  investmentReturnEr: number;
  totalInvestmentReturn: number;
  accumulatedValueEe: number;
  accumulatedValueVee: number;
  accumulatedValueEr: number;
  accumulatedValueTotal: number;
}

export interface AggregatedBalanceTotals {
  grossContributionEe: number;
  grossContributionVee: number;
  grossContributionEr: number;
  investmentReturnEe: number;
  investmentReturnVee: number;
  investmentReturnEr: number;
  totalInvestmentReturn: number;
  accumulatedValueEe: number;
  accumulatedValueVee: number;
  accumulatedValueEr: number;
  accumulatedValueTotal: number;
}

export interface AggregatedBalanceReportResponse {
  companyNumber: string;
  valuationDate: string;
  currency: string;
  rows: AggregatedBalanceRow[];
  totals: AggregatedBalanceTotals;
}
export interface TerminationReportFundRow {
  fund: number;
  startingEeUnits: number;
  startingVeeUnits: number;
  startingErUnits: number;
  startingTotalUnits: number;
  transactionalEeUnits: number;
  transactionalVeeUnits: number;
  transactionalErUnits: number;
  terminatedErUnits: number;
  transactionalTotalUnits: number;
  unitPrice: number;
  transactionalEeValue: number;
  transactionalVeeValue: number;
  transactionalErValue: number;
  terminatedErValue: number;
  transactionalTotalValue: number;
}

export interface TerminationReport {
  serial: number;
  reference: string;
  companyNumber: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  employeeId: number;
  employeeNumber: string;
  employeeName: string;
  nationalId: string;
  category: string;
  currency: string;
  pensionStartDate: string;
  terminationDate: string;
  resignationDate: string;
  paymentDate: string;
  vestingPercentage: number;
  surrenderChargesEe: number;
  surrenderChargesVee: number;
  surrenderChargesEr: number;
  rows: TerminationReportFundRow[];
  totalTransactionalEeValue: number;
  totalTransactionalVeeValue: number;
  totalTransactionalErValue: number;
  totalTerminatedErValue: number;
  totalTransactionalValue: number;
}

export interface EmployeeTerminationRequest {
  companyNumber: string;
  employeeNumber: string;
  terminationDate: string;
  resignationDate: string;
  path?: string;
}

export interface BulkTerminationRequest {
  companyNumber: string;
  employees: {
    employeeNumber: string;
    terminationDate: string;
    resignationDate: string;
  }[];
  path?: string;
}

export interface BulkTerminationResult {
  message?: string;
}

export interface CompanyTerminationRequest {
  companyNumber: string;
  terminationDate: string;
  path?: string;
}

export interface CompanyTerminationRow {
  description?: string;
  paymentDate: string | number;
  companyNumber: string;
  employeeId: number;
  employeeNumber: string;
  nationalId: string;
  fullName: string;
  dob: string | number;
  gender?: string;
  currency?: string;
  totalEeValue: number;
  totalVeeValue: number;
  totalErValue: number;
}

export type CompanyTerminationResponse =
  | CompanyTerminationRow[]
  | { employees?: CompanyTerminationRow[]; [key: string]: unknown };
