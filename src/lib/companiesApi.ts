import type { CreateCompanyRequest, Company } from '../types';
import { extractApiError, http } from './httpClient';

export const companiesApi = {
  create: async (req: CreateCompanyRequest): Promise<Company> => {
    try {
      const { data } = await http.post<Company>('/companies', req);
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to create company.'));
    }
  },

  getLatest: async (): Promise<Company[]> => {
    try {
      const { data } = await http.get<Company[]>('/companies/latest');
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to load companies.'));
    }
  },

  getLastNumber: async (): Promise<string> => {
    try {
      const { data } = await http.get<string>('/companies/last-number');
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to load last company number.'));
    }
  },

  update: async (id: number, req: Partial<CreateCompanyRequest>): Promise<Company> => {
    try {
      const { data } = await http.put<Company>(`/companies/${id}`, req);
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to update company.'));
    }
  },
};
