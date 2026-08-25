import type { CreateEmployeeRequest, Employee, EmployeeNumberResponse } from '../types';
import { extractApiError, http } from './httpClient';

export const employeesApi = {
  getNextNumber: async (companyNumber: string): Promise<EmployeeNumberResponse> => {
    try {
      const { data } = await http.get<EmployeeNumberResponse>(`/employee/next-number/${companyNumber}`);
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to load next employee number.'));
    }
  },

  getByCompanyNumber: async (companyNumber: string): Promise<Employee[]> => {
    try {
      const { data } = await http.get<Employee[]>(`/employee/company/${companyNumber}/active`);
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to load active employees.'));
    }
  },

  getActiveByCompanyNumber: async (companyNumber: string): Promise<Employee[]> => {
    try {
      const { data } = await http.get<Employee[]>(`/employee/company/${companyNumber}/active`);
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to load active employees.'));
    }
  },

  getById: async (id: number): Promise<Employee> => {
    try {
      const { data } = await http.get<Employee>(`/employee/${id}`);
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to load employee.'));
    }
  },

  create: async (req: CreateEmployeeRequest): Promise<Employee> => {
    try {
      const { data } = await http.post<Employee>('/employee', req);
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to add employee.'));
    }
  },

  update: async (id: number, req: CreateEmployeeRequest): Promise<Employee> => {
    try {
      const { data } = await http.put<Employee>(`/employee/updateEmployee/${id}`, req);
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to update employee.'));
    }
  },
};
