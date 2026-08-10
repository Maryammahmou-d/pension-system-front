import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="kaf-label">
        {label}{required ? <span style={{ color: 'var(--kaf-error)', marginLeft: 3 }}>*</span> : null}
      </label>
      {children}
    </div>
  );
}

export function ReportFeedback({
  error,
  success,
}: {
  error: string | null;
  success: string | null;
}) {
  return (
    <>
      {error && (
        <div className="kaf-callout error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="kaf-callout ok"
            style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}
          >
            <CheckCircle2 size={16} style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontWeight: 600 }}>{success}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
