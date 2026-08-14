import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Stack, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { getProductDetail } from '../../services/stock';
import type { ProductDetail } from '../../types';
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
  const navigate = useNavigate();

  useEffect(() => {
    if (id) getProductDetail(id).then(setData);
  }, [id]);

  if (!data) return null;

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
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Quantité</TableCell>
              <TableCell>Note</TableCell>
              <TableCell>Saisi par</TableCell>
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
                <TableCell>{m.note ?? '—'}</TableCell>
                <TableCell>{m.createdBy?.name ?? '—'}</TableCell>
              </TableRow>
            ))}
            {data.movements.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  Aucun mouvement enregistré pour ce produit.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
