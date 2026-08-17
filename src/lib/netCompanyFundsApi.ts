import type { NetCompanyFundsResult } from '../types';
import { extractApiError, http } from './httpClient';

export const netCompanyFundsApi = {
  calculate: async (companyNumber: string, valuationDate: string): Promise<NetCompanyFundsResult> => {
    try {
      const { data } = await http.get<NetCompanyFundsResult>('/net-company-funds/modified', {
        params: { companyNumber, valuationDate },
      });
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to calculate company funds.'));
    }
  },
};
