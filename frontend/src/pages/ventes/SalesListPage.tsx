import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Chip, Stack, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  // ?impayees=1 dans l'URL (utilisé par l'alerte "Paiement en retard" du
  // dashboard) filtre directement sur les factures avec un solde dû.
  const onlyUnpaid = searchParams.get('impayees') === '1';

  useEffect(() => {
    getInvoices().then(setInvoices);
  }, []);

  const displayedInvoices = onlyUnpaid ? invoices.filter((inv) => inv.balanceDue > 0) : invoices;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h5" fontWeight={700}>Ventes</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/ventes/nouvelle')}>
          Nouvelle vente
        </Button>
      </Stack>

      {onlyUnpaid && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Chip
            label="Factures avec solde impayé uniquement"
            size="small"
            onDelete={() => navigate('/ventes')}
            sx={{ bgcolor: diane.redLight, color: diane.red, fontWeight: 700 }}
          />
        </Stack>
      )}

      <Paper>
        <TableContainer>
<Table>
          <TableHead>
            <TableRow>
              <TableCell>Facture</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Produits</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Solde dû</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedInvoices.map((inv) => {
              const s = statusConfig[inv.status];
              return (
                <TableRow key={inv.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/ventes/${inv.id}`)}>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {inv.invoiceNumber}
                    {inv.voidedAt && <Chip label="Annulée" size="small" sx={{ ml: 1 }} />}
                  </TableCell>
                  <TableCell>{inv.customer?.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={inv.saleType === 'GROS' ? 'Gros' : 'Détail'}
                      size="small"
                      sx={{ bgcolor: inv.saleType === 'GROS' ? diane.purpleLight : diane.blueLight, color: inv.saleType === 'GROS' ? diane.purple : diane.blue, fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell>{inv.items.map((it) => it.product?.name).join(', ')}</TableCell>
                  <TableCell align="right">{formatFcfa(Number(inv.total))}</TableCell>
                  <TableCell align="right" sx={{ color: inv.balanceDue > 0 ? diane.red : 'text.secondary', fontWeight: inv.balanceDue > 0 ? 700 : 400 }}>
                    {inv.balanceDue > 0 ? formatFcfa(Number(inv.balanceDue)) : '—'}
                  </TableCell>
                  <TableCell>
                    <Chip label={s.label} size="small" sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700 }} />
                  </TableCell>
                  <TableCell>{new Date(inv.date).toLocaleDateString('fr-FR')}</TableCell>
                </TableRow>
              );
            })}
            {displayedInvoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  {onlyUnpaid ? 'Aucune facture impayée.' : 'Aucune vente enregistrée pour le moment.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
</TableContainer>
      </Paper>
    </Box>
  );
}
