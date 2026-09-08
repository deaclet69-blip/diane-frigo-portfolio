import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, IconButton, MenuItem,
  Avatar, Alert, useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ImageIcon from '@mui/icons-material/Image';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { getProducts, createProduct, updateProduct } from '../../services/products';
import { getCategories, createCategory, ProductCategory } from '../../services/categories';
import { resizeImageToDataUrl } from '../../utils/image';
import type { Product } from '../../types';

import { usd } from '../../utils/currency';

function formatFcfa(value: number) {
  return usd(value);
}

const NEW_CATEGORY = '__new__';

const emptyForm = {
  name: '', referencePurchasePrice: '', referenceSalePrice: '', alertThreshold: '500',
  categoryId: '', newCategoryName: '', imageUrl: '',
};

export default function ProductsSettingsPage() {
  const isMobile = useMediaQuery('(max-width:599px)');
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
      setImageError('The selected file is not an image.');
      return;
    }
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setForm((f) => ({ ...f, imageUrl: dataUrl }));
      setImageError('');
    } catch {
      setImageError('Could not read this image, try another one.');
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
        <Typography variant="subtitle1" fontWeight={700}>Products</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          New Product
        </Button>
      </Stack>

      {isMobile ? (
        <Stack spacing={1.5}>
          {products.map((p) => (
            <Paper key={p.id} variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Avatar variant="rounded" src={p.imageUrl ?? undefined} sx={{ width: 44, height: 44 }}>
                  <ImageIcon fontSize="small" />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Typography fontWeight={700}>{p.name}</Typography>
                    <IconButton size="small" onClick={() => openEdit(p)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">{p.category?.name ?? '—'}</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Purchase price: {formatFcfa(p.referencePurchasePrice)}
                  </Typography>
                  <Typography variant="body2">
                    Sale price: {formatFcfa(p.referenceSalePrice)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Alert threshold: {p.alertThreshold} boxes
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          ))}
          {products.length === 0 && (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
              No products yet.
            </Paper>
          )}
        </Stack>
      ) : (
      <Paper>
        <TableContainer>
<Table>
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Ref. Purchase Price</TableCell>
              <TableCell align="right">Ref. Sale Price</TableCell>
              <TableCell align="right">Alert Threshold</TableCell>
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
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editing ? 'Edit Product' : 'New Product'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar variant="rounded" src={form.imageUrl || undefined} sx={{ width: 64, height: 64 }}>
                <ImageIcon />
              </Avatar>
              <Stack spacing={0.5}>
                <Button component="label" size="small" variant="outlined">
                  {form.imageUrl ? 'Change Photo' : 'Add Photo'}
                  <input type="file" accept="image/*" hidden onChange={handleImagePick} />
                </Button>
                {form.imageUrl && (
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteOutlineIcon fontSize="small" />}
                    onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                  >
                    Remove Photo
                  </Button>
                )}
              </Stack>
            </Stack>
            {imageError && <Alert severity="warning">{imageError}</Alert>}

            <TextField
              label="Product Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
            />
            <TextField
              select
              label="Category (optional)"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              fullWidth
              helperText="Used for 'Stock by Category' on the dashboard"
            >
              <MenuItem value="">None</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
              <MenuItem value={NEW_CATEGORY}>+ Create a new category…</MenuItem>
            </TextField>
            {form.categoryId === NEW_CATEGORY && (
              <TextField
                label="New Category Name"
                value={form.newCategoryName}
                onChange={(e) => setForm({ ...form, newCategoryName: e.target.value })}
                fullWidth
                autoFocus
              />
            )}
            <TextField
              label="Reference Purchase Price (USD)"
              type="number"
              value={form.referencePurchasePrice}
              onChange={(e) => setForm({ ...form, referencePurchasePrice: e.target.value })}
              fullWidth
            />
            <TextField
              label="Reference Sale Price (USD)"
              type="number"
              value={form.referenceSalePrice}
              onChange={(e) => setForm({ ...form, referenceSalePrice: e.target.value })}
              fullWidth
              helperText="Editable per line at sale time (negotiation preserved)"
            />
            <TextField
              label="Alert Threshold (boxes)"
              type="number"
              value={form.alertThreshold}
              onChange={(e) => setForm({ ...form, alertThreshold: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
