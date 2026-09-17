import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  TextField,
  MenuItem,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
  Autocomplete,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../../services/products';
import { createMovement } from '../../services/stock';
import { getSuppliers, createSupplier } from '../../services/suppliers';
import type { Product, Supplier } from '../../types';

type Mode = 'ENTRY' | 'INVENTORY_ADJUSTMENT' | 'EXIT';

const modeLabels: Record<Mode, string> = {
  ENTRY: 'Restock',
  INVENTORY_ADJUSTMENT: 'Adjustment',
  EXIT: 'Manual Exit',
};
const modeHelp: Record<Mode, string> = {
  ENTRY: 'Stock entry — restocking from a supplier.',
  INVENTORY_ADJUSTMENT: 'Inventory adjustment — extra stock found during a count.',
  EXIT: 'Manual exit — loss or breakage outside a sale.',
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
      setError(err?.response?.data?.message ?? 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box maxWidth={560}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        Stock Movement
      </Typography>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <Box sx={{ overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
              <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={(_, v) => v && setMode(v)}
                size="small"
                sx={{ width: 'max-content' }}
              >
                {(Object.keys(modeLabels) as Mode[]).map((m) => (
                  <ToggleButton key={m} value={m} sx={{ fontSize: 13, whiteSpace: 'nowrap', px: 2 }}>
                    {modeLabels[m]}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5 }}>
              {modeHelp[mode]}
            </Typography>

            <TextField
              select
              label="Product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              fullWidth
              size="small"
            >
              {products.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Quantity (boxes)"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              fullWidth
              size="small"
              inputProps={{ min: 1 }}
            />

            {mode === 'ENTRY' && (
              <>
                <TextField
                  label="Unit Purchase Price (USD, optional)"
                  type="number"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  fullWidth
                  size="small"
                  helperText="Used to calculate cost basis in Finances > Profitability. Leave empty to use the product's reference price."
                  inputProps={{ min: 0 }}
                />
                <Autocomplete
                  freeSolo
                  size="small"
                  options={suppliers}
                  getOptionLabel={(s) => (typeof s === 'string' ? s : s.name)}
                  value={supplier}
                  onChange={(_, value) => setSupplier(value)}
                  onInputChange={(_, value, reason) => {
                    if (reason === 'input') setSupplier(value);
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Supplier (optional)" placeholder="Search or create a supplier…" />
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
              size="small"
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              fullWidth
              size="small"
              multiline
              minRows={2}
            />

            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">Movement recorded.</Alert>}

            <Button type="submit" variant="contained" size="large" disabled={loading}>
              {loading ? 'Saving…' : 'Save Movement'}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
