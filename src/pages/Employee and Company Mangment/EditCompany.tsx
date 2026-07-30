import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Pencil } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

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
  companyNumber: string;
}

// TODO: replace with /api/companies data
const INITIAL_COMPANIES: Company[] = [
  {
    companyNumber: '1001',
    kafCompanyNumber: 'K1001',
    companyName: 'Acme Corp',
    issueDate: '2015-03-12',
    address: '123 Main St, Cairo',
    contactPerson: 'Ahmed Ali',
    mobileNumber: '01001234567',
    email: 'info@acme.com',
    startingNumberOfEmployees: '50',
    startingAverageSalary: '15000',
    startingFundValue: '0',
    contributionCharges: '10',
    contributionChargesVEE: '5',
    imc: '2',
    withdrawalChargesEE: '100',
    withdrawalChargesVoluntaryEE: '150',
    withdrawalChargesER: '200',
    surrenderCharges: '300',
    topUpCharges: '1',
    monthlyAdminCharges: '50',
    portfolioSwitchingCharges: '75',
    allocationRedirectionCharges: '60',
    newOrAcquired: '0',
    vestingOnHireDate: true,
    maxWithdrawalPercentage: '100',
    maxAnnualWithdrawalFrequency: '1000',
    frequency: 'Monthly',
    salaryOrContribution: true,
    showAvailableForWithdrawal: true,
  },
  {
    companyNumber: '1002',
    kafCompanyNumber: 'K1002',
    companyName: 'Beta Ltd',
    issueDate: '2018-07-20',
    address: '45 Nile Blvd, Giza',
    contactPerson: 'Sara Hany',
    mobileNumber: '01009876543',
    email: 'contact@beta.com',
    startingNumberOfEmployees: '120',
    startingAverageSalary: '22000',
    startingFundValue: '0',
    contributionCharges: '12',
    contributionChargesVEE: '6',
    imc: '2.5',
    withdrawalChargesEE: '120',
    withdrawalChargesVoluntaryEE: '180',
    withdrawalChargesER: '240',
    surrenderCharges: '360',
    topUpCharges: '1.5',
    monthlyAdminCharges: '60',
    portfolioSwitchingCharges: '90',
    allocationRedirectionCharges: '70',
    newOrAcquired: '0',
    vestingOnHireDate: false,
    maxWithdrawalPercentage: '100',
    maxAnnualWithdrawalFrequency: '1000',
    frequency: 'Quarterly',
    salaryOrContribution: true,
    showAvailableForWithdrawal: false,
  },
  {
    companyNumber: '1003',
    kafCompanyNumber: 'K1003',
    companyName: 'Gamma Inc',
    issueDate: '2021-11-05',
    address: '77 Delta Rd, Alexandria',
    contactPerson: 'Omar Khaled',
    mobileNumber: '01005556677',
    email: 'hello@gamma.com',
    startingNumberOfEmployees: '30',
    startingAverageSalary: '18000',
    startingFundValue: '0',
    contributionCharges: '8',
    contributionChargesVEE: '4',
    imc: '1.5',
    withdrawalChargesEE: '80',
    withdrawalChargesVoluntaryEE: '120',
    withdrawalChargesER: '160',
    surrenderCharges: '250',
    topUpCharges: '0.5',
    monthlyAdminCharges: '40',
    portfolioSwitchingCharges: '60',
    allocationRedirectionCharges: '50',
    newOrAcquired: '0',
    vestingOnHireDate: true,
    maxWithdrawalPercentage: '100',
    maxAnnualWithdrawalFrequency: '1000',
    frequency: 'Monthly',
    salaryOrContribution: false,
    showAvailableForWithdrawal: true,
  },
];

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
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [updated, setUpdated] = useState<FormState>(emptyUpdated());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const handleEdit = (e: FormEvent) => {
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
    if (!hasChanges(updated, current)) {
      setSuccess('No changes were provided; current company data will be kept.');
      return;
    }

    setCompanies((prev) =>
      prev.map((c) => {
        if (c.companyNumber !== selectedCompany) return c;
        const next: Company = { ...c };
        (Object.keys(updated) as (keyof FormState)[]).forEach((k) => {
          if (typeof updated[k] === 'boolean') {
            (next as unknown as Record<keyof FormState, string | boolean>)[k] = updated[k];
          } else if ((updated[k] as string).trim() !== '') {
            (next as unknown as Record<keyof FormState, string | boolean>)[k] = updated[k];
          }
        });
        return next;
      })
    );
    setSuccess(`Company ${selectedCompany} update simulated.`);
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
                        {c.companyNumber}
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
