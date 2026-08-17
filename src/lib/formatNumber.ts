/** Matches Access Net Company Funds form display formats. */

const integerFmt = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const unitPriceFmt = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function fmtAccessUnits(n: number | null | undefined): string {
  if (n == null) return '';
  return integerFmt.format(Math.round(n));
}

export function fmtAccessUnitPrice(n: number | null | undefined): string {
  if (n == null) return '';
  return unitPriceFmt.format(n);
}

export function fmtAccessFunds(n: number | null | undefined): string {
  if (n == null) return '';
  return integerFmt.format(Math.round(n));
}

export type FundNetColumn =
  | 'eeUnits'
  | 'veeUnits'
  | 'erUnits'
  | 'totalUnits'
  | 'unitPrice'
  | 'eeFunds'
  | 'veeFunds'
  | 'erFunds'
  | 'totalFunds';

export function fmtAccessFundCell(column: FundNetColumn, n: number | null | undefined): string {
  if (column === 'unitPrice') return fmtAccessUnitPrice(n);
  if (column.endsWith('Funds')) return fmtAccessFunds(n);
  return fmtAccessUnits(n);
}
