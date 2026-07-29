# Rubix Frontend — Design Reference

**Purpose:** This document gives any AI agent (or developer) everything needed to build new Rubix pages that are pixel-perfect matches of the existing design — without needing to read the original AML source files.

---

## 1. Technology Stack

| Library | Version | Import |
|---|---|---|
| React | 19 | `import { useState, useEffect, … } from 'react'` |
| react-router-dom | 7 | `import { useNavigate, NavLink } from 'react-router-dom'` |
| framer-motion | 12 | `import { motion, AnimatePresence, type Variants } from 'framer-motion'` |
| lucide-react | latest | `import { LayoutDashboard, Users, … } from 'lucide-react'` |
| tailwindcss | 4 | Loaded via `@import "tailwindcss"` — used minimally; design is CSS-variable driven |
| axios | 1.x | `import axios from 'axios'` |
| clsx | 2.x | `import { clsx } from 'clsx'` |
| react-dom | 19 | `import { createPortal } from 'react-dom'` (for modals) |

---

## 2. Fonts

Loaded in `index.html` via Google Fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

- **Inter** — all body text, labels, buttons, headings
- **JetBrains Mono** — timestamps, IDs, code, monospace metadata

Font size scale in use:

| Usage | Size |
|---|---|
| Nav section labels, badge/table headers | 9.5–10px |
| Monospace meta (timestamps, IDs) | 12px |
| Labels (`kaf-label`) | 12px uppercase |
| Body text, table cells | 13–13.5px |
| Page subtitle | 13px |
| Page title (`kaf-page-title`) | 22px |
| Stat card value | 20px |

---

## 3. Complete CSS (`src/index.css`)

The full design system — paste this into any new project or read it to understand every class:

```css
@import "tailwindcss";

/* ─── KAF Design Tokens (Dark Theme) ─── */
:root {
  --kaf-purple: #9333ea;
  --kaf-purple-hover: #a855f7;
  --kaf-purple-light: #c084fc;
  --kaf-purple-deep: #6B027D;
  --kaf-purple-bg: rgba(147, 51, 234, 0.10);
  --kaf-purple-border: rgba(147, 51, 234, 0.28);
  --kaf-purple-glow: rgba(147, 51, 234, 0.22);

  --kaf-bg: #07050f;
  --kaf-surface-1: #0e0b1e;
  --kaf-surface-2: #16122a;
  --kaf-surface-3: #1e1836;
  --kaf-surface-4: #261f40;
  --kaf-sidebar: #090714;
  --kaf-code-bg: #1a1830;

  --kaf-dark: #f0e8ff;
  --kaf-text: #e2d8f5;
  --kaf-muted: #8a78a8;
  --kaf-muted-2: #564d6e;

  --kaf-border: rgba(255, 255, 255, 0.07);
  --kaf-border-2: rgba(255, 255, 255, 0.12);
  --kaf-white: var(--kaf-surface-1);

  --kaf-success: #10b981;
  --kaf-success-bg: rgba(16, 185, 129, 0.12);
  --kaf-warning: #f59e0b;
  --kaf-warning-bg: rgba(245, 158, 11, 0.12);
  --kaf-error: #ef4444;
  --kaf-error-bg: rgba(239, 68, 68, 0.12);
  --kaf-info: #3b82f6;
  --kaf-info-bg: rgba(59, 130, 246, 0.12);

  --shadow-sm: 0 1px 4px rgba(0,0,0,.5), 0 1px 2px rgba(0,0,0,.3);
  --shadow-md: 0 4px 16px rgba(0,0,0,.55), 0 2px 4px rgba(0,0,0,.3);
  --shadow-lg: 0 8px 32px rgba(0,0,0,.65), 0 4px 8px rgba(0,0,0,.3);
  --shadow-glow: 0 0 24px rgba(147,51,234,0.28);
  --shadow-glow-sm: 0 0 12px rgba(147,51,234,0.20);

  --radius: 12px;
  --ease: cubic-bezier(.4,0,.2,1);
}

/* ─── Light Theme Overrides ─── */
:root[data-theme="light"] {
  --kaf-purple: #7c2fc6;
  --kaf-purple-hover: #6B027D;
  --kaf-purple-light: #6B027D;
  --kaf-purple-deep: #4a0160;
  --kaf-purple-bg: rgba(124, 47, 198, 0.08);
  --kaf-purple-border: rgba(124, 47, 198, 0.22);
  --kaf-purple-glow: rgba(124, 47, 198, 0.18);

  --kaf-bg: #f7f4fb;
  --kaf-surface-1: #ffffff;
  --kaf-surface-2: #faf6fd;
  --kaf-surface-3: #f2ebf8;
  --kaf-surface-4: #e8dbef;
  --kaf-sidebar: #ffffff;
  --kaf-code-bg: #f5eefa;

  --kaf-dark: #1a0b24;
  --kaf-text: #2e1a3a;
  --kaf-muted: #6b5a7a;
  --kaf-muted-2: #9a88ab;

  --kaf-border: rgba(107, 2, 125, 0.10);
  --kaf-border-2: rgba(107, 2, 125, 0.18);

  --kaf-success: #059669;
  --kaf-success-bg: rgba(5, 150, 105, 0.10);
  --kaf-warning: #d97706;
  --kaf-warning-bg: rgba(217, 119, 6, 0.10);
  --kaf-error: #dc2626;
  --kaf-error-bg: rgba(220, 38, 38, 0.10);
  --kaf-info: #2563eb;
  --kaf-info-bg: rgba(37, 99, 235, 0.10);

  --shadow-sm: 0 1px 3px rgba(107,2,125,.06), 0 1px 2px rgba(0,0,0,.04);
  --shadow-md: 0 4px 14px rgba(107,2,125,.08), 0 2px 4px rgba(0,0,0,.04);
  --shadow-lg: 0 8px 28px rgba(107,2,125,.12), 0 4px 8px rgba(0,0,0,.05);
  --shadow-glow: 0 0 22px rgba(124,47,198,0.15);
  --shadow-glow-sm: 0 0 10px rgba(124,47,198,0.12);
}

/* ─── Base ─── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; color-scheme: dark; }
body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.7; color: var(--kaf-text); background: var(--kaf-bg); }
a { text-decoration: none; color: inherit; }

/* ─── Scrollbar ─── */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(147,51,234,.3); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--kaf-purple); }

/* ─── KAF Card ─── */
.kaf-card {
  background: var(--kaf-surface-1);
  border: 1px solid var(--kaf-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  transition: box-shadow .25s var(--ease), border-color .25s var(--ease), transform .25s var(--ease);
}
.kaf-card:hover { box-shadow: var(--shadow-md), 0 0 0 1px var(--kaf-purple-border); border-color: var(--kaf-purple-border); }
.kaf-card-lift:hover { transform: translateY(-2px); }
.kaf-glass { background: rgba(14,11,30,0.7); backdrop-filter: blur(12px); border: 1px solid var(--kaf-border); border-radius: var(--radius); }

/* ─── Buttons ─── */
.kaf-btn {
  display: inline-flex; align-items: center; gap: 8px;
  background: linear-gradient(135deg, var(--kaf-purple) 0%, var(--kaf-purple-deep) 100%);
  color: #fff; font-size: 13.5px; font-weight: 600; padding: 10px 22px;
  border: none; border-radius: var(--radius); cursor: pointer; letter-spacing: .2px;
  transition: all .2s var(--ease);
  box-shadow: 0 4px 14px rgba(147,51,234,.30), inset 0 1px 0 rgba(255,255,255,.1);
  position: relative; overflow: hidden;
}
.kaf-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg,rgba(255,255,255,.08) 0%,transparent 60%); opacity: 0; transition: opacity .2s; }
.kaf-btn:hover:not(:disabled)::before { opacity: 1; }
.kaf-btn:hover:not(:disabled) { box-shadow: 0 6px 22px rgba(147,51,234,.45), var(--shadow-glow-sm); transform: translateY(-1px); }
.kaf-btn:active:not(:disabled) { transform: translateY(0); box-shadow: var(--shadow-sm); }
.kaf-btn:disabled { opacity: .45; cursor: not-allowed; }

.kaf-btn-ghost {
  display: inline-flex; align-items: center; gap: 6px;
  background: transparent; color: var(--kaf-purple-light); font-size: 13px; font-weight: 500;
  padding: 8px 16px; border: 1.5px solid var(--kaf-purple-border); border-radius: var(--radius); cursor: pointer;
  transition: all .2s var(--ease);
}
.kaf-btn-ghost:hover { background: var(--kaf-purple-bg); border-color: var(--kaf-purple); color: var(--kaf-purple-light); }

.kaf-btn-danger {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(239,68,68,0.12); color: #f87171; font-size: 13px; font-weight: 500;
  padding: 8px 16px; border: 1.5px solid rgba(239,68,68,0.25); border-radius: var(--radius); cursor: pointer;
  transition: all .2s var(--ease);
}
.kaf-btn-danger:hover { background: rgba(239,68,68,0.20); border-color: rgba(239,68,68,0.45); }

/* ─── Inputs ─── */
.kaf-input {
  width: 100%; border: 1.5px solid var(--kaf-border-2); border-radius: 8px;
  padding: 9px 13px; font-size: 13.5px; font-family: 'Inter', sans-serif;
  color: var(--kaf-text); background-color: var(--kaf-surface-2); outline: none;
  transition: border-color .2s var(--ease), box-shadow .2s var(--ease), background .2s var(--ease);
}
.kaf-input:focus { border-color: var(--kaf-purple); background-color: var(--kaf-surface-3); box-shadow: 0 0 0 3px rgba(147,51,234,.15); }
.kaf-input::placeholder { color: var(--kaf-muted-2); }

.kaf-select {
  appearance: none; -webkit-appearance: none; padding-right: 34px !important;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239333ea' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
  background-repeat: no-repeat; background-position: right 12px center; background-size: 12px;
}

.kaf-textarea {
  width: 100%; border: 1.5px solid var(--kaf-border-2); border-radius: 8px;
  padding: 9px 13px; font-size: 12.5px; font-family: 'JetBrains Mono', monospace;
  color: #c4b8e8; background: var(--kaf-code-bg); outline: none; resize: vertical;
  transition: border-color .2s var(--ease), box-shadow .2s var(--ease);
}
.kaf-textarea:focus { border-color: var(--kaf-purple); box-shadow: 0 0 0 3px rgba(147,51,234,.12); }

.kaf-label { display: block; font-size: 12px; font-weight: 600; color: var(--kaf-muted); margin-bottom: 5px; letter-spacing: .3px; text-transform: uppercase; }

/* ─── Typography ─── */
.kaf-page-title {
  font-size: 22px; font-weight: 800; letter-spacing: -.4px; line-height: 1.2;
  background: linear-gradient(135deg, #f0e8ff 0%, var(--kaf-purple-light) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.kaf-page-sub { font-size: 13px; color: var(--kaf-muted); margin-top: 5px; }
.kaf-section-head { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.6px; color: var(--kaf-purple-light); padding-bottom: 8px; border-bottom: 1px solid var(--kaf-purple-border); margin-bottom: 16px; }
.kaf-mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }
.kaf-code-inline { background: rgba(147,51,234,.12); color: var(--kaf-purple-light); padding: 2px 7px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 11.5px; border: 1px solid rgba(147,51,234,0.18); }

/* ─── Table ─── */
.kaf-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
.kaf-table thead tr { background: linear-gradient(90deg, rgba(107,2,125,0.60) 0%, rgba(124,47,198,0.55) 45%, rgba(147,51,234,0.40) 100%); }
.kaf-table thead th { background: transparent; color: rgba(255,255,255,0.88); padding: 10px 16px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; text-align: left; white-space: nowrap; border-bottom: 1px solid var(--kaf-purple-border); }
.kaf-table tbody td { padding: 10px 16px; border-bottom: 1px solid var(--kaf-border); color: var(--kaf-text); vertical-align: middle; transition: background .15s var(--ease); }
.kaf-table tbody tr:last-child td { border-bottom: none; }
.kaf-table tbody tr:nth-child(even) td { background: rgba(255,255,255,0.02); }
.kaf-table tbody tr:hover td { background: var(--kaf-purple-bg); }
.kaf-table tbody tr:hover td:first-child { box-shadow: inset 3px 0 0 var(--kaf-purple); }

/* Light mode table override */
:root[data-theme="light"] .kaf-table thead tr { background: linear-gradient(90deg, rgba(107,2,125,0.95) 0%, rgba(124,47,198,0.90) 50%, rgba(147,51,234,0.82) 100%); }
:root[data-theme="light"] .kaf-table thead th { background: transparent; color: #ffffff; }
:root[data-theme="light"] .kaf-table tbody tr:nth-child(even) td { background: rgba(107,2,125,0.025); }

/* ─── Badge ─── */
.kaf-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 9px; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; white-space: nowrap; cursor: default; }
.badge-flagged  { background: rgba(239,68,68,0.15);   color: #f87171;              border: 1px solid rgba(239,68,68,0.3); }
.badge-clear    { background: rgba(16,185,129,0.12);   color: #34d399;              border: 1px solid rgba(16,185,129,0.28); }
.badge-active   { background: rgba(147,51,234,0.20);   color: var(--kaf-purple-light); border: 1px solid var(--kaf-purple-border); box-shadow: 0 0 8px rgba(147,51,234,0.15); }
.badge-inactive { background: rgba(255,255,255,0.04);  color: var(--kaf-muted);     border: 1px solid var(--kaf-border); }
.badge-pending  { background: rgba(100,116,139,0.15);  color: #94a3b8;              border: 1px solid rgba(100,116,139,0.28); }
.badge-processing { background: rgba(59,130,246,0.12); color: #60a5fa;              border: 1px solid rgba(59,130,246,0.28); }
.badge-completed { background: rgba(16,185,129,0.12);  color: #34d399;              border: 1px solid rgba(16,185,129,0.28); }
.badge-failed   { background: rgba(239,68,68,0.15);    color: #f87171;              border: 1px solid rgba(239,68,68,0.3); }

/* ─── Callout ─── */
.kaf-callout { background: var(--kaf-purple-bg); border-left: 3px solid var(--kaf-purple); border-radius: 0 8px 8px 0; padding: 12px 16px; font-size: 13px; color: var(--kaf-text); }
.kaf-callout.warn  { border-left-color: var(--kaf-warning); background: var(--kaf-warning-bg); color: #fcd34d; }
.kaf-callout.error { border-left-color: var(--kaf-error);   background: var(--kaf-error-bg);   color: #fca5a5; }
.kaf-callout.ok    { border-left-color: var(--kaf-success);  background: var(--kaf-success-bg); color: #6ee7b7; }

/* ─── Drop Zone ─── */
.kaf-drop-zone { border: 2px dashed var(--kaf-border-2); border-radius: var(--radius); background: var(--kaf-surface-1); transition: all .2s var(--ease); cursor: pointer; }
.kaf-drop-zone:hover, .kaf-drop-zone.drag-over { border-color: var(--kaf-purple); background: var(--kaf-purple-bg); box-shadow: 0 0 0 4px rgba(147,51,234,.08), var(--shadow-glow-sm); }

/* ─── Sidebar Nav ─── */
.kaf-nav-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 8px; font-size: 13px; font-weight: 500; margin-bottom: 1px; text-decoration: none; color: var(--kaf-muted); border-left: 2px solid transparent; transition: all .2s var(--ease); }
.kaf-nav-item:hover { background: rgba(147,51,234,.12); color: var(--kaf-text); padding-left: 15px; border-left-color: rgba(196,113,237,.4); }
.kaf-nav-item--active { background: rgba(147,51,234,.18); color: #e9d5ff; border-left-color: var(--kaf-purple-light); box-shadow: inset 0 0 12px rgba(147,51,234,.08); }
.kaf-nav-item--active:hover { padding-left: 12px; }

/* ─── Page wrapper ─── */
.kaf-page { padding: 36px 44px; min-height: 100%; }
@media (max-width: 1100px) { .kaf-page { padding: 28px 28px; } }
@media (max-width: 700px)  { .kaf-page { padding: 20px 16px; } }

/* ─── Utilities ─── */
.kaf-spinner { width: 16px; height: 16px; border: 2px solid rgba(147,51,234,.2); border-top-color: var(--kaf-purple); border-radius: 50%; animation: spin .75s linear infinite; }
.kaf-skeleton { background: linear-gradient(90deg, var(--kaf-surface-2) 25%, var(--kaf-surface-3) 50%, var(--kaf-surface-2) 75%); background-size: 400px 100%; animation: shimmer 1.4s ease-in-out infinite; border-radius: 6px; }
.stat-gradient { background: linear-gradient(135deg, var(--kaf-purple-light) 0%, #f0abfc 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.anim-fade-up  { animation: fadeUp  .4s var(--ease) both; }
.anim-fade-in  { animation: fadeIn  .3s var(--ease) both; }
.anim-slide-in { animation: slideInLeft .35s var(--ease) both; }
.stagger > *:nth-child(1) { animation-delay: .04s; }
.stagger > *:nth-child(2) { animation-delay: .08s; }
.stagger > *:nth-child(3) { animation-delay: .12s; }
.stagger > *:nth-child(4) { animation-delay: .16s; }
.stagger > *:nth-child(5) { animation-delay: .20s; }
.stagger > *:nth-child(6) { animation-delay: .24s; }

/* ─── Keyframes ─── */
@keyframes fadeUp    { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
@keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
@keyframes slideInLeft { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }
@keyframes spin      { to { transform: rotate(360deg); } }
@keyframes shimmer   { 0% { background-position:-400px 0; } 100% { background-position:400px 0; } }
@keyframes pulse-glow { 0%,100%{box-shadow:0 0 0 0 rgba(147,51,234,0);} 50%{box-shadow:0 0 0 6px rgba(147,51,234,0.12);} }
```

---

## 4. Design Token Quick-Reference

| Token | Dark value | Light value | Purpose |
|---|---|---|---|
| `--kaf-purple` | `#9333ea` | `#7c2fc6` | Primary brand / interactive |
| `--kaf-purple-hover` | `#a855f7` | `#6B027D` | Hover state |
| `--kaf-purple-light` | `#c084fc` | `#6B027D` | Text on dark, badge color |
| `--kaf-purple-deep` | `#6B027D` | `#4a0160` | Gradient end, logo filter |
| `--kaf-purple-bg` | `rgba(147,51,234,0.10)` | `rgba(124,47,198,0.08)` | Subtle tinted background |
| `--kaf-purple-border` | `rgba(147,51,234,0.28)` | `rgba(124,47,198,0.22)` | Card/badge borders |
| `--kaf-bg` | `#07050f` | `#f7f4fb` | Page background |
| `--kaf-surface-1` | `#0e0b1e` | `#ffffff` | Card background |
| `--kaf-surface-2` | `#16122a` | `#faf6fd` | Input background |
| `--kaf-surface-3` | `#1e1836` | `#f2ebf8` | Input focused background |
| `--kaf-surface-4` | `#261f40` | `#e8dbef` | Deeper surface |
| `--kaf-text` | `#e2d8f5` | `#2e1a3a` | Primary text |
| `--kaf-muted` | `#8a78a8` | `#6b5a7a` | Secondary/label text |
| `--kaf-muted-2` | `#564d6e` | `#9a88ab` | Tertiary/disabled text |
| `--kaf-border` | `rgba(255,255,255,0.07)` | `rgba(107,2,125,0.10)` | Subtle dividers |
| `--kaf-border-2` | `rgba(255,255,255,0.12)` | `rgba(107,2,125,0.18)` | Input/card borders |
| `--kaf-success` | `#10b981` | `#059669` | Green / ok |
| `--kaf-warning` | `#f59e0b` | `#d97706` | Amber / warning |
| `--kaf-error` | `#ef4444` | `#dc2626` | Red / error |
| `--kaf-info` | `#3b82f6` | `#2563eb` | Blue / info |
| `--radius` | `12px` | same | Standard border radius |
| `--ease` | `cubic-bezier(.4,0,.2,1)` | same | Standard easing |

---

## 5. Reusable Components API

### `<PageHeader>`
```tsx
import PageHeader from '../components/PageHeader';
import { LayoutDashboard } from 'lucide-react';

<PageHeader
  icon={LayoutDashboard}           // required — any LucideIcon
  title="Page Title"               // required — string or ReactNode
  subtitle="Optional description"  // optional
  actions={                        // optional — rendered right-aligned
    <button className="kaf-btn-ghost">Action</button>
  }
/>
```

### `<Badge>`
```tsx
import Badge from '../components/Badge';

// All 12 variants:
<Badge variant="active">Active</Badge>
<Badge variant="inactive">Inactive</Badge>
<Badge variant="pending">Pending</Badge>
<Badge variant="processing">Processing</Badge>
<Badge variant="completed">Completed</Badge>
<Badge variant="failed">Failed</Badge>
<Badge variant="flagged">Flagged</Badge>
<Badge variant="clear">Clear</Badge>
// Additional variants: terrorism | prosecution | classA | classD
```

### `<UserGuide>` (help modal)
```tsx
import UserGuide from '../components/UserGuide';
import type { GuideSection } from '../components/UserGuide';

const sections: GuideSection[] = [
  {
    title: 'Overview',
    image: '/user-guide/MyPage.png',  // place screenshot in /public/user-guide/
    body: (
      <div className="kaf-guide-body">
        <h4>Section heading</h4>
        <p>Description text.</p>
        <ul><li><strong>Item</strong> — explanation.</li></ul>
      </div>
    ),
  },
];

// Typically placed in PageHeader actions slot:
<PageHeader
  icon={SomeIcon}
  title="My Page"
  actions={<UserGuide pageTitle="My Page" sections={sections} />}
/>
```

### `<ProtectedRoute>`
```tsx
import ProtectedRoute from '../components/ProtectedRoute';

// Any authenticated user:
<ProtectedRoute><MyPage /></ProtectedRoute>

// Permission-gated:
<ProtectedRoute permission="permViewDashboard"><MyPage /></ProtectedRoute>

// Superuser only:
<ProtectedRoute superuserOnly><AdminPage /></ProtectedRoute>
```

---

## 6. Auth & Theme Hooks

```tsx
import { useAuth } from '../lib/auth';

const { user, login, logout, has, loading } = useAuth();

// user: UserDto | null
// loading: true while session is restoring on mount
// has('permViewDashboard') → true for superusers + users with that flag

// UserDto shape:
// { id, username, email, fullName, isSuperuser, isActive, mustChangePassword,
//   permViewDashboard, permViewAuditLog, permViewFlaggedRecords,
//   permRunAmlCheck, permRunBatchCheck, permViewLists, permManageLists, permUploadLists }
```

```tsx
import { useTheme } from '../lib/theme';

const { theme, toggle } = useTheme();
// theme: 'dark' | 'light'
const isLight = theme === 'light';

// Theme-aware inline style pattern:
style={{ color: isLight ? 'rgba(107,2,125,0.55)' : 'rgba(192,132,252,0.55)' }}
```

---

## 7. Framer Motion Conventions

```ts
// ── Page entrance (wrap the entire page return) ──────────────────
initial={{ opacity: 0, y: 12 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}

// ── Header-only entrance (slightly faster) ───────────────────────
initial={{ opacity: 0, y: -8 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.28 }}

// ── Stagger parent (grid of cards) ───────────────────────────────
const stagger: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.06 } },
};
// Usage: <motion.div variants={stagger} initial="hidden" animate="show">

// ── Stagger child (individual card) ──────────────────────────────
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
};
// Usage: <motion.div variants={item} className="kaf-card">

// ── Card hover lift ───────────────────────────────────────────────
whileHover={{ y: -2, transition: { duration: 0.18 } }}

// ── Logo / image hover scale ──────────────────────────────────────
whileHover={{ scale: 1.08 }}
transition={{ type: 'spring', stiffness: 400, damping: 20 }}

// ── Sidebar section slide-in ──────────────────────────────────────
initial={{ opacity: 0, x: -10 }}
animate={{ opacity: 1, x: 0 }}
transition={{ delay: 0.1 + index * 0.06, duration: 0.3 }}

// ── AnimatePresence (route transitions, modals, conditional UI) ───
<AnimatePresence mode="wait">
  <motion.div key={uniqueKey} initial={…} animate={…} exit={{ opacity: 0, y: -6 }}>
```

---

## 8. Inline Style Patterns (no CSS class)

These patterns are used throughout the app via `style={{}}` — not covered by CSS classes:

```ts
// ── Standard card padding ─────────────────────────────────────────
style={{ padding: '20px 24px' }}

// ── Stat card icon container (accent = any hex color) ─────────────
style={{
  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
  background: `linear-gradient(135deg, ${accent}33 0%, ${accent}16 100%)`,
  border: `1px solid ${accent}30`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: `0 4px 10px ${accent}22`,
}}

// ── Stat card value text ──────────────────────────────────────────
style={{ fontSize: 20, fontWeight: 800, color: 'var(--kaf-dark)', letterSpacing: '-.4px', lineHeight: 1.1 }}

// ── Upper-case section label (not kaf-label, used inside cards) ───
style={{ fontSize: 10, color: 'var(--kaf-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.7px' }}

// ── Monospace meta text (timestamps, IDs) ─────────────────────────
style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--kaf-muted-2)' }}

// ── Inline type tag (colored pill, no Badge component) ───────────
// meta = { color: '#60a5fa', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)' }
style={{
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
  background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
}}

// ── Page max-width container (some pages use instead of kaf-page) ─
style={{ padding: '32px 36px', maxWidth: 1280, margin: '0 auto' }}

// ── Modal backdrop ────────────────────────────────────────────────
style={{
  position: 'fixed', inset: 0, zIndex: 50,
  background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
}}

// ── Modal panel ───────────────────────────────────────────────────
style={{
  background: 'var(--kaf-surface-1)',
  border: '1px solid var(--kaf-border-2)',
  borderRadius: 16, width: '100%', maxWidth: 560,
  boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
  maxHeight: '90vh', overflowY: 'auto',
}}
```

---

## 9. Page Template A — Stat-Card Dashboard

Complete compilable TSX. Copy, rename, replace data.

```tsx
import { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { LayoutDashboard, Users, TrendingUp, AlertCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const stagger: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
};

function StatCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) {
  return (
    <motion.div
      variants={item}
      whileHover={{ y: -2, transition: { duration: 0.18 } }}
      className="kaf-card"
      style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: `linear-gradient(135deg, ${accent}33 0%, ${accent}16 100%)`,
        border: `1px solid ${accent}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 4px 10px ${accent}22`,
      }}>
        <Icon size={16} color={accent} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 10, color: 'var(--kaf-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.7px', lineHeight: 1.25 }}>
          {label}
        </p>
        <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--kaf-dark)', letterSpacing: '-.4px', lineHeight: 1.1, marginTop: 2 }}>
          {value}
        </p>
        {sub && <p style={{ fontSize: 10.5, color: 'var(--kaf-muted-2)', marginTop: 2 }}>{sub}</p>}
      </div>
    </motion.div>
  );
}

export default function MyDashboardPage() {
  const [loading] = useState(false);

  return (
    <div className="kaf-page">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <PageHeader
          icon={LayoutDashboard}
          title="Dashboard"
          subtitle="System overview"
        />
      </motion.div>

      {/* Stat strip */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="kaf-card" style={{ padding: 16, height: 72 }}>
              <div className="kaf-skeleton" style={{ height: 11, width: '55%', marginBottom: 9 }} />
              <div className="kaf-skeleton" style={{ height: 22, width: '38%' }} />
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          variants={stagger} initial="hidden" animate="show"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}
        >
          <StatCard icon={Users}       label="Total Members"  value="—" sub="All active members"  accent="#10b981" />
          <StatCard icon={TrendingUp}  label="Active Policies" value="—" sub="Current period"     accent="#9333ea" />
          <StatCard icon={AlertCircle} label="Pending Cases"  value="—" sub="Awaiting review"     accent="#f59e0b" />
        </motion.div>
      )}

      <div className="kaf-card" style={{ padding: '20px 24px' }}>
        <p className="kaf-section-head">Recent Activity</p>
        <p style={{ color: 'var(--kaf-muted)', fontSize: 13 }}>No activity yet.</p>
      </div>
    </div>
  );
}
```

---

## 10. Page Template B — Filterable Table

Complete compilable TSX for a searchable, paginated table page.

```tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';

interface Row {
  id: number;
  name: string;
  status: 'active' | 'inactive' | 'pending';
  date: string;
  note: string;
}

const MOCK_ROWS: Row[] = [
  { id: 1, name: 'Ahmed Hassan',   status: 'active',   date: '2026-07-29', note: 'Initial enrollment' },
  { id: 2, name: 'Sara Mohamed',   status: 'pending',  date: '2026-07-28', note: 'Awaiting documents' },
  { id: 3, name: 'Khaled Ibrahim', status: 'inactive', date: '2026-07-27', note: 'Resigned' },
];
const PAGE_SIZE = 25;

export default function MyTablePage() {
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]               = useState(0);
  const [loading]                     = useState(false);

  const filtered = MOCK_ROWS.filter((r) => {
    const q = search.toLowerCase();
    return (
      (!q || r.name.toLowerCase().includes(q) || r.note.toLowerCase().includes(q)) &&
      (!statusFilter || r.status === statusFilter)
    );
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows   = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="kaf-page">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <PageHeader
          icon={ClipboardList}
          title="Records"
          subtitle="Browse and filter all records."
          actions={
            <button className="kaf-btn-ghost" onClick={() => {}}>
              <RefreshCw size={13} /> Refresh
            </button>
          }
        />
      </motion.div>

      {/* Filter bar */}
      <div className="kaf-card" style={{ padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="kaf-input" style={{ maxWidth: 260 }}
          placeholder="Search…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        />
        <select
          className="kaf-input kaf-select" style={{ maxWidth: 160 }}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      <div className="kaf-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="kaf-table">
            <thead>
              <tr><th>#</th><th>Name</th><th>Status</th><th>Date</th><th>Note</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--kaf-muted)' }}>
                  <span className="kaf-spinner" style={{ display: 'inline-block', marginRight: 8 }} />Loading…
                </td></tr>
              ) : pageRows.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--kaf-muted)' }}>No records found.</td></tr>
              ) : pageRows.map((row) => (
                <tr key={row.id}>
                  <td style={{ color: 'var(--kaf-muted-2)', fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{row.id}</td>
                  <td style={{ fontWeight: 600 }}>{row.name}</td>
                  <td><Badge variant={row.status}>{row.status}</Badge></td>
                  <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{row.date}</td>
                  <td style={{ color: 'var(--kaf-muted)' }}>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--kaf-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--kaf-muted)' }}>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button className="kaf-btn-ghost" style={{ padding: '5px 10px' }} onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
              <ChevronLeft size={13} />
            </button>
            <span style={{ fontSize: 12, color: 'var(--kaf-muted)' }}>Page {page + 1} / {totalPages}</span>
            <button className="kaf-btn-ghost" style={{ padding: '5px 10px' }} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 11. Page Template C — Form + Results

Complete compilable TSX for a submit-form with result display.

```tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle2, AlertCircle, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';

export default function MyFormPage() {
  const [form, setForm]     = useState({ field1: '', field2: '', field3: '' });
  const [result, setResult] = useState<'ok' | 'error' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const hasInput = Object.values(form).some(Boolean);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasInput) { setError('Enter at least one field.'); return; }
    setError(''); setResult(null); setLoading(true);
    // TODO: replace with real API call
    await new Promise((r) => setTimeout(r, 600));
    setResult('ok');
    setLoading(false);
  };

  const reset = () => { setForm({ field1: '', field2: '', field3: '' }); setResult(null); setError(''); };

  return (
    <div className="kaf-page">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <PageHeader
          icon={Search}
          title="Search"
          subtitle="Submit a query and view results."
          actions={hasInput || result ? (
            <button className="kaf-btn-ghost" onClick={reset}><X size={13} /> Clear</button>
          ) : undefined}
        />
      </motion.div>

      {/* Form card */}
      <div className="kaf-card" style={{ padding: '20px 24px', marginBottom: 20 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 18 }}>
            <div>
              <label className="kaf-label">Field One</label>
              <input className="kaf-input" placeholder="Value…" value={form.field1} onChange={(e) => set('field1')(e.target.value)} />
            </div>
            <div>
              <label className="kaf-label">Field Two</label>
              <input className="kaf-input" placeholder="Value…" value={form.field2} onChange={(e) => set('field2')(e.target.value)} />
            </div>
            <div>
              <label className="kaf-label">Field Three</label>
              <input className="kaf-input" placeholder="Value…" value={form.field3} onChange={(e) => set('field3')(e.target.value)} />
            </div>
          </div>
          {error && <div className="kaf-callout error" style={{ marginBottom: 14 }}>{error}</div>}
          <button type="submit" className="kaf-btn" disabled={loading}>
            {loading
              ? <><span className="kaf-spinner" style={{ display: 'inline-block' }} /> Searching…</>
              : <><Search size={14} /> Search</>}
          </button>
        </form>
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className={`kaf-callout ${result === 'ok' ? 'ok' : 'error'}`}
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
          >
            {result === 'ok'
              ? <><CheckCircle2 size={16} /> No issues detected.</>
              : <><AlertCircle size={16} /> An issue was detected. Review required.</>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## 12. Page Template D — CRUD Modal Page

Complete compilable TSX for a table + add/edit/delete modal workflow.

```tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { UserCog, UserPlus, Pencil, Trash2, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';

interface Item { id: number; name: string; email: string; status: 'active' | 'inactive'; }
type DialogMode = { type: 'closed' } | { type: 'create' } | { type: 'edit'; item: Item };

const MOCK_ITEMS: Item[] = [
  { id: 1, name: 'Ahmed Hassan',   email: 'ahmed@example.com', status: 'active'   },
  { id: 2, name: 'Sara Mohamed',   email: 'sara@example.com',  status: 'inactive' },
];

export default function MyCrudPage() {
  const [items, setItems]   = useState<Item[]>(MOCK_ITEMS);
  const [dialog, setDialog] = useState<DialogMode>({ type: 'closed' });
  const [form, setForm]     = useState({ name: '', email: '' });
  const [confirmDelete, setConfirmDelete] = useState<Item | null>(null);

  const openCreate = () => { setForm({ name: '', email: '' }); setDialog({ type: 'create' }); };
  const openEdit   = (item: Item) => { setForm({ name: item.name, email: item.email }); setDialog({ type: 'edit', item }); };
  const close      = () => setDialog({ type: 'closed' });

  const handleSave = () => {
    if (dialog.type === 'create') {
      setItems((prev) => [...prev, { id: Date.now(), name: form.name, email: form.email, status: 'active' }]);
    } else if (dialog.type === 'edit') {
      setItems((prev) => prev.map((i) => i.id === dialog.item.id ? { ...i, ...form } : i));
    }
    close();
  };

  const handleDelete = (item: Item) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setConfirmDelete(null);
  };

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1280, margin: '0 auto' }}>
      <PageHeader
        icon={UserCog}
        title="My Items"
        subtitle="Manage items."
        actions={
          <button className="kaf-btn" onClick={openCreate}>
            <UserPlus size={14} /> Add Item
          </button>
        }
      />

      <div className="kaf-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="kaf-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td style={{ color: 'var(--kaf-muted)', fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>{item.email}</td>
                  <td><Badge variant={item.status}>{item.status}</Badge></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="kaf-btn-ghost" style={{ padding: '5px 10px' }} onClick={() => openEdit(item)}>
                        <Pencil size={12} />
                      </button>
                      <button className="kaf-btn-danger" style={{ padding: '5px 10px' }} onClick={() => setConfirmDelete(item)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit modal */}
      {dialog.type !== 'closed' && createPortal(
        <AnimatePresence>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={(e) => { if (e.target === e.currentTarget) close(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              style={{ background: 'var(--kaf-surface-1)', border: '1px solid var(--kaf-border-2)', borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}
            >
              {/* Header */}
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--kaf-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--kaf-dark)' }}>
                  {dialog.type === 'create' ? 'Add Item' : 'Edit Item'}
                </h2>
                <button onClick={close} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--kaf-muted)', display: 'inline-flex', padding: 4 }}>
                  <X size={16} />
                </button>
              </div>
              {/* Body */}
              <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="kaf-label">Name</label>
                  <input className="kaf-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" />
                </div>
                <div>
                  <label className="kaf-label">Email</label>
                  <input className="kaf-input" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
                </div>
              </div>
              {/* Footer */}
              <div style={{ padding: '14px 22px', borderTop: '1px solid var(--kaf-border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="kaf-btn-ghost" onClick={close}>Cancel</button>
                <button className="kaf-btn" onClick={handleSave}>Save</button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Delete confirm modal */}
      {confirmDelete && createPortal(
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'var(--kaf-surface-1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 14, padding: '22px 24px', maxWidth: 380, width: '100%', boxShadow: '0 16px 40px rgba(0,0,0,0.4)' }}
          >
            <p style={{ fontWeight: 700, marginBottom: 8, color: 'var(--kaf-dark)' }}>Delete "{confirmDelete.name}"?</p>
            <p style={{ color: 'var(--kaf-muted)', fontSize: 13, marginBottom: 18 }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="kaf-btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="kaf-btn-danger" onClick={() => handleDelete(confirmDelete)}>Delete</button>
            </div>
          </motion.div>
        </motion.div>,
        document.body
      )}
    </div>
  );
}
```

---

## 13. Adding a New Page — Checklist

When building a new Rubix page from scratch:

1. Create `src/pages/MyPage.tsx` using one of the templates above as starting point
2. Add route in `src/App.tsx`:
   ```tsx
   <Route path="my-page" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
   ```
3. Add nav item in `src/components/Layout.tsx` `ALL_SECTIONS` array:
   ```ts
   { to: '/my-page', label: 'My Page', icon: SomeIcon }
   ```
4. If page needs a permission gate, add `permission="permXxx"` to `<ProtectedRoute>` and add the nav item's `permission` field
5. Use `className="kaf-page"` as the root wrapper (handles padding + responsive)
6. Start with `<PageHeader>` as the first child
7. Place content in `.kaf-card` containers
8. All colors must use `var(--kaf-*)` tokens — never hardcode light/dark hex directly in new pages
