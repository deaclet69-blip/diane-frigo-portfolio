import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  LinearProgress,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import { getLoanStatus, upsertLoan } from '../../services/loans';
import type { LoanStatus } from '../../types';
import { diane } from '../../theme';

import { usd } from '../../utils/currency';

function formatFcfa(value: number) {
  return usd(Math.round(value));
}
function formatDays(d: number | null) {
  if (d === null) return 'Not enough recent data';
  if (d < 1) return 'Today';
  return `~${Math.ceil(d)} day${Math.ceil(d) > 1 ? 's' : ''}`;
}

export default function LoansPage() {
  const [status, setStatus] = useState<LoanStatus | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    totalAmount: '',
    constructionAmount: '',
    equipmentAmount: '',
    otherAmount: '',
    customProfitGoal: '',
  });

  function reload() {
    getLoanStatus()
      .then((s) => {
        setStatus(s);
        setNotFound(false);
      })
      .catch(() => setNotFound(true));
  }
  useEffect(reload, []);

  async function handleSave() {
    await upsertLoan({
      totalAmount: Number(form.totalAmount),
      constructionAmount: Number(form.constructionAmount) || 0,
      equipmentAmount: Number(form.equipmentAmount) || 0,
      otherAmount: Number(form.otherAmount) || 0,
      customProfitGoal: form.customProfitGoal ? Number(form.customProfitGoal) : undefined,
    });
    setOpen(false);
    reload();
  }

  if (notFound) {
    return (
      <Box maxWidth={480}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
          Investment
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          No loan recorded yet.
        </Alert>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Set Up My Loan
        </Button>
        <LoanFormDialog open={open} form={form} setForm={setForm} onClose={() => setOpen(false)} onSave={handleSave} />
      </Box>
    );
  }

  if (!status) return null;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Investment
        </Typography>
        <Button variant="outlined" onClick={() => setOpen(true)}>
          Edit
        </Button>
      </Stack>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          Loan Repayment — {formatFcfa(status.loan.totalAmount)}
        </Typography>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Revenue collected: {formatFcfa(status.repayment.cumulativeRevenueCollected)}
          </Typography>
          <Typography variant="body2" fontWeight={700}>
            {status.repayment.percentRepaid.toFixed(1)}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={status.repayment.percentRepaid}
          sx={{
            height: 10,
            borderRadius: 5,
            mb: 1,
            bgcolor: diane.blueLight,
            '& .MuiLinearProgress-bar': { bgcolor: diane.blue },
          }}
        />
        {status.repayment.isFullyRepaid ? (
          <Chip
            label="Loan fully covered by revenue"
            size="small"
            sx={{ bgcolor: '#E7F7EE', color: diane.green, fontWeight: 700 }}
          />
        ) : (
          <Typography variant="caption" color="text.secondary">
            Remaining to collect: {formatFcfa(status.repayment.remainingToSell)}
            {status.projections.daysToRepayLoan !== null &&
              ` — estimated ${formatDays(status.projections.daysToRepayLoan)} at the current pace`}
          </Typography>
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          Profit Target {status.loan.customProfitGoal ? '(custom)' : '(= loan amount)'}
        </Typography>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Net profit already achieved: {formatFcfa(status.profitObjective.netProfitAlreadyRealized)}
          </Typography>
          <Typography variant="body2" fontWeight={700}>
            {status.profitObjective.percentAchieved.toFixed(1)}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={status.profitObjective.percentAchieved}
          sx={{
            height: 10,
            borderRadius: 5,
            mb: 1,
            bgcolor: '#FCEAEA',
            '& .MuiLinearProgress-bar': { bgcolor: diane.green },
          }}
        />
        <Typography variant="caption" color="text.secondary">
          Remaining to generate: {formatFcfa(status.profitObjective.remainingToGenerateProfit)}
          {status.projections.daysToProfitObjective !== null &&
            ` — estimated ${formatDays(status.projections.daysToProfitObjective)} at the current pace`}
        </Typography>
      </Paper>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Paper sx={{ p: 2.5, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Recent Pace (last 14 days)
          </Typography>
          <Typography variant="h6" fontWeight={700}>
            {formatFcfa(status.projections.avgDailyProfit)}/day profit
          </Typography>
        </Paper>
        <Paper sx={{ p: 2.5, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Days of Stock Remaining
          </Typography>
          <Typography variant="h6" fontWeight={700}>
            {status.projections.stockRunwayDays !== null
              ? `~${Math.ceil(status.projections.stockRunwayDays)} days`
              : '—'}
          </Typography>
        </Paper>
        {status.projections.requiredDailyProfitBeforeStockOut !== null && (
          <Paper sx={{ p: 2.5, flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Required Profit/Day Before Stockout
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {formatFcfa(status.projections.requiredDailyProfitBeforeStockOut)}
            </Typography>
          </Paper>
        )}
      </Stack>

      {status.profitObjective.remainingToGenerateProfit > 0 && (
        <Paper>
          <Box sx={{ p: 2.5, pb: 0 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              By Product — to reach the target
            </Typography>
          </Box>
          <TableContainer>
            <Table sx={{ mt: 1 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Boxes to Sell</TableCell>
                  <TableCell align="right">Current Stock</TableCell>
                  <TableCell>Sufficient?</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {status.perProduct.map((p) => (
                  <TableRow key={p.productId}>
                    <TableCell>{p.productName}</TableCell>
                    <TableCell align="right">{p.cartonsNeeded ?? '—'}</TableCell>
                    <TableCell align="right">{p.currentStock}</TableCell>
                    <TableCell>
                      {p.stockSufficient !== null && (
                        <Chip
                          label={p.stockSufficient ? 'Yes' : 'No'}
                          size="small"
                          sx={{
                            bgcolor: p.stockSufficient ? '#E7F7EE' : '#FCEAEA',
                            color: p.stockSufficient ? diane.green : diane.red,
                            fontWeight: 700,
                          }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <LoanFormDialog open={open} form={form} setForm={setForm} onClose={() => setOpen(false)} onSave={handleSave} />
    </Box>
  );
}

function LoanFormDialog({ open, form, setForm, onClose, onSave }: any) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Set Up the Loan</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Total Loan Amount (USD)"
            type="number"
            value={form.totalAmount}
            onChange={(e: any) => setForm({ ...form, totalAmount: e.target.value })}
            fullWidth
          />
          <TextField
            label="Of which construction (USD)"
            type="number"
            value={form.constructionAmount}
            onChange={(e: any) => setForm({ ...form, constructionAmount: e.target.value })}
            fullWidth
          />
          <TextField
            label="Of which equipment (USD)"
            type="number"
            value={form.equipmentAmount}
            onChange={(e: any) => setForm({ ...form, equipmentAmount: e.target.value })}
            fullWidth
          />
          <TextField
            label="Of which other (USD)"
            type="number"
            value={form.otherAmount}
            onChange={(e: any) => setForm({ ...form, otherAmount: e.target.value })}
            fullWidth
          />
          <TextField
            label="Custom Profit Target (optional)"
            type="number"
            value={form.customProfitGoal}
            onChange={(e: any) => setForm({ ...form, customProfitGoal: e.target.value })}
            fullWidth
            helperText="Leave empty to use the loan amount as the target"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
