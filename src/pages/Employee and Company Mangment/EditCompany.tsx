import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Pencil } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { companiesApi } from '../../lib/companiesApi';
import { extractApiError } from '../../lib/httpClient';
import type { Company as BackendCompany, CreateCompanyRequest } from '../../types';

const FREQUENCIES = ['Monthly', 'Quarterly', 'Semi-Annually', 'Annually'];

interface FormState {
  kafCompanyNumber: string;
  companyName: string;
  issueDate: string;
  address: string;
  contactPerson: string;
  mobileNumber: string;
  email: string;
  startingNumberOfEmployees: string;
  startingAverageSalary: string;
  startingFundValue: string;
  contributionCharges: string;
  contributionChargesVEE: string;
  imc: string;
  withdrawalChargesEE: string;
  withdrawalChargesVoluntaryEE: string;
  withdrawalChargesER: string;
  surrenderCharges: string;
  topUpCharges: string;
  monthlyAdminCharges: string;
  portfolioSwitchingCharges: string;
  allocationRedirectionCharges: string;
  newOrAcquired: string;
  vestingOnHireDate: boolean;
  maxWithdrawalPercentage: string;
  maxAnnualWithdrawalFrequency: string;
  frequency: string;
  salaryOrContribution: boolean;
  showAvailableForWithdrawal: boolean;
}

interface Company extends FormState {
  id: number;
  companyNumber: string;
  serial: string;
}

const toStr = (v: number | string | undefined | null): string => (v == null ? '' : String(v));

function toCairoDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
}

function formatDisplayDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { timeZone: 'Africa/Cairo' });
}

const mapBackendCompany = (c: BackendCompany): Company => ({
  id: c.id ?? 0,
  serial: toStr(c.serial),
  companyNumber: c.companyNumber ?? '',
  kafCompanyNumber: c.kafsCompanyNumber ?? '',
  companyName: c.companyName ?? '',
  issueDate: toCairoDate(c.issueDate),
  address: c.address ?? '',
  contactPerson: c.contactPerson ?? '',
  mobileNumber: c.mobileNumber ?? '',
  email: c.email ?? '',
  startingNumberOfEmployees: toStr(c.startingNumberOfEmployees),
  startingAverageSalary: toStr(c.startingAverageSalary),
  startingFundValue: toStr(c.startingFundValue),
  contributionCharges: toStr(c.contributionCharges),
  contributionChargesVEE: toStr(c.contributionChargesVee),
  imc: toStr(c.imc),
  withdrawalChargesEE: toStr(c.withdrawalChargesEe),
  withdrawalChargesVoluntaryEE: toStr(c.withdrawalChargesVee),
  withdrawalChargesER: toStr(c.withdrawalChargesEr),
  surrenderCharges: toStr(c.employeeSurrenderCharge),
  topUpCharges: toStr(c.topUpCharges),
  monthlyAdminCharges: toStr(c.adminCharges),
  portfolioSwitchingCharges: toStr(c.portfolioSwitchingCharges),
  allocationRedirectionCharges: toStr(c.allocationRedirectionCharges),
  newOrAcquired: toStr(c.newOrAcquired),
  vestingOnHireDate: c.vestingOnHire ?? false,
  maxWithdrawalPercentage: toStr(c.maxWithdrawalPercentage),
  maxAnnualWithdrawalFrequency: toStr(c.maxWithdrawalCount),
  frequency: c.frequency ?? '',
  salaryOrContribution: c.salaryOrContribution ?? false,
  showAvailableForWithdrawal: c.showAvailableWithdrawal ?? false,
});

const emptyUpdated = (): FormState => ({
  kafCompanyNumber: '',
  companyName: '',
  issueDate: '',
  address: '',
  contactPerson: '',
  mobileNumber: '',
  email: '',
  startingNumberOfEmployees: '',
  startingAverageSalary: '',
  startingFundValue: '',
  contributionCharges: '',
  contributionChargesVEE: '',
  imc: '',
  withdrawalChargesEE: '',
  withdrawalChargesVoluntaryEE: '',
  withdrawalChargesER: '',
  surrenderCharges: '',
  topUpCharges: '',
  monthlyAdminCharges: '',
  portfolioSwitchingCharges: '',
  allocationRedirectionCharges: '',
  newOrAcquired: '',
  vestingOnHireDate: false,
  maxWithdrawalPercentage: '',
  maxAnnualWithdrawalFrequency: '',
  frequency: '',
  salaryOrContribution: false,
  showAvailableForWithdrawal: false,
});

function hasChanges(updated: FormState, current: Company): boolean {
  const stringKeys: (keyof FormState)[] = [
    'kafCompanyNumber',
    'companyName',
    'issueDate',
    'address',
    'contactPerson',
    'mobileNumber',
    'email',
    'startingNumberOfEmployees',
    'startingAverageSalary',
    'startingFundValue',
    'contributionCharges',
    'contributionChargesVEE',
    'imc',
    'withdrawalChargesEE',
    'withdrawalChargesVoluntaryEE',
    'withdrawalChargesER',
    'surrenderCharges',
    'topUpCharges',
    'monthlyAdminCharges',
    'portfolioSwitchingCharges',
    'allocationRedirectionCharges',
    'newOrAcquired',
    'maxWithdrawalPercentage',
    'maxAnnualWithdrawalFrequency',
    'frequency',
  ];

  const hasStringChange = stringKeys.some((k) => (updated[k] as string).trim() !== '');
  const hasBoolChange =
    updated.vestingOnHireDate !== current.vestingOnHireDate ||
    updated.salaryOrContribution !== current.salaryOrContribution ||
    updated.showAvailableForWithdrawal !== current.showAvailableForWithdrawal;

  return hasStringChange || hasBoolChange;
}

export default function EditCompany() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [updated, setUpdated] = useState<FormState>(emptyUpdated());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    companiesApi
      .getLatest()
      .then((list) => {
        if (cancelled) return;
        setCompanies(list.map(mapBackendCompany));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(extractApiError(err, 'Failed to load companies.'));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const current = useMemo(
    () => companies.find((c) => c.companyNumber === selectedCompany),
    [companies, selectedCompany]
  );

  const onChange = (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setUpdated((prev) => ({ ...prev, [key]: value } as FormState));
    setError(null);
    setSuccess(null);
  };

  const onSelectCompany = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedCompany(e.target.value);
    setUpdated(emptyUpdated());
    setError(null);
    setSuccess(null);
  };

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedCompany) {
      setError('Company Number is required.');
      return;
    }
    if (!current) {
      setError('Selected company not found.');
      return;
    }
    if (current.id <= 0) {
      setError('Company ID is missing.');
      return;
    }
    if (!hasChanges(updated, current)) {
      setSuccess('No changes were provided; current company data will be kept.');
      return;
    }

    const toS = (v: string) => (v.trim() ? v.trim() : undefined);
    const toN = (v: string) => (v.trim() ? Number(v) : undefined);
    const toI = (v: string) => (v.trim() ? Math.round(Number(v)) : undefined);
    const toD = (v: string) => (v.trim() ? `${v}T00:00:00+02:00` : undefined);

    const payload: Partial<CreateCompanyRequest> = {
      companyName: toS(updated.companyName),
      kafsCompanyNumber: toS(updated.kafCompanyNumber),
      address: toS(updated.address),
      contactPerson: toS(updated.contactPerson),
      mobileNumber: toS(updated.mobileNumber),
      email: toS(updated.email),
      frequency: toS(updated.frequency),
      issueDate: toD(updated.issueDate),
      startingNumberOfEmployees: toI(updated.startingNumberOfEmployees),
      startingAverageSalary: toN(updated.startingAverageSalary),
      startingFundValue: toN(updated.startingFundValue),
      contributionCharges: toN(updated.contributionCharges),
      contributionChargesVee: toN(updated.contributionChargesVEE),
      imc: toN(updated.imc),
      withdrawalChargesEe: toN(updated.withdrawalChargesEE),
      withdrawalChargesVee: toN(updated.withdrawalChargesVoluntaryEE),
      withdrawalChargesEr: toN(updated.withdrawalChargesER),
      employeeSurrenderCharge: toN(updated.surrenderCharges),
      topUpCharges: toI(updated.topUpCharges),
      adminCharges: toI(updated.monthlyAdminCharges),
      portfolioSwitchingCharges: toI(updated.portfolioSwitchingCharges),
      allocationRedirectionCharges: toI(updated.allocationRedirectionCharges),
      newOrAcquired: toI(updated.newOrAcquired),
      maxWithdrawalPercentage: toN(updated.maxWithdrawalPercentage),
      maxWithdrawalCount: toN(updated.maxAnnualWithdrawalFrequency),
      vestingOnHire:
        updated.vestingOnHireDate !== current.vestingOnHireDate
          ? updated.vestingOnHireDate
          : undefined,
      salaryOrContribution:
        updated.salaryOrContribution !== current.salaryOrContribution
          ? updated.salaryOrContribution
          : undefined,
      showAvailableWithdrawal:
        updated.showAvailableForWithdrawal !== current.showAvailableForWithdrawal
          ? updated.showAvailableForWithdrawal
          : undefined,
    };

    try {
      const result = await companiesApi.update(current.id, payload);
      const latest = await companiesApi.getLatest();
      setCompanies(latest.map(mapBackendCompany));
      setSuccess(`Company ${result.companyNumber} updated.`);
    } catch (err) {
      setError(extractApiError(err, 'Failed to update company.'));
    }
  };

  const handleClear = () => {
    setUpdated(emptyUpdated());
    setError(null);
    setSuccess(null);
  };

  return (
    <motion.div
      className="kaf-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
    >
      <PageHeader
        icon={Pencil}
        title="Edit Existing Company"
        subtitle="Update an existing company record. Leave a field blank to keep its current value."
      />

      <form onSubmit={handleEdit} className="kaf-card" style={{ padding: 28, maxWidth: 1280, margin: '0 auto' }}>
        {error && (
          <div className="kaf-callout error" style={{ marginBottom: 20 }}>
            {error}
          </div>
        )}
        {success && (
          <div className="kaf-callout ok" style={{ marginBottom: 20 }}>
            {success}
          </div>
        )}

        <div className="kaf-callout warn" style={{ marginBottom: 20, fontSize: 13, color: 'var(--kaf-error)' }}>
          Please leave fields blank to keep the current data. Only change what you need to update.
        </div>

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: '10px 24px', alignItems: 'center' }}>
              <div />
              <div
                style={{
                  textAlign: 'center',
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--kaf-text)',
                }}
              >
                Updated Values
              </div>
              <div
                style={{
                  textAlign: 'center',
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--kaf-text)',
                }}
              >
                Current Values
              </div>

              <FieldRow
                label="Company Number"
                updated={
                  <select className="kaf-input kaf-select" value={selectedCompany} onChange={onSelectCompany}>
                    <option value="" disabled>
                      Select company number
                    </option>
                    {companies.map((c) => (
                      <option key={c.companyNumber} value={c.companyNumber}>
                        {c.companyNumber} — {c.companyName} — {formatDisplayDate(c.issueDate)} — {c.serial}
                      </option>
                    ))}
                  </select>
                }
                current={<ReadOnlyInput value={current?.companyNumber ?? ''} />}
              />

              <FieldRow
                label="Kaf's Company Number"
                updated={<input className="kaf-input" type="text" value={updated.kafCompanyNumber} onChange={onChange('kafCompanyNumber')} />}
                current={<ReadOnlyInput value={current?.kafCompanyNumber ?? ''} />}
              />

              <FieldRow
                label="Company Name"
                updated={<input className="kaf-input" type="text" value={updated.companyName} onChange={onChange('companyName')} />}
                current={<ReadOnlyInput value={current?.companyName ?? ''} />}
              />

              <FieldRow
                label="Issue Date"
                updated={<input className="kaf-input" type="date" value={updated.issueDate} onChange={onChange('issueDate')} />}
                current={<ReadOnlyInput value={current?.issueDate ?? ''} />}
              />

              <FieldRow
                label="Address"
                updated={<input className="kaf-input" type="text" value={updated.address} onChange={onChange('address')} />}
                current={<ReadOnlyInput value={current?.address ?? ''} />}
              />

              <FieldRow
                label="Contact Person"
                updated={<input className="kaf-input" type="text" value={updated.contactPerson} onChange={onChange('contactPerson')} />}
                current={<ReadOnlyInput value={current?.contactPerson ?? ''} />}
              />

              <FieldRow
                label="Mobile Number"
                updated={<input className="kaf-input" type="text" value={updated.mobileNumber} onChange={onChange('mobileNumber')} />}
                current={<ReadOnlyInput value={current?.mobileNumber ?? ''} />}
              />

              <FieldRow
                label="Email"
                updated={<input className="kaf-input" type="email" value={updated.email} onChange={onChange('email')} />}
                current={<ReadOnlyInput value={current?.email ?? ''} />}
              />

              <FieldRow
                label="Starting Average Salary"
                updated={<input className="kaf-input" type="text" inputMode="decimal" value={updated.startingAverageSalary} onChange={onChange('startingAverageSalary')} />}
                current={<ReadOnlyInput value={current?.startingAverageSalary ?? ''} />}
              />

              <FieldRow
                label="Starting Number of Employees"
                updated={<input className="kaf-input" type="text" inputMode="numeric" value={updated.startingNumberOfEmployees} onChange={onChange('startingNumberOfEmployees')} />}
                current={<ReadOnlyInput value={current?.startingNumberOfEmployees ?? ''} />}
              />

              <FieldRow
                label="Starting Fund Value"
                updated={<input className="kaf-input" type="text" inputMode="decimal" value={updated.startingFundValue} onChange={onChange('startingFundValue')} />}
                current={<ReadOnlyInput value={current?.startingFundValue ?? ''} />}
              />

              <FieldRow
                label="Contribution Charges"
                updated={<PercentInput value={updated.contributionCharges} onChange={onChange('contributionCharges')} />}
                current={<ReadOnlyInput value={current?.contributionCharges ?? ''} suffix="%" />}
              />

              <FieldRow
                label="Contribution Charges VEE"
                updated={<PercentInput value={updated.contributionChargesVEE} onChange={onChange('contributionChargesVEE')} />}
                current={<ReadOnlyInput value={current?.contributionChargesVEE ?? ''} suffix="%" />}
              />

              <FieldRow
                label="IMC"
                updated={<PercentInput value={updated.imc} onChange={onChange('imc')} />}
                current={<ReadOnlyInput value={current?.imc ?? ''} suffix="%" />}
              />

              <FieldRow
                label="Withdrawal Charges EE"
                updated={<SuffixInput value={updated.withdrawalChargesEE} onChange={onChange('withdrawalChargesEE')} suffix="EGP" />}
                current={<ReadOnlyInput value={current?.withdrawalChargesEE ?? ''} suffix="EGP" />}
              />

              <FieldRow
                label="Withdrawal Charges VEE"
                updated={<SuffixInput value={updated.withdrawalChargesVoluntaryEE} onChange={onChange('withdrawalChargesVoluntaryEE')} suffix="EGP" />}
                current={<ReadOnlyInput value={current?.withdrawalChargesVoluntaryEE ?? ''} suffix="EGP" />}
              />

              <FieldRow
                label="Withdrawal Charges ER"
                updated={<SuffixInput value={updated.withdrawalChargesER} onChange={onChange('withdrawalChargesER')} suffix="EGP" />}
                current={<ReadOnlyInput value={current?.withdrawalChargesER ?? ''} suffix="EGP" />}
              />

              <FieldRow
                label="Surrender Charges"
                updated={<SuffixInput value={updated.surrenderCharges} onChange={onChange('surrenderCharges')} suffix="EGP" />}
                current={<ReadOnlyInput value={current?.surrenderCharges ?? ''} suffix="EGP" />}
              />

              <FieldRow
                label="Top Up Charges"
                updated={<PercentInput value={updated.topUpCharges} onChange={onChange('topUpCharges')} />}
                current={<ReadOnlyInput value={current?.topUpCharges ?? ''} suffix="%" />}
              />

              <FieldRow
                label="Monthly Admin Charges"
                updated={<SuffixInput value={updated.monthlyAdminCharges} onChange={onChange('monthlyAdminCharges')} suffix="EGP" />}
                current={<ReadOnlyInput value={current?.monthlyAdminCharges ?? ''} suffix="EGP" />}
              />

              <FieldRow
                label="Portfolio Switching Charges"
                updated={<SuffixInput value={updated.portfolioSwitchingCharges} onChange={onChange('portfolioSwitchingCharges')} suffix="EGP" />}
                current={<ReadOnlyInput value={current?.portfolioSwitchingCharges ?? ''} suffix="EGP" />}
              />

              <FieldRow
                label="Allocation Redirection Charges"
                updated={<SuffixInput value={updated.allocationRedirectionCharges} onChange={onChange('allocationRedirectionCharges')} suffix="EGP" />}
                current={<ReadOnlyInput value={current?.allocationRedirectionCharges ?? ''} suffix="EGP" />}
              />

              <FieldRow
                label="New (0) / Acquired (1)"
                updated={<input className="kaf-input" type="text" inputMode="numeric" value={updated.newOrAcquired} onChange={onChange('newOrAcquired')} />}
                current={<ReadOnlyInput value={current?.newOrAcquired ?? ''} />}
              />

              <FieldRow
                label="Vesting On Hire Date (yes) or Pension Start Date (no)"
                updated={<input type="checkbox" checked={updated.vestingOnHireDate} onChange={onChange('vestingOnHireDate')} style={{ width: 18, height: 18 }} />}
                current={<ReadOnlyInput value={current?.vestingOnHireDate ? 'yes' : 'no'} />}
              />

              <FieldRow
                label="Max Withdrawal Percentage"
                updated={<PercentInput value={updated.maxWithdrawalPercentage} onChange={onChange('maxWithdrawalPercentage')} />}
                current={<ReadOnlyInput value={current?.maxWithdrawalPercentage ?? ''} suffix="%" />}
              />

              <FieldRow
                label="Max Annual Withdrawal Frequency"
                updated={<input className="kaf-input" type="text" inputMode="decimal" value={updated.maxAnnualWithdrawalFrequency} onChange={onChange('maxAnnualWithdrawalFrequency')} />}
                current={<ReadOnlyInput value={current?.maxAnnualWithdrawalFrequency ?? ''} />}
              />

              <FieldRow
                label="Frequency"
                updated={
                  <select className="kaf-input kaf-select" value={updated.frequency} onChange={onChange('frequency')}>
                    <option value="" disabled>
                      Select frequency
                    </option>
                    {FREQUENCIES.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                }
                current={<ReadOnlyInput value={current?.frequency ?? ''} />}
              />

              <FieldRow
                label="Salary (yes) or Contribution (no)"
                updated={<input type="checkbox" checked={updated.salaryOrContribution} onChange={onChange('salaryOrContribution')} style={{ width: 18, height: 18 }} />}
                current={<ReadOnlyInput value={current?.salaryOrContribution ? 'yes' : 'no'} />}
              />

              <FieldRow
                label="Show Available for Withdrawal (yes) or Hide Vesting (no)"
                updated={<input type="checkbox" checked={updated.showAvailableForWithdrawal} onChange={onChange('showAvailableForWithdrawal')} style={{ width: 18, height: 18 }} />}
                current={<ReadOnlyInput value={current?.showAvailableForWithdrawal ? 'yes' : 'no'} />}
              />
            </div>
          </div>

          <div
            style={{
              width: 120,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              alignSelf: 'center',
            }}
          >
            <button type="submit" className="kaf-btn">
              Edit
            </button>
            <button type="button" className="kaf-btn-ghost" onClick={handleClear}>
              Clear
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}

interface FieldRowProps {
  label: string;
  updated: React.ReactNode;
  current: React.ReactNode;
}

function FieldRow({ label, updated, current }: FieldRowProps) {
  return (
    <>
      <span className="kaf-label" style={{ textAlign: 'right', margin: 0 }}>
        {label}
      </span>
      <div>{updated}</div>
      <div>{current}</div>
    </>
  );
}

interface ReadOnlyInputProps {
  value: string;
  suffix?: string;
}

function ReadOnlyInput({ value, suffix }: ReadOnlyInputProps) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        className="kaf-input"
        type="text"
        value={value}
        readOnly
        style={{
          background: 'var(--kaf-surface-2)',
          textAlign: suffix ? 'right' : 'left',
          paddingRight: suffix ? 36 : 12,
        }}
      />
      {suffix && (
        <span
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--kaf-muted)',
            fontSize: 12,
            pointerEvents: 'none',
          }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}

interface PercentInputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

function PercentInput({ value, onChange }: PercentInputProps) {
  return <SuffixInput value={value} onChange={onChange} suffix="%" />;
}

interface SuffixInputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  suffix: string;
}

function SuffixInput({ value, onChange, suffix }: SuffixInputProps) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        className="kaf-input"
        type="text"
        inputMode="decimal"
        value={value}
        onChange={onChange}
        style={{ textAlign: 'right', paddingRight: 36 }}
      />
      <span
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--kaf-muted)',
          fontSize: 12,
          pointerEvents: 'none',
        }}
      >
        {suffix}
      </span>
    </div>
  );
}
