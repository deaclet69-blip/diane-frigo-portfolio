import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Chip, Stack,
  Button, useMediaQuery, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getInvoices } from '../../services/sales';
import type { Invoice } from '../../types';
import { diane } from '../../theme';

import { usd } from '../../utils/currency';

function formatFcfa(value: number) {
  return usd(value);
}

const statusConfig: Record<Invoice['status'], { label: string; color: string; bg: string }> = {
  PAID: { label: 'Paid', color: diane.green, bg: '#E7F7EE' },
  PARTIAL: { label: 'Partial', color: diane.orange, bg: '#FEF3E6' },
  CREDIT: { label: 'Credit', color: diane.red, bg: '#FCEAEA' },
};

export default function SalesListPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // ?impayees=1 dans l'URL (utilisé par l'alerte "Paiement en retard" du
  // dashboard) filtre directement sur les factures avec un solde dû.
  const onlyUnpaid = searchParams.get('impayees') === '1';
  const isMobile = useMediaQuery('(max-width:599px)');

  useEffect(() => {
    getInvoices().then(setInvoices);
  }, []);

  const displayedInvoices = onlyUnpaid ? invoices.filter((inv) => inv.balanceDue > 0) : invoices;
  const emptyMessage = onlyUnpaid ? 'No unpaid invoices.' : 'No sales recorded yet.';

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h5" fontWeight={700}>Sales</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/ventes/nouvelle')}>
          New Sale
        </Button>
      </Stack>

      {onlyUnpaid && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Chip
            label="Unpaid invoices only"
            size="small"
            onDelete={() => navigate('/ventes')}
            sx={{ bgcolor: diane.redLight, color: diane.red, fontWeight: 700 }}
          />
        </Stack>
      )}

      {isMobile ? (
        // Vue "cartes" mobile — priorité demandée par l'utilisateur : le
        // tableau desktop (8 colonnes) est illisible en dessous de 600px.
        // Une carte par vente, avec l'essentiel visible d'un coup d'œil.
        <Stack spacing={1.5}>
          {displayedInvoices.map((inv) => {
            const s = statusConfig[inv.status];
            return (
              <Paper
                key={inv.id}
                variant="outlined"
                sx={{ p: 2, cursor: 'pointer' }}
                onClick={() => navigate(`/ventes/${inv.id}`)}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography fontWeight={700}>#{inv.invoiceNumber}</Typography>
                    <Typography color="text.secondary">·</Typography>
                    <Typography color="text.secondary">{inv.customer?.name}</Typography>
                  </Stack>
                  <Chip label={s.label} size="small" sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700 }} />
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
                  <Chip
                    label={inv.saleType === 'GROS' ? 'Wholesale' : 'Retail'}
                    size="small"
                    sx={{ bgcolor: inv.saleType === 'GROS' ? diane.purpleLight : diane.blueLight, color: inv.saleType === 'GROS' ? diane.purple : diane.blue, fontWeight: 700 }}
                  />
                  {inv.voidedAt && <Chip label="Voided" size="small" />}
                  <Typography variant="body2" color="text.secondary">
                    {new Date(inv.date).toLocaleDateString('en-US')}
                  </Typography>
                </Stack>

                <Divider sx={{ my: 1 }} />

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {inv.items.map((it) => it.product?.name).join(', ')}
                </Typography>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight={700}>{formatFcfa(Number(inv.total))}</Typography>
                  {inv.balanceDue > 0 && (
                    <Typography variant="body2" sx={{ color: diane.red, fontWeight: 700 }}>
                      {formatFcfa(Number(inv.balanceDue))} due
                    </Typography>
                  )}
                </Stack>
              </Paper>
            );
          })}
          {displayedInvoices.length === 0 && (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
              {emptyMessage}
            </Paper>
          )}
        </Stack>
      ) : (
        <Paper>
          <TableContainer>
<Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Products</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Balance Due</TableCell>
                <TableCell>Status</TableCell>
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
                      {inv.voidedAt && <Chip label="Voided" size="small" sx={{ ml: 1 }} />}
                    </TableCell>
                    <TableCell>{inv.customer?.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={inv.saleType === 'GROS' ? 'Wholesale' : 'Retail'}
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
                    <TableCell>{new Date(inv.date).toLocaleDateString('en-US')}</TableCell>
                  </TableRow>
                );
              })}
              {displayedInvoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
</TableContainer>
        </Paper>
      )}
    </Box>
  );
}
