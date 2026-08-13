import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { companiesApi } from '../../lib/companiesApi';
import { extractApiError } from '../../lib/httpClient';
import type { CreateCompanyRequest } from '../../types';

const FREQUENCIES = ['Monthly', 'Quarterly', 'Semi-Annually', 'Annually'];

interface FormState {
  companyNumber: string;
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

const emptyState = (): FormState => ({
  companyNumber: '',
  kafCompanyNumber: '',
  companyName: '',
  issueDate: '',
  address: '',
  contactPerson: '',
  mobileNumber: '',
  email: '',
  startingNumberOfEmployees: '',
  startingAverageSalary: '',
  startingFundValue: '0.00',
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
  newOrAcquired: '0',
  vestingOnHireDate: false,
  maxWithdrawalPercentage: '100.00',
  maxAnnualWithdrawalFrequency: '1000.00',
  frequency: '',
  salaryOrContribution: true,
  showAvailableForWithdrawal: true,
});

export default function AddCompany() {
  const [s, setS] = useState<FormState>(emptyState());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    companiesApi
      .getLastNumber()
      .then((last) => {
        if (!last) return;
        setS((prev) => (prev.companyNumber === '' ? { ...prev, companyNumber: last } : prev));
      })
      .catch((err) => {
        console.error(extractApiError(err, 'Failed to load last company number.'));
      });
  }, []);

  const onChange = (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setS((prev) => ({ ...prev, [key]: value } as FormState));
    setError(null);
    setSuccess(null);
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const required: (keyof FormState)[] = [
      'kafCompanyNumber',
      'companyName',
      'issueDate',
      'address',
      'contactPerson',
      'mobileNumber',
      'email',
      'startingNumberOfEmployees',
      'startingAverageSalary',
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
      'frequency',
      'maxWithdrawalPercentage',
      'maxAnnualWithdrawalFrequency',
    ];

    const missing = required.find((k) => !String(s[k]).trim());
    if (missing) {
      setError(`${String(missing)} is required.`);
      return;
    }

    const toNum = (v: string) => Number(v);
    const toInt = (v: string) => Math.round(Number(v));
    const toDate = (v: string) => `${v}T00:00:00Z`;

    const payload: CreateCompanyRequest = {
      kafsCompanyNumber: s.kafCompanyNumber,
      companyName: s.companyName,
      issueDate: toDate(s.issueDate),
      frequency: s.frequency,
      address: s.address,
      contactPerson: s.contactPerson,
      mobileNumber: s.mobileNumber,
      email: s.email,
      startingNumberOfEmployees: toInt(s.startingNumberOfEmployees),
      startingAverageSalary: toNum(s.startingAverageSalary),
      startingFundValue: toNum(s.startingFundValue),
      contributionCharges: toNum(s.contributionCharges),
      contributionChargesVee: toNum(s.contributionChargesVEE),
      imc: toNum(s.imc),
      withdrawalChargesEe: toNum(s.withdrawalChargesEE),
      withdrawalChargesVee: toNum(s.withdrawalChargesVoluntaryEE),
      withdrawalChargesEr: toNum(s.withdrawalChargesER),
      employeeSurrenderCharge: toNum(s.surrenderCharges),
      topUpCharges: toInt(s.topUpCharges),
      adminCharges: toInt(s.monthlyAdminCharges),
      portfolioSwitchingCharges: toInt(s.portfolioSwitchingCharges),
      allocationRedirectionCharges: toInt(s.allocationRedirectionCharges),
      newOrAcquired: toInt(s.newOrAcquired),
      vestingOnHire: s.vestingOnHireDate,
      maxWithdrawalPercentage: toNum(s.maxWithdrawalPercentage),
      maxWithdrawalCount: toNum(s.maxAnnualWithdrawalFrequency),
      salaryOrContribution: s.salaryOrContribution,
      showAvailableWithdrawal: s.showAvailableForWithdrawal,
    };

    try {
      const company = await companiesApi.create(payload);
      setSuccess(`Company ${company.companyNumber} - ${company.companyName} created.`);
    } catch (err) {
      setError(extractApiError(err, 'Failed to create company.'));
    }
  };

  const handleClear = () => {
    setS(emptyState());
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
        icon={Building2}
        title="Add New Company"
        subtitle="Create a new company record."
      />

      <form onSubmit={handleAdd} className="kaf-card" style={{ padding: 28, maxWidth: 960, margin: '0 auto' }}>
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

        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <FieldGroup label="Company Number">
              <input className="kaf-input" type="text" value={s.companyNumber} readOnly />
            </FieldGroup>

            <FieldGroup label="Kaf's Company Number" required>
              <input className="kaf-input" type="text" value={s.kafCompanyNumber} onChange={onChange('kafCompanyNumber')} />
            </FieldGroup>

            <FieldGroup label="Company Name" required>
              <input className="kaf-input" type="text" value={s.companyName} onChange={onChange('companyName')} />
            </FieldGroup>

            <FieldGroup label="Issue Date" required>
              <input className="kaf-input" type="date" value={s.issueDate} onChange={onChange('issueDate')} />
            </FieldGroup>

            <FieldGroup label="Address" required>
              <input className="kaf-input" type="text" value={s.address} onChange={onChange('address')} />
            </FieldGroup>

            <FieldGroup label="Contact Person" required>
              <input className="kaf-input" type="text" value={s.contactPerson} onChange={onChange('contactPerson')} />
            </FieldGroup>

            <FieldGroup label="Mobile Number" required>
              <input className="kaf-input" type="text" value={s.mobileNumber} onChange={onChange('mobileNumber')} />
            </FieldGroup>

            <FieldGroup label="E-mail" required>
              <input className="kaf-input" type="email" value={s.email} onChange={onChange('email')} />
            </FieldGroup>

            <FieldGroup label="Starting Number of Employees" required>
              <input className="kaf-input" type="text" inputMode="numeric" value={s.startingNumberOfEmployees} onChange={onChange('startingNumberOfEmployees')} />
            </FieldGroup>

            <FieldGroup label="Starting Average Salary" required>
              <input className="kaf-input" type="text" inputMode="decimal" value={s.startingAverageSalary} onChange={onChange('startingAverageSalary')} />
            </FieldGroup>

            <FieldGroup label="Starting Fund Value">
              <SuffixInput value={s.startingFundValue} onChange={onChange('startingFundValue')} suffix="" />
            </FieldGroup>

            <FieldGroup label="Contribution Charges" required>
              <PercentInput value={s.contributionCharges} onChange={onChange('contributionCharges')} />
            </FieldGroup>

            <FieldGroup label="Contribution Charges VEE" required>
              <PercentInput value={s.contributionChargesVEE} onChange={onChange('contributionChargesVEE')} />
            </FieldGroup>

            <FieldGroup label="IMC" required>
              <PercentInput value={s.imc} onChange={onChange('imc')} />
            </FieldGroup>

            <FieldGroup label="Withdrawal Charges EE" required>
              <SuffixInput value={s.withdrawalChargesEE} onChange={onChange('withdrawalChargesEE')} suffix="EGP" />
            </FieldGroup>

            <FieldGroup label="Withdrawal Charges Voluntary EE" required>
              <SuffixInput value={s.withdrawalChargesVoluntaryEE} onChange={onChange('withdrawalChargesVoluntaryEE')} suffix="EGP" />
            </FieldGroup>

            <FieldGroup label="Withdrawal Charges ER" required>
              <SuffixInput value={s.withdrawalChargesER} onChange={onChange('withdrawalChargesER')} suffix="EGP" />
            </FieldGroup>

            <FieldGroup label="Surrender Charges" required>
              <SuffixInput value={s.surrenderCharges} onChange={onChange('surrenderCharges')} suffix="EGP" />
            </FieldGroup>

            <FieldGroup label="Top Up Charges" required>
              <PercentInput value={s.topUpCharges} onChange={onChange('topUpCharges')} />
            </FieldGroup>

            <FieldGroup label="Monthly Admin Charges" required>
              <SuffixInput value={s.monthlyAdminCharges} onChange={onChange('monthlyAdminCharges')} suffix="EGP" />
            </FieldGroup>

            <FieldGroup label="Portfolio Switching Charges" required>
              <SuffixInput value={s.portfolioSwitchingCharges} onChange={onChange('portfolioSwitchingCharges')} suffix="EGP" />
            </FieldGroup>

            <FieldGroup label="Allocation Redirection Charges" required>
              <SuffixInput value={s.allocationRedirectionCharges} onChange={onChange('allocationRedirectionCharges')} suffix="EGP" />
            </FieldGroup>

            <FieldGroup label="New (0) / Acquired (1)">
              <input className="kaf-input" type="text" inputMode="numeric" value={s.newOrAcquired} onChange={onChange('newOrAcquired')} />
            </FieldGroup>

            <FieldGroup label="Vesting On Hire Date (yes) or Pension Start Date (no)" required>
              <input type="checkbox" checked={s.vestingOnHireDate} onChange={onChange('vestingOnHireDate')} style={{ width: 18, height: 18 }} />
            </FieldGroup>

            <FieldGroup label="Max Withdrawal Percentage" required>
              <PercentInput value={s.maxWithdrawalPercentage} onChange={onChange('maxWithdrawalPercentage')} />
            </FieldGroup>

            <FieldGroup label="Max Annual Withdrawal Frequency" required>
              <SuffixInput value={s.maxAnnualWithdrawalFrequency} onChange={onChange('maxAnnualWithdrawalFrequency')} suffix="" />
            </FieldGroup>

            <FieldGroup label="Frequency" required>
              <select className="kaf-input kaf-select" value={s.frequency} onChange={onChange('frequency')}>
                <option value="" disabled>
                  Select frequency
                </option>
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </FieldGroup>

            <FieldGroup label="Salary (yes) or Contribution (no)" required>
              <input type="checkbox" checked={s.salaryOrContribution} onChange={onChange('salaryOrContribution')} style={{ width: 18, height: 18 }} />
            </FieldGroup>

            <FieldGroup label="Show Available for Withdrawal (yes) or Hide Vesting (no)" required>
              <input type="checkbox" checked={s.showAvailableForWithdrawal} onChange={onChange('showAvailableForWithdrawal')} style={{ width: 18, height: 18 }} />
            </FieldGroup>
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
              Add
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

interface FieldGroupProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

function FieldGroup({ label, required, children }: FieldGroupProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', alignItems: 'center', gap: 14 }}>
      <label className="kaf-label" style={{ margin: 0, textAlign: 'right' }}>
        {label}
        {required && <span style={{ color: 'var(--kaf-error)', marginLeft: 3 }}>*</span>}
      </label>
      <div>{children}</div>
    </div>
  );
}

interface PercentInputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

function PercentInput({ value, onChange }: PercentInputProps) {
  return (
    <SuffixInput value={value} onChange={onChange} suffix="%" />
  );
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
        style={{ textAlign: 'right', paddingRight: suffix ? 36 : 12 }}
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
