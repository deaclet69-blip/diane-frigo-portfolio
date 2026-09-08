import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Stack, Chip,
  ToggleButtonGroup, ToggleButton, useMediaQuery,
} from '@mui/material';
import { getExpenses, getExpenseCategories, createExpense, reclassifyExpense, createExpenseCategory } from '../../services/finances';
import type { Expense, ExpenseCategory, ChargeType } from '../../types';
import { diane } from '../../theme';

import { usd } from '../../utils/currency';

function formatFcfa(value: number) {
  return usd(value);
}

const typeConfig: Record<ChargeType, { label: string; color: string; bg: string; help: string }> = {
  FIXE: {
    label: 'Fixed', color: diane.blue, bg: diane.blueLight,
    help: 'Recurring and predictable (rent, salaries…) — factored into the cost per box.',
  },
  VARIABLE: {
    label: 'Variable', color: diane.orange, bg: '#FEF3E6',
    help: "Depends on business activity (transport, packaging…) — reduces net profit but not the cost basis.",
  },
  EXCEPTIONNEL: {
    label: 'One-time', color: diane.red, bg: '#FCEAEA',
    help: "One-off and outside regular operations — still reduces net profit, but never the cost basis.",
  },
};

const NEW_CATEGORY = '__new__';

export default function ChargesPage() {
  const isMobile = useMediaQuery('(max-width:599px)');
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
        <Typography variant="h5" fontWeight={700}>Expenses</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>New Expense</Button>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        All 3 types reduce net profit — only the <strong>Fixed</strong> type is factored
        into the cost per box (see Finances &gt; Profitability).
      </Typography>

      <ToggleButtonGroup size="small" value={filter} exclusive onChange={(_, v) => v && setFilter(v)} sx={{ mb: 2 }}>
        <ToggleButton value="ALL">All</ToggleButton>
        <ToggleButton value="FIXE">Fixed</ToggleButton>
        <ToggleButton value="VARIABLE">Variable</ToggleButton>
        <ToggleButton value="EXCEPTIONNEL">One-time</ToggleButton>
      </ToggleButtonGroup>

      {isMobile ? (
        <Stack spacing={1.5} sx={{ pb: 15 }}>
          {expenses.map((e) => (
            <Paper key={e.id} variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(e.date).toLocaleDateString('en-US')}
                  </Typography>
                  <Typography fontWeight={700}>{e.category.name}</Typography>
                </Box>
                <Typography variant="h6" fontWeight={700}>{formatFcfa(e.amount)}</Typography>
              </Stack>
              {e.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {e.description}
                </Typography>
              )}
              <TextField
                select
                size="small"
                value={e.chargeType}
                onChange={(ev) => handleReclassify(e, ev.target.value as ChargeType)}
                sx={{ mt: 1.5, minWidth: 160 }}
                InputProps={{
                  startAdornment: (
                    <Chip
                      label={typeConfig[e.chargeType].label}
                      size="small"
                      sx={{ bgcolor: typeConfig[e.chargeType].bg, color: typeConfig[e.chargeType].color, fontWeight: 700, mr: 0.5 }}
                    />
                  ),
                }}
              >
                {(Object.keys(typeConfig) as ChargeType[]).map((t) => (
                  <MenuItem key={t} value={t}>{typeConfig[t].label}</MenuItem>
                ))}
              </TextField>
            </Paper>
          ))}
          {expenses.length === 0 && (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
              No expenses recorded.
            </Paper>
          )}
        </Stack>
      ) : (
      <Paper>
        <TableContainer>
<Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.map((e) => (
              <TableRow key={e.id} hover>
                <TableCell>{new Date(e.date).toLocaleDateString('en-US')}</TableCell>
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
                  No expenses recorded.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
</TableContainer>
      </Paper>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>New Expense</DialogTitle>
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
              label="Category"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              fullWidth
            >
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
              <MenuItem value={NEW_CATEGORY}>+ Create a new category…</MenuItem>
            </TextField>
            {form.categoryId === NEW_CATEGORY && (
              <TextField
                label="New Category Name"
                value={form.newCategoryName}
                onChange={(e) => setForm({ ...form, newCategoryName: e.target.value })}
                fullWidth
                autoFocus
              />
            )}
            <TextField
              label="Amount (USD)"
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
              label="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
