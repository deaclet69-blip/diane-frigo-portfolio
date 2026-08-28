import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Stack,
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

function formatFcfa(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} FCFA`;
}

const granularityLabels: Record<TraceabilityGranularity, string> = {
  day: 'Jour', week: 'Semaine', month: 'Mois', year: 'Année',
};

function TraceabilitySection() {
  const [granularity, setGranularity] = useState<TraceabilityGranularity>('month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState<TraceabilityReport | null>(null);
  const [loading, setLoading] = useState(false);

  function reload() {
    setLoading(true);
    getTraceabilityReport(granularity, from || undefined, to || undefined)
      .then(setData)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [granularity]);

  function exportCsv() {
    if (!data) return;
    const headers = ['Période', 'Recettes (FCFA)', "Chiffre d'affaires (FCFA)", 'Coût marchandises (FCFA)', 'Marge brute (FCFA)', 'Charges (FCFA)', 'Résultat net (FCFA)'];
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
    a.download = `tracabilite-${granularity}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const displayRows = data ? [...data.rows].reverse() : [];

  return (
    <Paper>
      <Box sx={{ p: 2.5, pb: 0 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>Traçabilité de l'argent</Typography>
            <Typography variant="caption" color="text.secondary">
              Recettes encaissées, chiffre d'affaires et bénéfice par jour, semaine, mois ou année — pour analyser l'historique.
            </Typography>
          </Box>
          <Button
            size="small" variant="outlined" startIcon={<DownloadIcon fontSize="small" />}
            onClick={exportCsv} disabled={!data || data.rows.length === 0}
          >
            Exporter CSV
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
          <TextField
            size="small" type="date" label="Du (optionnel)" value={from}
            onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small" type="date" label="Au (optionnel)" value={to}
            onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }}
          />
          <Button size="small" variant="contained" onClick={reload} disabled={loading}>
            Filtrer
          </Button>
        </Stack>
      </Box>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress size={24} /></Stack>
      ) : (
        <Box sx={{ maxHeight: 480, overflow: 'auto', mt: 1 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Période</TableCell>
                <TableCell align="right">Recettes</TableCell>
                <TableCell align="right">CA</TableCell>
                <TableCell align="right">Coût march.</TableCell>
                <TableCell align="right">Marge brute</TableCell>
                <TableCell align="right">Charges</TableCell>
                <TableCell align="right">Résultat net</TableCell>
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
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>Aucune donnée pour cette période.</TableCell></TableRow>
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
        </Box>
      )}
    </Paper>
  );
}

type ReportSection = 'tracabilite' | 'entrees' | 'ventes' | 'vitesse' | 'clients' | 'charges';

const sectionLabels: Record<ReportSection, string> = {
  tracabilite: "Traçabilité de l'argent",
  entrees: 'Entrées de stock',
  ventes: 'Ventes par produit',
  vitesse: "Vitesse d'écoulement",
  clients: 'Top clients',
  charges: 'Charges par catégorie',
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
        <Typography variant="h5" fontWeight={700}>Rapports</Typography>
        <FormControl size="small" sx={{ minWidth: 260 }}>
          <InputLabel id="report-section-label">Choisir un rapport</InputLabel>
          <Select
            labelId="report-section-label"
            label="Choisir un rapport"
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
            <Typography variant="subtitle1" fontWeight={700}>Entrées de stock</Typography>
            <Typography variant="caption" color="text.secondary">Date, fournisseur et prix d'achat de chaque réapprovisionnement</Typography>
          </Box>
          <Table sx={{ mt: 1 }}>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Produit</TableCell>
                <TableCell align="right">Quantité</TableCell>
                <TableCell>Fournisseur</TableCell>
                <TableCell align="right">Prix d'achat</TableCell>
                <TableCell align="right">Coût total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stockEntries.map((e, i) => (
                <TableRow key={i}>
                  <TableCell>{new Date(e.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{e.productName}</TableCell>
                  <TableCell align="right">{e.quantity}</TableCell>
                  <TableCell>{e.supplierName ?? '—'}</TableCell>
                  <TableCell align="right">{e.unitCost != null ? formatFcfa(e.unitCost) : '—'}</TableCell>
                  <TableCell align="right">{e.totalCost != null ? formatFcfa(e.totalCost) : '—'}</TableCell>
                </TableRow>
              ))}
              {stockEntries.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>Aucune entrée de stock.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      {section === 'ventes' && (
        <Paper>
          <Box sx={{ p: 2.5, pb: 0 }}>
            <Typography variant="subtitle1" fontWeight={700}>Ventes par produit</Typography>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Produit</TableCell>
                <TableCell align="right">Quantité vendue</TableCell>
                <TableCell align="right">CA généré</TableCell>
                <TableCell align="right">Bénéfice</TableCell>
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
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>Aucune donnée.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      {section === 'vitesse' && (
        <Paper>
          <Box sx={{ p: 2.5, pb: 0 }}>
            <Typography variant="subtitle1" fontWeight={700}>Vitesse d'écoulement des produits</Typography>
            <Typography variant="caption" color="text.secondary">
              Classement du produit qui part le plus vite au moins vite (30 derniers jours) — pour savoir quoi racheter en priorité.
            </Typography>
          </Box>
          <Table sx={{ mt: 1 }}>
            <TableHead>
              <TableRow>
                <TableCell>Rang</TableCell>
                <TableCell>Produit</TableCell>
                <TableCell align="right">Vendu (30j)</TableCell>
                <TableCell align="right">Rythme / jour</TableCell>
                <TableCell align="right">Stock actuel</TableCell>
                <TableCell align="right">Jours de stock restants</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {velocity.map((v) => (
                <TableRow key={v.productId}>
                  <TableCell sx={{ fontWeight: 700 }}>#{v.rank}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{v.productName}</TableCell>
                  <TableCell align="right">{v.quantitySoldWindow}</TableCell>
                  <TableCell align="right">{v.avgDailyQuantity.toFixed(1)} cartons/j</TableCell>
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
                    {v.daysOfStockRemaining !== null ? `~${Math.round(v.daysOfStockRemaining)} j` : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {velocity.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>Aucune donnée.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      {section === 'clients' && (
        <Paper>
          <Box sx={{ p: 2.5, pb: 0 }}>
            <Typography variant="subtitle1" fontWeight={700}>Top clients</Typography>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Client</TableCell>
                <TableCell align="right">Commandes</TableCell>
                <TableCell align="right">Quantité</TableCell>
                <TableCell align="right">CA généré</TableCell>
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
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>Aucune donnée.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      {section === 'charges' && (
        <Paper>
          <Box sx={{ p: 2.5, pb: 0 }}>
            <Typography variant="subtitle1" fontWeight={700}>Charges par catégorie</Typography>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Catégorie</TableCell>
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
                <TableRow><TableCell colSpan={2} align="center" sx={{ py: 3, color: 'text.secondary' }}>Aucune donnée.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
