import type { VestingRule, VestingRuleSummary } from '../types';
import { extractApiError, http } from './httpClient';

export const vestingRulesApi = {
  list: async (): Promise<VestingRuleSummary[]> => {
    try {
      const { data } = await http.get<VestingRuleSummary[]>('/vesting-rules');
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to load vesting rules.'));
    }
  },

  /** All vesting history rows for a company (newest first), matching Access. */
  listByCompany: async (companyNumber: string): Promise<VestingRule[]> => {
    try {
      const { data } = await http.get<VestingRule[]>(
        `/vesting-rules/${encodeURIComponent(companyNumber)}`,
      );
      return Array.isArray(data) ? data : data ? [data] : [];
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to load vesting rules.'));
    }
  },

  get: async (companyNumber: string): Promise<VestingRule | null> => {
    const rules = await vestingRulesApi.listByCompany(companyNumber);
    return rules[0] ?? null;
  },

  create: async (rule: VestingRule): Promise<VestingRule> => {
    try {
      const { data } = await http.post<VestingRule>('/vesting-rules', rule);
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to add vesting rules.'));
    }
  },

  update: async (rule: VestingRule): Promise<VestingRule> => {
    try {
      const { data } = await http.put<VestingRule>('/vesting-rules', rule);
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to update vesting rules.'));
    }
  },
};
