import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Stack, Table, TableContainer, TableHead, TableRow, TableCell, TableBody,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate, useParams } from 'react-router-dom';
import { getProductDetail, updateMovement } from '../../services/stock';
import type { ProductDetail, StockMovement } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import { diane } from '../../theme';

import { usd } from '../../utils/currency';

function formatFcfa(value: number) {
  return usd(value);
}

const movementLabels: Record<string, { label: string; color: string }> = {
  ENTRY: { label: 'Entry', color: diane.green },
  EXIT: { label: 'Exit', color: diane.red },
  INVENTORY_ADJUSTMENT: { label: 'Inventory Adjustment', color: diane.blue },
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ProductDetail | null>(null);
  const [editing, setEditing] = useState<StockMovement | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const navigate = useNavigate();

  function reload() {
    if (id) getProductDetail(id).then(setData);
  }
  useEffect(reload, [id]);

  function openEdit(m: StockMovement) {
    setEditing(m);
    setEditQuantity(String(m.quantity));
    setEditError(null);
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setEditError(null);
    try {
      await updateMovement(editing.id, { quantity: Number(editQuantity) });
      setEditing(null);
      reload();
    } catch (err: any) {
      setEditError(err?.response?.data?.message ?? 'Correction failed.');
    }
  }

  if (!data) return null;

  // On ne peut corriger que les mouvements manuels — jamais ceux liés à une
  // facture (il faut annuler la facture) ou à un import Excel.
  const isEditable = (m: StockMovement) => m.referenceType !== 'invoice' && m.referenceType !== 'excel_import';

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate('/stock')} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={700}>{data.product.name}</Typography>
        <StatusBadge status={data.status} />
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Paper sx={{ p: 2.5, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">Current Stock</Typography>
          <Typography variant="h5" fontWeight={700}>
            {data.currentStock.toLocaleString('en-US')} {data.product.unit}
            {data.currentStock !== 1 ? 's' : ''}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2.5, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">Stock Value</Typography>
          <Typography variant="h5" fontWeight={700}>{formatFcfa(data.value)}</Typography>
        </Paper>
        <Paper sx={{ p: 2.5, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">Ref. Purchase / Sale Price</Typography>
          <Typography variant="h5" fontWeight={700}>
            {formatFcfa(data.product.referencePurchasePrice)} / {formatFcfa(data.product.referenceSalePrice)}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2.5, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">Alert Threshold</Typography>
          <Typography variant="h5" fontWeight={700}>
            {data.product.alertThreshold.toLocaleString('en-US')} {data.product.unit}s
          </Typography>
        </Paper>
      </Stack>

      {data.note && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: diane.blueLight }}>
          <Typography variant="body2" color="text.secondary">{data.note}</Typography>
        </Paper>
      )}

      <Paper>
        <Box sx={{ p: 2.5, pb: 0 }}>
          <Typography variant="subtitle1" fontWeight={700}>Movement History</Typography>
          <Typography variant="caption" color="text.secondary">
            Made a mistake? Click the pencil icon to correct the quantity.
          </Typography>
        </Box>
        <TableContainer>
<Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Note</TableCell>
              <TableCell>Entered By</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.movements.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{new Date(m.date).toLocaleDateString('en-US')}</TableCell>
                <TableCell>
                  <Chip
                    label={movementLabels[m.movementType].label}
                    size="small"
                    sx={{ bgcolor: 'transparent', color: movementLabels[m.movementType].color, fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell align="right">
                  {m.movementType === 'EXIT' ? '-' : '+'}{m.quantity}
                </TableCell>
                <TableCell>{m.supplier?.name ?? '—'}</TableCell>
                <TableCell>{m.note ?? '—'}</TableCell>
                <TableCell>{m.createdBy?.name ?? '—'}</TableCell>
                <TableCell align="right">
                  {isEditable(m) && (
                    <IconButton size="small" onClick={() => openEdit(m)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {data.movements.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No movements recorded for this product.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
</TableContainer>
      </Paper>

      <Dialog open={!!editing} onClose={() => setEditing(null)} fullWidth maxWidth="xs">
        <DialogTitle>Correct the Quantity</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {editing && movementLabels[editing.movementType].label} du{' '}
              {editing && new Date(editing.date).toLocaleDateString('en-US')}
            </Typography>
            <TextField
              label="Correct Quantity (boxes)"
              type="number"
              value={editQuantity}
              onChange={(e) => setEditQuantity(e.target.value)}
              fullWidth
              inputProps={{ min: 1 }}
            />
            {editError && <Alert severity="error">{editError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit}>Correct</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
