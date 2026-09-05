import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Stack, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, IconButton, Chip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { getCustomerDetail } from '../../services/customers';
import type { CustomerDetail } from '../../types';
import { diane } from '../../theme';

import { usd } from '../../utils/currency';

function formatFcfa(value: number) {
  return usd(value);
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CustomerDetail | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) getCustomerDetail(id).then(setData);
  }, [id]);

  if (!data) return null;

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate('/clients')} size="small"><ArrowBackIcon /></IconButton>
        <Typography variant="h5" fontWeight={700}>{data.name}</Typography>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Paper sx={{ p: 2.5, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">Orders</Typography>
          <Typography variant="h5" fontWeight={700}>{data.stats.orderCount}</Typography>
        </Paper>
        <Paper sx={{ p: 2.5, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">Revenue Generated</Typography>
          <Typography variant="h5" fontWeight={700}>{formatFcfa(data.stats.totalRevenue)}</Typography>
        </Paper>
        <Paper sx={{ p: 2.5, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">Quantity Purchased</Typography>
          <Typography variant="h5" fontWeight={700}>{data.stats.totalQuantity}</Typography>
        </Paper>
        <Paper sx={{ p: 2.5, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">Outstanding Debt</Typography>
          <Typography variant="h5" fontWeight={700} sx={{ color: data.stats.totalDebt > 0 ? diane.red : diane.green }}>
            {formatFcfa(data.stats.totalDebt)}
          </Typography>
        </Paper>
      </Stack>

      {data.deposits.length > 0 && (
        <Paper sx={{ p: 2.5, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Active Deposits</Typography>
          <Stack direction="row" spacing={3}>
            {data.deposits.map((d) => (
              <Box key={d.id}>
                <Typography variant="body2" color="text.secondary">{d.product.name}</Typography>
                <Typography fontWeight={700}>
                  {d.movements.filter((m: any) => m.movementType === 'DEPOSIT').reduce((a: number, m: any) => a + m.quantity, 0)
                    - d.movements.filter((m: any) => m.movementType === 'WITHDRAWAL').reduce((a: number, m: any) => a + m.quantity, 0)}
                  {' '}boxes available
                </Typography>
              </Box>
            ))}
          </Stack>
        </Paper>
      )}

      <Paper>
        <Box sx={{ p: 2.5, pb: 0 }}>
          <Typography variant="subtitle1" fontWeight={700}>Purchase History</Typography>
        </Box>
        <TableContainer>
<Table>
          <TableHead>
            <TableRow>
              <TableCell>Invoice</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.invoices.map((inv: any) => (
              <TableRow key={inv.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/ventes/${inv.id}`)}>
                <TableCell sx={{ fontWeight: 600 }}>{inv.invoiceNumber}</TableCell>
                <TableCell>{new Date(inv.date).toLocaleDateString('en-US')}</TableCell>
                <TableCell align="right">{formatFcfa(Number(inv.total))}</TableCell>
                <TableCell><Chip label={inv.status} size="small" /></TableCell>
              </TableRow>
            ))}
            {data.invoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No purchases recorded.
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
