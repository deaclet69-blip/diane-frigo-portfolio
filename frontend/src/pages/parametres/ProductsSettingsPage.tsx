import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, IconButton, MenuItem,
  Avatar, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ImageIcon from '@mui/icons-material/Image';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { getProducts, createProduct, updateProduct } from '../../services/products';
import { getCategories, createCategory, ProductCategory } from '../../services/categories';
import { resizeImageToDataUrl } from '../../utils/image';
import type { Product } from '../../types';

function formatFcfa(value: number) {
  return `${value.toLocaleString('fr-FR')} FCFA`;
}

const NEW_CATEGORY = '__new__';

const emptyForm = {
  name: '', referencePurchasePrice: '', referenceSalePrice: '', alertThreshold: '500',
  categoryId: '', newCategoryName: '', imageUrl: '',
};

export default function ProductsSettingsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageError, setImageError] = useState('');

  function reload() {
    getProducts(true).then(setProducts);
    getCategories().then(setCategories);
  }

  useEffect(reload, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setImageError('');
    setOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      referencePurchasePrice: String(p.referencePurchasePrice),
      referenceSalePrice: String(p.referenceSalePrice),
      alertThreshold: String(p.alertThreshold),
      categoryId: p.category?.id ?? '',
      newCategoryName: '',
      imageUrl: p.imageUrl ?? '',
    });
    setImageError('');
    setOpen(true);
  }

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permet de re-choisir le même fichier ensuite
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('Le fichier choisi n\'est pas une image.');
      return;
    }
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setForm((f) => ({ ...f, imageUrl: dataUrl }));
      setImageError('');
    } catch {
      setImageError('Impossible de lire cette image, réessaie avec une autre.');
    }
  }

  async function handleSave() {
    let categoryId = form.categoryId;
    if (categoryId === NEW_CATEGORY && form.newCategoryName.trim()) {
      const created = await createCategory(form.newCategoryName.trim());
      categoryId = created.id;
    }
    const payload = {
      name: form.name,
      referencePurchasePrice: Number(form.referencePurchasePrice),
      referenceSalePrice: Number(form.referenceSalePrice),
      alertThreshold: Number(form.alertThreshold),
      categoryId: categoryId || undefined,
      imageUrl: form.imageUrl, // '' = pas/plus d'image
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
        <TableContainer>
<Table>
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Nom</TableCell>
              <TableCell>Catégorie</TableCell>
              <TableCell align="right">Prix d'achat réf.</TableCell>
              <TableCell align="right">Prix de vente réf.</TableCell>
              <TableCell align="right">Seuil d'alerte</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell sx={{ width: 48 }}>
                  <Avatar variant="rounded" src={p.imageUrl ?? undefined} sx={{ width: 34, height: 34 }}>
                    <ImageIcon fontSize="small" />
                  </Avatar>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                <TableCell>{p.category?.name ?? '—'}</TableCell>
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
</TableContainer>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editing ? 'Modifier le produit' : 'Nouveau produit'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar variant="rounded" src={form.imageUrl || undefined} sx={{ width: 64, height: 64 }}>
                <ImageIcon />
              </Avatar>
              <Stack spacing={0.5}>
                <Button component="label" size="small" variant="outlined">
                  {form.imageUrl ? 'Changer la photo' : 'Ajouter une photo'}
                  <input type="file" accept="image/*" hidden onChange={handleImagePick} />
                </Button>
                {form.imageUrl && (
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteOutlineIcon fontSize="small" />}
                    onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                  >
                    Retirer la photo
                  </Button>
                )}
              </Stack>
            </Stack>
            {imageError && <Alert severity="warning">{imageError}</Alert>}

            <TextField
              label="Nom du produit"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
            />
            <TextField
              select
              label="Catégorie (optionnel)"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              fullWidth
              helperText="Utilisée pour 'Stock par catégorie' sur le tableau de bord"
            >
              <MenuItem value="">Aucune</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
              <MenuItem value={NEW_CATEGORY}>+ Créer une nouvelle catégorie…</MenuItem>
            </TextField>
            {form.categoryId === NEW_CATEGORY && (
              <TextField
                label="Nom de la nouvelle catégorie"
                value={form.newCategoryName}
                onChange={(e) => setForm({ ...form, newCategoryName: e.target.value })}
                fullWidth
                autoFocus
              />
            )}
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
