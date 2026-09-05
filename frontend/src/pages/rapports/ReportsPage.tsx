import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Stack,
  ToggleButtonGroup, ToggleButton, TextField, Button, CircularProgress,
  Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import {
  getProductsReport, getCustomersReport, getExpensesReport, getStockEntriesReport,
  getTraceabilityReport, getVelocityReport, VelocityRow,
} from '../../services/reports';
import type { StockEntryReportRow, TraceabilityGranularity, TraceabilityReport } from '../../types';
import { diane } from '../../theme';

import { usd } from '../../utils/currency';

function formatFcfa(value: number) {
  return usd(Math.round(value));
}

const granularityLabels: Record<TraceabilityGranularity, string> = {
  day: 'Day', week: 'Week', month: 'Month', year: 'Year',
};

function TraceabilitySection() {
  const [granularity, setGranularity] = useState<TraceabilityGranularity>('month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  // Valeur tapée dans le champ de recherche précise — son FORMAT change selon
  // la vue active (date complète / date complète aussi pour semaine / mois
  // "YYYY-MM" / année seule). Demande utilisateur : rechercher directement
  // un jour, une semaine, un mois ou une année précis.
  const [searchValue, setSearchValue] = useState('');
  const [data, setData] = useState<TraceabilityReport | null>(null);
  const [loading, setLoading] = useState(false);

  function reload(overrideFrom?: string, overrideTo?: string) {
    setLoading(true);
    getTraceabilityReport(granularity, overrideFrom ?? from ?? undefined, overrideTo ?? to ?? undefined)
      .then(setData)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setSearchValue('');
    setFrom('');
    setTo('');
    reload('', '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [granularity]);

  function applySearch(value: string) {
    setSearchValue(value);
    if (!value) {
      setFrom(''); setTo('');
      reload('', '');
      return;
    }
    let f = '';
    let t = '';
    if (granularity === 'day') {
      f = value; t = value;
    } else if (granularity === 'week') {
      // `value` = n'importe quelle date de la semaine choisie → on calcule
      // lundi (début) et dimanche (fin), comme dans la feuille Excel.
      const d = new Date(value + 'T00:00:00');
      const dayOfWeek = (d.getDay() + 6) % 7; // 0 = lundi
      const monday = new Date(d);
      monday.setDate(d.getDate() - dayOfWeek);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      f = monday.toISOString().slice(0, 10);
      t = sunday.toISOString().slice(0, 10);
    } else if (granularity === 'month') {
      // `value` au format "YYYY-MM"
      const [y, m] = value.split('-').map(Number);
      f = `${y}-${String(m).padStart(2, '0')}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      t = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    } else if (granularity === 'year') {
      f = `${value}-01-01`;
      t = `${value}-12-31`;
    }
    setFrom(f); setTo(t);
    reload(f, t);
  }

  function exportCsv() {
    if (!data) return;
    const headers = ['Period', 'Revenue Collected (USD)', "Total Sales (USD)", 'Cost of Goods (USD)', 'Gross Margin (USD)', 'Expenses (USD)', 'Net Result (USD)'];
    const lines = data.rows.map((r) => [
      r.label, Math.round(r.recettes), Math.round(r.chiffreAffaires), Math.round(r.coutMarchandises),
      Math.round(r.margeBrute), Math.round(r.charges), Math.round(r.resultatNet),
    ]);
    lines.push(['TOTAL', Math.round(data.totals.recettes), Math.round(data.totals.chiffreAffaires),
      Math.round(data.totals.coutMarchandises), Math.round(data.totals.margeBrute),
      Math.round(data.totals.charges), Math.round(data.totals.resultatNet)]);
    const csv = [headers, ...lines].map((row) => row.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traceability-${granularity}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const displayRows = data ? [...data.rows].reverse() : [];
  const searchLabel: Record<TraceabilityGranularity, string> = {
    day: 'Search a specific day', week: 'Search a week (pick any day in that week)',
    month: 'Search a specific month', year: 'Search a specific year',
  };

  return (
    <Paper>
      <Box sx={{ p: 2.5, pb: 0 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>Financial Traceability</Typography>
            <Typography variant="caption" color="text.secondary">
              Revenue collected, total sales, and profit by day, week, month, or year — for analyzing history.
            </Typography>
          </Box>
          <Button
            size="small" variant="outlined" startIcon={<DownloadIcon fontSize="small" />}
            onClick={exportCsv} disabled={!data || data.rows.length === 0}
          >
            Export CSV
          </Button>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2, mb: 1 }} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <ToggleButtonGroup
            size="small" value={granularity} exclusive
            onChange={(_, v) => v && setGranularity(v)}
          >
            {(Object.keys(granularityLabels) as TraceabilityGranularity[]).map((g) => (
              <ToggleButton key={g} value={g}>{granularityLabels[g]}</ToggleButton>
            ))}
          </ToggleButtonGroup>

          {(granularity === 'day' || granularity === 'week') && (
            <TextField
              size="small" type="date" label={searchLabel[granularity]} value={searchValue}
              onChange={(e) => applySearch(e.target.value)} InputLabelProps={{ shrink: true }}
            />
          )}
          {granularity === 'month' && (
            <TextField
              size="small" type="month" label={searchLabel.month} value={searchValue}
              onChange={(e) => applySearch(e.target.value)} InputLabelProps={{ shrink: true }}
            />
          )}
          {granularity === 'year' && (
            <TextField
              size="small" type="number" label={searchLabel.year} value={searchValue}
              onChange={(e) => applySearch(e.target.value)}
              sx={{ width: 160 }} inputProps={{ min: 2020, max: 2100 }}
            />
          )}

          {searchValue && (
            <Button size="small" onClick={() => applySearch('')}>
              Reset
            </Button>
          )}
        </Stack>
      </Box>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress size={24} /></Stack>
      ) : (
        <Box sx={{ maxHeight: 480, overflow: 'auto', mt: 1 }}>
          <TableContainer>
<Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Period</TableCell>
                <TableCell align="right">Revenue</TableCell>
                <TableCell align="right">Sales</TableCell>
                <TableCell align="right">Cost of Goods</TableCell>
                <TableCell align="right">Gross Margin</TableCell>
                <TableCell align="right">Expenses</TableCell>
                <TableCell align="right">Net Result</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayRows.map((r) => (
                <TableRow key={r.period} hover>
                  <TableCell sx={{ fontWeight: 600, textTransform: 'capitalize' }}>{r.label}</TableCell>
                  <TableCell align="right">{formatFcfa(r.recettes)}</TableCell>
                  <TableCell align="right">{formatFcfa(r.chiffreAffaires)}</TableCell>
                  <TableCell align="right">{formatFcfa(r.coutMarchandises)}</TableCell>
                  <TableCell align="right">{formatFcfa(r.margeBrute)}</TableCell>
                  <TableCell align="right" sx={{ color: diane.red }}>{formatFcfa(r.charges)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: r.resultatNet >= 0 ? diane.green : diane.red }}>
                    {formatFcfa(r.resultatNet)}
                  </TableCell>
                </TableRow>
              ))}
              {displayRows.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>No data for this period.</TableCell></TableRow>
              )}
            </TableBody>
            {data && data.rows.length > 0 && (
              <TableBody>
                <TableRow sx={{ bgcolor: diane.bg, '& td': { fontWeight: 800, borderTop: `2px solid ${diane.navy}` } }}>
                  <TableCell>TOTAL</TableCell>
                  <TableCell align="right">{formatFcfa(data.totals.recettes)}</TableCell>
                  <TableCell align="right">{formatFcfa(data.totals.chiffreAffaires)}</TableCell>
                  <TableCell align="right">{formatFcfa(data.totals.coutMarchandises)}</TableCell>
                  <TableCell align="right">{formatFcfa(data.totals.margeBrute)}</TableCell>
                  <TableCell align="right" sx={{ color: diane.red }}>{formatFcfa(data.totals.charges)}</TableCell>
                  <TableCell align="right" sx={{ color: data.totals.resultatNet >= 0 ? diane.green : diane.red }}>
                    {formatFcfa(data.totals.resultatNet)}
                  </TableCell>
                </TableRow>
              </TableBody>
            )}
          </Table>
</TableContainer>
        </Box>
      )}
    </Paper>
  );
}

type ReportSection = 'tracabilite' | 'entrees' | 'ventes' | 'vitesse' | 'clients' | 'charges';

const sectionLabels: Record<ReportSection, string> = {
  tracabilite: "Financial Traceability",
  entrees: 'Stock Entries',
  ventes: 'Sales by Product',
  vitesse: "Sell-Through Rate",
  clients: 'Top Customers',
  charges: 'Expenses by Category',
};

export default function ReportsPage() {
  const [section, setSection] = useState<ReportSection>('tracabilite');
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntryReportRow[]>([]);
  const [velocity, setVelocity] = useState<VelocityRow[]>([]);

  useEffect(() => {
    getProductsReport().then(setProducts);
    getCustomersReport().then(setCustomers);
    getExpensesReport().then(setExpenses);
    getStockEntriesReport().then(setStockEntries);
    getVelocityReport(30).then(setVelocity);
  }, []);

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5} sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Reports</Typography>
        <FormControl size="small" sx={{ minWidth: 260 }}>
          <InputLabel id="report-section-label">Choose a Report</InputLabel>
          <Select
            labelId="report-section-label"
            label="Choose a Report"
            value={section}
            onChange={(e) => setSection(e.target.value as ReportSection)}
          >
            {(Object.keys(sectionLabels) as ReportSection[]).map((key) => (
              <MenuItem key={key} value={key}>{sectionLabels[key]}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {section === 'tracabilite' && <TraceabilitySection />}

      {section === 'entrees' && (
        <Paper>
          <Box sx={{ p: 2.5, pb: 0 }}>
            <Typography variant="subtitle1" fontWeight={700}>Stock Entries</Typography>
            <Typography variant="caption" color="text.secondary">Date, supplier, and purchase price for each restocking</Typography>
          </Box>
          <TableContainer>
<Table sx={{ mt: 1 }}>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Product</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell align="right">Purchase Price</TableCell>
                <TableCell align="right">Total Cost</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stockEntries.map((e, i) => (
                <TableRow key={i}>
                  <TableCell>{new Date(e.date).toLocaleDateString('en-US')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{e.productName}</TableCell>
                  <TableCell align="right">{e.quantity}</TableCell>
                  <TableCell>{e.supplierName ?? '—'}</TableCell>
                  <TableCell align="right">{e.unitCost != null ? formatFcfa(e.unitCost) : '—'}</TableCell>
                  <TableCell align="right">{e.totalCost != null ? formatFcfa(e.totalCost) : '—'}</TableCell>
                </TableRow>
              ))}
              {stockEntries.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>No stock entries.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
</TableContainer>
        </Paper>
      )}

      {section === 'ventes' && (
        <Paper>
          <Box sx={{ p: 2.5, pb: 0 }}>
            <Typography variant="subtitle1" fontWeight={700}>Sales by Product</Typography>
          </Box>
          <TableContainer>
<Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell align="right">Quantity Sold</TableCell>
                <TableCell align="right">Revenue Generated</TableCell>
                <TableCell align="right">Profit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.productName}>
                  <TableCell>{p.productName}</TableCell>
                  <TableCell align="right">{p.quantity}</TableCell>
                  <TableCell align="right">{formatFcfa(p.revenue)}</TableCell>
                  <TableCell align="right">{formatFcfa(p.profit)}</TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>No data.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
</TableContainer>
        </Paper>
      )}

      {section === 'vitesse' && (
        <Paper>
          <Box sx={{ p: 2.5, pb: 0 }}>
            <Typography variant="subtitle1" fontWeight={700}>Product Sell-Through Rate</Typography>
            <Typography variant="caption" color="text.secondary">
              Ranking of products from fastest to slowest moving (last 30 days) — to know what to restock first.
            </Typography>
          </Box>
          <TableContainer>
<Table sx={{ mt: 1 }}>
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>Product</TableCell>
                <TableCell align="right">Sold (30d)</TableCell>
                <TableCell align="right">Pace / Day</TableCell>
                <TableCell align="right">Current Stock</TableCell>
                <TableCell align="right">Days of Stock Left</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {velocity.map((v) => (
                <TableRow key={v.productId}>
                  <TableCell sx={{ fontWeight: 700 }}>#{v.rank}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{v.productName}</TableCell>
                  <TableCell align="right">{v.quantitySoldWindow}</TableCell>
                  <TableCell align="right">{v.avgDailyQuantity.toFixed(1)} boxes/day</TableCell>
                  <TableCell align="right">{v.currentStock}</TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 700,
                      color: v.daysOfStockRemaining !== null && v.daysOfStockRemaining < 7 ? diane.red
                        : v.daysOfStockRemaining !== null && v.daysOfStockRemaining < 15 ? diane.orange
                        : diane.green,
                    }}
                  >
                    {v.daysOfStockRemaining !== null ? `~${Math.round(v.daysOfStockRemaining)} d` : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {velocity.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>No data.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
</TableContainer>
        </Paper>
      )}

      {section === 'clients' && (
        <Paper>
          <Box sx={{ p: 2.5, pb: 0 }}>
            <Typography variant="subtitle1" fontWeight={700}>Top Customers</Typography>
          </Box>
          <TableContainer>
<Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell align="right">Orders</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Revenue Generated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.customerName}>
                  <TableCell>{c.customerName}</TableCell>
                  <TableCell align="right">{c.orderCount}</TableCell>
                  <TableCell align="right">{c.quantity}</TableCell>
                  <TableCell align="right">{formatFcfa(c.revenue)}</TableCell>
                </TableRow>
              ))}
              {customers.length === 0 && (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>No data.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
</TableContainer>
        </Paper>
      )}

      {section === 'charges' && (
        <Paper>
          <Box sx={{ p: 2.5, pb: 0 }}>
            <Typography variant="subtitle1" fontWeight={700}>Expenses by Category</Typography>
          </Box>
          <TableContainer>
<Table>
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.map((e) => (
                <TableRow key={e.category}>
                  <TableCell>{e.category}</TableCell>
                  <TableCell align="right">{formatFcfa(e.total)}</TableCell>
                </TableRow>
              ))}
              {expenses.length === 0 && (
                <TableRow><TableCell colSpan={2} align="center" sx={{ py: 3, color: 'text.secondary' }}>No data.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
</TableContainer>
        </Paper>
      )}
    </Box>
  );
}
