import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ChangeEvent, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import type { Company, CreateEmployeeRequest } from '../../types';
import { companiesApi } from '../../lib/companiesApi';
import { contributionsApi } from '../../lib/contributionsApi';
import { employeesApi } from '../../lib/employeesApi';
import { extractApiError } from '../../lib/httpClient';

const FUNDS = 10;
const FUND_INDICES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const GENDERS = ['Male', 'Female'];
const CURRENCIES = ['EGP', 'USD', 'EUR'];

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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setCompaniesLoading(true);
    companiesApi
      .getLatest()
      .then((list) => {
        if (cancelled) return;
        setCompanies(list);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(extractApiError(err, 'Failed to load companies.'));
      })
      .finally(() => {
        if (!cancelled) setCompaniesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!s.companyNumber) return;
    const company = companies.find((c) => c.companyNumber === s.companyNumber);
    if (!company) return;
    setS((prev) => ({
      ...prev,
      companyIssueDate: company.issueDate ? company.issueDate.slice(0, 10) : '',
      category: '',
    }));
    setCategories([]);

    let cancelled = false;
    setCategoriesLoading(true);
    contributionsApi
      .getByCompanyNumber(s.companyNumber)
      .then((list) => {
        if (cancelled) return;
        const cats = [...new Set(list.map((c) => c.category))];
        setCategories(cats);
        setS((prev) => ({ ...prev, category: cats[0] ?? '' }));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(extractApiError(err, 'Failed to load categories.'));
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });

    employeesApi
      .getNextNumber(s.companyNumber)
      .then((res) => {
        if (cancelled) return;
        setS((prev) => ({
          ...prev,
          employeeId: String(res.employeeId),
          employeeNumber: res.employeeNumber,
        }));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(extractApiError(err, 'Failed to load next employee number.'));
      });
    return () => {
      cancelled = true;
    };
  }, [s.companyNumber, companies]);

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

  const handleSubmit = async (e: FormEvent) => {
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

    const company = companies.find((c) => c.companyNumber === s.companyNumber);
    if (!company || !company.id) {
      setError('Selected company not found.');
      return;
    }

    const toDate = (v: string) => (v ? `${v}T00:00:00Z` : '');

    const payload: CreateEmployeeRequest = {
      companyId: company.id,
      nationalId: s.nationalId,
      fullName: s.fullName,
      dob: toDate(s.dateOfBirth),
      gender: s.gender,
      occupation: s.occupation,
      hireDate: toDate(s.hireDate),
      ageAtHire: toNum(s.ageAtHire),
      pensionStartDate: toDate(s.pensionStartDate),
      kafJoiningDate: toDate(s.kafJoiningDate),
      category: s.category,
      grossSalary: toNum(s.grossSalary),
      salaryCurrency: s.salaryCurrency,
      contributionEe: toNum(s.contributionEE),
      contributionEr: toNum(s.contributionER),
      email: s.email,
      startingEeValue: toNum(s.startingEEValue),
      startingErValue: toNum(s.startingERValue),
      startingFundValue: toNum(s.startingFundValue),
      vee: toNum(s.veeContribution),
      weightF1Ee: toNum(s.weightsEE[0]),
      weightF2Ee: toNum(s.weightsEE[1]),
      weightF3Ee: toNum(s.weightsEE[2]),
      weightF4Ee: toNum(s.weightsEE[3]),
      weightF5Ee: toNum(s.weightsEE[4]),
      weightF6Ee: toNum(s.weightsEE[5]),
      weightF7Ee: toNum(s.weightsEE[6]),
      weightF8Ee: toNum(s.weightsEE[7]),
      weightF9Ee: toNum(s.weightsEE[8]),
      weightF10Ee: toNum(s.weightsEE[9]),
      weightF1Er: toNum(s.weightsER[0]),
      weightF2Er: toNum(s.weightsER[1]),
      weightF3Er: toNum(s.weightsER[2]),
      weightF4Er: toNum(s.weightsER[3]),
      weightF5Er: toNum(s.weightsER[4]),
      weightF6Er: toNum(s.weightsER[5]),
      weightF7Er: toNum(s.weightsER[6]),
      weightF8Er: toNum(s.weightsER[7]),
      weightF9Er: toNum(s.weightsER[8]),
      weightF10Er: toNum(s.weightsER[9]),
    };

    setLoading(true);
    try {
      const result = await employeesApi.create(payload);
      setS((prev) => ({
        ...prev,
        employeeId: String(result.employeeId),
        employeeNumber: result.employeeNumber,
      }));
      setSuccess(`Employee ${result.employeeNumber} (ID: ${result.employeeId}) added successfully.`);
    } catch (err) {
      setError(extractApiError(err, 'Failed to add employee.'));
    } finally {
      setLoading(false);
    }
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
                disabled={companiesLoading || loading}
              >
                <option value="" disabled>
                  {companiesLoading ? 'Loading companies…' : 'Select company number'}
                </option>
                {companies.map((c) => (
                  <option key={c.companyNumber} value={c.companyNumber}>
                    {c.companyNumber} — {c.companyName}
                  </option>
                ))}
              </select>
            </FieldGroup>

            <FieldGroup label="Company Issue Date">
              <input
                className="kaf-input"
                type="date"
                value={s.companyIssueDate}
                disabled
              />
            </FieldGroup>

            <FieldGroup label="Employee ID">
              <input
                className="kaf-input"
                type="text"
                value={s.employeeId}
                readOnly
              />
            </FieldGroup>

            <FieldGroup label="Employee Number">
              <input
                className="kaf-input"
                type="text"
                value={s.employeeNumber}
                readOnly
              />
            </FieldGroup>

            <FieldGroup label="National ID" required>
              <input
                className="kaf-input"
                type="text"
                value={s.nationalId}
                onChange={onString('nationalId')}
                disabled={loading}
              />
            </FieldGroup>

            <FieldGroup label="Full Name" required>
              <input
                className="kaf-input"
                type="text"
                value={s.fullName}
                onChange={onString('fullName')}
                disabled={loading}
              />
            </FieldGroup>

            <FieldGroup label="Date of Birth" required>
              <input
                className="kaf-input"
                type="date"
                value={s.dateOfBirth}
                onChange={onString('dateOfBirth')}
                disabled={loading}
              />
            </FieldGroup>

            <FieldGroup label="Gender">
              <select className="kaf-input kaf-select" value={s.gender} onChange={onString('gender')} disabled={loading}>
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
                disabled={loading}
              />
            </FieldGroup>

            <FieldGroup label="Hire Date" required>
              <input
                className="kaf-input"
                type="date"
                value={s.hireDate}
                onChange={onString('hireDate')}
                disabled={loading}
              />
            </FieldGroup>

            <FieldGroup label="Age at Hire">
              <input
                className="kaf-input"
                type="text"
                inputMode="numeric"
                value={s.ageAtHire}
                onChange={onString('ageAtHire')}
                disabled={loading}
              />
            </FieldGroup>

            <FieldGroup label="Pension Start Date" required>
              <input
                className="kaf-input"
                type="date"
                value={s.pensionStartDate}
                onChange={onString('pensionStartDate')}
                disabled={loading}
              />
            </FieldGroup>

            <FieldGroup label="Kaf Joining Date" required>
              <input
                className="kaf-input"
                type="date"
                value={s.kafJoiningDate}
                onChange={onString('kafJoiningDate')}
                disabled={loading}
              />
            </FieldGroup>

            <FieldGroup label="Category" required>
              <select className="kaf-input kaf-select" value={s.category} onChange={onString('category')} disabled={loading || categoriesLoading}>
                <option value="" disabled>
                  {categoriesLoading ? 'Loading categories…' : 'Select category'}
                </option>
                {categories.map((c) => (
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
                disabled={loading}
              />
            </FieldGroup>

            <FieldGroup label="Salary Currency" required>
              <select
                className="kaf-input kaf-select"
                value={s.salaryCurrency}
                onChange={onString('salaryCurrency')}
                disabled={loading}
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
                disabled={loading}
              />
            </FieldGroup>

            <FieldGroup label="Contribution ER">
              <input
                className="kaf-input"
                type="text"
                inputMode="decimal"
                value={s.contributionER}
                onChange={onString('contributionER')}
                disabled={loading}
              />
            </FieldGroup>

            <FieldGroup label="E-mail">
              <input
                className="kaf-input"
                type="email"
                value={s.email}
                onChange={onString('email')}
                disabled={loading}
              />
            </FieldGroup>

            <FieldGroup label="Starting EE Value">
              <input
                className="kaf-input"
                type="text"
                inputMode="decimal"
                value={s.startingEEValue}
                onChange={onString('startingEEValue')}
                disabled={loading}
              />
            </FieldGroup>

            <FieldGroup label="Starting ER Value">
              <input
                className="kaf-input"
                type="text"
                inputMode="decimal"
                value={s.startingERValue}
                onChange={onString('startingERValue')}
                disabled={loading}
              />
            </FieldGroup>

            <FieldGroup label="Starting Fund Value">
              <input
                className="kaf-input"
                type="text"
                inputMode="decimal"
                value={s.startingFundValue}
                onChange={onString('startingFundValue')}
                disabled={loading}
              />
            </FieldGroup>

            <FieldGroup label="VEE Contribution" required>
              <PercentInput value={s.veeContribution} onChange={onString('veeContribution')} disabled={loading} />
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
                  disabled={loading}
                />
                <WeightField
                  label={`Weight F${i + 1} ER`}
                  required
                  value={s.weightsER[i]}
                  onChange={onWeight('ER', i)}
                  disabled={loading}
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
              <button type="submit" className="kaf-btn" disabled={loading}>
                Add
              </button>
              <button type="button" className="kaf-btn-ghost" onClick={handleClear} disabled={loading}>
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
  disabled?: boolean;
}

function PercentInput({ value, onChange, disabled }: PercentInputProps) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        className="kaf-input"
        type="text"
        inputMode="decimal"
        value={value}
        onChange={onChange}
        disabled={disabled}
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
  disabled?: boolean;
}

function WeightField({ label, value, onChange, required, readOnly, disabled }: WeightFieldProps) {
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
          disabled={disabled}
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
