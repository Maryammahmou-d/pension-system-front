import type {
  CancelInvoiceRequest,
  CreateInvoiceRequest,
  CreateInvoiceResult,
  InvoiceDetails,
  Invoice,
  SettleInvoiceRequest,
} from '../types';
import { extractApiError, http } from './httpClient';

export const invoicesApi = {
  list: async (status?: Invoice['status']): Promise<Invoice[]> => {
    try {
      const { data } = await http.get<Invoice[]>('/invoices', {
        params: status ? { status } : undefined,
      });
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to load invoices.'));
    }
  },

  get: async (invoiceNumber: string): Promise<Invoice | null> => {
    try {
      const { data } = await http.get<Invoice>(`/invoices/${invoiceNumber}`);
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to load invoice.'));
    }
  },

  details: async (invoiceNumber: string): Promise<InvoiceDetails> => {
    try {
      const { data } = await http.get<InvoiceDetails>(`/invoices/${invoiceNumber}/details`);
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Failed to load invoice details.'));
    }
  },

  create: async (req: CreateInvoiceRequest): Promise<CreateInvoiceResult> => {
    try {
      const { data } = await http.post<CreateInvoiceResult>('/invoices', req);
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Invoice could not be created'));
    }
  },

  settle: async (req: SettleInvoiceRequest): Promise<Invoice> => {
    try {
      const { data } = await http.post<Invoice>(`/invoices/${req.invoiceNumber}/settle`, {
        paymentDate: req.paymentDate,
        userSecurityLevel: req.userSecurityLevel,
        userName: req.userName,
      });
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Settle failed'));
    }
  },

  cancel: async (req: CancelInvoiceRequest): Promise<Invoice> => {
    try {
      const { data } = await http.post<Invoice>(`/invoices/${req.invoiceNumber}/cancel`, {
        cancellationDate: req.cancellationDate,
        userName: req.userName,
      });
      return data;
    } catch (err) {
      throw new Error(extractApiError(err, 'Cancel failed'));
    }
  },
};
