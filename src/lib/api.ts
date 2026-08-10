import axios from 'axios';
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserDto,
  PermissionKey,
  UserSecurityRole,
} from '../types';
import { DEFAULT_USER_PASSWORD } from '../types';
import { http } from './httpClient';
import { canAccessRole } from './access';
import type { PageKey } from './access';

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

// ── In-memory mock user store ────────────────────────────────────
export const ALL_PERM_KEYS: PermissionKey[] = [
  'permViewDashboard',
  'permCreateInvoice',
  'permSettleInvoice',
  'permCancelInvoice',
  'permAddTopUp',
  'permBulkTopUp',
  'permManageUsers',
];

const allPerms = (): Record<PermissionKey, boolean> =>
  Object.fromEntries(ALL_PERM_KEYS.map((k) => [k, true])) as Record<PermissionKey, boolean>;

/** Each `perm*` flag is backed by a page in the access matrix. */
const PERM_PAGES: Record<Exclude<PermissionKey, 'permViewDashboard'>, PageKey> = {
  permCreateInvoice: 'createInvoice',
  permSettleInvoice: 'settleInvoice',
  permCancelInvoice: 'cancelInvoice',
  permAddTopUp: 'addTopUp',
  permBulkTopUp: 'bulkTopUp',
  permManageUsers: 'userManagement',
};

/**
 * Derives the stored permission flags from the single access matrix in
 * `access.ts`, so there is only ever one table of roles to maintain.
 */
export function permissionsForRole(role: UserSecurityRole): {
  isSuperuser: boolean;
  perms: Record<PermissionKey, boolean>;
} {
  const perms = { permViewDashboard: true } as Record<PermissionKey, boolean>;
  for (const [perm, page] of Object.entries(PERM_PAGES)) {
    perms[perm as PermissionKey] = canAccessRole(role, page);
  }
  return { isSuperuser: role === 'Admin', perms };
}

/** Numeric `UserSecurity` codes as stored in the backend `users` table. */
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

/**
 * Backend route that resets a user's password to the default.
 * Change this one line when the real endpoint is available.
 */
export const RESET_PASSWORD_ENDPOINT = (userId: number) => `/users/${userId}/reset-password`;

/** Raw row shape returned by `GET {API_BASE_URL}/users`. */
export interface BackendUserRow {
  userId: number;
  userLogin: string;
  fullName: string | null;
  password?: string | null;
  userSecurity: number;
}

function mapBackendUser(row: BackendUserRow): UserDto {
  const role = roleForSecurityLevel(row.userSecurity);
  const { isSuperuser, perms } = permissionsForRole(role);
  const username = row.userLogin ?? '';
  return {
    id: row.userId,
    username,
    email: `${username.toLowerCase()}@rubix.local`,
    fullName: row.fullName ?? username,
    userSecurity: role,
    isSuperuser,
    isActive: true,
    mustChangePassword: false,
    ...perms,
  };
}

let _users: UserDto[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@rubix.local',
    fullName: 'Administrator',
    userSecurity: 'Admin',
    isSuperuser: true,
    isActive: true,
    mustChangePassword: false,
    ...allPerms(),
  },
  {
    id: 2,
    username: 'ops',
    email: 'ops@rubix.local',
    fullName: 'Operations User',
    userSecurity: 'Operations',
    isSuperuser: false,
    isActive: true,
    mustChangePassword: false,
    ...permissionsForRole('Operations').perms,
  },
  {
    id: 3,
    username: 'crm',
    email: 'crm@rubix.local',
    fullName: 'CRM User',
    userSecurity: 'CRM',
    isSuperuser: false,
    isActive: true,
    mustChangePassword: false,
    ...permissionsForRole('CRM').perms,
  },
  {
    id: 4,
    username: 'tech',
    email: 'tech@rubix.local',
    fullName: 'Tech User',
    userSecurity: 'Tech',
    isSuperuser: false,
    isActive: true,
    mustChangePassword: false,
    ...permissionsForRole('Tech').perms,
  },
];

/** username (lowercase) → plaintext password (mock only) */
const _passwords: Record<string, string> = {
  admin: 'admin',
  ops: 'ops',
  crm: 'crm',
  tech: 'tech',
};

let _nextId = 5;
const delay = () => new Promise<void>((r) => setTimeout(r, 120));

const authError = () =>
  Object.assign(new Error('Invalid credentials.'), { isAuthError: true });

/** Adds or replaces a user in the local store so mock-only flows stay in sync. */
function upsertLocalUser(u: UserDto): void {
  const exists = _users.some((x) => x.id === u.id);
  _users = exists ? _users.map((x) => (x.id === u.id ? u : x)) : [..._users, u];
  _nextId = Math.max(_nextId, u.id + 1);
}

function findByLogin(identifier: string): UserDto | undefined {
  const key = identifier.trim().toLowerCase();
  return _users.find(
    (u) => u.username.toLowerCase() === key || u.email.toLowerCase() === key,
  );
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
    if (!username) throw new Error('Login ID is required.');
    if (!req.fullName?.trim()) throw new Error('Full Name is required.');
    if (!req.userSecurity) throw new Error('User Security is required.');
    if (findByLogin(username)) throw new Error('Login ID already exists.');

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
    await delay();
    const existing = _users.find((x) => x.id === id);
    if (!existing) throw new Error(`User ${id} not found`);

    let next: UserDto = { ...existing };

    if (req.fullName !== undefined) next.fullName = req.fullName;
    if (req.email !== undefined) next.email = req.email;
    if (req.isActive !== undefined) next.isActive = req.isActive;

    if (req.userSecurity !== undefined) {
      const mapped = permissionsForRole(req.userSecurity);
      next.userSecurity = req.userSecurity;
      next.isSuperuser = mapped.isSuperuser;
      next = { ...next, ...mapped.perms };
    }

    if (req.isSuperuser !== undefined) next.isSuperuser = req.isSuperuser;

    for (const k of ALL_PERM_KEYS) {
      if (req[k] !== undefined) next[k] = Boolean(req[k]);
    }

    _users = _users.map((u) => (u.id === id ? next : u));
    return { ...next };
  },

  /**
   * Resets a user's password back to the backend default. No password is
   * supplied by the caller — the backend decides the new value and flags the
   * user to change it on next login.
   *
   * TODO: point RESET_PASSWORD_ENDPOINT at the real backend route.
   */
  resetPassword: async (id: number): Promise<void> => {
    await http.post(RESET_PASSWORD_ENDPOINT(id));
    const u = _users.find((x) => x.id === id);
    if (u) {
      _users = _users.map((x) => (x.id === id ? { ...x, mustChangePassword: true } : x));
      delete _passwords[u.username.toLowerCase()];
    }
  },

  remove: async (id: number): Promise<void> => {
    await delay();
    const u = _users.find((x) => x.id === id);
    if (u) delete _passwords[u.username.toLowerCase()];
    _users = _users.filter((x) => x.id !== id);
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
      if (axios.isAxiosError(err)) {
        const status = err.response?.status ?? 0;
        if (status === 404) {
          throw new Error(
            'Login endpoint not found (POST /users/login). Is the backend running the latest build?',
          );
        }
        if (status === 401 || status === 403) throw authError();
        // The backend signals a rejected login by throwing, which Spring turns
        // into a 500 carrying the reason in `message` (e.g. "Invalid Login ID
        // or Password"). Prefer that text over the generic axios message.
        const message = (err.response?.data as { message?: string } | undefined)?.message;
        if (message) throw Object.assign(new Error(message), { isAuthError: true });
      }
      throw err;
    }

    if (!row?.userLogin) throw authError();

    const u = mapBackendUser(row);
    if (!u.isActive) throw authError();

    upsertLocalUser(u);
    if (row.password) _passwords[u.username.toLowerCase()] = row.password;

    return { ...u };
  },

  setPassword: async (
    username: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<UserDto> => {
    await delay();
    const key = username.toLowerCase();
    const u = _users.find((x) => x.username.toLowerCase() === key);
    if (!u) throw new Error('User not found.');
    if (_passwords[key] !== currentPassword) {
      throw new Error('Current password is incorrect.');
    }
    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters.');
    }
    _passwords[key] = newPassword;
    const next: UserDto = { ...u, mustChangePassword: false };
    _users = _users.map((x) => (x.id === u.id ? next : x));
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
