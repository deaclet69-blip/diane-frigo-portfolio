import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Stack, Chip, List, ListItem, ListItemIcon, ListItemText,
  LinearProgress, CircularProgress, Button, Divider,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SavingsIcon from '@mui/icons-material/Savings';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Inventory2Icon2 from '@mui/icons-material/MoveToInbox';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { getFullDashboard } from '../../services/dashboard';
import type { FullDashboard } from '../../types';
import { getCurrentUser } from '../../services/auth';
import { diane } from '../../theme';

function fcfa(v: number) {
  return `${Math.round(v).toLocaleString('fr-FR')} FCFA`;
}
function fcfaShort(v: number) {
  return `${Math.round(v).toLocaleString('fr-FR')}`;
}

const donutColors = [diane.indigo, diane.blue, diane.orange, '#C4C9E8'];

const alertStyle: Record<string, { bg: string; color: string; icon: JSX.Element }> = {
  warning: { bg: diane.orangeLight, color: diane.orange, icon: <WarningAmberIcon fontSize="small" /> },
  error: { bg: diane.redLight, color: diane.red, icon: <Inventory2OutlinedIcon fontSize="small" /> },
  info: { bg: diane.blueLight, color: diane.blue, icon: <AccountBalanceWalletOutlinedIcon fontSize="small" /> },
};

const activityIcon: Record<string, JSX.Element> = {
  sale: <ShoppingCartIcon fontSize="small" />,
  stock: <Inventory2Icon2 fontSize="small" />,
  expense: <PaymentsOutlinedIcon fontSize="small" />,
};
const activityColor: Record<string, string> = { sale: diane.blue, stock: diane.green, expense: diane.red };

export default function DashboardPage() {
  const [data, setData] = useState<FullDashboard | null>(null);
  const user = getCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    getFullDashboard().then(setData);
  }, []);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Tableau de bord</Typography>
          <Typography variant="body2" color="text.secondary">Vue d'ensemble de votre activité</Typography>
        </Box>
      </Stack>

      {/* Ligne 1 — 5 cartes KPI (grille fixe pour rester sur une seule ligne en desktop) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' },
          gap: 2,
          mb: 2.5,
        }}
      >
        <KpiCard
          icon={<TrendingUpIcon />} iconBg={diane.blue} label="Chiffre d'affaires" sublabel="Aujourd'hui"
          value={data ? fcfa(data.kpis.revenueToday) : '…'}
          change={data?.kpis.revenueChangePercent ?? null}
        />
        <KpiCard
          icon={<SavingsIcon />} iconBg={diane.green} label="Bénéfice net" sublabel="Aujourd'hui"
          value={data ? fcfa(data.kpis.profitToday) : '…'}
          change={data?.kpis.profitChangePercent ?? null}
        />
        <KpiCard
          icon={<Inventory2Icon />} iconBg={diane.purple} label="Stock actuel" sublabel="Valeur du stock"
          value={data ? `${data.kpis.stockCartons.toLocaleString('fr-FR')} cartons` : '…'}
          footer={data ? fcfa(data.kpis.stockValue) : undefined}
        />
        <KpiCard
          icon={<PersonOutlineIcon />} iconBg={diane.orange} label="Dépôts clients" sublabel="Stock en dépôt"
          value={data ? `${data.kpis.depositsCartons.toLocaleString('fr-FR')} cartons` : '…'}
          footer={data ? fcfa(data.kpis.depositsValue) : undefined}
        />
        <KpiCard
          icon={<CreditCardIcon />} iconBg={diane.red} label="Créances clients" sublabel="Montant dû"
          value={data ? fcfa(data.kpis.receivablesTotal) : '…'}
          footer={data ? `${data.kpis.receivablesCount} client(s) concerné(s)` : undefined}
        />
      </Box>

      {/* Ligne 2 — Évolution CA / Répartition ventes / Alertes */}
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} sx={{ mb: 2.5 }}>
        <Paper sx={{ p: 3, flex: 1.6 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={700}>Évolution du chiffre d'affaires</Typography>
            <Chip label="7 derniers jours" size="small" sx={{ bgcolor: diane.bg, fontWeight: 600 }} />
          </Stack>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={data?.revenueTrend ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis
                dataKey="date" fontSize={11}
                tickFormatter={(d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
              />
              <YAxis fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => fcfa(v)} labelFormatter={(d) => new Date(d).toLocaleDateString('fr-FR')} />
              <Line type="monotone" dataKey="revenue" stroke={diane.indigo} strokeWidth={3} dot={{ r: 4, fill: diane.indigo }} />
            </LineChart>
          </ResponsiveContainer>
        </Paper>

        <Paper sx={{ p: 3, flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Répartition des ventes par produit</Typography>
          {data && data.salesByProduct.length > 0 ? (
            <>
              <Box sx={{ position: 'relative', height: 170 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.salesByProduct} dataKey="value" nameKey="name"
                      innerRadius={55} outerRadius={80} paddingAngle={2}
                    >
                      {data.salesByProduct.map((_, i) => (
                        <Cell key={i} fill={donutColors[i % donutColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => fcfa(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Total</Typography>
                  <Typography variant="subtitle2" fontWeight={800}>
                    {fcfaShort(data.salesByProduct.reduce((a, p) => a + p.value, 0))}
                  </Typography>
                </Box>
              </Box>
              <Stack spacing={0.75} sx={{ mt: 1, mb: 1.5 }}>
                {data.salesByProduct.slice(0, 4).map((p, i) => (
                  <Stack key={p.name} direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: donutColors[i % donutColors.length] }} />
                    <Typography variant="caption" sx={{ flexGrow: 1 }} noWrap>{p.name}</Typography>
                    <Typography variant="caption" fontWeight={700}>{p.percent.toFixed(0)}%</Typography>
                  </Stack>
                ))}
              </Stack>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Pas encore de ventes cette semaine.</Typography>
          )}
          <Typography
            variant="body2" fontWeight={700} sx={{ color: diane.indigo, cursor: 'pointer' }}
            onClick={() => navigate('/rapports')}
          >
            Voir le rapport complet →
          </Typography>
        </Paper>

        <Paper sx={{ p: 3, flex: 1 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={700}>Alertes et notifications</Typography>
            <Typography variant="body2" fontWeight={700} sx={{ color: diane.indigo, cursor: 'pointer' }}>
              Tout voir
            </Typography>
          </Stack>
          <List dense disablePadding>
            {(data?.alerts.length ?? 0) === 0 && (
              <Typography variant="body2" color="text.secondary">Tout va bien, aucune alerte.</Typography>
            )}
            {data?.alerts.map((a, i) => {
              const s = alertStyle[a.type] ?? alertStyle.info;
              return (
                <ListItem key={i} disableGutters sx={{ py: 0.75 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {s.icon}
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="body2" fontWeight={700}>{a.title}</Typography>}
                    secondary={a.detail}
                  />
                </ListItem>
              );
            })}
          </List>
        </Paper>
      </Stack>

      {/* Ligne 3 — Activité récente / Top produits / Stock par catégorie */}
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} sx={{ mb: 2.5 }}>
        <Paper sx={{ p: 3, flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Activité récente</Typography>
          <List dense disablePadding>
            {data?.recentActivity.map((a, i) => (
              <ListItem key={i} disableGutters sx={{ py: 0.75 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Box sx={{
                    width: 32, height: 32, borderRadius: 2,
                    bgcolor: `${activityColor[a.type]}1A`, color: activityColor[a.type],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {activityIcon[a.type] ?? <ReceiptLongIcon fontSize="small" />}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={<Typography variant="body2" fontWeight={700}>{a.label}</Typography>}
                  secondary={`${a.sublabel} · ${a.timeAgo}`}
                />
                {a.amount > 0 && (
                  <Typography variant="body2" fontWeight={700} sx={{ color: a.type === 'expense' ? diane.red : diane.green }}>
                    {fcfa(a.amount)}
                  </Typography>
                )}
              </ListItem>
            ))}
            {(data?.recentActivity.length ?? 0) === 0 && (
              <Typography variant="body2" color="text.secondary">Aucune activité récente.</Typography>
            )}
          </List>
        </Paper>

        <Paper sx={{ p: 3, flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Top produits par marge</Typography>
          <Stack spacing={1.5} sx={{ mb: 1.5 }}>
            {data?.topProductsByMargin.map((p) => (
              <Box key={p.productName}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" fontWeight={600}>{p.productName}</Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ color: diane.green }}>{fcfa(p.margin)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                  <LinearProgress
                    variant="determinate" value={Math.min(100, p.marginPercent)}
                    sx={{ flexGrow: 1, height: 6, borderRadius: 3, bgcolor: diane.bg, '& .MuiLinearProgress-bar': { bgcolor: diane.indigo } }}
                  />
                  <Typography variant="caption" color="text.secondary">{p.marginPercent.toFixed(0)}%</Typography>
                </Stack>
              </Box>
            ))}
            {(data?.topProductsByMargin.length ?? 0) === 0 && (
              <Typography variant="body2" color="text.secondary">Pas encore de ventes.</Typography>
            )}
          </Stack>
          <Typography
            variant="body2" fontWeight={700} sx={{ color: diane.indigo, cursor: 'pointer' }}
            onClick={() => navigate('/rapports')}
          >
            Voir tous les produits →
          </Typography>
        </Paper>

        <Paper sx={{ p: 3, flex: 1 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={700}>Stock par catégorie</Typography>
            <Typography
              variant="body2" fontWeight={700} sx={{ color: diane.indigo, cursor: 'pointer' }}
              onClick={() => navigate('/stock')}
            >
              Voir tout
            </Typography>
          </Stack>
          <Stack spacing={1.75}>
            {data?.stockByCategory.map((c, i) => (
              <Box key={c.category}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={600}>{c.category}</Typography>
                  <Typography variant="caption" color="text.secondary">{c.cartons} cartons</Typography>
                </Stack>
                <LinearProgress
                  variant="determinate" value={c.percent}
                  sx={{ height: 8, borderRadius: 4, bgcolor: diane.bg, '& .MuiLinearProgress-bar': { bgcolor: donutColors[i % donutColors.length] } }}
                />
              </Box>
            ))}
            {(data?.stockByCategory.length ?? 0) === 0 && (
              <Typography variant="body2" color="text.secondary">Aucun produit en stock.</Typography>
            )}
          </Stack>
        </Paper>
      </Stack>

      {/* Bandeau footer — Résumé financier du mois */}
      <Paper
        sx={{
          p: 3, borderRadius: 3, color: '#fff',
          background: `linear-gradient(120deg, ${diane.navyFooter} 0%, ${diane.indigo} 140%)`,
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={3}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Résumé financier du mois</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
              <Stat label="Chiffre d'affaires" value={data ? fcfa(data.monthlySummary.revenue) : '…'} />
              <Stat label="Total des dépenses" value={data ? fcfa(data.monthlySummary.expenses) : '…'} />
              <Stat label="Bénéfice net" value={data ? fcfa(data.monthlySummary.netProfit) : '…'} color={diane.green} />
              <Stat label="Marge moyenne" value={data ? `${data.monthlySummary.avgMarginPercent.toFixed(0)}%` : '…'} />
            </Stack>
          </Box>

          <Stack direction="row" spacing={3} alignItems="center">
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                variant="determinate"
                value={data ? Math.min(100, Math.max(0, data.monthlySummary.avgMarginPercent * 3)) : 0}
                size={64} thickness={5}
                sx={{ color: diane.green, '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }}
              />
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="caption" fontWeight={800}>
                  {data ? `${Math.min(100, Math.round(data.monthlySummary.avgMarginPercent * 3))}%` : '…'}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/finances')}
              sx={{ bgcolor: '#fff', color: diane.navy, '&:hover': { bgcolor: '#EEE' } }}
            >
              Voir le rapport détaillé
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}

function KpiCard({ icon, iconBg, label, sublabel, value, footer, change }: {
  icon: JSX.Element; iconBg: string; label: string; sublabel?: string; value: string;
  footer?: string; change?: number | null;
}) {
  return (
    <Paper sx={{ p: 2.5, width: '100%', minWidth: 0 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: 2.5, bgcolor: iconBg, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="body2" fontWeight={700} lineHeight={1.2}>{label}</Typography>
          {sublabel && <Typography variant="caption" color="text.secondary">{sublabel}</Typography>}
        </Box>
      </Stack>
      <Typography variant="h6" fontWeight={800}>{value}</Typography>
      {change != null && (
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
          {change >= 0 ? (
            <TrendingUpIcon sx={{ fontSize: 14, color: diane.green }} />
          ) : (
            <TrendingDownIcon sx={{ fontSize: 14, color: diane.red }} />
          )}
          <Typography variant="caption" sx={{ color: change >= 0 ? diane.green : diane.red, fontWeight: 700 }}>
            {change >= 0 ? '+' : ''}{change.toFixed(1)}% vs hier
          </Typography>
        </Stack>
      )}
      {footer && <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>{footer}</Typography>}
    </Paper>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)' }}>{label}</Typography>
      <Typography variant="subtitle1" fontWeight={800} sx={{ color: color ?? '#fff' }}>{value}</Typography>
    </Box>
  );
}
