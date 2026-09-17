import { Chip } from '@mui/material';
import type { StockStatus } from '../types';
import { diane } from '../theme';

const config: Record<StockStatus, { label: string; bg: string; color: string }> = {
  OK: { label: 'In Stock', bg: '#E7F7EE', color: diane.green },
  ALERTE: { label: 'Low Stock', bg: '#FEF3E6', color: diane.orange },
  RUPTURE: { label: 'Out of Stock', bg: '#FCEAEA', color: diane.red },
};

export default function StatusBadge({ status }: { status: StockStatus }) {
  const c = config[status];
  return <Chip label={c.label} size="small" sx={{ bgcolor: c.bg, color: c.color, fontWeight: 700, fontSize: 12 }} />;
}
