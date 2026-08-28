import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Stack, LinearProgress, Table, TableContainer, TableHead, TableRow, TableCell, TableBody,
  Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import { getFinanceSummary, getRecovery, setMonthlyGoal } from '../../services/finances';
import type { FinanceSummary, RecoveryStatus } from '../../types';
import { diane } from '../../theme';

function formatFcfa(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} FCFA`;
}

const monthLabel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

export default function FinancesPage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [recovery, setRecovery] = useState<RecoveryStatus | null>(null);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const navigate = useNavigate();

  function reload() {
    getFinanceSummary('month').then(setSummary);
    getRecovery().then(setRecovery);
  }

  useEffect(reload, []);

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
          <Typography variant="caption" color="text.secondary">CA du mois</Typography>
          <Typography variant="h5" fontWeight={700}>{summary ? formatFcfa(summary.revenue) : '…'}</Typography>
        </Paper>
        <Paper sx={{ p: 2.5, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">Coût des marchandises</Typography>
          <Typography variant="h5" fontWeight={700}>{summary ? formatFcfa(summary.costOfGoods) : '…'}</Typography>
        </Paper>
        <Paper sx={{ p: 2.5, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">Marge brute</Typography>
          <Typography variant="h5" fontWeight={700} sx={{ color: diane.green }}>
            {summary ? formatFcfa(summary.grossProfit) : '…'}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2.5, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">Résultat net (mois)</Typography>
          <Typography variant="h5" fontWeight={700} sx={{ color: summary && summary.netResult >= 0 ? diane.green : diane.red }}>
            {summary ? formatFcfa(summary.netResult) : '…'}
          </Typography>
        </Paper>
      </Stack>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
            Objectif de {monthLabel}
          </Typography>
          <Button size="small" startIcon={<EditIcon fontSize="small" />} onClick={openGoalDialog}>
            {recovery?.goal != null ? 'Modifier' : 'Fixer un objectif'}
          </Button>
        </Stack>

        {recovery?.goal != null ? (
          <>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Résultat net du mois : {summary ? formatFcfa(summary.netResult) : '…'}
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                Objectif : {formatFcfa(recovery.goal)}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={Math.max(0, goalProgress)}
              sx={{
                height: 10, borderRadius: 5, mb: 1, bgcolor: diane.blueLight,
                '& .MuiLinearProgress-bar': { bgcolor: goalProgress >= 100 ? diane.green : diane.blue },
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {goalProgress.toFixed(1)}% de l'objectif atteint ce mois-ci
            </Typography>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Aucun objectif fixé pour ce mois — clique sur "Fixer un objectif" pour te donner un chiffre à atteindre.
          </Typography>
        )}
      </Paper>

      {summary && (
        <Paper sx={{ p: 2.5, mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
            Charges du mois par type — les 3 réduisent le résultat net (détail dans "Charges")
          </Typography>
          <Stack direction="row" spacing={4}>
            <Box>
              <Typography variant="caption" sx={{ color: diane.blue, fontWeight: 700 }}>FIXE</Typography>
              <Typography variant="h6" fontWeight={700}>{formatFcfa(summary.chargesFixe)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: diane.orange, fontWeight: 700 }}>VARIABLE</Typography>
              <Typography variant="h6" fontWeight={700}>{formatFcfa(summary.chargesVariable)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: diane.red, fontWeight: 700 }}>EXCEPTIONNEL</Typography>
              <Typography variant="h6" fontWeight={700}>{formatFcfa(summary.chargesExceptionnel)}</Typography>
            </Box>
          </Stack>
        </Paper>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Paper
          sx={{ p: 2.5, flex: 1, cursor: 'pointer', '&:hover': { bgcolor: diane.blueLight } }}
          onClick={() => navigate('/finances/tarification')}
        >
          <Typography variant="subtitle2" fontWeight={700}>💰 Tarification</Typography>
          <Typography variant="body2" color="text.secondary">Coût de revient et prix suggérés par produit</Typography>
        </Paper>
        <Paper
          sx={{ p: 2.5, flex: 1, cursor: 'pointer', '&:hover': { bgcolor: diane.blueLight } }}
          onClick={() => navigate('/finances/pertes')}
        >
          <Typography variant="subtitle2" fontWeight={700}>📉 Pertes</Typography>
          <Typography variant="body2" color="text.secondary">Suivi des pertes et taux de perte du mois</Typography>
        </Paper>
        <Paper
          sx={{ p: 2.5, flex: 1, cursor: 'pointer', '&:hover': { bgcolor: diane.blueLight } }}
          onClick={() => navigate('/finances/investissement')}
        >
          <Typography variant="subtitle2" fontWeight={700}>🏦 Investissement</Typography>
          <Typography variant="body2" color="text.secondary">Suivi du remboursement de prêt</Typography>
        </Paper>
      </Stack>

      {recovery && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            Objectif de récupération <Typography component="span" variant="caption" color="text.secondary">(cumulé depuis le début)</Typography>
          </Typography>

          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Résultat actuel</Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: recovery.isPositive ? diane.green : diane.red }}>
                {formatFcfa(recovery.netResult)}
              </Typography>
            </Box>
            <Box textAlign="right">
              <Typography variant="caption" color="text.secondary">Montant restant</Typography>
              <Typography variant="h6" fontWeight={700}>{formatFcfa(recovery.amountRemaining)}</Typography>
            </Box>
          </Stack>

          <LinearProgress
            variant="determinate"
            value={recovery.progressPercent}
            sx={{
              height: 10, borderRadius: 5, mb: 1,
              bgcolor: '#FCEAEA',
              '& .MuiLinearProgress-bar': { bgcolor: recovery.isPositive ? diane.green : diane.red },
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {recovery.progressPercent.toFixed(1)}% — Objectif : atteindre un bénéfice net positif
          </Typography>

          {!recovery.isPositive && recovery.perProduct.length > 0 && (
            <TableContainer>
<Table size="small" sx={{ mt: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Produit</TableCell>
                  <TableCell align="right">Cartons à vendre pour combler l'écart</TableCell>
                  <TableCell align="right">Stock actuel</TableCell>
                  <TableCell>Stock suffisant ?</TableCell>
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
                          label={p.stockSufficient ? 'Oui' : 'Non'}
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
        <DialogTitle sx={{ textTransform: 'capitalize' }}>Objectif de {monthLabel}</DialogTitle>
        <DialogContent>
          <TextField
            label="Résultat net à atteindre (FCFA)"
            type="number"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGoalDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSaveGoal}>Enregistrer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
