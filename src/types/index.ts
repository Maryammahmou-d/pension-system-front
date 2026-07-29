export interface AmlMatchResult {
  recordId: number;
  matchedName?: string;
  matchType: 'ID' | 'NAME';
  listType: 'TERRORISM' | 'PROSECUTION';
  matchClass: 'A' | 'B' | 'C' | 'D';
  score: number;
  matchNote?: string | null;
  rawData?: Record<string, unknown>;
}

export interface AmlCheckRequest {
  name?: string;
  nationalId?: string;
  passportId?: string;
  crNumber?: string;
  sourceSystem?: string;
}

export interface AmlCheckResponse {
  status: 'CLEAR' | 'FLAGGED';
  totalMatches: number;
  matches: AmlMatchResult[];
}

export interface InsuredPerson {
  index: number;
  name?: string;
  nationalId?: string;
  passportId?: string;
  crNumber?: string;
}

export interface AmlBatchCheckRequest {
  policyNumber?: string;
  crNumbers?: string[];
  insuredPersons: InsuredPerson[];
  sourceSystem?: string;
}

export interface FlaggedPerson {
  index: number;
  name?: string;
  nationalId?: string;
  status: 'CLEAR' | 'FLAGGED';
  nameMatchSkipped?: boolean;
  matches: AmlMatchResult[];
}

export interface AmlBatchCheckResponse {
  status: 'CLEAR' | 'FLAGGED';
  totalScreened: number;
  totalFlagged: number;
  totalMatches: number;
  processingTimeMs: number;
  nameValidationNote?: string | null;
  crMatches?: AmlMatchResult[];
  flaggedPersons: FlaggedPerson[];
}

export interface BatchJobSubmitResponse {
  jobId: string;
  status: string;
  message: string;
}

export interface BatchJobStatusResponse {
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalPersons?: number;
  totalFlagged?: number;
  totalMatches?: number;
  processingTimeMs?: number;
  errorMessage?: string;
  result?: AmlBatchCheckResponse;
}

export interface AmlListDto {
  id: number;
  listType: 'TERRORISM' | 'PROSECUTION';
  fileName: string;
  version: number;
  isActive: boolean;
  uploadedAt: string;
  recordCount?: number;
  uploadedByUserId?: number | null;
  uploadedByUsername?: string | null;
}

export interface AuditLog {
  id: number;
  actionType:
  | 'AML_CHECK'
  | 'AML_BATCH_CHECK'
  | 'LIST_UPLOAD'
  | 'OVERRIDE'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_DELETE'
  | 'USER_PASSWORD_RESET'
  | string;
  description?: string | null;
  sourceSystem?: string | null;
  requestData?: string | null;
  result?: string | null;
  createdAt: string;
  createdByUserId?: number | null;
  createdByUsername?: string | null;
}

export type UploadMode = 'REPLACE' | 'MERGE';

// ── Upload analyze / commit ──────────────────────────────────────

export interface UploadSheetAnalysis {
  listType: 'TERRORISM' | 'PROSECUTION';
  sheetName: string;
  newRecordCount: number;
  currentActiveVersion: number | null;
  currentActiveRecordCount: number;
  identicalCount: number;
  flaggedIdenticalCount: number;
  newUniqueCount: number;
}

export interface UploadAnalysisResult {
  uploadToken: string;
  fileName: string;
  expiresAtEpochMs: number;
  sheets: UploadSheetAnalysis[];
}

export interface UploadCommitRequest {
  uploadToken: string;
  mode: UploadMode;
  keepFlaggedHistory: boolean;
}

export interface UploadCommitResponse {
  message: string;
  listsCreated: number;
  results: Array<{ listId: number; listType: string; version: number; fileName: string }>;
}

export interface TerrorismRecordDto {
  id?: number;
  listId?: number;
  name?: string;
  fileOrder?: string;
  idNumber?: string;
  idType?: string;
  unifiedCode?: string;
  entityOwner?: string;
  address?: string;
  activityType?: string;
  terrorismListingDecision?: string;
  decisionYear?: string;
  caseNumber?: string;
  caseYear?: string;
  counselorLetter?: string;
  letterDate?: string;
  decisionReceivedDate?: string;
  seizureLifted?: string;
}

export interface ProsecutionRecordDto {
  id?: number;
  listId?: number;
  name?: string;
  fileOrder?: string;
  idNumber?: string;
  idType?: string;
  unifiedCode?: string;
  personType?: string;
  prohibitionOrderNumber?: string;
  prohibitionYear?: string;
  caseNumber?: string;
  caseYear?: string;
  prohibitionStatus?: string;
  counselorLetterNumber?: string;
  counselorLetterDate?: string;
  emailReceivedDate?: string;
  notes?: string;
}

export interface FlaggedRecordDto {
  id: number;
  matchedRecordId: number;
  listType: 'TERRORISM' | 'PROSECUTION';
  listVersion?: number | null;
  matchedName?: string | null;
  personName?: string | null;
  personIdNumber?: string | null;
  policyNumber?: string | null;
  sourceType: 'POLICY_SCREENING' | 'INDIVIDUAL_CHECK' | 'MANUAL_CHECK' | string;
  matchScore?: number | null;
  matchClass?: string | null;
  matchType?: string | null;
  createdAt: string;
  createdByUserId?: number | null;
  createdByUsername?: string | null;
}

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
