import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Stack, Chip,
  ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import { getExpenses, getExpenseCategories, createExpense, reclassifyExpense, createExpenseCategory } from '../../services/finances';
import type { Expense, ExpenseCategory, ChargeType } from '../../types';
import { diane } from '../../theme';

function formatFcfa(value: number) {
  return `${value.toLocaleString('fr-FR')} FCFA`;
}

const typeConfig: Record<ChargeType, { label: string; color: string; bg: string; help: string }> = {
  FIXE: {
    label: 'Fixe', color: diane.blue, bg: diane.blueLight,
    help: 'Récurrente et prévisible (loyer, salaires…) — entre dans le calcul du coût de revient par carton.',
  },
  VARIABLE: {
    label: 'Variable', color: diane.orange, bg: '#FEF3E6',
    help: "Dépend de l'activité (transport, emballage…) — réduit le résultat net mais pas le coût de revient.",
  },
  EXCEPTIONNEL: {
    label: 'Exceptionnel', color: diane.red, bg: '#FCEAEA',
    help: "Ponctuelle et hors exploitation courante — réduit quand même le résultat net, mais jamais le coût de revient.",
  },
};

const NEW_CATEGORY = '__new__';

export default function ChargesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [filter, setFilter] = useState<'ALL' | ChargeType>('ALL');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    categoryId: '', newCategoryName: '', description: '', amount: '', date: new Date().toISOString().slice(0, 10),
    chargeType: 'VARIABLE' as ChargeType,
  });

  function reload() {
    getExpenses(filter === 'ALL' ? {} : { chargeType: filter }).then(setExpenses);
  }

  function reloadCategories() {
    getExpenseCategories().then(setCategories);
  }

  useEffect(reloadCategories, []);
  useEffect(reload, [filter]);

  async function handleCreate() {
    if (!form.amount) return;
    let categoryId = form.categoryId;
    if (categoryId === NEW_CATEGORY) {
      if (!form.newCategoryName.trim()) return;
      const created = await createExpenseCategory(form.newCategoryName.trim());
      categoryId = created.id;
      reloadCategories();
    }
    if (!categoryId) return;
    await createExpense({
      categoryId,
      description: form.description || undefined,
      amount: Number(form.amount),
      date: form.date,
      chargeType: form.chargeType,
    });
    setOpen(false);
    setForm({ ...form, categoryId: '', newCategoryName: '', description: '', amount: '' });
    reload();
  }

  async function handleReclassify(exp: Expense, next: ChargeType) {
    await reclassifyExpense(exp.id, next);
    reload();
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h5" fontWeight={700}>Charges</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>Nouvelle charge</Button>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Les 3 types réduisent tous le résultat net — seul le type <strong>Fixe</strong> est réparti
        dans le coût de revient par carton (voir Finances &gt; Tarification).
      </Typography>

      <ToggleButtonGroup size="small" value={filter} exclusive onChange={(_, v) => v && setFilter(v)} sx={{ mb: 2 }}>
        <ToggleButton value="ALL">Toutes</ToggleButton>
        <ToggleButton value="FIXE">Fixe</ToggleButton>
        <ToggleButton value="VARIABLE">Variable</ToggleButton>
        <ToggleButton value="EXCEPTIONNEL">Exceptionnel</ToggleButton>
      </ToggleButtonGroup>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Catégorie</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Montant</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.map((e) => (
              <TableRow key={e.id} hover>
                <TableCell>{new Date(e.date).toLocaleDateString('fr-FR')}</TableCell>
                <TableCell>{e.category.name}</TableCell>
                <TableCell>{e.description ?? '—'}</TableCell>
                <TableCell align="right">{formatFcfa(e.amount)}</TableCell>
                <TableCell>
                  <Chip
                    label={typeConfig[e.chargeType].label}
                    size="small"
                    sx={{ bgcolor: typeConfig[e.chargeType].bg, color: typeConfig[e.chargeType].color, fontWeight: 700 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <TextField
                    select
                    size="small"
                    value={e.chargeType}
                    onChange={(ev) => handleReclassify(e, ev.target.value as ChargeType)}
                    sx={{ minWidth: 140 }}
                  >
                    {(Object.keys(typeConfig) as ChargeType[]).map((t) => (
                      <MenuItem key={t} value={t}>{typeConfig[t].label}</MenuItem>
                    ))}
                  </TextField>
                </TableCell>
              </TableRow>
            ))}
            {expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  Aucune charge enregistrée.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Nouvelle charge</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <ToggleButtonGroup
              value={form.chargeType}
              exclusive
              onChange={(_, v) => v && setForm({ ...form, chargeType: v })}
              fullWidth
              size="small"
            >
              {(Object.keys(typeConfig) as ChargeType[]).map((t) => (
                <ToggleButton key={t} value={t}>{typeConfig[t].label}</ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Typography variant="caption" color="text.secondary">
              {typeConfig[form.chargeType].help}
            </Typography>
            <TextField
              select
              label="Catégorie"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              fullWidth
            >
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
              <MenuItem value={NEW_CATEGORY}>+ Créer une nouvelle catégorie…</MenuItem>
            </TextField>
            {form.categoryId === NEW_CATEGORY && (
              <TextField
                label="Nom de la nouvelle catégorie"
                value={form.newCategoryName}
                onChange={(e) => setForm({ ...form, newCategoryName: e.target.value })}
                fullWidth
                autoFocus
              />
            )}
            <TextField
              label="Montant (FCFA)"
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              fullWidth
            />
            <TextField
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Description (optionnel)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleCreate}>Enregistrer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
