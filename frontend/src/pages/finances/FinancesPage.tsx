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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import { getFinanceSummary, getRecovery, setMonthlyGoal } from '../../services/finances';
import type { FinanceSummary, RecoveryStatus } from '../../types';
import { diane } from '../../theme';

import { usd } from '../../utils/currency';

function formatFcfa(value: number) {
  return usd(Math.round(value));
}

const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

export default function FinancesPage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [recovery, setRecovery] = useState<RecoveryStatus | null>(null);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [recoveryAck, setRecoveryAck] = useState(() => localStorage.getItem('diane-frigo-recovery-ack') === '1');
  const navigate = useNavigate();

  function reload() {
    getFinanceSummary('month').then(setSummary);
    getRecovery().then(setRecovery);
  }

  useEffect(reload, []);

  useEffect(() => {
    if (recovery && !recovery.isPositive && recoveryAck) {
      localStorage.removeItem('diane-frigo-recovery-ack');
      setRecoveryAck(false);
    }
  }, [recovery, recoveryAck]);

  function acknowledgeRecovery() {
    localStorage.setItem('diane-frigo-recovery-ack', '1');
    setRecoveryAck(true);
  }

  function openGoalDialog() {
    setGoalInput(recovery?.goal != null ? String(recovery.goal) : '');
    setGoalDialogOpen(true);
  }

  async function handleSaveGoal() {
    if (!goalInput) return;
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    await setMonthlyGoal(firstOfMonth.toISOString().slice(0, 10), Number(goalInput));
    setGoalDialogOpen(false);
    reload();
  }

  const goalProgress = summary && recovery?.goal ? Math.min(100, (summary.netResult / recovery.goal) * 100) : 0;

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Paper sx={{ p: 2.5, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Revenue this Month
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {summary ? formatFcfa(summary.revenue) : '…'}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2.5, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Cost of Goods
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {summary ? formatFcfa(summary.costOfGoods) : '…'}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2.5, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Gross Margin
          </Typography>
          <Typography variant="h5" fontWeight={700} sx={{ color: diane.green }}>
            {summary ? formatFcfa(summary.grossProfit) : '…'}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2.5, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Net Result (Month)
          </Typography>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{ color: summary && summary.netResult >= 0 ? diane.green : diane.red }}
          >
            {summary ? formatFcfa(summary.netResult) : '…'}
          </Typography>
        </Paper>
      </Stack>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
            Target for {monthLabel}
          </Typography>
          <Button size="small" startIcon={<EditIcon fontSize="small" />} onClick={openGoalDialog}>
            {recovery?.goal != null ? 'Edit' : 'Set a Target'}
          </Button>
        </Stack>

        {recovery?.goal != null ? (
          <>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Net result this month: {summary ? formatFcfa(summary.netResult) : '…'}
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                Target: {formatFcfa(recovery.goal)}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={Math.max(0, goalProgress)}
              sx={{
                height: 10,
                borderRadius: 5,
                mb: 1,
                bgcolor: diane.blueLight,
                '& .MuiLinearProgress-bar': { bgcolor: goalProgress >= 100 ? diane.green : diane.blue },
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {goalProgress.toFixed(1)}% of target reached this month
            </Typography>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No target set for this month — click "Set a Target" to give yourself a goal to reach.
          </Typography>
        )}
      </Paper>

      {summary && (
        <Paper sx={{ p: 2.5, mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
            Expenses this month by type — all 3 reduce net profit (details in "Expenses")
          </Typography>
          <Stack direction="row" spacing={4}>
            <Box>
              <Typography variant="caption" sx={{ color: diane.blue, fontWeight: 700 }}>
                FIXED
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {formatFcfa(summary.chargesFixe)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: diane.orange, fontWeight: 700 }}>
                VARIABLE
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {formatFcfa(summary.chargesVariable)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: diane.red, fontWeight: 700 }}>
                ONE-TIME
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {formatFcfa(summary.chargesExceptionnel)}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Paper
          sx={{ p: 2.5, flex: 1, cursor: 'pointer', '&:hover': { bgcolor: diane.blueLight } }}
          onClick={() => navigate('/finances/tarification')}
        >
          <Typography variant="subtitle2" fontWeight={700}>
            💰 Profitability
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cost basis and suggested prices per product
          </Typography>
        </Paper>
        <Paper
          sx={{ p: 2.5, flex: 1, cursor: 'pointer', '&:hover': { bgcolor: diane.blueLight } }}
          onClick={() => navigate('/finances/pertes')}
        >
          <Typography variant="subtitle2" fontWeight={700}>
            📉 Losses
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Loss tracking and this month's loss rate
          </Typography>
        </Paper>
        <Paper
          sx={{ p: 2.5, flex: 1, cursor: 'pointer', '&:hover': { bgcolor: diane.blueLight } }}
          onClick={() => navigate('/finances/investissement')}
        >
          <Typography variant="subtitle2" fontWeight={700}>
            🏦 Investment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Loan repayment tracking
          </Typography>
        </Paper>
      </Stack>

      {recovery && recovery.isPositive && recoveryAck
        ? null
        : recovery && (
            <Paper sx={{ p: 3, mb: 3 }}>
              {recovery.isPositive ? (
                <Stack spacing={1.5} alignItems="flex-start">
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: diane.green }}>
                    ✅ Target reached — you're now profitable
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Cumulative result: <strong>{formatFcfa(recovery.netResult)}</strong>
                  </Typography>
                  <Button size="small" variant="outlined" onClick={acknowledgeRecovery}>
                    OK, dismiss
                  </Button>
                </Stack>
              ) : (
                <>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                    Recovery Target{' '}
                    <Typography component="span" variant="caption" color="text.secondary">
                      (cumulative since the start)
                    </Typography>
                  </Typography>

                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Current Result
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{ color: recovery.isPositive ? diane.green : diane.red }}
                      >
                        {formatFcfa(recovery.netResult)}
                      </Typography>
                    </Box>
                    <Box textAlign="right">
                      <Typography variant="caption" color="text.secondary">
                        Amount Remaining
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {formatFcfa(recovery.amountRemaining)}
                      </Typography>
                    </Box>
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={recovery.progressPercent}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      mb: 1,
                      bgcolor: '#FCEAEA',
                      '& .MuiLinearProgress-bar': { bgcolor: recovery.isPositive ? diane.green : diane.red },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {recovery.progressPercent.toFixed(1)}% — Target: reach a positive net profit
                  </Typography>
                </>
              )}

              {!recovery.isPositive && recovery.perProduct.length > 0 && (
                <TableContainer>
                  <Table size="small" sx={{ mt: 2 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Boxes to sell to close the gap</TableCell>
                        <TableCell align="right">Current Stock</TableCell>
                        <TableCell>Stock Sufficient?</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recovery.perProduct.map((p) => (
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
              )}
            </Paper>
          )}

      <Dialog open={goalDialogOpen} onClose={() => setGoalDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ textTransform: 'capitalize' }}>Target for {monthLabel}</DialogTitle>
        <DialogContent>
          <TextField
            label="Net Result Target (USD)"
            type="number"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGoalDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveGoal}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
