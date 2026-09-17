import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Checkbox,
  FormControlLabel,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Alert,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../../services/products';
import { getCustomers, checkCustomerName, createCustomerWithDedup } from '../../services/customers';
import { createSale } from '../../services/sales';
import type { Product, Customer } from '../../types';
import { diane } from '../../theme';

interface Line {
  productId: string;
  quantity: string;
  unitSalePrice: string;
}

import { usd } from '../../utils/currency';

function formatFcfa(value: number) {
  return usd(value);
}

export default function NewSalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [saleType, setSaleType] = useState<'DETAIL' | 'GROS'>('DETAIL');
  const [lines, setLines] = useState<Line[]>([{ productId: '', quantity: '', unitSalePrice: '' }]);
  const [discount, setDiscount] = useState('0');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partial' | 'credit'>('paid');
  const [amountPaid, setAmountPaid] = useState('');
  const [leaveInDeposit, setLeaveInDeposit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ invoiceNumber: string; total: number; profit: number } | null>(null);
  const [dedupPrompt, setDedupPrompt] = useState<{ matchName: string } | null>(null);
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

  /** Résout l'identité du client : sélection existante, ou création (avec
   * vérification de doublon si un nom libre a été tapé — demande utilisateur). */
  async function resolveCustomerId(forceDistinct = false): Promise<string | null> {
    if (customerId) return customerId;
    if (!newCustomerName.trim()) return null;

    if (!forceDistinct) {
      const { exists } = await checkCustomerName(newCustomerName.trim());
      if (exists) {
        setDedupPrompt({ matchName: newCustomerName.trim() });
        return null; // on attend la réponse de l'utilisateur dans la boîte de dialogue
      }
    }

    const created = await createCustomerWithDedup({
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim() || undefined,
      forceDistinct,
    });
    return created.id;
  }

  async function handleSubmit() {
    setError(null);
    const validLines = lines.filter((l) => l.productId && l.quantity);
    if (validLines.length === 0) {
      setError('Add at least one product.');
      return;
    }

    const resolvedId = await resolveCustomerId();
    if (dedupPrompt) return; // la boîte de dialogue va gérer la suite
    if (!resolvedId) {
      setError('Select or create a customer.');
      return;
    }

    await submitSale(resolvedId);
  }

  async function submitSale(finalCustomerId: string) {
    const validLines = lines.filter((l) => l.productId && l.quantity);
    setLoading(true);
    try {
      const { invoice, totalProfit } = await createSale({
        customerId: finalCustomerId,
        date,
        invoiceNumber: invoiceNumber.trim() || undefined,
        saleType,
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
      setError(err?.response?.data?.message ?? 'An error occurred.');
    } finally {
      setLoading(false);
    }
  }

  // "Oui, même personne" → on réutilise la fiche trouvée par son nom exact
  async function confirmSamePerson() {
    if (!dedupPrompt) return;
    const { matches } = await checkCustomerName(dedupPrompt.matchName);
    setDedupPrompt(null);
    if (matches[0]) await submitSale(matches[0].id);
  }

  // "Non, personne différente" → création forcée, avec suffixe si besoin
  async function confirmDifferentPerson() {
    if (!dedupPrompt) return;
    const created = await createCustomerWithDedup({
      name: dedupPrompt.matchName,
      phone: newCustomerPhone.trim() || undefined,
      forceDistinct: true,
    });
    setDedupPrompt(null);
    await submitSale(created.id);
  }

  if (result) {
    return (
      <Box maxWidth={480}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ color: diane.green, fontWeight: 700, mb: 1 }}>
            ✓ Sale recorded
          </Typography>
          <Stack spacing={1} sx={{ mt: 3, textAlign: 'left' }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">Invoice No.</Typography>
              <Typography fontWeight={700}>{result.invoiceNumber}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">Amount</Typography>
              <Typography fontWeight={700}>{formatFcfa(result.total)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">Profit</Typography>
              <Typography fontWeight={700} sx={{ color: diane.green }}>
                {formatFcfa(result.profit)}
              </Typography>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setResult(null);
                setLines([{ productId: '', quantity: '', unitSalePrice: '' }]);
                setInvoiceNumber('');
                setCustomerId(null);
                setNewCustomerName('');
                setNewCustomerPhone('');
              }}
            >
              New Sale
            </Button>
            <Button fullWidth variant="contained" onClick={() => navigate('/ventes')}>
              View Sales
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Box maxWidth={640}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        New Sale
      </Typography>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          CUSTOMER
        </Typography>
        <Autocomplete<Customer, false, false, true>
          options={customers}
          getOptionLabel={(c) => (typeof c === 'string' ? c : c.name)}
          onChange={(_, value) => {
            const customer = typeof value === 'string' ? null : value;
            setCustomerId(customer?.id ?? null);
            if (!customer) setNewCustomerName('');
          }}
          onInputChange={(_, value, reason) => {
            if (reason === 'input') {
              setNewCustomerName(value);
              setCustomerId(null);
            }
          }}
          freeSolo
          renderInput={(params) => <TextField {...params} placeholder="Search or create a customer…" fullWidth />}
        />
        {/* Visible uniquement quand on tape un NOUVEAU nom (pas une sélection existante) */}
        {!customerId && newCustomerName && (
          <TextField
            label="Phone (optional)"
            size="small"
            fullWidth
            sx={{ mt: 1.5 }}
            value={newCustomerPhone}
            onChange={(e) => setNewCustomerPhone(e.target.value)}
          />
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
          <TextField
            label="Sale Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Invoice No. (optional)"
            placeholder="Auto if empty"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            fullWidth
          />
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          Price type applied to this sale
        </Typography>
        <ToggleButtonGroup value={saleType} exclusive onChange={(_, v) => v && setSaleType(v)} size="small" fullWidth>
          <ToggleButton value="DETAIL">Retail</ToggleButton>
          <ToggleButton value="GROS">Wholesale</ToggleButton>
        </ToggleButtonGroup>
      </Paper>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          PRODUCTS
        </Typography>
        <Stack spacing={2}>
          {lines.map((line, i) => (
            <Stack key={i} direction="row" spacing={1.5} alignItems="center">
              <TextField
                select
                label="Product"
                value={line.productId}
                onChange={(e) =>
                  updateLine(i, {
                    productId: e.target.value,
                    unitSalePrice: line.unitSalePrice || String(priceForProduct(e.target.value)),
                  })
                }
                sx={{ flex: 2 }}
                size="small"
              >
                {products.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Qty"
                type="number"
                value={line.quantity}
                onChange={(e) => updateLine(i, { quantity: e.target.value })}
                sx={{ flex: 1 }}
                size="small"
                inputProps={{ min: 1 }}
              />
              <TextField
                label="Unit Price"
                type="number"
                value={line.unitSalePrice}
                onChange={(e) => updateLine(i, { unitSalePrice: e.target.value })}
                sx={{ flex: 1 }}
                size="small"
                helperText="Editable (negotiation)"
              />
              <IconButton onClick={() => removeLine(i)} disabled={lines.length === 1}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Stack>
          ))}
        </Stack>
        <Button startIcon={<AddIcon />} onClick={addLine} sx={{ mt: 2 }}>
          Add a product
        </Button>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between">
            <Typography color="text.secondary">Subtotal</Typography>
            <Typography>{formatFcfa(subtotal)}</Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography color="text.secondary">Discount</Typography>
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
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
          PAYMENT
        </Typography>
        <ToggleButtonGroup
          value={paymentStatus}
          exclusive
          onChange={(_, v) => v && setPaymentStatus(v)}
          size="small"
          fullWidth
        >
          <ToggleButton value="paid">Paid</ToggleButton>
          <ToggleButton value="partial">Partial</ToggleButton>
          <ToggleButton value="credit">Credit</ToggleButton>
        </ToggleButtonGroup>

        {paymentStatus === 'partial' && (
          <TextField
            label="Amount Paid Now"
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
          label="Leave products on deposit"
        />
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Button variant="contained" size="large" fullWidth onClick={handleSubmit} disabled={loading}>
        {loading ? 'Saving…' : 'RECORD SALE'}
      </Button>

      <Dialog open={!!dedupPrompt} onClose={() => setDedupPrompt(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Customer already exists</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            A customer named <strong>{dedupPrompt?.matchName}</strong> already exists. Is this the same person?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={confirmDifferentPerson}>No, different person</Button>
          <Button variant="contained" onClick={confirmSamePerson}>
            Yes, same person
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
