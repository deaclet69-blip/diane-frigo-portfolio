import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Stack, Table, TableContainer, TableHead, TableRow, TableCell, TableBody,
  IconButton, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { getInvoiceDetail, addPayment, voidInvoice } from '../../services/sales';
import type { Invoice } from '../../types';
import { diane } from '../../theme';

import { usd } from '../../utils/currency';

function formatFcfa(value: number) {
  return usd(value);
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const navigate = useNavigate();

  function reload() {
    if (id) getInvoiceDetail(id).then(setInvoice);
  }
  useEffect(reload, [id]);

  async function handlePay() {
    if (!id || !payAmount) return;
    await addPayment(id, { amount: Number(payAmount), date: new Date().toISOString().slice(0, 10) });
    setPayOpen(false);
    setPayAmount('');
    reload();
  }

  async function handleVoid() {
    if (!id || !voidReason) return;
    await voidInvoice(id, voidReason);
    setVoidOpen(false);
    reload();
  }

  if (!invoice) return null;

  return (
    <Box maxWidth={640}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate('/ventes')} size="small"><ArrowBackIcon /></IconButton>
        <Typography variant="h5" fontWeight={700}>Invoice {invoice.invoiceNumber}</Typography>
        {invoice.voidedAt && <Chip label="Voided" color="default" />}
      </Stack>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Customer</Typography>
            <Typography fontWeight={600}>{invoice.customer?.name}</Typography>
          </Box>
          <Box textAlign="right">
            <Typography variant="caption" color="text.secondary">Date</Typography>
            <Typography fontWeight={600}>{new Date(invoice.date).toLocaleDateString('en-US')}</Typography>
          </Box>
        </Stack>

        <TableContainer>
<Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Unit Price</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoice.items.map((it) => (
              <TableRow key={it.id}>
                <TableCell>{it.product?.name}</TableCell>
                <TableCell align="right">{it.quantity}</TableCell>
                <TableCell align="right">{formatFcfa(it.unitSalePrice)}</TableCell>
                <TableCell align="right">{formatFcfa(it.lineTotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
</TableContainer>

        <Stack spacing={0.5} sx={{ mt: 2, alignItems: 'flex-end' }}>
          <Typography variant="body2">Subtotal: {formatFcfa(invoice.subtotal)}</Typography>
          {invoice.discount > 0 && <Typography variant="body2">Discount: -{formatFcfa(invoice.discount)}</Typography>}
          <Typography fontWeight={700}>Total: {formatFcfa(invoice.total)}</Typography>
          <Typography variant="body2" sx={{ color: diane.green }}>Paid: {formatFcfa(invoice.amountPaid)}</Typography>
          {invoice.balanceDue > 0 && (
            <Typography variant="body2" sx={{ color: diane.red }}>Balance Due: {formatFcfa(invoice.balanceDue)}</Typography>
          )}
        </Stack>

        {invoice.note && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(128,128,128,0.15)' }}>
            <Typography variant="caption" color="text.secondary">Note</Typography>
            <Typography variant="body2">{invoice.note}</Typography>
          </Box>
        )}
      </Paper>

      {!invoice.voidedAt && (
        <Stack direction="row" spacing={2}>
          {invoice.balanceDue > 0 && (
            <Button variant="contained" onClick={() => setPayOpen(true)}>Record Payment</Button>
          )}
          <Button variant="outlined" color="error" onClick={() => setVoidOpen(true)}>Void Invoice</Button>
        </Stack>
      )}

      <Dialog open={payOpen} onClose={() => setPayOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Record a Payment</DialogTitle>
        <DialogContent>
          <TextField
            label="Amount (USD)"
            type="number"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
            helperText={`Current balance due: ${formatFcfa(invoice.balanceDue)}`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePay}>Confirm</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={voidOpen} onClose={() => setVoidOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Void this invoice?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Stock will be automatically credited back. This action is logged and irreversible.
          </Typography>
          <TextField
            label="Reason for voiding"
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVoidOpen(false)}>Back</Button>
          <Button variant="contained" color="error" onClick={handleVoid}>Confirm Void</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
