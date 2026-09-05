import { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Paper, InputAdornment, TextField, ToggleButtonGroup, ToggleButton,
  Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Stack, Button, Avatar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ImageIcon from '@mui/icons-material/Image';
import { useNavigate } from 'react-router-dom';
import { getStockOverview } from '../../services/stock';
import type { StockOverview, StockStatus } from '../../types';
import StatusBadge from '../../components/StatusBadge';

import { usd } from '../../utils/currency';

function formatFcfa(value: number) {
  return usd(value);
}

export default function StockListPage() {
  const [data, setData] = useState<StockOverview | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StockStatus | 'ALL'>('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    getStockOverview().then(setData);
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Stock</Typography>
          <Typography variant="body2" color="text.secondary">
            {data ? `${data.totals.totalStock.toLocaleString('en-US')} boxes · ${formatFcfa(data.totals.totalValue)}` : '…'}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/stock/entree')}>
          Add Stock
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          placeholder="Search a product…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ minWidth: 260 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <ToggleButtonGroup size="small" value={statusFilter} exclusive onChange={(_, v) => v && setStatusFilter(v)}>
          <ToggleButton value="ALL">All</ToggleButton>
          <ToggleButton value="OK">In Stock</ToggleButton>
          <ToggleButton value="ALERTE">Low Stock</ToggleButton>
          <ToggleButton value="RUPTURE">Out of Stock</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Paper>
        <TableContainer>
<Table>
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Stock Left</TableCell>
              <TableCell align="right">Value</TableCell>
              <TableCell align="right">Ref. Sale Price</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((item) => (
              <TableRow
                key={item.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/stock/${item.id}`)}
              >
                <TableCell sx={{ width: 48 }}>
                  <Avatar variant="rounded" src={item.imageUrl ?? undefined} sx={{ width: 34, height: 34 }}>
                    <ImageIcon fontSize="small" />
                  </Avatar>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                <TableCell>{item.category ?? '—'}</TableCell>
                <TableCell align="right">
                  {item.currentStock.toLocaleString('en-US')} {item.unit}
                  {item.currentStock !== 1 ? 's' : ''}
                </TableCell>
                <TableCell align="right">{formatFcfa(item.value)}</TableCell>
                <TableCell align="right">{formatFcfa(item.referenceSalePrice)}</TableCell>
                <TableCell><StatusBadge status={item.status} /></TableCell>
              </TableRow>
            ))}
            {data && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No products match your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
</TableContainer>
      </Paper>
    </Box>
  );
}
