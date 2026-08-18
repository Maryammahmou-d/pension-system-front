import type { MonthlyChargeRun, MonthlyChargesResult } from '../types';
import { extractApiError, http } from './httpClient';

export const monthlyChargesApi = {
  listPrevious: async (): Promise<MonthlyChargeRun[]> => {
    try {
      const { data } = await http.get<MonthlyChargeRun[]>('/monthly-charges');
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to load previous runs.'));
    }
  },

  run: async (runDate: string, month: number, year: number): Promise<MonthlyChargesResult> => {
    try {
      const { data } = await http.post<MonthlyChargesResult>('/monthly-charges/run', { runDate, month, year });
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to run monthly charges.'));
    }
  },
};
