import type {
  EmployeeFundsWithdrawalEstimate,
  EmployeeFundsWithdrawalResult,
  EmployeeTerminationEstimate,
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
};
