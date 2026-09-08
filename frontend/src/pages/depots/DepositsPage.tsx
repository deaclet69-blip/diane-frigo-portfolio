import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Stack, Alert, useMediaQuery,
} from '@mui/material';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { getDepositBalances, createWithdrawal } from '../../services/deposits';
import type { DepositBalance } from '../../types';

export default function DepositsPage() {
  const isMobile = useMediaQuery('(max-width:599px)');
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
      setError(err?.response?.data?.message ?? 'Error during withdrawal.');
    }
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Customer Deposits</Typography>

      {balances.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 5, textAlign: 'center' }}>
          <Inventory2OutlinedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No active deposits.</Typography>
        </Paper>
      ) : isMobile ? (
        <Stack spacing={1.5}>
          {balances.map((b) => (
            <Paper key={b.id} variant="outlined" sx={{ p: 2 }}>
              <Typography fontWeight={700}>{b.customer.name}</Typography>
              <Typography variant="body2" color="text.secondary">{b.product.name}</Typography>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Deposited {b.deposited} · Withdrawn {b.withdrawn}
                  </Typography>
                  <Typography fontWeight={700}>{b.balance} boxes available</Typography>
                </Box>
                <Button size="small" variant="outlined" disabled={b.balance <= 0} onClick={() => openWithdraw(b)}>
                  Withdraw
                </Button>
              </Stack>
            </Paper>
          ))}
        </Stack>
      ) : (
      <Paper>
        <TableContainer>
<Table>
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell>
              <TableCell>Product</TableCell>
              <TableCell align="right">Deposited</TableCell>
              <TableCell align="right">Withdrawn</TableCell>
              <TableCell align="right">Available Balance</TableCell>
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
                    Withdraw
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
</TableContainer>
      </Paper>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Withdrawal — {selected?.customer.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {selected?.product.name} — {selected?.balance} boxes available
            </Typography>
            <TextField
              label="Quantity to Withdraw"
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
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleWithdraw}>Confirm Withdrawal</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
