import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Stack, Alert,
} from '@mui/material';
import { getDepositBalances, createWithdrawal } from '../../services/deposits';
import type { DepositBalance } from '../../types';

export default function DepositsPage() {
  const [balances, setBalances] = useState<DepositBalance[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<DepositBalance | null>(null);
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState<string | null>(null);

  function reload() {
    getDepositBalances().then(setBalances);
  }
  useEffect(reload, []);

  function openWithdraw(b: DepositBalance) {
    setSelected(b);
    setQuantity('');
    setError(null);
    setOpen(true);
  }

  async function handleWithdraw() {
    if (!selected || !quantity) return;
    try {
      await createWithdrawal({
        customerId: selected.customer.id,
        productId: selected.product.id,
        quantity: Number(quantity),
        date: new Date().toISOString().slice(0, 10),
      });
      setOpen(false);
      reload();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erreur lors du retrait.');
    }
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Dépôts clients</Typography>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Client</TableCell>
              <TableCell>Produit</TableCell>
              <TableCell align="right">Déposé</TableCell>
              <TableCell align="right">Retiré</TableCell>
              <TableCell align="right">Solde disponible</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {balances.map((b) => (
              <TableRow key={b.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{b.customer.name}</TableCell>
                <TableCell>{b.product.name}</TableCell>
                <TableCell align="right">{b.deposited}</TableCell>
                <TableCell align="right">{b.withdrawn}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{b.balance}</TableCell>
                <TableCell align="right">
                  <Button size="small" disabled={b.balance <= 0} onClick={() => openWithdraw(b)}>
                    Retrait
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {balances.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  Aucun dépôt en cours.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Retrait — {selected?.customer.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {selected?.product.name} — {selected?.balance} cartons disponibles
            </Typography>
            <TextField
              label="Quantité à retirer"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              fullWidth
              inputProps={{ min: 1, max: selected?.balance }}
            />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleWithdraw}>Confirmer le retrait</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
