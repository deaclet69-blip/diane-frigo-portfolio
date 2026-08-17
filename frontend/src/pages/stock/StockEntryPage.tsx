import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Stack, TextField, MenuItem, Button, ToggleButtonGroup,
  ToggleButton, Alert, Autocomplete,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../../services/products';
import { createMovement } from '../../services/stock';
import { getSuppliers, createSupplier } from '../../services/suppliers';
import type { Product, Supplier } from '../../types';

type Mode = 'ENTRY' | 'INVENTORY_ADJUSTMENT' | 'EXIT';

const modeLabels: Record<Mode, string> = {
  ENTRY: 'Entrée de stock (réapprovisionnement)',
  INVENTORY_ADJUSTMENT: 'Ajustement inventaire (trouvé en trop)',
  EXIT: 'Sortie manuelle (perte / casse)',
};

export default function StockEntryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [productId, setProductId] = useState('');
  const [mode, setMode] = useState<Mode>('ENTRY');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [supplier, setSupplier] = useState<Supplier | string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getProducts().then(setProducts);
    getSuppliers().then(setSuppliers);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!productId || !quantity) return;
    setLoading(true);
    try {
      let supplierId: string | undefined;
      if (mode === 'ENTRY' && supplier) {
        if (typeof supplier === 'string') {
          const created = await createSupplier(supplier.trim());
          supplierId = created.id;
        } else {
          supplierId = supplier.id;
        }
      }

      await createMovement({
        productId,
        movementType: mode,
        quantity: Number(quantity),
        date,
        unitCost: mode === 'ENTRY' && unitCost ? Number(unitCost) : undefined,
        supplierId,
        note: note || undefined,
      });
      setSuccess(true);
      setQuantity('');
      setUnitCost('');
      setSupplier(null);
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
              <>
                <TextField
                  label="Prix d'achat unitaire (FCFA, optionnel)"
                  type="number"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  fullWidth
                  helperText="Sert au calcul du coût de revient dans Finances > Tarification. Laisse vide pour utiliser le prix de référence du produit."
                  inputProps={{ min: 0 }}
                />
                <Autocomplete
                  freeSolo
                  options={suppliers}
                  getOptionLabel={(s) => (typeof s === 'string' ? s : s.name)}
                  value={supplier}
                  onChange={(_, value) => setSupplier(value)}
                  onInputChange={(_, value, reason) => {
                    if (reason === 'input') setSupplier(value);
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Fournisseur (optionnel)" placeholder="Rechercher ou créer un fournisseur…" />
                  )}
                />
              </>
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
