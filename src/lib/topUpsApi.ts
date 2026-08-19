import type { BulkTopUpRequest, BulkTopUpResult, TopUpRequest, TopUpResult } from '../types';
import { extractApiError, http } from './httpClient';

export const topUpsApi = {
  create: async (req: TopUpRequest): Promise<TopUpResult> => {
    try {
      const { data } = await http.post<TopUpResult>('/top-ups', req);
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Top up failed'));
    }
  },

  bulk: async (req: BulkTopUpRequest): Promise<BulkTopUpResult> => {
    try {
      const { data } = await http.post<BulkTopUpResult>('/top-ups/bulk', req);
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Bulk top-up failed'));
    }
  },
};
