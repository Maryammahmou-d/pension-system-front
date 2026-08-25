import type {
  Company,
  CompanyTerminationRequest,
  CreateCompanyRequest,
} from '../types';
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
      const { data } = await http.get<Company[]>('/companies/active');
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to load active companies.'));
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

  getActive: async (): Promise<Company[]> => {
    try {
      const { data } = await http.get<Company[]>('/companies/active');
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to load active companies.'));
    }
  },

  terminate: async (req: CompanyTerminationRequest): Promise<ArrayBuffer> => {
    try {
      const { data } = await http.post<ArrayBuffer>('/company-termination', req, { responseType: 'arraybuffer' });
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Company termination request failed.'));
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
