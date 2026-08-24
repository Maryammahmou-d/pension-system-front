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
