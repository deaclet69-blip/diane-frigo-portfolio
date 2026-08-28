import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Button, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Alert, LinearProgress,
} from '@mui/material';
import { getLosses, getMonthlyLossRate, createLoss } from '../../services/losses';
import { getProducts } from '../../services/products';
import type { Loss, MonthlyLossRate, Product, LossReason } from '../../types';
import { diane } from '../../theme';

function formatFcfa(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} FCFA`;
}

const reasonLabels: Record<LossReason, string> = {
  RUPTURE_CHAINE_FROID: 'Rupture chaîne de froid',
  EXPIRATION: 'Expiration / Péremption',
  CASSE: 'Casse',
  VOL: 'Vol',
  ERREUR_MANUTENTION: 'Erreur de manutention',
  AUTRE: 'Autre',
};

export default function LossesPage() {
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
      setError(err?.response?.data?.message ?? 'Erreur lors de l\'enregistrement.');
    }
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Pertes</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>Déclarer une perte</Button>
      </Stack>

      {rate && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Taux de perte du mois</Typography>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="h5" fontWeight={700} sx={{ color: rate.isAboveAcceptable ? diane.red : diane.green }}>
              {(rate.rate * 100).toFixed(2)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Seuil acceptable : {(rate.acceptableRate * 100).toFixed(1)}%
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
            {formatFcfa(rate.lossValue)} de pertes ce mois, pour {formatFcfa(rate.revenue)} de CA
          </Typography>
        </Paper>
      )}

      <Paper>
        <TableContainer>
<Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Produit</TableCell>
              <TableCell align="right">Quantité</TableCell>
              <TableCell>Motif</TableCell>
              <TableCell align="right">Valeur</TableCell>
              <TableCell>Note</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {losses.map((l) => (
              <TableRow key={l.id}>
                <TableCell>{new Date(l.date).toLocaleDateString('fr-FR')}</TableCell>
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
                  Aucune perte enregistrée.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
</TableContainer>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Déclarer une perte</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select label="Produit" value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })} fullWidth
            >
              {products.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </TextField>
            <TextField
              label="Quantité (cartons)" type="number" value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })} fullWidth
            />
            <TextField
              select label="Motif" value={form.reason}
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
              label="Note (optionnel)" value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })} fullWidth multiline minRows={2}
            />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleCreate}>Enregistrer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
