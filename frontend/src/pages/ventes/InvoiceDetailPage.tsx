import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Stack, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { getInvoiceDetail, addPayment, voidInvoice } from '../../services/sales';
import type { Invoice } from '../../types';
import { diane } from '../../theme';

function formatFcfa(value: number) {
  return `${value.toLocaleString('fr-FR')} FCFA`;
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
        <Typography variant="h5" fontWeight={700}>Facture {invoice.invoiceNumber}</Typography>
        {invoice.voidedAt && <Chip label="Annulée" color="default" />}
      </Stack>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Client</Typography>
            <Typography fontWeight={600}>{invoice.customer?.name}</Typography>
          </Box>
          <Box textAlign="right">
            <Typography variant="caption" color="text.secondary">Date</Typography>
            <Typography fontWeight={600}>{new Date(invoice.date).toLocaleDateString('fr-FR')}</Typography>
          </Box>
        </Stack>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Produit</TableCell>
              <TableCell align="right">Qté</TableCell>
              <TableCell align="right">Prix unit.</TableCell>
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

        <Stack spacing={0.5} sx={{ mt: 2, alignItems: 'flex-end' }}>
          <Typography variant="body2">Sous-total : {formatFcfa(invoice.subtotal)}</Typography>
          {invoice.discount > 0 && <Typography variant="body2">Remise : -{formatFcfa(invoice.discount)}</Typography>}
          <Typography fontWeight={700}>Total : {formatFcfa(invoice.total)}</Typography>
          <Typography variant="body2" sx={{ color: diane.green }}>Payé : {formatFcfa(invoice.amountPaid)}</Typography>
          {invoice.balanceDue > 0 && (
            <Typography variant="body2" sx={{ color: diane.red }}>Solde dû : {formatFcfa(invoice.balanceDue)}</Typography>
          )}
        </Stack>
      </Paper>

      {!invoice.voidedAt && (
        <Stack direction="row" spacing={2}>
          {invoice.balanceDue > 0 && (
            <Button variant="contained" onClick={() => setPayOpen(true)}>Enregistrer un paiement</Button>
          )}
          <Button variant="outlined" color="error" onClick={() => setVoidOpen(true)}>Annuler la facture</Button>
        </Stack>
      )}

      <Dialog open={payOpen} onClose={() => setPayOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Enregistrer un paiement</DialogTitle>
        <DialogContent>
          <TextField
            label="Montant (FCFA)"
            type="number"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
            helperText={`Solde dû actuel : ${formatFcfa(invoice.balanceDue)}`}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handlePay}>Valider</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={voidOpen} onClose={() => setVoidOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Annuler cette facture ?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Le stock sera automatiquement recrédité. Cette action est tracée et irréversible.
          </Typography>
          <TextField
            label="Motif de l'annulation"
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVoidOpen(false)}>Retour</Button>
          <Button variant="contained" color="error" onClick={handleVoid}>Confirmer l'annulation</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
