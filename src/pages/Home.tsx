import { motion } from 'framer-motion';
import { LayoutDashboard } from 'lucide-react';
import PageHeader from '../components/PageHeader';

export default function Home() {
  return (
    <motion.div
      className="kaf-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
    >
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        subtitle="Rubix Pension System — content coming soon."
      />

      <div className="kaf-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--kaf-muted)', fontSize: 14 }}>
          This area is reserved for Rubix dashboard modules.
        </p>
      </div>
    </motion.div>
  );
}
