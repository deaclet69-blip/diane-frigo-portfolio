import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Chip, Stack, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { getInvoices } from '../../services/sales';
import type { Invoice } from '../../types';
import { diane } from '../../theme';

function formatFcfa(value: number) {
  return `${value.toLocaleString('fr-FR')} FCFA`;
}

const statusConfig: Record<Invoice['status'], { label: string; color: string; bg: string }> = {
  PAID: { label: 'Payé', color: diane.green, bg: '#E7F7EE' },
  PARTIAL: { label: 'Partiel', color: diane.orange, bg: '#FEF3E6' },
  CREDIT: { label: 'Crédit', color: diane.red, bg: '#FCEAEA' },
};

export default function SalesListPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getInvoices().then(setInvoices);
  }, []);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Ventes</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/ventes/nouvelle')}>
          Nouvelle vente
        </Button>
      </Stack>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Facture</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Produits</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((inv) => {
              const s = statusConfig[inv.status];
              return (
                <TableRow key={inv.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/ventes/${inv.id}`)}>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {inv.invoiceNumber}
                    {inv.voidedAt && <Chip label="Annulée" size="small" sx={{ ml: 1 }} />}
                  </TableCell>
                  <TableCell>{inv.customer?.name}</TableCell>
                  <TableCell>{inv.items.map((it) => it.product?.name).join(', ')}</TableCell>
                  <TableCell align="right">{formatFcfa(Number(inv.total))}</TableCell>
                  <TableCell>
                    <Chip label={s.label} size="small" sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700 }} />
                  </TableCell>
                  <TableCell>{new Date(inv.date).toLocaleDateString('fr-FR')}</TableCell>
                </TableRow>
              );
            })}
            {invoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  Aucune vente enregistrée pour le moment.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
