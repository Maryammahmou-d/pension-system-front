import { motion } from 'framer-motion';
import type { AmlMatchResult } from '../types';
import Badge from './Badge';

interface Props {
  match: AmlMatchResult;
  index: number;
}

export default function MatchCard({ match, index }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="kaf-card"
      style={{
        padding: '14px 18px',
        borderLeft: `3px solid ${match.listType === 'TERRORISM' ? 'var(--kaf-warning)' : 'var(--kaf-purple)'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 9.5,
            fontWeight: 700,
            color: 'var(--kaf-muted-2)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            #{index + 1}
          </span>
          <Badge variant={match.listType === 'TERRORISM' ? 'terrorism' : 'prosecution'}>
            {match.listType}
          </Badge>
          <Badge variant={match.matchClass === 'A' ? 'classA' : 'classD'}>
            Class {match.matchClass}
          </Badge>
          <span className="kaf-code-inline">score: {match.score}</span>
        </div>
        <span style={{
          fontSize: 11,
          color: 'var(--kaf-muted)',
          whiteSpace: 'nowrap',
          fontWeight: 600,
          background: 'var(--kaf-surface-2)',
          padding: '2px 8px',
          borderRadius: 6,
          border: '1px solid var(--kaf-border)',
        }}>
          {match.matchType === 'ID' ? 'ID Match' : 'Name Match'}
        </span>
      </div>

      {match.matchedName && (
        <p style={{
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--kaf-dark)',
          marginBottom: 6,
          direction: 'rtl',
          textAlign: 'right',
          fontFamily: 'Segoe UI, Tahoma, sans-serif',
        }}>
          {match.matchedName}
        </p>
      )}

      {match.matchNote && (
        <div className="kaf-callout warn" style={{ marginTop: 8, padding: '8px 14px', fontSize: 12 }}>
          {match.matchNote}
        </div>
      )}

      {match.rawData && Object.keys(match.rawData).length > 0 && (
        <details style={{ marginTop: 10 }}>
          <summary style={{
            fontSize: 11.5,
            color: 'var(--kaf-purple-light)',
            cursor: 'pointer',
            fontWeight: 600,
            userSelect: 'none',
            listStyle: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 16, height: 16, borderRadius: 4,
              background: 'var(--kaf-purple-bg)', border: '1px solid var(--kaf-purple-border)',
              fontSize: 8, color: 'var(--kaf-purple-light)',
            }}>▾</span>
            Record Details
          </summary>
          <div style={{
            marginTop: 10,
            background: 'var(--kaf-surface-2)',
            border: '1px solid var(--kaf-border-2)',
            borderRadius: 10,
            padding: '14px 16px',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px 20px',
            }}>
              {Object.entries(match.rawData)
                .filter(([k]) => k !== 'id' && k !== 'listId')
                .map(([key, value]) => {
                  const isArabic = typeof value === 'string' && /[\u0600-\u06FF]/.test(value);
                  const display = value != null && value !== '' ? String(value) : null;
                  return (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: 'var(--kaf-muted-2)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.9px',
                      }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span style={{
                        fontSize: 12.5,
                        fontWeight: display ? 500 : 400,
                        color: display ? 'var(--kaf-text)' : 'var(--kaf-muted-2)',
                        direction: isArabic ? 'rtl' : 'ltr',
                        textAlign: isArabic ? 'right' : 'left',
                        fontFamily: isArabic ? 'Segoe UI, Tahoma, sans-serif' : 'inherit',
                        lineHeight: 1.4,
                      }}>
                        {display ?? '—'}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </details>
      )}
    </motion.div>
  );
}
