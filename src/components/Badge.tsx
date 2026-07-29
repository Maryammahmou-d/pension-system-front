type Variant =
  | 'flagged' | 'clear'
  | 'terrorism' | 'prosecution'
  | 'classA' | 'classD'
  | 'pending' | 'processing' | 'completed' | 'failed'
  | 'active' | 'inactive';

interface BadgeProps {
  variant: Variant;
  children: React.ReactNode;
}

const cls: Record<Variant, string> = {
  flagged:     'badge-flagged',
  clear:       'badge-clear',
  terrorism:   'badge-terrorism',
  prosecution: 'badge-prosecution',
  classA:      'badge-classA',
  classD:      'badge-classD',
  pending:     'badge-pending',
  processing:  'badge-processing',
  completed:   'badge-completed',
  failed:      'badge-failed',
  active:      'badge-active',
  inactive:    'badge-inactive',
};

export default function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={`kaf-badge ${cls[variant]}`}>{children}</span>
  );
}
