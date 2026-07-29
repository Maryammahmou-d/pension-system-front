// ── Auth & users ────────────────────────────────────────────────

export type PermissionKey =
  | 'permViewDashboard'
  | 'permViewAuditLog'
  | 'permViewFlaggedRecords'
  | 'permRunAmlCheck'
  | 'permRunBatchCheck'
  | 'permViewLists'
  | 'permManageLists'
  | 'permUploadLists';

export interface UserDto {
  id: number;
  username: string;
  email: string;
  fullName?: string | null;
  isSuperuser: boolean;
  isActive: boolean;
  mustChangePassword: boolean;

  permViewDashboard: boolean;
  permViewAuditLog: boolean;
  permViewFlaggedRecords: boolean;
  permRunAmlCheck: boolean;
  permRunBatchCheck: boolean;
  permViewLists: boolean;
  permManageLists: boolean;
  permUploadLists: boolean;

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
  email: string;
  fullName?: string;
  /** Initial password chosen by the creating superuser (min 8 chars). */
  password: string;
  isSuperuser?: boolean;
  permViewDashboard?: boolean;
  permViewAuditLog?: boolean;
  permViewFlaggedRecords?: boolean;
  permRunAmlCheck?: boolean;
  permRunBatchCheck?: boolean;
  permViewLists?: boolean;
  permManageLists?: boolean;
  permUploadLists?: boolean;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  isSuperuser?: boolean;
  isActive?: boolean;
  permViewDashboard?: boolean;
  permViewAuditLog?: boolean;
  permViewFlaggedRecords?: boolean;
  permRunAmlCheck?: boolean;
  permRunBatchCheck?: boolean;
  permViewLists?: boolean;
  permManageLists?: boolean;
  permUploadLists?: boolean;
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
