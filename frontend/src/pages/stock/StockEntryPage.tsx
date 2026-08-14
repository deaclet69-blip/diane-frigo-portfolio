import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Stack, TextField, MenuItem, Button, ToggleButtonGroup,
  ToggleButton, Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../../services/products';
import { createMovement } from '../../services/stock';
import type { Product } from '../../types';

type Mode = 'ENTRY' | 'INVENTORY_ADJUSTMENT' | 'EXIT';

const modeLabels: Record<Mode, string> = {
  ENTRY: 'Entrée de stock (réapprovisionnement)',
  INVENTORY_ADJUSTMENT: 'Ajustement inventaire (trouvé en trop)',
  EXIT: 'Sortie manuelle (perte / casse)',
};

export default function StockEntryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState('');
  const [mode, setMode] = useState<Mode>('ENTRY');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!productId || !quantity) return;
    setLoading(true);
    try {
      await createMovement({
        productId,
        movementType: mode,
        quantity: Number(quantity),
        date,
        unitCost: mode === 'ENTRY' && unitCost ? Number(unitCost) : undefined,
        note: note || undefined,
      });
      setSuccess(true);
      setQuantity('');
      setUnitCost('');
      setNote('');
      setTimeout(() => navigate(`/stock/${productId}`), 900);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box maxWidth={560}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Mouvement de stock</Typography>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_, v) => v && setMode(v)}
              fullWidth
              size="small"
            >
              {(Object.keys(modeLabels) as Mode[]).map((m) => (
                <ToggleButton key={m} value={m} sx={{ fontSize: 12 }}>{modeLabels[m]}</ToggleButton>
              ))}
            </ToggleButtonGroup>

            <TextField
              select
              label="Produit"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              fullWidth
            >
              {products.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="Quantité (cartons)"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              fullWidth
              inputProps={{ min: 1 }}
            />

            {mode === 'ENTRY' && (
              <TextField
                label="Prix d'achat unitaire (FCFA, optionnel)"
                type="number"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                fullWidth
                helperText="Sert au calcul du coût de revient dans Finances > Tarification. Laisse vide pour utiliser le prix de référence du produit."
                inputProps={{ min: 0 }}
              />
            )}

            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Note (optionnel)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />

            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">Mouvement enregistré.</Alert>}

            <Button type="submit" variant="contained" size="large" disabled={loading}>
              {loading ? 'Enregistrement…' : 'Enregistrer le mouvement'}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
