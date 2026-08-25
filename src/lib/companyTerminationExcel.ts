import ExcelJS from 'exceljs';
import type { CompanyTerminationRow } from '../types';

function toExcelDate(value: string | number): Date | number | string {
  if (typeof value === 'number') return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d;
}

export async function buildCompanyTerminationExcel(rows: CompanyTerminationRow[]): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Termination');
  ws.columns = [
    { header: 'Payment_Date', key: 'paymentDate', width: 14, style: { numFmt: 'yyyy-mm-dd' } },
    { header: 'Company_Number', key: 'companyNumber', width: 16 },
    { header: 'Employee_ID', key: 'employeeId', width: 12 },
    { header: 'Employee_Number', key: 'employeeNumber', width: 18 },
    { header: 'National_ID', key: 'nationalId', width: 16 },
    { header: 'Full_Name', key: 'fullName', width: 32 },
    { header: 'DOB', key: 'dob', width: 12, style: { numFmt: 'yyyy-mm-dd' } },
    { header: 'Gender', key: 'gender', width: 10 },
    { header: 'Currency', key: 'currency', width: 10 },
    { header: 'Total_EE_Value', key: 'totalEeValue', width: 16 },
    { header: 'Total_VEE_Value', key: 'totalVeeValue', width: 16 },
    { header: 'Total_ER_Value', key: 'totalErValue', width: 16 },
  ];

  for (const row of rows) {
    ws.addRow({
      paymentDate: toExcelDate(row.paymentDate),
      companyNumber: row.companyNumber,
      employeeId: row.employeeId,
      employeeNumber: row.employeeNumber,
      nationalId: row.nationalId,
      fullName: row.fullName,
      dob: toExcelDate(row.dob),
      gender: row.gender ?? '',
      currency: row.currency ?? '',
      totalEeValue: row.totalEeValue,
      totalVeeValue: row.totalVeeValue,
      totalErValue: row.totalErValue,
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}