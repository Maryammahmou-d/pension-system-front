function yyyymmdd(iso: string): string {
  return iso.replace(/-/g, '');
}

export function balanceReportBaseName(valuationDate: string, companyNumber: string): string {
  return `Balance_Report_${yyyymmdd(valuationDate)}_${companyNumber}`;
}

export function balanceReportExcelName(valuationDate: string, companyNumber: string): string {
  return `${balanceReportBaseName(valuationDate, companyNumber)}.xlsx`;
}

export function balanceReportPdfName(valuationDate: string, companyNumber: string): string {
  return `${balanceReportBaseName(valuationDate, companyNumber)}.pdf`;
}

export function employeeBalanceExcelName(valuationDate: string, employeeNumber: string): string {
  return `${balanceReportBaseName(valuationDate, employeeNumber)}.xlsx`;
}

export function employeeBalancePdfName(valuationDate: string, employeeNumber: string): string {
  return `${balanceReportBaseName(valuationDate, employeeNumber)}.pdf`;
}

export function companyBalanceZipName(valuationDate: string, companyNumber: string): string {
  return `${balanceReportBaseName(valuationDate, companyNumber)}.zip`;
}

/** Access-style output folder: Company_Balance_Reports_{yyyymmdd}_{companyNumber} */
export function companyBalanceFolderName(valuationDate: string, companyNumber: string): string {
  return `Company_Balance_Reports_${yyyymmdd(valuationDate)}_${companyNumber.trim()}`;
}
