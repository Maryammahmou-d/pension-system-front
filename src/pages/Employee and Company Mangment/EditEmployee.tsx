import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Pencil } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import type { Company, CreateEmployeeRequest, Employee } from '../../types';
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


function toNum(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function toInputDate(value?: string | null): string {
  return value ? value.slice(0, 10) : '';
}

function employeeToFormState(emp: Employee, company?: Company | null): FormState {
  return {
    companyNumber: emp.companyNumber ?? '',
    companyIssueDate: toInputDate(company?.issueDate),
    employeeId: String(emp.employeeId ?? ''),
    employeeNumber: emp.employeeNumber ?? '',
    nationalId: emp.nationalId ?? '',
    fullName: emp.fullName ?? '',
    dateOfBirth: toInputDate(emp.dob),
    gender: emp.gender ?? '',
    occupation: emp.occupation ?? '',
    hireDate: toInputDate(emp.hireDate),
    ageAtHire: String(emp.ageAtHire ?? ''),
    pensionStartDate: toInputDate(emp.pensionStartDate),
    kafJoiningDate: toInputDate(emp.kafJoiningDate),
    category: emp.category ?? '',
    grossSalary: String(emp.grossSalary ?? ''),
    salaryCurrency: emp.salaryCurrency ?? '',
    contributionEE: String(emp.contributionEe ?? ''),
    contributionER: String(emp.contributionEr ?? ''),
    email: emp.email ?? '',
    startingEEValue: String(emp.startingEeValue ?? ''),
    startingERValue: String(emp.startingErValue ?? ''),
    startingFundValue: String(emp.startingFundValue ?? ''),
    veeContribution: String(emp.vee ?? ''),
    weightsEE: [
      emp.weightF1Ee,
      emp.weightF2Ee,
      emp.weightF3Ee,
      emp.weightF4Ee,
      emp.weightF5Ee,
      emp.weightF6Ee,
      emp.weightF7Ee,
      emp.weightF8Ee,
      emp.weightF9Ee,
      emp.weightF10Ee,
    ].map((v) => String(v ?? '')),
    weightsER: [
      emp.weightF1Er,
      emp.weightF2Er,
      emp.weightF3Er,
      emp.weightF4Er,
      emp.weightF5Er,
      emp.weightF6Er,
      emp.weightF7Er,
      emp.weightF8Er,
      emp.weightF9Er,
      emp.weightF10Er,
    ].map((v) => String(v ?? '')),
  };
}

function hasChanges(updated: FormState): boolean {
  const entries = Object.entries(updated) as [string, string | string[]][];
  return entries.some(([, value]) => {
    if (Array.isArray(value)) return value.some((v) => v.trim());
    return value.trim() !== '';
  });
}

export default function EditEmployee() {
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [updated, setUpdated] = useState<FormState>(emptyUpdated());
  const [current, setCurrent] = useState<FormState>(emptyUpdated());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

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
    if (!selectedCompany) {
      setEmployees([]);
      setSelectedEmployee('');
      return;
    }
    let cancelled = false;
    setEmployeesLoading(true);
    employeesApi
      .getByCompanyNumber(selectedCompany)
      .then((list) => {
        if (cancelled) return;
        setEmployees(list);
        if (list.length && !selectedEmployee) {
          setSelectedEmployee(String(list[0].employeeId));
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(extractApiError(err, 'Failed to load employees.'));
      })
      .finally(() => {
        if (!cancelled) setEmployeesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCompany]);

  useEffect(() => {
    if (!selectedCompany) {
      setCategories([]);
      setCategoriesLoading(false);
      return;
    }
    let cancelled = false;
    setCategoriesLoading(true);
    setCategories([]);
    contributionsApi
      .getByCompanyNumber(selectedCompany)
      .then((list) => {
        if (cancelled) return;
        const cats = [...new Set(list.map((c) => c.category))];
        setCategories(cats);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(extractApiError(err, 'Failed to load categories.'));
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCompany]);

  useEffect(() => {
    if (!selectedEmployee) {
      setCurrent(emptyUpdated());
      return;
    }
    let cancelled = false;
    employeesApi
      .getById(Number(selectedEmployee))
      .then((emp) => {
        if (cancelled) return;
        const company = companies.find((c) => c.companyNumber === emp.companyNumber);
        setCurrent(employeeToFormState(emp, company));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(extractApiError(err, 'Failed to load employee.'));
      });
    return () => {
      cancelled = true;
    };
  }, [selectedEmployee, companies]);

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
    [current.weightsEE]
  );
  const currentTotalER = useMemo(
    () => current.weightsER.reduce((sum, v) => sum + toNum(v), 0),
    [current.weightsER]
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
    setSelectedCompany(e.target.value);
    setSelectedEmployee('');
    setEmployees([]);
    setCategories([]);
    setCategoriesLoading(false);
    setCurrent(emptyUpdated());
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedEmployee) {
      setError('Please select an employee to update.');
      return;
    }

    if (!hasChanges(updated)) {
      setSuccess('No changes were provided; current employee data will be kept.');
      return;
    }

    const company = companies.find((c) => c.companyNumber === current.companyNumber);
    if (!company || !company.id) {
      setError('Selected company not found.');
      return;
    }

    const pickString = (updatedValue: string, currentValue: string) =>
      updatedValue.trim() || currentValue.trim();

    const pickDate = (updatedValue: string, currentValue: string) => {
      const v = updatedValue.trim() || currentValue.trim();
      return v ? `${v}T00:00:00Z` : (null as unknown as string);
    };

    const pickNumber = (updatedValue: string, currentValue: string) => {
      const v = updatedValue.trim() || currentValue.trim();
      return v ? toNum(v) : (null as unknown as number);
    };

    const payload: CreateEmployeeRequest = {
      companyId: company.id,
      nationalId: pickString(updated.nationalId, current.nationalId),
      fullName: pickString(updated.fullName, current.fullName),
      dob: pickDate(updated.dateOfBirth, current.dateOfBirth),
      gender: pickString(updated.gender, current.gender),
      occupation: pickString(updated.occupation, current.occupation),
      hireDate: pickDate(updated.hireDate, current.hireDate),
      ageAtHire: pickNumber(updated.ageAtHire, current.ageAtHire),
      pensionStartDate: pickDate(updated.pensionStartDate, current.pensionStartDate),
      kafJoiningDate: pickDate(updated.kafJoiningDate, current.kafJoiningDate),
      category: pickString(updated.category, current.category),
      grossSalary: pickNumber(updated.grossSalary, current.grossSalary),
      salaryCurrency: pickString(updated.salaryCurrency, current.salaryCurrency),
      contributionEe: pickNumber(updated.contributionEE, current.contributionEE),
      contributionEr: pickNumber(updated.contributionER, current.contributionER),
      email: pickString(updated.email, current.email),
      startingEeValue: pickNumber(updated.startingEEValue, current.startingEEValue),
      startingErValue: pickNumber(updated.startingERValue, current.startingERValue),
      startingFundValue: pickNumber(updated.startingFundValue, current.startingFundValue),
      vee: pickNumber(updated.veeContribution, current.veeContribution),
      weightF1Ee: pickNumber(updated.weightsEE[0], current.weightsEE[0]),
      weightF2Ee: pickNumber(updated.weightsEE[1], current.weightsEE[1]),
      weightF3Ee: pickNumber(updated.weightsEE[2], current.weightsEE[2]),
      weightF4Ee: pickNumber(updated.weightsEE[3], current.weightsEE[3]),
      weightF5Ee: pickNumber(updated.weightsEE[4], current.weightsEE[4]),
      weightF6Ee: pickNumber(updated.weightsEE[5], current.weightsEE[5]),
      weightF7Ee: pickNumber(updated.weightsEE[6], current.weightsEE[6]),
      weightF8Ee: pickNumber(updated.weightsEE[7], current.weightsEE[7]),
      weightF9Ee: pickNumber(updated.weightsEE[8], current.weightsEE[8]),
      weightF10Ee: pickNumber(updated.weightsEE[9], current.weightsEE[9]),
      weightF1Er: pickNumber(updated.weightsER[0], current.weightsER[0]),
      weightF2Er: pickNumber(updated.weightsER[1], current.weightsER[1]),
      weightF3Er: pickNumber(updated.weightsER[2], current.weightsER[2]),
      weightF4Er: pickNumber(updated.weightsER[3], current.weightsER[3]),
      weightF5Er: pickNumber(updated.weightsER[4], current.weightsER[4]),
      weightF6Er: pickNumber(updated.weightsER[5], current.weightsER[5]),
      weightF7Er: pickNumber(updated.weightsER[6], current.weightsER[6]),
      weightF8Er: pickNumber(updated.weightsER[7], current.weightsER[7]),
      weightF9Er: pickNumber(updated.weightsER[8], current.weightsER[8]),
      weightF10Er: pickNumber(updated.weightsER[9], current.weightsER[9]),
    };

    setLoading(true);
    try {
      const result = await employeesApi.update(Number(selectedEmployee), payload);
      setCurrent(employeeToFormState(result, company));
      setUpdated(emptyUpdated());
      setSuccess(`Employee ${result.employeeNumber} (ID: ${result.employeeId}) updated successfully.`);
    } catch (err) {
      setError(extractApiError(err, 'Failed to update employee.'));
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
                    disabled={companiesLoading}
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
                }
                current={<span />}
              />

              <FieldRow
                label="Employee Number"
                updated={
                  <select
                    className="kaf-input kaf-select"
                    value={selectedEmployee}
                    onChange={onSelectEmployee}
                    disabled={!selectedCompany || employeesLoading}
                  >
                    <option value="" disabled>
                      {!selectedCompany
                        ? 'Select a company first'
                        : employeesLoading
                          ? 'Loading employees…'
                          : 'Select employee number'}
                    </option>
                    {employees.map((emp) => (
                      <option key={emp.employeeId} value={String(emp.employeeId)}>
                        {emp.employeeNumber} — {emp.fullName}
                      </option>
                    ))}
                  </select>
                }
                current={<span />}
              />

              <FieldRow
                label="Employee ID"
                updated={<ReadOnlyInput value={current.employeeId} />}
                current={<span />}
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
                updated={<ReadOnlyInput value={current.kafJoiningDate} />}
                current={<span />}
              />

              <FieldRow
                label="Category"
                updated={
                  <select
                    className="kaf-input kaf-select"
                    value={updated.category}
                    onChange={onString('category')}
                    disabled={loading || categoriesLoading}
                  >
                    <option value="" disabled>
                      {categoriesLoading ? 'Loading categories…' : 'Select category'}
                    </option>
                    {categories.map((c) => (
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
            <button type="submit" className="kaf-btn" disabled={loading}>
              {loading ? 'Saving…' : 'Edit'}
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
