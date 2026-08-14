import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Stack, TextField, MenuItem, Button, IconButton, Checkbox,
  FormControlLabel, ToggleButtonGroup, ToggleButton, Divider, Alert, Autocomplete,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../../services/products';
import { getCustomers, createCustomer } from '../../services/customers';
import { createSale } from '../../services/sales';
import type { Product, Customer } from '../../types';
import { diane } from '../../theme';

interface Line {
  productId: string;
  quantity: string;
  unitSalePrice: string;
}

function formatFcfa(value: number) {
  return `${value.toLocaleString('fr-FR')} FCFA`;
}

export default function NewSalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState<Line[]>([{ productId: '', quantity: '', unitSalePrice: '' }]);
  const [discount, setDiscount] = useState('0');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partial' | 'credit'>('paid');
  const [amountPaid, setAmountPaid] = useState('');
  const [leaveInDeposit, setLeaveInDeposit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ invoiceNumber: string; total: number; profit: number } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getProducts().then(setProducts);
    getCustomers().then(setCustomers);
  }, []);

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, { productId: '', quantity: '', unitSalePrice: '' }]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function priceForProduct(productId: string) {
    return products.find((p) => p.id === productId)?.referenceSalePrice ?? 0;
  }

  const subtotal = lines.reduce((acc, l) => {
    const qty = Number(l.quantity) || 0;
    const price = Number(l.unitSalePrice) || 0;
    return acc + qty * price;
  }, 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0));

  async function handleSubmit() {
    setError(null);

    let finalCustomerId = customerId;
    if (!finalCustomerId && newCustomerName.trim()) {
      const created = await createCustomer({ name: newCustomerName.trim() });
      finalCustomerId = created.id;
    }
    if (!finalCustomerId) {
      setError('Sélectionne ou crée un client.');
      return;
    }
    const validLines = lines.filter((l) => l.productId && l.quantity);
    if (validLines.length === 0) {
      setError('Ajoute au moins un produit.');
      return;
    }

    setLoading(true);
    try {
      const { invoice, totalProfit } = await createSale({
        customerId: finalCustomerId,
        date,
        items: validLines.map((l) => ({
          productId: l.productId,
          quantity: Number(l.quantity),
          unitSalePrice: Number(l.unitSalePrice) || priceForProduct(l.productId),
        })),
        discount: Number(discount) || 0,
        paymentStatus,
        amountPaid: paymentStatus === 'partial' ? Number(amountPaid) || 0 : undefined,
        leaveInDeposit,
      });
      setResult({ invoiceNumber: invoice.invoiceNumber, total: Number(invoice.total), profit: totalProfit });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <Box maxWidth={480}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ color: diane.green, fontWeight: 700, mb: 1 }}>
            ✓ Vente enregistrée
          </Typography>
          <Stack spacing={1} sx={{ mt: 3, textAlign: 'left' }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">N° facture</Typography>
              <Typography fontWeight={700}>{result.invoiceNumber}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">Montant</Typography>
              <Typography fontWeight={700}>{formatFcfa(result.total)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">Bénéfice</Typography>
              <Typography fontWeight={700} sx={{ color: diane.green }}>{formatFcfa(result.profit)}</Typography>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
            <Button fullWidth variant="outlined" onClick={() => { setResult(null); setLines([{ productId: '', quantity: '', unitSalePrice: '' }]); }}>
              Nouvelle vente
            </Button>
            <Button fullWidth variant="contained" onClick={() => navigate('/ventes')}>
              Voir les ventes
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Box maxWidth={640}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Nouvelle vente</Typography>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>CLIENT</Typography>
        <Autocomplete<Customer, false, false, true>
          options={customers}
          getOptionLabel={(c) => (typeof c === 'string' ? c : c.name)}
          onChange={(_, value) => {
            const customer = typeof value === 'string' ? null : value;
            setCustomerId(customer?.id ?? null);
            if (!customer) setNewCustomerName('');
          }}
          onInputChange={(_, value, reason) => {
            if (reason === 'input') setNewCustomerName(value);
          }}
          freeSolo
          renderInput={(params) => (
            <TextField {...params} placeholder="Rechercher ou créer un client…" fullWidth />
          )}
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>PRODUITS</Typography>
        <Stack spacing={2}>
          {lines.map((line, i) => (
            <Stack key={i} direction="row" spacing={1.5} alignItems="center">
              <TextField
                select
                label="Produit"
                value={line.productId}
                onChange={(e) => updateLine(i, {
                  productId: e.target.value,
                  unitSalePrice: line.unitSalePrice || String(priceForProduct(e.target.value)),
                })}
                sx={{ flex: 2 }}
                size="small"
              >
                {products.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Qté"
                type="number"
                value={line.quantity}
                onChange={(e) => updateLine(i, { quantity: e.target.value })}
                sx={{ flex: 1 }}
                size="small"
                inputProps={{ min: 1 }}
              />
              <TextField
                label="Prix unit."
                type="number"
                value={line.unitSalePrice}
                onChange={(e) => updateLine(i, { unitSalePrice: e.target.value })}
                sx={{ flex: 1 }}
                size="small"
                helperText="Modifiable (négociation)"
              />
              <IconButton onClick={() => removeLine(i)} disabled={lines.length === 1}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Stack>
          ))}
        </Stack>
        <Button startIcon={<AddIcon />} onClick={addLine} sx={{ mt: 2 }}>
          Ajouter un produit
        </Button>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between">
            <Typography color="text.secondary">Sous-total</Typography>
            <Typography>{formatFcfa(subtotal)}</Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography color="text.secondary">Remise</Typography>
            <TextField
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              size="small"
              sx={{ width: 140 }}
              inputProps={{ min: 0 }}
            />
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography fontWeight={700}>Total</Typography>
            <Typography fontWeight={700}>{formatFcfa(total)}</Typography>
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>PAIEMENT</Typography>
        <ToggleButtonGroup value={paymentStatus} exclusive onChange={(_, v) => v && setPaymentStatus(v)} size="small" fullWidth>
          <ToggleButton value="paid">Payé</ToggleButton>
          <ToggleButton value="partial">Partiel</ToggleButton>
          <ToggleButton value="credit">Crédit</ToggleButton>
        </ToggleButtonGroup>

        {paymentStatus === 'partial' && (
          <TextField
            label="Montant versé maintenant"
            type="number"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
        )}

        <FormControlLabel
          sx={{ mt: 1 }}
          control={<Checkbox checked={leaveInDeposit} onChange={(e) => setLeaveInDeposit(e.target.checked)} />}
          label="Laisser les produits en dépôt"
        />
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Button variant="contained" size="large" fullWidth onClick={handleSubmit} disabled={loading}>
        {loading ? 'Enregistrement…' : 'ENREGISTRER LA VENTE'}
      </Button>
    </Box>
  );
}
