import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserDto,
  UserSecurityRole,
} from '../types';
import { DEFAULT_USER_PASSWORD } from '../types';
import { extractApiError, http } from './httpClient';

// ── Token storage ────────────────────────────────────────────────
const TOKEN_KEY = 'kaf_rubix_token';
const USER_KEY = 'kaf_rubix_user';

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

/** Numeric `UserSecurity` codes as stored in the backend `UserTable`. */
export const ROLE_BY_SECURITY_LEVEL: Record<number, UserSecurityRole> = {
  1: 'Admin',
  2: 'Investment',
  3: 'Operations',
  4: 'Actuarial',
  5: 'Tech',
  6: 'CRM',
};

const SECURITY_LEVEL_BY_ROLE = Object.fromEntries(
  Object.entries(ROLE_BY_SECURITY_LEVEL).map(([level, role]) => [role, Number(level)]),
) as Record<UserSecurityRole, number>;

export function securityLevelForRole(role: UserSecurityRole | undefined): number {
  if (!role) return 3;
  return SECURITY_LEVEL_BY_ROLE[role] ?? 3;
}

export function roleForSecurityLevel(level: number | null | undefined): UserSecurityRole {
  return ROLE_BY_SECURITY_LEVEL[Number(level)] ?? 'Actuarial';
}

/** Raw `User` entity returned by every `/users` endpoint. */
export interface BackendUserRow {
  userId: number;
  userLogin: string;
  fullName: string | null;
  password?: string | null;
  userSecurity: number;
}

function mapBackendUser(row: BackendUserRow): UserDto {
  const role = roleForSecurityLevel(row.userSecurity);
  const username = row.userLogin ?? '';
  return {
    id: row.userId,
    username,
    fullName: row.fullName ?? username,
    userSecurity: role,
    isSuperuser: role === 'Admin',
    mustChangePassword: row.password === DEFAULT_USER_PASSWORD,
  };
}

let _users: UserDto[] = [];

/** username (lowercase) → plaintext password, cached from the backend rows. */
const _passwords: Record<string, string> = {};

let _nextId = 1;
const delay = () => new Promise<void>((r) => setTimeout(r, 120));

const authError = () =>
  Object.assign(new Error('Invalid credentials.'), { isAuthError: true });

/** Adds or replaces a user in the local store so mock-only flows stay in sync. */
function upsertLocalUser(u: UserDto): void {
  const exists = _users.some((x) => x.id === u.id);
  _users = exists ? _users.map((x) => (x.id === u.id ? u : x)) : [..._users, u];
  _nextId = Math.max(_nextId, u.id + 1);
}

export const usersApi = {
  list: async (): Promise<UserDto[]> => {
    const { data } = await http.get<BackendUserRow[]>('/users');
    const mapped = data.map(mapBackendUser);

    // Keep the local store in sync so login / edit flows see the same users.
    _users = mapped;
    _nextId = mapped.reduce((max, u) => Math.max(max, u.id), 0) + 1;
    for (const row of data) {
      if (row.userLogin && row.password) {
        _passwords[row.userLogin.toLowerCase()] = row.password;
      }
    }

    return [...mapped];
  },

  get: async (id: number): Promise<UserDto> => {
    await delay();
    const u = _users.find((x) => x.id === id);
    if (!u) throw new Error(`User ${id} not found`);
    return { ...u };
  },

  create: async (req: CreateUserRequest): Promise<UserDto> => {
    const username = req.username.trim();
    const password = req.password?.trim() || DEFAULT_USER_PASSWORD;

    const { data } = await http.post<BackendUserRow>('/users', {
      userLogin: username,
      fullName: req.fullName.trim(),
      password,
      userSecurity: securityLevelForRole(req.userSecurity),
    });

    const created = mapBackendUser(data);
    upsertLocalUser(created);
    _passwords[created.username.toLowerCase()] = password;
    return { ...created };
  },

  update: async (id: number, req: UpdateUserRequest): Promise<UserDto> => {
    const { data } = await http.put<BackendUserRow>(`/users/${id}`, {
      fullName: req.fullName,
      userLogin: req.userLogin,
      userSecurity: req.userSecurity ? securityLevelForRole(req.userSecurity) : undefined,
    });
    const next = mapBackendUser(data);
    upsertLocalUser(next);
    return { ...next };
  },

  /**
   * `PUT /users/{id}/reset-password` — takes no body; the backend resets the
   * password to the shared default and returns the updated row.
   */
  resetPassword: async (id: number): Promise<UserDto> => {
    const { data } = await http.put<BackendUserRow>(`/users/${id}/reset-password`);
    const next = mapBackendUser(data);
    upsertLocalUser(next);
    _passwords[next.username.toLowerCase()] = DEFAULT_USER_PASSWORD;
    return { ...next };
  },

  authenticate: async (identifier: string, password: string): Promise<UserDto> => {
    let row: BackendUserRow | null;
    try {
      const res = await http.post<BackendUserRow | null>('/users/login', {
        userLogin: identifier.trim(),
        password,
      });
      row = res.data;
    } catch (err) {
      // Surface exactly what the backend sent (plain-string or JSON body).
      throw Object.assign(
        new Error(extractApiError(err, 'Login failed')),
        { isAuthError: true },
      );
    }

    if (!row?.userLogin) throw authError();

    const u = mapBackendUser(row);
    upsertLocalUser(u);
    if (row.password) _passwords[u.username.toLowerCase()] = row.password;

    return { ...u };
  },

  setPassword: async (
    id: number,
    username: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<UserDto> => {
    const { data } = await http.put<BackendUserRow>(
      `/users/${id}/reset-first-login-password`,
      {
        userLogin: username,
        currentPassword,
        newPassword,
      },
    );
    const next = mapBackendUser(data);
    upsertLocalUser(next);
    return { ...next };
  },
};

export {
  invoicesApi,
  topUpsApi,
  lookupsApi,
  unitPricesApi,
  netCompanyFundsApi,
  netCompanyFundsPaymentDateApi,
  netEmployeeFundsApi,
  netFundsApi,
  netUnitsApi,
  monthlyChargesApi,
  vestingRulesApi,
  employeeFundsWithdrawalApi,
  employeeTerminationApi,
  reportsApi,
  dateHelpers,
} from './rubixApi';
export type { ReportExtractFormat, ReportExtractResult } from './rubixApi';
