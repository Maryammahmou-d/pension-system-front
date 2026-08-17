import type { UnitPriceRow } from '../types';
import { extractApiError, http } from './httpClient';

export const unitPricesApi = {
  save: async (userId: number, row: UnitPriceRow): Promise<UnitPriceRow> => {
    try {
      const payload = { ...row, priceDate: `${row.priceDate}T00:00:00Z` };
      const { data } = await http.post<UnitPriceRow>(`/unit-price/${userId}`, payload);
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to save unit prices.'));
    }
  },
};
