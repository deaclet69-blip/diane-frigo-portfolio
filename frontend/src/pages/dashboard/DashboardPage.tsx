import { useEffect, useState } from 'react';
import { Box, Typography, Stack, Paper, ToggleButtonGroup, ToggleButton, LinearProgress } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BarChartIcon from '@mui/icons-material/BarChart';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { api } from '../../services/api';
import KpiCard from '../../components/KpiCard';
import { diane } from '../../theme';
import type { DashboardSummary, MonthlyChartPoint } from '../../types';
import { getCurrentUser } from '../../services/auth';
import { getMonthlyChart } from '../../services/finances';
import AiSummaryCard from '../../components/AiSummaryCard';

function formatFcfa(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} FCFA`;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [period, setPeriod] = useState<'month' | 'all'>('month');
  const [chartData, setChartData] = useState<MonthlyChartPoint[]>([]);
  const user = getCurrentUser();

  useEffect(() => {
    api.get<DashboardSummary>(`/dashboard?period=${period}`).then((res) => setSummary(res.data));
  }, [period]);

  useEffect(() => {
    getMonthlyChart(12).then(setChartData);
  }, []);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Bonjour {user?.email?.split('@')[0] ?? ''} 👋
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Voici ce qui se passe aujourd'hui dans votre activité.
          </Typography>
        </Box>
        <ToggleButtonGroup size="small" value={period} exclusive onChange={(_, v) => v && setPeriod(v)}>
          <ToggleButton value="month">Ce mois</ToggleButton>
          <ToggleButton value="all">Depuis le début</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }} useFlexGap flexWrap="wrap">
        <KpiCard
          icon={<TrendingUpIcon fontSize="small" />}
          iconBg={diane.blue}
          label={period === 'month' ? 'CA du mois' : 'CA total'}
          value={summary ? formatFcfa(summary.revenue) : '…'}
        />
        <KpiCard
          icon={<HomeIcon fontSize="small" />}
          iconBg={diane.green}
          label="Bénéfice brut"
          value={summary ? formatFcfa(summary.grossProfit) : '…'}
          sublabel={summary && summary.revenue > 0 ? `${((summary.grossProfit / summary.revenue) * 100).toFixed(1)}% de marge` : undefined}
        />
        <KpiCard
          icon={<AccountBalanceIcon fontSize="small" />}
          iconBg={diane.orange}
          label={period === 'month' ? 'Charges du mois' : 'Charges totales'}
          value={summary ? formatFcfa(summary.operatingExpenses) : '…'}
        />
        <KpiCard
          icon={<HomeIcon fontSize="small" />}
          iconBg={summary && summary.netResult >= 0 ? diane.green : diane.red}
          label="Résultat net"
          value={summary ? formatFcfa(summary.netResult) : '…'}
          sublabel={summary && summary.netResult < 0 ? 'Déficit' : 'Excédent'}
          sublabelColor={summary && summary.netResult >= 0 ? diane.green : diane.red}
        />
        <KpiCard
          icon={<Inventory2Icon fontSize="small" />}
          iconBg={diane.navy}
          label="Stock actuel"
          value={summary ? `${summary.currentStockCartons.toLocaleString('fr-FR')} cartons` : '…'}
          sublabel={summary ? formatFcfa(summary.currentStockValue) : undefined}
        />
        <KpiCard
          icon={<BarChartIcon fontSize="small" />}
          iconBg={diane.red}
          label="Alertes stock"
          value={summary ? String(summary.lowStockAlertsCount) : '…'}
          sublabel={summary ? `dont ${summary.ruptureCount} en rupture` : undefined}
        />
      </Stack>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Paper sx={{ p: 3, flex: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>CA vs Charges (12 derniers mois)</Typography>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatFcfa(v)} />
              <Legend />
              <Line type="monotone" dataKey="ca" name="CA" stroke={diane.green} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="charges" name="Charges" stroke={diane.red} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Paper>

        <Paper sx={{ p: 3, flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            Objectif de récupération
          </Typography>
          <Typography variant="caption" color="text.secondary">Résultat cumulé depuis le début</Typography>
          <Typography variant="h5" fontWeight={700} sx={{ color: summary && summary.netResult >= 0 ? diane.green : diane.red, mb: 1 }}>
            {summary ? formatFcfa(summary.recoveryAmountRemaining > 0 ? -summary.recoveryAmountRemaining : 0) : '…'}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={summary?.recoveryProgressPercent ?? 0}
            sx={{
              height: 10, borderRadius: 5, mb: 1, bgcolor: '#FCEAEA',
              '& .MuiLinearProgress-bar': { bgcolor: diane.red },
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {summary ? `${summary.recoveryProgressPercent.toFixed(1)}% — voir le détail dans Finances` : ''}
          </Typography>
        </Paper>
      </Stack>

      <AiSummaryCard />
    </Box>
  );
}
