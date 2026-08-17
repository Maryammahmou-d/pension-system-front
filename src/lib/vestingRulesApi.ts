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

  get: async (companyNumber: string): Promise<VestingRule | null> => {
    try {
      const { data } = await http.get<VestingRule | null>(`/vesting-rules/${encodeURIComponent(companyNumber)}`);
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to load vesting rules.'));
    }
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
