import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X } from 'lucide-react';

export type GuideSection = {
  /** Tab label / section heading shown above the description. */
  title: string;
  /** Path under /public — e.g. `/user-guide/Dashboard.png`. */
  image: string;
  /** Free-form description of the page / tab. */
  body: ReactNode;
};

interface Props {
  /** Title shown at the top of the modal — usually the page name. */
  pageTitle: string;
  /** One or more sections. When multiple, a tab strip is rendered. */
  sections: GuideSection[];
  /** Optional override for the trigger button label. Defaults to "Guide". */
  buttonLabel?: string;
}

/**
 * A standard "User Guide" trigger + modal used on every page.
 *
 * Renders a small ghost button (icon + label) suitable for the PageHeader
 * `actions` slot. Clicking it opens a centered modal containing one or more
 * annotated screenshots that explain the page.
 *
 * Both light and dark themes are supported via the existing `--kaf-*` tokens.
 */
export default function UserGuide({ pageTitle, sections, buttonLabel = 'Guide' }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const onOpen = () => { setActive(0); setOpen(true); };
  const onClose = () => setOpen(false);

  const section = sections[Math.min(active, sections.length - 1)];

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        className="kaf-btn-ghost"
        style={{ padding: '8px 14px', fontSize: 12, gap: 6 }}
        title={`Open the ${pageTitle} user guide`}
      >
        <HelpCircle size={13} /> {buttonLabel}
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              style={{
                position: 'fixed', inset: 0, zIndex: 60,
                background: 'rgba(0,0,0,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 20, backdropFilter: 'blur(3px)',
              }}
            >
              <motion.div
                initial={{ y: 14, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 14, opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.22 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%', maxWidth: 1280, maxHeight: '94vh',
                  display: 'flex', flexDirection: 'column',
                  background: 'var(--kaf-surface-1)',
                  border: '1px solid var(--kaf-border)',
                  borderRadius: 16,
                  boxShadow: '0 24px 70px rgba(0,0,0,0.45)',
                  overflow: 'hidden',
                }}
              >
                {/* Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 22px',
                  borderBottom: '1px solid var(--kaf-border)',
                  background: 'var(--kaf-surface-2)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      background: 'linear-gradient(135deg, var(--kaf-purple) 0%, var(--kaf-purple-deep) 100%)',
                      flexShrink: 0,
                    }}>
                      <HelpCircle size={15} color="#fff" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{
                        margin: 0, fontSize: 10.5, fontWeight: 700,
                        color: 'var(--kaf-muted)', textTransform: 'uppercase', letterSpacing: '1px',
                      }}>User Guide</p>
                      <h2 style={{
                        margin: 0, fontSize: 16, fontWeight: 700,
                        color: 'var(--kaf-dark)',
                      }}>{pageTitle}</h2>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close user guide"
                    style={{
                      width: 30, height: 30, borderRadius: 8,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid var(--kaf-border)',
                      background: 'var(--kaf-surface-1)',
                      color: 'var(--kaf-muted)', cursor: 'pointer',
                      transition: 'all .15s var(--ease)',
                    }}
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Tabs (only shown when multiple sections) */}
                {sections.length > 1 && (
                  <div style={{
                    display: 'flex', gap: 6, padding: '12px 22px 0',
                    background: 'var(--kaf-surface-2)',
                    borderBottom: '1px solid var(--kaf-border)',
                    flexWrap: 'wrap',
                  }}>
                    {sections.map((s, i) => {
                      const isActive = i === active;
                      return (
                        <button
                          key={s.title}
                          type="button"
                          onClick={() => setActive(i)}
                          style={{
                            padding: '8px 14px',
                            fontSize: 12, fontWeight: 600,
                            border: 'none', cursor: 'pointer',
                            background: 'transparent',
                            color: isActive ? 'var(--kaf-purple)' : 'var(--kaf-muted)',
                            borderBottom: `2px solid ${isActive ? 'var(--kaf-purple)' : 'transparent'}`,
                            marginBottom: -1,
                            transition: 'all .15s var(--ease)',
                          }}
                        >
                          {s.title}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Body */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1.9fr) minmax(320px, 1fr)',
                  gap: 0,
                  overflow: 'hidden',
                  flex: 1,
                }}>
                  {/* Screenshot pane */}
                  <div style={{
                    background: 'var(--kaf-surface-2)',
                    borderRight: '1px solid var(--kaf-border)',
                    padding: 20, overflow: 'auto',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                  }}>
                    <img
                      key={section.image}
                      src={section.image}
                      alt={section.title}
                      style={{
                        width: '100%', height: 'auto',
                        borderRadius: 10,
                        border: '1px solid var(--kaf-border)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                        background: '#fff',
                      }}
                    />
                  </div>

                  {/* Description pane */}
                  <div style={{
                    padding: '20px 24px',
                    overflow: 'auto',
                    color: 'var(--kaf-text)',
                    fontSize: 13, lineHeight: 1.6,
                  }}>
                    {sections.length > 1 && (
                      <h3 style={{
                        margin: '0 0 10px',
                        fontSize: 15, fontWeight: 700,
                        color: 'var(--kaf-dark)',
                      }}>{section.title}</h3>
                    )}
                    <div className="kaf-guide-body">
                      {section.body}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
