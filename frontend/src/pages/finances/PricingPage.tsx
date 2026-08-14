import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Stack, TextField, MenuItem, Table, TableHead, TableRow, TableCell,
  TableBody, Button, Alert, Divider,
} from '@mui/material';
import { getPricingSettings, updatePricingSettings, getProfitabilityAnalysis, checkPrice } from '../../services/pricing';
import { getProducts } from '../../services/products';
import type { PricingSettings, ProfitabilityAnalysis, PriceCheckResult, Product } from '../../types';
import { diane } from '../../theme';

function formatFcfa(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} FCFA`;
}
function pct(v: number) {
  return `${(v * 100).toFixed(0)}%`;
}

export default function PricingPage() {
  const [settings, setSettings] = useState<PricingSettings | null>(null);
  const [analysis, setAnalysis] = useState<ProfitabilityAnalysis | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [checkProductId, setCheckProductId] = useState('');
  const [checkPriceValue, setCheckPriceValue] = useState('');
  const [checkResult, setCheckResult] = useState<PriceCheckResult | null>(null);
  const [saved, setSaved] = useState(false);

  function reload() {
    getPricingSettings().then(setSettings);
    getProfitabilityAnalysis().then(setAnalysis);
  }

  useEffect(() => {
    reload();
    getProducts().then(setProducts);
  }, []);

  async function handleSaveSettings() {
    if (!settings) return;
    await updatePricingSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    reload();
  }

  async function handleCheckPrice() {
    if (!checkProductId || !checkPriceValue) return;
    const result = await checkPrice(checkProductId, Number(checkPriceValue));
    setCheckResult(result);
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>Tarification</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Coût de revient = prix d'achat moyen pondéré + charges Fixe réparties par carton vendu ce mois.
      </Typography>

      {analysis && (
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2.5, pb: 0 }}>
            <Typography variant="subtitle1" fontWeight={700}>Analyse rentabilité par produit</Typography>
            <Typography variant="caption" color="text.secondary">
              Charges fixes réparties : {formatFcfa(analysis.chargesPerCarton)} / carton
            </Typography>
            <Alert severity={analysis.usingRealAverage ? 'success' : 'info'} sx={{ mt: 1.5 }}>
              {analysis.usingRealAverage
                ? `Méthode : moyenne réelle sur ${analysis.monthsWithData} mois complets`
                : "Méthode : ton estimation de départ (ci-dessous) — pas encore assez d'historique réel (il faut 2 mois avec des charges Fixe enregistrées)"}
            </Alert>
          </Box>
          <Table sx={{ mt: 1 }}>
            <TableHead>
              <TableRow>
                <TableCell>Produit</TableCell>
                <TableCell align="right">Prix d'achat moyen</TableCell>
                <TableCell align="right">Coût de revient</TableCell>
                <TableCell align="right">Prix plancher</TableCell>
                <TableCell align="right">Gros volume</TableCell>
                <TableCell align="right">Gros</TableCell>
                <TableCell align="right">Détail</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analysis.rows.map((r) => (
                <TableRow key={r.productId}>
                  <TableCell sx={{ fontWeight: 600 }}>{r.productName}</TableCell>
                  <TableCell align="right">{formatFcfa(r.avgPurchasePrice)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{formatFcfa(r.costOfGoods)}</TableCell>
                  <TableCell align="right">{formatFcfa(r.suggestedPrices.floor)}</TableCell>
                  <TableCell align="right">{formatFcfa(r.suggestedPrices.wholesaleBulk)}</TableCell>
                  <TableCell align="right">{formatFcfa(r.suggestedPrices.wholesale)}</TableCell>
                  <TableCell align="right" sx={{ color: diane.green, fontWeight: 700 }}>
                    {formatFcfa(r.suggestedPrices.retail)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Vérificateur de prix</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
          <TextField
            select label="Produit" value={checkProductId}
            onChange={(e) => setCheckProductId(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            {products.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </TextField>
          <TextField
            label="Prix proposé (FCFA)" type="number" value={checkPriceValue}
            onChange={(e) => setCheckPriceValue(e.target.value)}
          />
          <Button variant="contained" onClick={handleCheckPrice} sx={{ mt: { xs: 0, sm: 1 } }}>
            Vérifier
          </Button>
        </Stack>

        {checkResult && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" fontWeight={700}>{checkResult.verdict}</Typography>
            <Stack direction="row" spacing={4} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Marge</Typography>
                <Typography fontWeight={700}>{formatFcfa(checkResult.marginFcfa)} ({pct(checkResult.marginPercent)})</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Coût de revient</Typography>
                <Typography fontWeight={700}>{formatFcfa(checkResult.costOfGoods)}</Typography>
              </Box>
            </Stack>
          </Box>
        )}
      </Paper>

      {settings && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Paramètres de tarification</Typography>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Marge plancher (%)" type="number" fullWidth
                value={settings.targetMarginFloor * 100}
                onChange={(e) => setSettings({ ...settings, targetMarginFloor: Number(e.target.value) / 100 })}
              />
              <TextField
                label="Marge gros volume (%)" type="number" fullWidth
                value={settings.targetMarginWholesaleBulk * 100}
                onChange={(e) => setSettings({ ...settings, targetMarginWholesaleBulk: Number(e.target.value) / 100 })}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Marge gros (%)" type="number" fullWidth
                value={settings.targetMarginWholesale * 100}
                onChange={(e) => setSettings({ ...settings, targetMarginWholesale: Number(e.target.value) / 100 })}
              />
              <TextField
                label="Marge détail (%)" type="number" fullWidth
                value={settings.targetMarginRetail * 100}
                onChange={(e) => setSettings({ ...settings, targetMarginRetail: Number(e.target.value) / 100 })}
              />
            </Stack>
            <Divider />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Taux de perte acceptable (%)" type="number" fullWidth
                value={settings.acceptableLossRate * 100}
                onChange={(e) => setSettings({ ...settings, acceptableLossRate: Number(e.target.value) / 100 })}
              />
              <TextField
                label="Arrondi des prix (FCFA)" type="number" fullWidth
                value={settings.priceRoundingFcfa}
                onChange={(e) => setSettings({ ...settings, priceRoundingFcfa: Number(e.target.value) })}
              />
            </Stack>
            <Divider />
            <Typography variant="body2" fontWeight={600}>
              Estimation de départ (tant que tu n'as pas 2 mois complets d'historique)
            </Typography>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Charges fixes mensuelles estimées (FCFA)" type="number" fullWidth
                value={settings.estimatedMonthlyFixedCharges}
                onChange={(e) => setSettings({ ...settings, estimatedMonthlyFixedCharges: Number(e.target.value) })}
              />
              <TextField
                label="Ventes mensuelles estimées (cartons, tous produits)" type="number" fullWidth
                value={settings.estimatedMonthlyCartonsSold}
                onChange={(e) => setSettings({ ...settings, estimatedMonthlyCartonsSold: Number(e.target.value) })}
              />
            </Stack>
            {saved && <Alert severity="success">Paramètres enregistrés.</Alert>}
            <Button variant="contained" onClick={handleSaveSettings} sx={{ alignSelf: 'flex-start' }}>
              Enregistrer les paramètres
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
