import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Stack } from '@mui/material';
import { getProductsReport, getCustomersReport, getExpensesReport } from '../../services/reports';

function formatFcfa(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} FCFA`;
}

export default function ReportsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    getProductsReport().then(setProducts);
    getCustomersReport().then(setCustomers);
    getExpensesReport().then(setExpenses);
  }, []);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Rapports</Typography>

      <Stack spacing={3}>
        <Paper>
          <Box sx={{ p: 2.5, pb: 0 }}>
            <Typography variant="subtitle1" fontWeight={700}>Ventes par produit</Typography>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Produit</TableCell>
                <TableCell align="right">Quantité vendue</TableCell>
                <TableCell align="right">CA généré</TableCell>
                <TableCell align="right">Bénéfice</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.productName}>
                  <TableCell>{p.productName}</TableCell>
                  <TableCell align="right">{p.quantity}</TableCell>
                  <TableCell align="right">{formatFcfa(p.revenue)}</TableCell>
                  <TableCell align="right">{formatFcfa(p.profit)}</TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>Aucune donnée.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>

        <Paper>
          <Box sx={{ p: 2.5, pb: 0 }}>
            <Typography variant="subtitle1" fontWeight={700}>Top clients</Typography>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Client</TableCell>
                <TableCell align="right">Commandes</TableCell>
                <TableCell align="right">Quantité</TableCell>
                <TableCell align="right">CA généré</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.customerName}>
                  <TableCell>{c.customerName}</TableCell>
                  <TableCell align="right">{c.orderCount}</TableCell>
                  <TableCell align="right">{c.quantity}</TableCell>
                  <TableCell align="right">{formatFcfa(c.revenue)}</TableCell>
                </TableRow>
              ))}
              {customers.length === 0 && (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>Aucune donnée.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>

        <Paper>
          <Box sx={{ p: 2.5, pb: 0 }}>
            <Typography variant="subtitle1" fontWeight={700}>Charges par catégorie</Typography>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Catégorie</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.map((e) => (
                <TableRow key={e.category}>
                  <TableCell>{e.category}</TableCell>
                  <TableCell align="right">{formatFcfa(e.total)}</TableCell>
                </TableRow>
              ))}
              {expenses.length === 0 && (
                <TableRow><TableCell colSpan={2} align="center" sx={{ py: 3, color: 'text.secondary' }}>Aucune donnée.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Stack>
    </Box>
  );
}
