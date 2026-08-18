import type {
  NetCompanyFundsResult,
  NetEmployeeFundsResult,
  NetFundsResult,
  NetUnitsResult,
} from '../types';
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

export const netEmployeeFundsApi = {
  calculate: async (
    companyNumber: string,
    employeeNumber: string,
    valuationDate: string,
  ): Promise<NetEmployeeFundsResult> => {
    try {
      const { data } = await http.get<NetEmployeeFundsResult>('/net-employee-funds', {
        params: { companyNumber, employeeNumber, valuationDate },
      });
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to calculate employee funds.'));
    }
  },
};

export const netFundsApi = {
  calculate: async (valuationDate: string): Promise<NetFundsResult> => {
    try {
      const { data } = await http.get<NetFundsResult>('/net-funds', {
        params: { valuationDate },
      });
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to calculate net funds.'));
    }
  },
};

export const netUnitsApi = {
  calculate: async (valuationDate: string): Promise<NetUnitsResult> => {
    try {
      const { data } = await http.get<NetUnitsResult>('/net-units', {
        params: { valuationDate },
      });
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to calculate net units.'));
    }
  },
};
