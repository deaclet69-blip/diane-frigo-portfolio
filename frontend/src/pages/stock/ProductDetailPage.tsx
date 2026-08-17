import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Stack, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate, useParams } from 'react-router-dom';
import { getProductDetail, updateMovement } from '../../services/stock';
import type { ProductDetail, StockMovement } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import { diane } from '../../theme';

function formatFcfa(value: number) {
  return `${value.toLocaleString('fr-FR')} FCFA`;
}

const movementLabels: Record<string, { label: string; color: string }> = {
  ENTRY: { label: 'Entrée', color: diane.green },
  EXIT: { label: 'Sortie', color: diane.red },
  INVENTORY_ADJUSTMENT: { label: 'Ajustement inventaire', color: diane.blue },
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
      setEditError(err?.response?.data?.message ?? 'Correction impossible.');
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
          <Typography variant="caption" color="text.secondary">Stock actuel</Typography>
          <Typography variant="h5" fontWeight={700}>
            {data.currentStock.toLocaleString('fr-FR')} {data.product.unit}
            {data.currentStock !== 1 ? 's' : ''}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2.5, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">Valeur du stock</Typography>
          <Typography variant="h5" fontWeight={700}>{formatFcfa(data.value)}</Typography>
        </Paper>
        <Paper sx={{ p: 2.5, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">Prix d'achat réf. / vente réf.</Typography>
          <Typography variant="h5" fontWeight={700}>
            {formatFcfa(data.product.referencePurchasePrice)} / {formatFcfa(data.product.referenceSalePrice)}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2.5, flex: 1 }}>
          <Typography variant="caption" color="text.secondary">Seuil d'alerte</Typography>
          <Typography variant="h5" fontWeight={700}>
            {data.product.alertThreshold.toLocaleString('fr-FR')} {data.product.unit}s
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
          <Typography variant="subtitle1" fontWeight={700}>Historique des mouvements</Typography>
          <Typography variant="caption" color="text.secondary">
            Une erreur de saisie ? Clique sur le crayon pour corriger la quantité.
          </Typography>
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Quantité</TableCell>
              <TableCell>Fournisseur</TableCell>
              <TableCell>Note</TableCell>
              <TableCell>Saisi par</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.movements.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{new Date(m.date).toLocaleDateString('fr-FR')}</TableCell>
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
                  Aucun mouvement enregistré pour ce produit.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={!!editing} onClose={() => setEditing(null)} fullWidth maxWidth="xs">
        <DialogTitle>Corriger la quantité</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {editing && movementLabels[editing.movementType].label} du{' '}
              {editing && new Date(editing.date).toLocaleDateString('fr-FR')}
            </Typography>
            <TextField
              label="Quantité correcte (cartons)"
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
          <Button onClick={() => setEditing(null)}>Annuler</Button>
          <Button variant="contained" onClick={handleSaveEdit}>Corriger</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
