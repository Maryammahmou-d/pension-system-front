import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, Landmark } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { dateHelpers, reportsApi } from '../../lib/api';
import { mockExportContents, saveFileWithPicker, suggestedNameFromPath } from '../../lib/saveFile';
import { Field, ReportFeedback } from '../../components/reports/reportFormBits';

export default function CompaniesFundsReport() {
  const [valuationDate, setValuationDate] = useState(dateHelpers.todayIso());
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    setSuccess(null);
    if (!valuationDate) {
      setError('Valuation Date is required.');
      return;
    }
    setLoading(true);
    try {
      const res = await reportsApi.extract('companies-funds', 'excel', {
        valuationDate, path: path || undefined,
      });
      const saved = await saveFileWithPicker({
        suggestedName: suggestedNameFromPath(path, 'companies-funds.xlsx.txt'),
        contents: mockExportContents('Companies Funds', { valuationDate }),
      });
      if (saved === 'cancelled') return;
      setSuccess(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extract failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kaf-page">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <PageHeader
          icon={Landmark}
          title="Extract Companies Funds"
          subtitle="Export companies funds Excel for a valuation date."
        />
      </motion.div>

      <div className="kaf-card" style={{ padding: '22px 24px', maxWidth: 560 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Valuation Date" required>
            <input
              className="kaf-input"
              type="date"
              value={valuationDate}
              onChange={(e) => setValuationDate(e.target.value)}
              disabled={loading}
            />
          </Field>

          <Field label="Path">
            <input
              className="kaf-input"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="Optional — choose location in the save dialog"
              disabled={loading}
            />
          </Field>

          <ReportFeedback error={error} success={success} />

          <button type="button" className="kaf-btn" disabled={loading} onClick={() => void run()} style={{ width: '100%', marginTop: 4 }}>
            {loading
              ? <><span className="kaf-spinner" style={{ display: 'inline-block' }} /> Extracting…</>
              : <><FileSpreadsheet size={14} /> Extract Excel</>}
          </button>
        </div>
      </div>
    </div>
  );
}

