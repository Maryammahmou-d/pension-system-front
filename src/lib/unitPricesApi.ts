import type { UnitPriceRow } from '../types';
import { extractApiError, http } from './httpClient';

interface BackendUnitPrice {
  id: number;
  entryDate: string;
  priceDate: string;
  fund1: number;
  fund2: number;
  fund3: number;
  fund4: number;
  fund5: number;
  fund6: number;
  fund7: number;
  fund8: number;
  fund9: number;
  fund10: number;
  userName: string | null;
}

function mapRow(r: BackendUnitPrice): UnitPriceRow {
  const iso = r.priceDate?.slice(0, 10) ?? '';
  return {
    priceDate: iso,
    fund1: r.fund1,
    fund2: r.fund2,
    fund3: r.fund3,
    fund4: r.fund4,
    fund5: r.fund5,
    fund6: r.fund6,
    fund7: r.fund7,
    fund8: r.fund8,
    fund9: r.fund9,
    fund10: r.fund10,
    userName: r.userName,
  };
}

export const unitPricesApi = {
  list: async (): Promise<UnitPriceRow[]> => {
    try {
      const { data } = await http.get<BackendUnitPrice[]>('/unit-price');
      return data.map(mapRow);
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to load unit prices.'));
    }
  },

  save: async (userId: number, row: UnitPriceRow): Promise<UnitPriceRow> => {
    try {
      const payload = { ...row, priceDate: `${row.priceDate}T00:00:00+03:00` };
      const { data } = await http.post<BackendUnitPrice>(`/unit-price/${userId}`, payload);
      return mapRow(data);
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to save unit prices.'));
    }
  },
};
