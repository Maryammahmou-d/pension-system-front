import type {
  BulkTerminationRequest,
  BulkTerminationResult,
  EmployeeFundsWithdrawalEstimate,
  EmployeeFundsWithdrawalResult,
  EmployeeTerminationEstimate,
  EmployeeTerminationRequest,
} from '../types';
import { extractApiError, http } from './httpClient';

export const employeeFundsWithdrawalApi = {
  estimate: async (
    companyNumber: string,
    employeeNumber: string,
    withdrawalDate: string,
  ): Promise<EmployeeFundsWithdrawalEstimate> => {
    try {
      const { data } = await http.get<EmployeeFundsWithdrawalEstimate>('/employee-withdrawal/estimate', {
        params: { companyNumber, employeeNumber, withdrawalDate },
      });
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to estimate withdrawal.'));
    }
  },

  withdraw: async (
    companyNumber: string,
    employeeNumber: string,
    withdrawalDate: string,
    amounts: { fund: number; employeeFund: number; voluntaryEmployeeFund: number; employerFund: number }[],
  ): Promise<EmployeeFundsWithdrawalResult> => {
    try {
      const { data } = await http.post<EmployeeFundsWithdrawalResult>('/employee-withdrawal', {
        companyNumber,
        employeeNumber,
        withdrawalDate,
        amounts,
      });
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to record withdrawal.'));
    }
  },
};

export const employeeTerminationApi = {
  estimate: async (
    companyNumber: string,
    employeeNumber: string,
    terminationDate: string,
  ): Promise<EmployeeTerminationEstimate> => {
    try {
      const { data } = await http.get<EmployeeTerminationEstimate>('/employee-termination/estimate', {
        params: { companyNumber, employeeNumber, terminationDate },
      });
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to estimate termination.'));
    }
  },

  terminate: async (req: EmployeeTerminationRequest): Promise<ArrayBuffer> => {
    try {
      const { data } = await http.post<ArrayBuffer>('/employee-termination', req, { responseType: 'arraybuffer' });
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Termination request failed.'));
    }
  },

  terminateBulk: async (req: BulkTerminationRequest): Promise<BulkTerminationResult> => {
    try {
      const { data } = await http.post<BulkTerminationResult>('/employee-termination/bulk', req);
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Bulk termination request failed.'));
    }
  },
};
