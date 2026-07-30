import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ChangeEvent, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
 
const FUNDS = 10;
const FUND_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
 
const GENDERS = ['Male', 'Female'];
const CURRENCIES = ['EGP', 'USD', 'EUR'];
const CATEGORIES = ['Category 1', 'Category 2', 'Category 3'];
 
interface Company {
  number: string;
  issueDate: string;
}
 
// TODO: replace with /api/companies data
const COMPANIES: Company[] = [
  { number: '1001', issueDate: '2015-03-12' },
  { number: '1002', issueDate: '2018-07-20' },
  { number: '1003', issueDate: '2021-11-05' },
];
 
interface FormState {
  companyNumber: string;
  companyIssueDate: string;
  employeeId: string;
  employeeNumber: string;
  nationalId: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  occupation: string;
  hireDate: string;
  ageAtHire: string;
  pensionStartDate: string;
  kafJoiningDate: string;
  category: string;
  grossSalary: string;
  salaryCurrency: string;
  contributionEE: string;
  contributionER: string;
  email: string;
  startingEEValue: string;
  startingERValue: string;
  startingFundValue: string;
  veeContribution: string;
  weightsEE: string[];
  weightsER: string[];
}
 
type StringField = keyof Omit<FormState, 'weightsEE' | 'weightsER'>;
 
const emptyState = (): FormState => ({
  companyNumber: '',
  companyIssueDate: '',
  employeeId: '',
  employeeNumber: '',
  nationalId: '',
  fullName: '',
  dateOfBirth: '',
  gender: '',
  occupation: '',
  hireDate: '',
  ageAtHire: '',
  pensionStartDate: '',
  kafJoiningDate: '',
  category: '',
  grossSalary: '',
  salaryCurrency: 'EGP',
  contributionEE: '',
  contributionER: '',
  email: '',
  startingEEValue: '0.00',
  startingERValue: '0.00',
  startingFundValue: '0.00',
  veeContribution: '0.00',
  weightsEE: Array.from({ length: FUNDS }, () => '0.00'),
  weightsER: Array.from({ length: FUNDS }, () => '0.00'),
});
 
const REQUIRED: StringField[] = [
  'companyNumber',
  'nationalId',
  'fullName',
  'dateOfBirth',
  'hireDate',
  'pensionStartDate',
  'kafJoiningDate',
  'category',
  'grossSalary',
  'salaryCurrency',
  'veeContribution',
];
 
function toNum(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}
 
export default function AddEmployee() {
  const [s, setS] = useState<FormState>(emptyState());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const nextId = useRef(1);
 
  useEffect(() => {
    if (!s.companyNumber) return;
    const company = COMPANIES.find((c) => c.number === s.companyNumber);
    if (!company) return;
    setS((prev) => ({
      ...prev,
      companyIssueDate: company.issueDate,
      employeeId: `EMP-${company.number}-${String(nextId.current++).padStart(3, '0')}`,
    }));
  }, [s.companyNumber]);
 
  const totalEE = useMemo(
    () => s.weightsEE.reduce((sum, v) => sum + toNum(v), 0),
    [s.weightsEE],
  );
  const totalER = useMemo(
    () => s.weightsER.reduce((sum, v) => sum + toNum(v), 0),
    [s.weightsER],
  );
 
  const onString = (key: StringField) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setS((prev) => ({ ...prev, [key]: e.target.value } as FormState));
    setError(null);
    setSuccess(null);
  };
 
  const onWeight = (side: 'EE' | 'ER', index: number) => (e: ChangeEvent<HTMLInputElement>) => {
    setS((prev) => {
      const arr = side === 'EE' ? [...prev.weightsEE] : [...prev.weightsER];
      arr[index] = e.target.value;
      return { ...prev, [side === 'EE' ? 'weightsEE' : 'weightsER']: arr } as FormState;
    });
    setError(null);
    setSuccess(null);
  };
 
  const handleClear = () => {
    setS(emptyState());
    setError(null);
    setSuccess(null);
  };
 
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
 
    const missing = REQUIRED.filter((key) => !s[key].trim());
    if (missing.length) {
      setError('Please fill in all required fields.');
      return;
    }
 
    const emptyWeightEE = s.weightsEE.some((v) => !v.trim());
    const emptyWeightER = s.weightsER.some((v) => !v.trim());
    if (emptyWeightEE || emptyWeightER) {
      setError('All investment allocation weights are required.');
      return;
    }
 
    if (Math.abs(totalEE - 100) > 0.01 || Math.abs(totalER - 100) > 0.01) {
      setError('EE and ER investment allocation weights must each total 100%.');
      return;
    }
 
    setSuccess('Employee form is valid. Backend integration is not yet connected.');
  };
 
  return (
    <motion.div
      className="kaf-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
    >
      <PageHeader
        icon={UserPlus}
        title="Add New Employee"
        subtitle="Create a new employee record for the Rubix Pension system."
      />
 
      <form onSubmit={handleSubmit} className="kaf-card" style={{ padding: 28, maxWidth: 1280, margin: '0 auto' }}>
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
 
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
            gap: 40,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FieldGroup label="Company Number" required>
              <select
                className="kaf-input kaf-select"
                value={s.companyNumber}
                onChange={onString('companyNumber')}
              >
                <option value="" disabled>
                  Select company number
                </option>
                {COMPANIES.map((c) => (
                  <option key={c.number} value={c.number}>
                    {c.number}
                  </option>
                ))}
              </select>
            </FieldGroup>
 
            <FieldGroup label="Company Issue Date">
              <input
                className="kaf-input"
                type="date"
                value={s.companyIssueDate}
                onChange={onString('companyIssueDate')}
              />
            </FieldGroup>
 
            <FieldGroup label="Employee ID">
              <input
                className="kaf-input"
                type="text"
                value={s.employeeId}
                onChange={onString('employeeId')}
              />
            </FieldGroup>
 
            <FieldGroup label="Employee Number">
              <input
                className="kaf-input"
                type="text"
                value={s.employeeNumber}
                onChange={onString('employeeNumber')}
              />
            </FieldGroup>
 
            <FieldGroup label="National ID" required>
              <input
                className="kaf-input"
                type="text"
                value={s.nationalId}
                onChange={onString('nationalId')}
              />
            </FieldGroup>
 
            <FieldGroup label="Full Name" required>
              <input
                className="kaf-input"
                type="text"
                value={s.fullName}
                onChange={onString('fullName')}
              />
            </FieldGroup>
 
            <FieldGroup label="Date of Birth" required>
              <input
                className="kaf-input"
                type="date"
                value={s.dateOfBirth}
                onChange={onString('dateOfBirth')}
              />
            </FieldGroup>
 
            <FieldGroup label="Gender">
              <select className="kaf-input kaf-select" value={s.gender} onChange={onString('gender')}>
                <option value="" disabled>
                  Select gender
                </option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </FieldGroup>
 
            <FieldGroup label="Occupation">
              <input
                className="kaf-input"
                type="text"
                value={s.occupation}
                onChange={onString('occupation')}
              />
            </FieldGroup>
 
            <FieldGroup label="Hire Date" required>
              <input
                className="kaf-input"
                type="date"
                value={s.hireDate}
                onChange={onString('hireDate')}
              />
            </FieldGroup>
 
            <FieldGroup label="Age at Hire">
              <input
                className="kaf-input"
                type="text"
                inputMode="numeric"
                value={s.ageAtHire}
                onChange={onString('ageAtHire')}
              />
            </FieldGroup>
 
            <FieldGroup label="Pension Start Date" required>
              <input
                className="kaf-input"
                type="date"
                value={s.pensionStartDate}
                onChange={onString('pensionStartDate')}
              />
            </FieldGroup>
 
            <FieldGroup label="Kaf Joining Date" required>
              <input
                className="kaf-input"
                type="date"
                value={s.kafJoiningDate}
                onChange={onString('kafJoiningDate')}
              />
            </FieldGroup>
 
            <FieldGroup label="Category" required>
              <select className="kaf-input kaf-select" value={s.category} onChange={onString('category')}>
                <option value="" disabled>
                  Select category
                </option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </FieldGroup>
 
            <FieldGroup label="Gross Salary" required>
              <input
                className="kaf-input"
                type="text"
                inputMode="decimal"
                value={s.grossSalary}
                onChange={onString('grossSalary')}
              />
            </FieldGroup>
 
            <FieldGroup label="Salary Currency" required>
              <select
                className="kaf-input kaf-select"
                value={s.salaryCurrency}
                onChange={onString('salaryCurrency')}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </FieldGroup>
 
            <FieldGroup label="Contribution EE">
              <input
                className="kaf-input"
                type="text"
                inputMode="decimal"
                value={s.contributionEE}
                onChange={onString('contributionEE')}
              />
            </FieldGroup>
 
            <FieldGroup label="Contribution ER">
              <input
                className="kaf-input"
                type="text"
                inputMode="decimal"
                value={s.contributionER}
                onChange={onString('contributionER')}
              />
            </FieldGroup>
 
            <FieldGroup label="E-mail">
              <input
                className="kaf-input"
                type="email"
                value={s.email}
                onChange={onString('email')}
              />
            </FieldGroup>
 
            <FieldGroup label="Starting EE Value">
              <input
                className="kaf-input"
                type="text"
                inputMode="decimal"
                value={s.startingEEValue}
                onChange={onString('startingEEValue')}
              />
            </FieldGroup>
 
            <FieldGroup label="Starting ER Value">
              <input
                className="kaf-input"
                type="text"
                inputMode="decimal"
                value={s.startingERValue}
                onChange={onString('startingERValue')}
              />
            </FieldGroup>
 
            <FieldGroup label="Starting Fund Value">
              <input
                className="kaf-input"
                type="text"
                inputMode="decimal"
                value={s.startingFundValue}
                onChange={onString('startingFundValue')}
              />
            </FieldGroup>
 
            <FieldGroup label="VEE Contribution" required>
              <PercentInput value={s.veeContribution} onChange={onString('veeContribution')} />
            </FieldGroup>
          </div>
 
          <div
            className="kaf-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              padding: 14,
              background: 'var(--kaf-surface-2)',
              alignSelf: 'start',
            }}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--kaf-text)',
                margin: 0,
              }}
            >
              Investment Allocation
            </h3>
 
            {FUND_INDICES.map((i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '4px 12px',
                  alignItems: 'center',
                }}
              >
                <WeightField
                  label={`Weight F${i + 1} EE`}
                  required
                  value={s.weightsEE[i]}
                  onChange={onWeight('EE', i)}
                />
                <WeightField
                  label={`Weight F${i + 1} ER`}
                  required
                  value={s.weightsER[i]}
                  onChange={onWeight('ER', i)}
                />
              </div>
            ))}
 
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '4px 12px',
                alignItems: 'center',
                marginTop: 4,
                paddingTop: 8,
                borderTop: '1px solid var(--kaf-border)',
              }}
            >
              <WeightField label="Total" value={totalEE.toFixed(2)} readOnly />
              <WeightField label="Total" value={totalER.toFixed(2)} readOnly />
            </div>
 
            <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
              <button type="submit" className="kaf-btn">
                Add
              </button>
              <button type="button" className="kaf-btn-ghost" onClick={handleClear}>
                Clear
              </button>
            </div>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
 
interface FieldGroupProps {
  label: string;
  required?: boolean;
  children: ReactNode;
}
 
function FieldGroup({ label, required, children }: FieldGroupProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center', gap: 14 }}>
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
    <div style={{ position: 'relative' }}>
      <input
        className="kaf-input"
        type="text"
        inputMode="decimal"
        value={value}
        onChange={onChange}
        style={{ textAlign: 'right', paddingRight: 30 }}
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
        %
      </span>
    </div>
  );
}
 
interface WeightFieldProps {
  label: string;
  value: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  readOnly?: boolean;
}
 
function WeightField({ label, value, onChange, required, readOnly }: WeightFieldProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, color: 'var(--kaf-muted)', whiteSpace: 'nowrap' }}>
        {label}
        {required && <span style={{ color: 'var(--kaf-error)', marginLeft: 3 }}>*</span>}
      </span>
      <div style={{ position: 'relative' }}>
        <input
          className="kaf-input"
          type="text"
          inputMode="decimal"
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          style={{ textAlign: 'right', padding: '5px 28px 5px 8px', fontSize: 11.5 }}
        />
        <span
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--kaf-muted)',
            fontSize: 10,
            pointerEvents: 'none',
          }}
        >
          %
        </span>
      </div>
    </div>
  );
}