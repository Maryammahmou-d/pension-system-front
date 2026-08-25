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

/** Semi-transparent layer over a report card while PDF/Excel is generating. */
export function ReportBusyOverlay({
  show,
  message,
  progress,
}: {
  show: boolean;
  message: string;
  /** 0–100 when known; omit for spinner-only. */
  progress?: number | null;
}) {
  const pct =
    typeof progress === 'number' && Number.isFinite(progress)
      ? Math.max(0, Math.min(100, Math.round(progress)))
      : null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            borderRadius: 'inherit',
            background: 'rgba(14, 11, 30, 0.55)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            padding: '0 28px',
          }}
        >
          {pct !== null ? (
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--kaf-purple-light)', letterSpacing: '0.02em' }}>
              {pct}%
            </div>
          ) : (
            <span className="kaf-spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
          )}
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--kaf-text)', textAlign: 'center' }}>
            {message}
          </div>
          {pct !== null && (
            <div
              style={{
                width: '100%',
                maxWidth: 220,
                height: 6,
                borderRadius: 999,
                background: 'rgba(255,255,255,0.12)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: 'var(--kaf-purple)',
                  transition: 'width 0.25s ease',
                }}
              />
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
