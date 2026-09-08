import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Button, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Alert, LinearProgress, useMediaQuery,
} from '@mui/material';
import { getLosses, getMonthlyLossRate, createLoss } from '../../services/losses';
import { getProducts } from '../../services/products';
import type { Loss, MonthlyLossRate, Product, LossReason } from '../../types';
import { diane } from '../../theme';

import { usd } from '../../utils/currency';

function formatFcfa(value: number) {
  return usd(Math.round(value));
}

const reasonLabels: Record<LossReason, string> = {
  RUPTURE_CHAINE_FROID: 'Cold Chain Break',
  EXPIRATION: 'Expired',
  CASSE: 'Breakage',
  VOL: 'Theft',
  ERREUR_MANUTENTION: 'Handling Error',
  AUTRE: 'Other',
};

export default function LossesPage() {
  const isMobile = useMediaQuery('(max-width:599px)');
  const [losses, setLosses] = useState<Loss[]>([]);
  const [rate, setRate] = useState<MonthlyLossRate | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    productId: '', quantity: '', date: new Date().toISOString().slice(0, 10),
    reason: 'EXPIRATION' as LossReason, note: '',
  });

  function reload() {
    getLosses().then(setLosses);
    getMonthlyLossRate().then(setRate);
  }

  useEffect(() => {
    reload();
    getProducts().then(setProducts);
  }, []);

  async function handleCreate() {
    if (!form.productId || !form.quantity) return;
    setError(null);
    try {
      await createLoss({
        productId: form.productId,
        quantity: Number(form.quantity),
        date: form.date,
        reason: form.reason,
        note: form.note || undefined,
      });
      setOpen(false);
      setForm({ ...form, quantity: '', note: '' });
      reload();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error while saving.');
    }
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Losses</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>Report a Loss</Button>
      </Stack>

      {rate && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>This Month's Loss Rate</Typography>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="h5" fontWeight={700} sx={{ color: rate.isAboveAcceptable ? diane.red : diane.green }}>
              {(rate.rate * 100).toFixed(2)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Acceptable threshold: {(rate.acceptableRate * 100).toFixed(1)}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, (rate.rate / (rate.acceptableRate * 2)) * 100)}
            sx={{
              height: 8, borderRadius: 4,
              bgcolor: '#E7F7EE',
              '& .MuiLinearProgress-bar': { bgcolor: rate.isAboveAcceptable ? diane.red : diane.green },
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {formatFcfa(rate.lossValue)} in losses this month, out of {formatFcfa(rate.revenue)} in revenue
          </Typography>
        </Paper>
      )}

      {isMobile ? (
        <Stack spacing={1.5}>
          {losses.map((l) => (
            <Paper key={l.id} variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Typography fontWeight={700}>{l.product.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(l.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ mt: 0.5 }}>Quantity: {l.quantity} boxes</Typography>
              <Typography variant="body2">Reason: {reasonLabels[l.reason]}</Typography>
              <Typography variant="body2" sx={{ color: diane.red, fontWeight: 700 }}>
                Value: {formatFcfa(l.totalValue)}
              </Typography>
              {l.note && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{l.note}</Typography>}
            </Paper>
          ))}
          {losses.length === 0 && (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
              No losses recorded.
            </Paper>
          )}
        </Stack>
      ) : (
      <Paper>
        <TableContainer>
<Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Product</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell align="right">Value</TableCell>
              <TableCell>Note</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {losses.map((l) => (
              <TableRow key={l.id}>
                <TableCell>{new Date(l.date).toLocaleDateString('en-US')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{l.product.name}</TableCell>
                <TableCell align="right">{l.quantity}</TableCell>
                <TableCell>{reasonLabels[l.reason]}</TableCell>
                <TableCell align="right" sx={{ color: diane.red, fontWeight: 700 }}>{formatFcfa(l.totalValue)}</TableCell>
                <TableCell>{l.note ?? '—'}</TableCell>
              </TableRow>
            ))}
            {losses.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No losses recorded.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
</TableContainer>
      </Paper>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Report a Loss</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select label="Product" value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })} fullWidth
            >
              {products.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </TextField>
            <TextField
              label="Quantity (boxes)" type="number" value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })} fullWidth
            />
            <TextField
              select label="Reason" value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value as LossReason })} fullWidth
            >
              {(Object.keys(reasonLabels) as LossReason[]).map((r) => (
                <MenuItem key={r} value={r}>{reasonLabels[r]}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Date" type="date" value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })} fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Note (optional)" value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })} fullWidth multiline minRows={2}
            />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
