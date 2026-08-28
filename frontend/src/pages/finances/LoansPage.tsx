import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Stack, LinearProgress, Table, TableContainer, TableHead, TableRow, TableCell,
  TableBody, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert,
} from '@mui/material';
import { getLoanStatus, upsertLoan } from '../../services/loans';
import type { LoanStatus } from '../../types';
import { diane } from '../../theme';

function formatFcfa(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} FCFA`;
}
function formatDays(d: number | null) {
  if (d === null) return 'Pas assez de données récentes';
  if (d < 1) return "Aujourd'hui";
  return `~${Math.ceil(d)} jour${Math.ceil(d) > 1 ? 's' : ''}`;
}

export default function LoansPage() {
  const [status, setStatus] = useState<LoanStatus | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    totalAmount: '', constructionAmount: '', equipmentAmount: '', otherAmount: '', customProfitGoal: '',
  });

  function reload() {
    getLoanStatus()
      .then((s) => { setStatus(s); setNotFound(false); })
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
        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>Investissement</Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          Aucun prêt enregistré pour le moment.
        </Alert>
        <Button variant="contained" onClick={() => setOpen(true)}>Configurer mon prêt</Button>
        <LoanFormDialog open={open} form={form} setForm={setForm} onClose={() => setOpen(false)} onSave={handleSave} />
      </Box>
    );
  }

  if (!status) return null;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Investissement</Typography>
        <Button variant="outlined" onClick={() => setOpen(true)}>Modifier</Button>
      </Stack>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          Remboursement du prêt — {formatFcfa(status.loan.totalAmount)}
        </Typography>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Recettes encaissées : {formatFcfa(status.repayment.cumulativeRevenueCollected)}
          </Typography>
          <Typography variant="body2" fontWeight={700}>{status.repayment.percentRepaid.toFixed(1)}%</Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={status.repayment.percentRepaid}
          sx={{
            height: 10, borderRadius: 5, mb: 1, bgcolor: diane.blueLight,
            '& .MuiLinearProgress-bar': { bgcolor: diane.blue },
          }}
        />
        {status.repayment.isFullyRepaid ? (
          <Chip label="Prêt entièrement couvert par les recettes" size="small" sx={{ bgcolor: '#E7F7EE', color: diane.green, fontWeight: 700 }} />
        ) : (
          <Typography variant="caption" color="text.secondary">
            Reste à encaisser : {formatFcfa(status.repayment.remainingToSell)}
            {status.projections.daysToRepayLoan !== null && ` — estimation ${formatDays(status.projections.daysToRepayLoan)} au rythme actuel`}
          </Typography>
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          Objectif de bénéfice {status.loan.customProfitGoal ? '(personnalisé)' : '(= montant du prêt)'}
        </Typography>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Bénéfice net déjà réalisé : {formatFcfa(status.profitObjective.netProfitAlreadyRealized)}
          </Typography>
          <Typography variant="body2" fontWeight={700}>{status.profitObjective.percentAchieved.toFixed(1)}%</Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={status.profitObjective.percentAchieved}
          sx={{
            height: 10, borderRadius: 5, mb: 1, bgcolor: '#FCEAEA',
            '& .MuiLinearProgress-bar': { bgcolor: diane.green },
          }}
        />
        <Typography variant="caption" color="text.secondary">
          Reste à générer : {formatFcfa(status.profitObjective.remainingToGenerateProfit)}
          {status.projections.daysToProfitObjective !== null && ` — estimation ${formatDays(status.projections.daysToProfitObjective)} au rythme actuel`}
        </Typography>
      </Paper>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Paper sx={{ p: 2.5, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">Rythme récent (14 derniers jours)</Typography>
          <Typography variant="h6" fontWeight={700}>{formatFcfa(status.projections.avgDailyProfit)}/jour de bénéfice</Typography>
        </Paper>
        <Paper sx={{ p: 2.5, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">Jours de stock restants</Typography>
          <Typography variant="h6" fontWeight={700}>
            {status.projections.stockRunwayDays !== null ? `~${Math.ceil(status.projections.stockRunwayDays)} jours` : '—'}
          </Typography>
        </Paper>
        {status.projections.requiredDailyProfitBeforeStockOut !== null && (
          <Paper sx={{ p: 2.5, flex: 1 }}>
            <Typography variant="caption" color="text.secondary">Bénéfice/jour nécessaire avant rupture</Typography>
            <Typography variant="h6" fontWeight={700}>{formatFcfa(status.projections.requiredDailyProfitBeforeStockOut)}</Typography>
          </Paper>
        )}
      </Stack>

      {status.profitObjective.remainingToGenerateProfit > 0 && (
        <Paper>
          <Box sx={{ p: 2.5, pb: 0 }}>
            <Typography variant="subtitle1" fontWeight={700}>Par produit — pour atteindre l'objectif</Typography>
          </Box>
          <TableContainer>
<Table sx={{ mt: 1 }}>
            <TableHead>
              <TableRow>
                <TableCell>Produit</TableCell>
                <TableCell align="right">Cartons à vendre</TableCell>
                <TableCell align="right">Stock actuel</TableCell>
                <TableCell>Suffisant ?</TableCell>
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
                        label={p.stockSufficient ? 'Oui' : 'Non'}
                        size="small"
                        sx={{ bgcolor: p.stockSufficient ? '#E7F7EE' : '#FCEAEA', color: p.stockSufficient ? diane.green : diane.red, fontWeight: 700 }}
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
      <DialogTitle>Configurer le prêt</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Montant total du prêt (FCFA)" type="number" value={form.totalAmount}
            onChange={(e: any) => setForm({ ...form, totalAmount: e.target.value })} fullWidth
          />
          <TextField
            label="Dont construction (FCFA)" type="number" value={form.constructionAmount}
            onChange={(e: any) => setForm({ ...form, constructionAmount: e.target.value })} fullWidth
          />
          <TextField
            label="Dont équipement (FCFA)" type="number" value={form.equipmentAmount}
            onChange={(e: any) => setForm({ ...form, equipmentAmount: e.target.value })} fullWidth
          />
          <TextField
            label="Dont autre (FCFA)" type="number" value={form.otherAmount}
            onChange={(e: any) => setForm({ ...form, otherAmount: e.target.value })} fullWidth
          />
          <TextField
            label="Objectif de bénéfice personnalisé (optionnel)" type="number" value={form.customProfitGoal}
            onChange={(e: any) => setForm({ ...form, customProfitGoal: e.target.value })} fullWidth
            helperText="Laisse vide pour utiliser le montant du prêt comme objectif"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" onClick={onSave}>Enregistrer</Button>
      </DialogActions>
    </Dialog>
  );
}
