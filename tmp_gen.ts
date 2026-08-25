import { writeFileSync } from 'node:fs';
import { buildTerminationReportPdf } from './tmp_termpdf';

const rows = Array.from({ length: 10 }, (_, i) => ({
  fund: i + 1,
  startingEeUnits: i === 0 ? 1200 : 0,
  startingVeeUnits: 0,
  startingErUnits: i === 0 ? 6800 : 0,
  startingTotalUnits: i === 0 ? 8000 : 0,
  transactionalEeUnits: i === 0 ? -1200 : 0,
  transactionalVeeUnits: 0,
  transactionalErUnits: i === 0 ? -3400 : 0,
  terminatedErUnits: i === 0 ? -3400 : 0,
  transactionalTotalUnits: i === 0 ? -8000 : 0,
  unitPrice: i === 0 ? 10.5 : 0,
  transactionalEeValue: i === 0 ? -12600 : 0,
  transactionalVeeValue: 0,
  transactionalErValue: i === 0 ? -35700 : 0,
  terminatedErValue: i === 0 ? -35700 : 0,
  transactionalTotalValue: i === 0 ? -84000 : 0,
}));

const report = {
  serial: 1,
  reference: 'TR-1-1',
  companyNumber: 'C000022',
  companyName: 'SOS Company',
  companyAddress: '12 Nile St, Cairo',
  companyPhone: '01000000000',
  employeeId: 1,
  employeeNumber: '1',
  employeeName: 'Ahmed Mohamed Rahoumy Ibrahim',
  nationalId: '28001172500139',
  category: '1',
  currency: 'EGP',
  pensionStartDate: '2026-02-01',
  terminationDate: '2026-06-06',
  resignationDate: '2026-06-01',
  paymentDate: '2026-06-06',
  vestingPercentage: 50,
  surrenderChargesEe: 0,
  surrenderChargesVee: 0,
  surrenderChargesEr: 0,
  rows,
  totalTransactionalEeValue: -12600,
  totalTransactionalVeeValue: 0,
  totalTransactionalErValue: -35700,
  totalTerminatedErValue: -35700,
  totalTransactionalValue: -84000,
};

// jsPDF's blob output needs a Blob->buffer bridge in node.
buildTerminationReportPdf(report).then(async (blob) => {
  const buf = Buffer.from(await blob.arrayBuffer());
  writeFileSync('D:/Rubix/generated_termination.pdf', buf);
  console.log('written', buf.length);
});
