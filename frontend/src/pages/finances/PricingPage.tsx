import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Stack, TextField, MenuItem, Table, TableContainer, TableHead, TableRow, TableCell,
  TableBody, Button, Alert, Divider, useMediaQuery,
} from '@mui/material';
import { getPricingSettings, updatePricingSettings, getProfitabilityAnalysis, checkPrice } from '../../services/pricing';
import { getProducts } from '../../services/products';
import type { PricingSettings, ProfitabilityAnalysis, PriceCheckResult, Product } from '../../types';
import { diane } from '../../theme';

import { usd } from '../../utils/currency';

function formatFcfa(value: number) {
  return usd(Math.round(value));
}
function pct(v: number) {
  return `${(v * 100).toFixed(0)}%`;
}

export default function PricingPage() {
  const isMobile = useMediaQuery('(max-width:599px)');
  const [settings, setSettings] = useState<PricingSettings | null>(null);
  const [analysis, setAnalysis] = useState<ProfitabilityAnalysis | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [checkProductId, setCheckProductId] = useState('');
  const [checkPriceValue, setCheckPriceValue] = useState('');
  const [checkResult, setCheckResult] = useState<PriceCheckResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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
    setSaveError(null);
    // On n'envoie QUE les champs modifiables (jamais `id`/`updatedAt`) — le
    // serveur rejette toute donnée en trop, c'était une cause du bug
    // "l'enregistrement ne marche pas" signalé par l'utilisateur.
    // Number(...) est indispensable ici : les champs "Decimal" de la base
    // arrivent du serveur sous forme de texte (ex. "0.08"), pas de vrai
    // nombre — sans cette conversion, le serveur les refusait tous.
    const payload = {
      targetMarginFloor: Number(settings.targetMarginFloor),
      targetMarginWholesaleBulk: Number(settings.targetMarginWholesaleBulk),
      targetMarginWholesale: Number(settings.targetMarginWholesale),
      targetMarginRetail: Number(settings.targetMarginRetail),
      marginAlertCritical: Number(settings.marginAlertCritical),
      marginAlertGood: Number(settings.marginAlertGood),
      marginAlertExcellent: Number(settings.marginAlertExcellent),
      stockRotationFastDays: Number(settings.stockRotationFastDays),
      stockRotationDormantDays: Number(settings.stockRotationDormantDays),
      acceptableLossRate: Number(settings.acceptableLossRate),
      priceRoundingFcfa: Number(settings.priceRoundingFcfa),
      estimatedMonthlyFixedCharges: Number(settings.estimatedMonthlyFixedCharges),
      estimatedMonthlyCartonsSold: Number(settings.estimatedMonthlyCartonsSold),
    };
    try {
      await updatePricingSettings(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      reload();
    } catch (err: any) {
      setSaveError(err?.response?.data?.message ?? "Save failed.");
    }
  }

  async function handleCheckPrice() {
    if (!checkProductId || !checkPriceValue) return;
    const result = await checkPrice(checkProductId, Number(checkPriceValue));
    setCheckResult(result);
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>Profitability</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Cost basis = weighted average purchase price + fixed expenses allocated per box sold this month.
      </Typography>

      {analysis && (
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2.5, pb: 0 }}>
            <Typography variant="subtitle1" fontWeight={700}>Profitability Analysis by Product</Typography>
            <Typography variant="caption" color="text.secondary">
              Allocated fixed expenses: {formatFcfa(analysis.chargesPerCarton)} / box
            </Typography>
            <Alert severity={analysis.usingRealAverage ? 'success' : 'info'} sx={{ mt: 1.5 }}>
              {analysis.usingRealAverage
                ? `Method: real average over ${analysis.monthsWithData} full months`
                : "Method: your starting estimate (below) — not enough real history yet (2 months of recorded fixed expenses needed)"}
            </Alert>
          </Box>
          {isMobile && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 2, pt: 1 }}>
              Swipe to compare prices →
            </Typography>
          )}
          <TableContainer>
<Table sx={{ mt: 1 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={isMobile ? { position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1 } : undefined}>
                  Product
                </TableCell>
                {!isMobile && <TableCell align="right">Avg. Purchase Price</TableCell>}
                <TableCell align="right">Cost Basis</TableCell>
                <TableCell align="right">Floor Price</TableCell>
                <TableCell align="right">Bulk Wholesale</TableCell>
                <TableCell align="right">Wholesale</TableCell>
                <TableCell align="right">Retail</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analysis.rows.map((r) => (
                <TableRow key={r.productId}>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      ...(isMobile ? { position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1 } : {}),
                    }}
                  >
                    {r.productName}
                  </TableCell>
                  {!isMobile && <TableCell align="right">{formatFcfa(r.avgPurchasePrice)}</TableCell>}
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
</TableContainer>
        </Paper>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Price Checker</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
          <TextField
            select label="Product" value={checkProductId}
            onChange={(e) => setCheckProductId(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            {products.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </TextField>
          <TextField
            label="Proposed Price (USD)" type="number" value={checkPriceValue}
            onChange={(e) => setCheckPriceValue(e.target.value)}
          />
          <Button variant="contained" onClick={handleCheckPrice} sx={{ mt: { xs: 0, sm: 1 } }}>
            Check
          </Button>
        </Stack>

        {checkResult && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" fontWeight={700}>{checkResult.verdict}</Typography>
            <Stack direction="row" spacing={4} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Margin</Typography>
                <Typography fontWeight={700}>{formatFcfa(checkResult.marginFcfa)} ({pct(checkResult.marginPercent)})</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Cost Basis</Typography>
                <Typography fontWeight={700}>{formatFcfa(checkResult.costOfGoods)}</Typography>
              </Box>
            </Stack>
          </Box>
        )}
      </Paper>

      {settings && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Profitability Settings</Typography>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Floor Margin (%)" type="number" fullWidth
                value={settings.targetMarginFloor * 100}
                onChange={(e) => setSettings({ ...settings, targetMarginFloor: Number(e.target.value) / 100 })}
              />
              <TextField
                label="Bulk Wholesale Margin (%)" type="number" fullWidth
                value={settings.targetMarginWholesaleBulk * 100}
                onChange={(e) => setSettings({ ...settings, targetMarginWholesaleBulk: Number(e.target.value) / 100 })}
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Wholesale Margin (%)" type="number" fullWidth
                value={settings.targetMarginWholesale * 100}
                onChange={(e) => setSettings({ ...settings, targetMarginWholesale: Number(e.target.value) / 100 })}
              />
              <TextField
                label="Retail Margin (%)" type="number" fullWidth
                value={settings.targetMarginRetail * 100}
                onChange={(e) => setSettings({ ...settings, targetMarginRetail: Number(e.target.value) / 100 })}
              />
            </Stack>
            <Divider />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Acceptable Loss Rate (%)" type="number" fullWidth
                value={settings.acceptableLossRate * 100}
                onChange={(e) => setSettings({ ...settings, acceptableLossRate: Number(e.target.value) / 100 })}
              />
              <TextField
                label="Price Rounding (USD)" type="number" fullWidth
                value={settings.priceRoundingFcfa}
                onChange={(e) => setSettings({ ...settings, priceRoundingFcfa: Number(e.target.value) })}
              />
            </Stack>
            <Divider />
            <Typography variant="body2" fontWeight={600}>
              Starting Estimate (until you have 2 full months of history)
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Estimated Monthly Fixed Expenses (USD)" type="number" fullWidth
                value={settings.estimatedMonthlyFixedCharges || ''}
                onChange={(e) => setSettings({ ...settings, estimatedMonthlyFixedCharges: e.target.value === '' ? 0 : Number(e.target.value) })}
              />
              <TextField
                label="Estimated Monthly Sales (boxes, all products)" type="number" fullWidth
                value={settings.estimatedMonthlyCartonsSold || ''}
                onChange={(e) => setSettings({ ...settings, estimatedMonthlyCartonsSold: e.target.value === '' ? 0 : Number(e.target.value) })}
              />
            </Stack>
            {saved && <Alert severity="success">Settings saved.</Alert>}
            {saveError && <Alert severity="error">{saveError}</Alert>}
            <Button variant="contained" onClick={handleSaveSettings} sx={{ alignSelf: 'flex-start' }}>
              Save Settings
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
