// ── Auth & users ────────────────────────────────────────────────

export type PermissionKey =
  | 'permViewDashboard'
  | 'permCreateInvoice'
  | 'permSettleInvoice'
  | 'permCancelInvoice'
  | 'permAddTopUp'
  | 'permBulkTopUp'
  | 'permManageUsers';

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

export interface UserDto {
  id: number;
  username: string;
  email: string;
  fullName?: string | null;
  userSecurity: UserSecurityRole;
  isSuperuser: boolean;
  isActive: boolean;
  mustChangePassword: boolean;

  permViewDashboard: boolean;
  permCreateInvoice: boolean;
  permSettleInvoice: boolean;
  permCancelInvoice: boolean;
  permAddTopUp: boolean;
  permBulkTopUp: boolean;
  permManageUsers: boolean;

  createdAt?: string | null;
  updatedAt?: string | null;
  lastLoginAt?: string | null;
  createdBy?: string | null;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresInSeconds: number;
  user: UserDto;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface CreateUserRequest {
  username: string;
  fullName: string;
  userSecurity: UserSecurityRole;
  /** Optional; defaults to `{username}@rubix.local` when omitted. */
  email?: string;
  /** Optional; defaults to Access default `Password` when omitted. */
  password?: string;
  isSuperuser?: boolean;
  permViewDashboard?: boolean;
  permCreateInvoice?: boolean;
  permSettleInvoice?: boolean;
  permCancelInvoice?: boolean;
  permAddTopUp?: boolean;
  permBulkTopUp?: boolean;
  permManageUsers?: boolean;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  userSecurity?: UserSecurityRole;
  isSuperuser?: boolean;
  isActive?: boolean;
  permViewDashboard?: boolean;
  permCreateInvoice?: boolean;
  permSettleInvoice?: boolean;
  permCancelInvoice?: boolean;
  permAddTopUp?: boolean;
  permBulkTopUp?: boolean;
  permManageUsers?: boolean;
  /** When true, resets the user's password using newPassword and forces change on next login. */
  resetPassword?: boolean;
  /** Required when resetPassword=true (min 8 chars). */
  newPassword?: string;
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
