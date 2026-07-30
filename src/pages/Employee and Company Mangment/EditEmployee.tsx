import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Pencil } from 'lucide-react';
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

const emptyUpdated = (): FormState => ({
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
  salaryCurrency: '',
  contributionEE: '',
  contributionER: '',
  email: '',
  startingEEValue: '',
  startingERValue: '',
  startingFundValue: '',
  veeContribution: '',
  weightsEE: Array.from({ length: FUNDS }, () => ''),
  weightsER: Array.from({ length: FUNDS }, () => ''),
});

// Mock current employee record (replace with /api/employee/:id data later)
const CURRENT: FormState = {
  companyNumber: '1001',
  companyIssueDate: '2015-03-12',
  employeeId: 'EMP-1001-001',
  employeeNumber: '1001-001',
  nationalId: '12345678901234',
  fullName: 'Ahmed Mohamed',
  dateOfBirth: '1990-05-20',
  gender: 'Male',
  occupation: 'Software Engineer',
  hireDate: '2020-01-15',
  ageAtHire: '29',
  pensionStartDate: '2055-05-20',
  kafJoiningDate: '2020-02-01',
  category: 'Category 1',
  grossSalary: '25000',
  salaryCurrency: 'EGP',
  contributionEE: '1500',
  contributionER: '3000',
  email: 'ahmed.mohamed@example.com',
  startingEEValue: '5000',
  startingERValue: '10000',
  startingFundValue: '15000',
  veeContribution: '5.00',
  weightsEE: Array.from({ length: FUNDS }, () => '10.00'),
  weightsER: Array.from({ length: FUNDS }, () => '10.00'),
};

// TODO: replace with /api/employees data
const EMPLOYEES: FormState[] = [
  CURRENT,
  { ...CURRENT, employeeNumber: '1001-002', employeeId: 'EMP-1001-002', fullName: 'Mohamed Ali', nationalId: '22334455667788' },
  { ...CURRENT, companyNumber: '1002', companyIssueDate: '2018-07-20', employeeNumber: '1002-001', employeeId: 'EMP-1002-001', fullName: 'Sara Hany', nationalId: '33445566778899' },
  { ...CURRENT, companyNumber: '1002', companyIssueDate: '2018-07-20', employeeNumber: '1002-002', employeeId: 'EMP-1002-002', fullName: 'Omar Khaled', nationalId: '44556677889900' },
  { ...CURRENT, companyNumber: '1003', companyIssueDate: '2021-11-05', employeeNumber: '1003-001', employeeId: 'EMP-1003-001', fullName: 'Laila Saad', nationalId: '55667788990011' },
];

function toNum(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function hasChanges(updated: FormState): boolean {
  const entries = Object.entries(updated) as [string, string | string[]][];
  return entries.some(([, value]) => {
    if (Array.isArray(value)) return value.some((v) => v.trim());
    return value.trim() !== '';
  });
}

export default function EditEmployee() {
  const [selectedCompany, setSelectedCompany] = useState(CURRENT.companyNumber);
  const [selectedEmployee, setSelectedEmployee] = useState(CURRENT.employeeNumber);
  const [updated, setUpdated] = useState<FormState>(emptyUpdated());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const current = useMemo(
    () => EMPLOYEES.find((e) => e.companyNumber === selectedCompany && e.employeeNumber === selectedEmployee) ?? CURRENT,
    [selectedCompany, selectedEmployee]
  );

  const updatedTotalEE = useMemo(
    () => updated.weightsEE.reduce((sum, v) => sum + toNum(v), 0),
    [updated.weightsEE]
  );
  const updatedTotalER = useMemo(
    () => updated.weightsER.reduce((sum, v) => sum + toNum(v), 0),
    [updated.weightsER]
  );

  const currentTotalEE = useMemo(
    () => current.weightsEE.reduce((sum, v) => sum + toNum(v), 0),
    [current]
  );
  const currentTotalER = useMemo(
    () => current.weightsER.reduce((sum, v) => sum + toNum(v), 0),
    [current]
  );

  const onString = (key: StringField) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setUpdated((prev) => ({ ...prev, [key]: value } as FormState));
    setError(null);
    setSuccess(null);
  };

  const onWeight = (side: 'EE' | 'ER', index: number) => (e: ChangeEvent<HTMLInputElement>) => {
    setUpdated((prev) => {
      const arr = side === 'EE' ? [...prev.weightsEE] : [...prev.weightsER];
      arr[index] = e.target.value;
      return { ...prev, [side === 'EE' ? 'weightsEE' : 'weightsER']: arr } as FormState;
    });
    setError(null);
    setSuccess(null);
  };

  const onSelectCompany = (e: ChangeEvent<HTMLSelectElement>) => {
    const company = e.target.value;
    setSelectedCompany(company);
    const first = EMPLOYEES.find((emp) => emp.companyNumber === company);
    setSelectedEmployee(first?.employeeNumber ?? '');
    setUpdated(emptyUpdated());
    setError(null);
    setSuccess(null);
  };

  const onSelectEmployee = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedEmployee(e.target.value);
    setUpdated(emptyUpdated());
    setError(null);
    setSuccess(null);
  };

  const handleClear = () => {
    setUpdated(emptyUpdated());
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!hasChanges(updated)) {
      setSuccess('No changes were provided; current employee data will be kept.');
      return;
    }

    setSuccess('Employee update simulated. Backend integration is not yet connected.');
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
        title="Edit Existing Employee"
        subtitle="Update an existing employee record. Leave a field blank to keep its current value."
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

        <div className="kaf-callout warn" style={{ marginBottom: 20, fontSize: 13 }}>
          Please leave fields blank to keep the current data. Only change what you need to update.
        </div>

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr', gap: '12px 24px', alignItems: 'center' }}>
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
                  <select
                    className="kaf-input kaf-select"
                    value={selectedCompany}
                    onChange={onSelectCompany}
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
                }
                current={<ReadOnlyInput value={current.companyNumber} />}
              />

              <FieldRow
                label="Employee Number"
                updated={
                  <select
                    className="kaf-input kaf-select"
                    value={selectedEmployee}
                    onChange={onSelectEmployee}
                    disabled={!selectedCompany}
                  >
                    <option value="" disabled>
                      {selectedCompany ? 'Select employee number' : 'Select a company first'}
                    </option>
                    {EMPLOYEES.filter((emp) => emp.companyNumber === selectedCompany).map((emp) => (
                      <option key={emp.employeeNumber} value={emp.employeeNumber}>
                        {emp.employeeNumber}
                      </option>
                    ))}
                  </select>
                }
                current={<ReadOnlyInput value={current.employeeNumber} />}
              />

              <FieldRow
                label="Employee ID"
                updated={
                  <input
                    className="kaf-input"
                    type="text"
                    value={updated.employeeId}
                    onChange={onString('employeeId')}
                  />
                }
                current={<ReadOnlyInput value={current.employeeId} />}
              />

              <FieldRow
                label="National ID"
                updated={
                  <input
                    className="kaf-input"
                    type="text"
                    value={updated.nationalId}
                    onChange={onString('nationalId')}
                  />
                }
                current={<ReadOnlyInput value={current.nationalId} />}
              />

              <FieldRow
                label="Full Name"
                updated={
                  <input
                    className="kaf-input"
                    type="text"
                    value={updated.fullName}
                    onChange={onString('fullName')}
                  />
                }
                current={<ReadOnlyInput value={current.fullName} />}
              />

              <FieldRow
                label="Date of Birth"
                updated={
                  <input
                    className="kaf-input"
                    type="date"
                    value={updated.dateOfBirth}
                    onChange={onString('dateOfBirth')}
                  />
                }
                current={<ReadOnlyInput value={current.dateOfBirth} />}
              />

              <FieldRow
                label="Gender"
                updated={
                  <select
                    className="kaf-input kaf-select"
                    value={updated.gender}
                    onChange={onString('gender')}
                  >
                    <option value="" disabled>
                      Select gender
                    </option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                }
                current={<ReadOnlyInput value={current.gender} />}
              />

              <FieldRow
                label="Occupation"
                updated={
                  <input
                    className="kaf-input"
                    type="text"
                    value={updated.occupation}
                    onChange={onString('occupation')}
                  />
                }
                current={<ReadOnlyInput value={current.occupation} />}
              />

              <FieldRow
                label="Hire Date"
                updated={
                  <input
                    className="kaf-input"
                    type="date"
                    value={updated.hireDate}
                    onChange={onString('hireDate')}
                  />
                }
                current={<ReadOnlyInput value={current.hireDate} />}
              />

              <FieldRow
                label="Age at Hire"
                updated={
                  <input
                    className="kaf-input"
                    type="text"
                    inputMode="numeric"
                    value={updated.ageAtHire}
                    onChange={onString('ageAtHire')}
                  />
                }
                current={<ReadOnlyInput value={current.ageAtHire} />}
              />

              <FieldRow
                label="Pension Start Date"
                updated={
                  <input
                    className="kaf-input"
                    type="date"
                    value={updated.pensionStartDate}
                    onChange={onString('pensionStartDate')}
                  />
                }
                current={<ReadOnlyInput value={current.pensionStartDate} />}
              />

              <FieldRow
                label="Kaf Joining Date"
                updated={
                  <input
                    className="kaf-input"
                    type="date"
                    value={updated.kafJoiningDate}
                    onChange={onString('kafJoiningDate')}
                  />
                }
                current={<ReadOnlyInput value={current.kafJoiningDate} />}
              />

              <FieldRow
                label="Category"
                updated={
                  <select
                    className="kaf-input kaf-select"
                    value={updated.category}
                    onChange={onString('category')}
                  >
                    <option value="" disabled>
                      Select category
                    </option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                }
                current={<ReadOnlyInput value={current.category} />}
              />

              <FieldRow
                label="Gross Salary"
                updated={
                  <input
                    className="kaf-input"
                    type="text"
                    inputMode="decimal"
                    value={updated.grossSalary}
                    onChange={onString('grossSalary')}
                  />
                }
                current={<ReadOnlyInput value={current.grossSalary} />}
              />

              <FieldRow
                label="Salary Currency"
                updated={
                  <select
                    className="kaf-input kaf-select"
                    value={updated.salaryCurrency}
                    onChange={onString('salaryCurrency')}
                  >
                    <option value="" disabled>
                      Select currency
                    </option>
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                }
                current={<ReadOnlyInput value={current.salaryCurrency} />}
              />

              <FieldRow
                label="Contribution EE"
                updated={
                  <input
                    className="kaf-input"
                    type="text"
                    inputMode="decimal"
                    value={updated.contributionEE}
                    onChange={onString('contributionEE')}
                  />
                }
                current={<ReadOnlyInput value={current.contributionEE} />}
              />

              <FieldRow
                label="Contribution ER"
                updated={
                  <input
                    className="kaf-input"
                    type="text"
                    inputMode="decimal"
                    value={updated.contributionER}
                    onChange={onString('contributionER')}
                  />
                }
                current={<ReadOnlyInput value={current.contributionER} />}
              />

              <FieldRow
                label="E-mail"
                updated={
                  <input
                    className="kaf-input"
                    type="email"
                    value={updated.email}
                    onChange={onString('email')}
                  />
                }
                current={<ReadOnlyInput value={current.email} />}
              />

              <FieldRow
                label="Starting EE Value"
                updated={
                  <input
                    className="kaf-input"
                    type="text"
                    inputMode="decimal"
                    value={updated.startingEEValue}
                    onChange={onString('startingEEValue')}
                  />
                }
                current={<ReadOnlyInput value={current.startingEEValue} />}
              />

              <FieldRow
                label="Starting ER Value"
                updated={
                  <input
                    className="kaf-input"
                    type="text"
                    inputMode="decimal"
                    value={updated.startingERValue}
                    onChange={onString('startingERValue')}
                  />
                }
                current={<ReadOnlyInput value={current.startingERValue} />}
              />

              <FieldRow
                label="Starting Fund Value"
                updated={
                  <input
                    className="kaf-input"
                    type="text"
                    inputMode="decimal"
                    value={updated.startingFundValue}
                    onChange={onString('startingFundValue')}
                  />
                }
                current={<ReadOnlyInput value={current.startingFundValue} />}
              />

              <FieldRow
                label="Voluntary Top-Up"
                updated={
                  <PercentInput value={updated.veeContribution} onChange={onString('veeContribution')} />
                }
                current={<ReadOnlyPercent value={current.veeContribution} />}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <InvestmentCard
                title="Updated Investment Allocation"
                weightsEE={updated.weightsEE}
                weightsER={updated.weightsER}
                totalEE={updatedTotalEE}
                totalER={updatedTotalER}
                onWeight={onWeight}
                readOnly={false}
              />
              <InvestmentCard
                title="Current Investment Allocation"
                weightsEE={current.weightsEE}
                weightsER={current.weightsER}
                totalEE={currentTotalEE}
                totalER={currentTotalER}
                readOnly
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
  updated: ReactNode;
  current: ReactNode;
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

interface InvestmentCardProps {
  title: string;
  weightsEE: string[];
  weightsER: string[];
  totalEE: number;
  totalER: number;
  onWeight?: (side: 'EE' | 'ER', index: number) => (e: ChangeEvent<HTMLInputElement>) => void;
  readOnly: boolean;
}

function InvestmentCard({ title, weightsEE, weightsER, totalEE, totalER, onWeight, readOnly }: InvestmentCardProps) {
  return (
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
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--kaf-text)',
          margin: 0,
        }}
      >
        {title}
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
            value={weightsEE[i]}
            onChange={readOnly || !onWeight ? undefined : onWeight('EE', i)}
            readOnly={readOnly}
          />
          <WeightField
            label={`Weight F${i + 1} ER`}
            value={weightsER[i]}
            onChange={readOnly || !onWeight ? undefined : onWeight('ER', i)}
            readOnly={readOnly}
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
    </div>
  );
}

function ReadOnlyInput({ value }: { value: string }) {
  return (
    <input
      className="kaf-input"
      type="text"
      value={value}
      readOnly
      style={{ background: 'var(--kaf-surface-2)' }}
    />
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

function ReadOnlyPercent({ value }: { value: string }) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        className="kaf-input"
        type="text"
        value={value}
        readOnly
        style={{ textAlign: 'right', paddingRight: 30, background: 'var(--kaf-surface-2)' }}
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
  readOnly?: boolean;
}

function WeightField({ label, value, onChange, readOnly }: WeightFieldProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, color: 'var(--kaf-muted)', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ position: 'relative' }}>
        <input
          className="kaf-input"
          type="text"
          inputMode="decimal"
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          style={{
            textAlign: 'right',
            padding: '5px 28px 5px 8px',
            fontSize: 11.5,
            background: readOnly ? 'var(--kaf-surface-2)' : undefined,
          }}
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
