import type { Contribution, CreateContributionRequest } from '../types';
import { extractApiError, http } from './httpClient';

type RawContribution = Record<string, unknown>;

function toContribution(raw: RawContribution): Contribution {
  return {
    companyNumber: String(raw.companyNumber ?? raw.CompanyNumber ?? ''),
    category: String(raw.category ?? ''),
    ee: Number(raw.ee ?? raw.EE) || 0,
    er: Number(raw.er ?? raw.ER) || 0,
  };
}

export const contributionsApi = {
  getByCompanyNumber: async (companyNumber: string): Promise<Contribution[]> => {
    try {
      const { data } = await http.get<unknown[]>(`/contribution/${encodeURIComponent(companyNumber)}`);
      return (data ?? []).map((item) => toContribution(item as RawContribution));
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to load contributions.'));
    }
  },

  create: async (req: CreateContributionRequest): Promise<Contribution> => {
    try {
      const { data } = await http.post<unknown>('/contribution', req);
      return toContribution(data as RawContribution);
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to add contribution.'));
    }
  },

  update: async (req: CreateContributionRequest): Promise<Contribution> => {
    try {
      const { data } = await http.put<unknown>('/contribution/update', req);
      return toContribution(data as RawContribution);
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to update contribution.'));
    }
  },
};
