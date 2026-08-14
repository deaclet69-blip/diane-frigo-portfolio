import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { getProducts, createProduct, updateProduct } from '../../services/products';
import type { Product } from '../../types';

function formatFcfa(value: number) {
  return `${value.toLocaleString('fr-FR')} FCFA`;
}

const emptyForm = {
  name: '', referencePurchasePrice: '', referenceSalePrice: '', alertThreshold: '500',
};

export default function ProductsSettingsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);

  function reload() {
    getProducts(true).then(setProducts);
  }

  useEffect(reload, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      referencePurchasePrice: String(p.referencePurchasePrice),
      referenceSalePrice: String(p.referenceSalePrice),
      alertThreshold: String(p.alertThreshold),
    });
    setOpen(true);
  }

  async function handleSave() {
    const payload = {
      name: form.name,
      referencePurchasePrice: Number(form.referencePurchasePrice),
      referenceSalePrice: Number(form.referenceSalePrice),
      alertThreshold: Number(form.alertThreshold),
    };
    if (editing) {
      await updateProduct(editing.id, payload);
    } else {
      await createProduct(payload);
    }
    setOpen(false);
    reload();
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700}>Produits</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nouveau produit
        </Button>
      </Stack>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell align="right">Prix d'achat réf.</TableCell>
              <TableCell align="right">Prix de vente réf.</TableCell>
              <TableCell align="right">Seuil d'alerte</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                <TableCell align="right">{formatFcfa(p.referencePurchasePrice)}</TableCell>
                <TableCell align="right">{formatFcfa(p.referenceSalePrice)}</TableCell>
                <TableCell align="right">{p.alertThreshold}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openEdit(p)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editing ? 'Modifier le produit' : 'Nouveau produit'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nom du produit"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Prix d'achat de référence (FCFA)"
              type="number"
              value={form.referencePurchasePrice}
              onChange={(e) => setForm({ ...form, referencePurchasePrice: e.target.value })}
              fullWidth
            />
            <TextField
              label="Prix de vente de référence (FCFA)"
              type="number"
              value={form.referenceSalePrice}
              onChange={(e) => setForm({ ...form, referenceSalePrice: e.target.value })}
              fullWidth
              helperText="Modifiable ligne par ligne à la vente (négociation conservée)"
            />
            <TextField
              label="Seuil d'alerte (cartons)"
              type="number"
              value={form.alertThreshold}
              onChange={(e) => setForm({ ...form, alertThreshold: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSave}>Enregistrer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
