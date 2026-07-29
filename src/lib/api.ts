import axios from 'axios';
import type {
  AmlCheckResponse,
  AmlListDto,
  AuditLog,
  UploadMode,
  TerrorismRecordDto,
  ProsecutionRecordDto,
  PagedRecordsResponse,
  AmlBatchCheckRequest,
  AmlBatchCheckResponse,
  BatchJobSubmitResponse,
  BatchJobStatusResponse,
  FlaggedRecordDto,
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
  CreateUserRequest,
  UpdateUserRequest,
  UserDto,
  UploadAnalysisResult,
  UploadCommitRequest,
  UploadCommitResponse,
} from '../types';

// ── Token storage ────────────────────────────────────────────────
const TOKEN_KEY = 'kaf_aml_token';
const USER_KEY = 'kaf_aml_user';

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export const userStorage = {
  get: (): UserDto | null => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as UserDto; } catch { return null; }
  },
  set: (user: UserDto) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
};

// ── Axios instances (shared interceptors) ────────────────────────
const api = axios.create({
  baseURL: '/api/aml',
  headers: { 'Content-Type': 'application/json' },
});

const authApiClient = axios.create({
  baseURL: '/api/auth',
  headers: { 'Content-Type': 'application/json' },
});

const usersApiClient = axios.create({
  baseURL: '/api/users',
  headers: { 'Content-Type': 'application/json' },
});

// Attach the bearer token (if any) to every outgoing request.
const attachAuth = (cfg: import('axios').InternalAxiosRequestConfig) => {
  const token = tokenStorage.get();
  if (token && cfg.headers) {
    cfg.headers.set?.('Authorization', `Bearer ${token}`);
  }
  return cfg;
};
api.interceptors.request.use(attachAuth);
authApiClient.interceptors.request.use(attachAuth);
usersApiClient.interceptors.request.use(attachAuth);

// On 401, surface a custom event so the AuthContext can sign the user out
// and redirect to /login. We don't redirect here directly to keep this
// module decoupled from React Router.
const onUnauthorized = (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    tokenStorage.clear();
    window.dispatchEvent(new CustomEvent('kaf-aml:unauthorized'));
  }
  return Promise.reject(error);
};
api.interceptors.response.use((r) => r, onUnauthorized);
authApiClient.interceptors.response.use((r) => r, onUnauthorized);
usersApiClient.interceptors.response.use((r) => r, onUnauthorized);

// ── Auth endpoints ───────────────────────────────────────────────
export const authApi = {
  login: (req: LoginRequest) =>
    authApiClient.post<LoginResponse>('/login', req).then((r) => r.data),
  me: () => authApiClient.get<UserDto>('/me').then((r) => r.data),
  changePassword: (req: ChangePasswordRequest) =>
    authApiClient.post<UserDto>('/change-password', req).then((r) => r.data),
};

// ── User management endpoints (superuser only) ───────────────────
export const usersApi = {
  list: () => usersApiClient.get<UserDto[]>('').then((r) => r.data),
  get: (id: number) => usersApiClient.get<UserDto>(`/${id}`).then((r) => r.data),
  create: (req: CreateUserRequest) =>
    usersApiClient.post<UserDto>('', req).then((r) => r.data),
  update: (id: number, req: UpdateUserRequest) =>
    usersApiClient.put<UserDto>(`/${id}`, req).then((r) => r.data),
  remove: (id: number) =>
    usersApiClient.delete<void>(`/${id}`).then((r) => r.data),
};

export const amlApi = {
  check: (req: {
    name?: string;
    nationalId?: string;
    passportId?: string;
    crNumber?: string;
    sourceSystem: string;
    policyNumber?: string;
  }) =>
    api.post<AmlCheckResponse>('/check', req).then((r) => r.data),

  uploadFile: (file: File, mode: UploadMode = 'REPLACE') => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ message: string; listsCreated: number; results: unknown[] }>(
      `/upload?mode=${mode}`, form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ).then((r) => r.data);
  },

  // Two-step upload — analyze previews the changes, commit applies them.
  analyzeUpload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<UploadAnalysisResult>(
      '/upload/analyze', form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ).then((r) => r.data);
  },

  commitUpload: (req: UploadCommitRequest) =>
    api.post<UploadCommitResponse>('/upload/commit', req).then((r) => r.data),

  getLists: () => api.get<AmlListDto[]>('/lists').then((r) => r.data),

  getListsByType: (type: 'TERRORISM' | 'PROSECUTION') =>
    api.get<AmlListDto[]>(`/lists/${type}`).then((r) => r.data),

  getAuditLogs: (actionType?: string) =>
    api.get<AuditLog[]>('/audit', { params: actionType ? { actionType } : {} })
      .then((r) => r.data),

  getRecords: (listId: number, page = 0, size = 50, search?: string, flagged?: boolean | null) =>
    api.get<PagedRecordsResponse<TerrorismRecordDto | ProsecutionRecordDto>>(
      `/lists/${listId}/records`,
      { params: { page, size, ...(search ? { search } : {}), ...(flagged !== undefined && flagged !== null ? { flagged } : {}) } }
    ).then((r) => r.data),

  updateTerrorismRecord: (id: number, dto: TerrorismRecordDto) =>
    api.put<TerrorismRecordDto>(`/terrorism/records/${id}`, dto).then((r) => r.data),

  updateProsecutionRecord: (id: number, dto: ProsecutionRecordDto) =>
    api.put<ProsecutionRecordDto>(`/prosecution/records/${id}`, dto).then((r) => r.data),

  createTerrorismRecord: (listId: number, dto: TerrorismRecordDto) =>
    api.post<TerrorismRecordDto>(`/lists/${listId}/terrorism/records`, dto).then((r) => r.data),

  createProsecutionRecord: (listId: number, dto: ProsecutionRecordDto) =>
    api.post<ProsecutionRecordDto>(`/lists/${listId}/prosecution/records`, dto).then((r) => r.data),

  // ── Batch screening ────────────────────────────────────────────
  batchCheck: (req: AmlBatchCheckRequest) =>
    api.post<AmlBatchCheckResponse>('/check/batch', req).then((r) => r.data),

  batchSubmit: (req: AmlBatchCheckRequest) =>
    api.post<BatchJobSubmitResponse>('/check/batch/submit', req).then((r) => r.data),

  batchStatus: (jobId: string) =>
    api.get<BatchJobStatusResponse>(`/check/batch/${jobId}`).then((r) => r.data),

  // ── Excel-driven batch screening (server-side parsing) ────────
  batchExcelPeek: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ headers: string[]; totalRows: number; sheetName: string }>(
      '/check/batch/excel/peek', form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    ).then((r) => r.data);
  },

  batchExcelRun: (
    file: File,
    mapping: { nameColumn: string; idColumn?: string; idTypeColumn?: string },
    policyNumber?: string,
    mode: 'standard' | 'queued' = 'standard',
  ) => {
    const form = new FormData();
    form.append('file', file);
    form.append('nameColumn', mapping.nameColumn);
    if (mapping.idColumn) form.append('idColumn', mapping.idColumn);
    if (mapping.idTypeColumn) form.append('idTypeColumn', mapping.idTypeColumn);
    if (policyNumber) form.append('policyNumber', policyNumber);
    form.append('sourceSystem', 'AML_FRONTEND');
    const path = mode === 'queued' ? '/check/batch/excel/submit' : '/check/batch/excel';
    return api.post<AmlBatchCheckResponse | BatchJobSubmitResponse>(
      path, form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    ).then((r) => r.data);
  },

  // ── Flagged records ───────────────────────────────────────────
  getRecentFlags: (limit = 5, days?: number) =>
    api.get<FlaggedRecordDto[]>('/flags/recent', { params: { limit, ...(days ? { days } : {}) } })
      .then((r) => r.data),

  getFlagsByRecordIds: (ids: number[]) =>
    api.get<Record<number, FlaggedRecordDto>>('/flags/by-records', { params: { ids: ids.join(',') } })
      .then((r) => r.data),

  getFlagCount: (
    listType: 'TERRORISM' | 'PROSECUTION',
    listVersion: number,
    matchClass?: 'A' | 'D',
  ) =>
    api.get<{ listType: string; listVersion: number; matchClass?: string; count: number }>(
      '/flags/count',
      { params: { listType, listVersion, ...(matchClass ? { matchClass } : {}) } },
    ).then((r) => r.data.count),

  getAllFlags: (page = 0, size = 50, sourceType?: string, matchClass?: string) =>
    api.get<{
      flags: FlaggedRecordDto[];
      totalElements: number;
      totalPages: number;
      page: number;
      size: number;
    }>('/flags', {
      params: {
        page, size,
        ...(sourceType ? { sourceType } : {}),
        ...(matchClass ? { matchClass } : {}),
      },
    }).then((r) => r.data),
};
