import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Box, Typography, Stack, IconButton, Tooltip } from '@mui/material';
import { NavLink } from 'react-router-dom';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CategoryIcon from '@mui/icons-material/Category';
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import InsightsIcon from '@mui/icons-material/Insights';
import BarChartIcon from '@mui/icons-material/BarChart';
import SavingsIcon from '@mui/icons-material/Savings';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import { diane } from '../theme';
import { useColorMode } from '../colorMode';
import { getCurrentUser } from '../services/auth';

const navItems = [
  { label: 'Dashboard', icon: <SpaceDashboardIcon />, to: '/' },
  { label: 'Sales', icon: <ShoppingCartIcon />, to: '/ventes' },
  { label: 'Stock', icon: <Inventory2Icon />, to: '/stock' },
  { label: 'Products', icon: <CategoryIcon />, to: '/parametres/produits' },
  { label: 'Customers', icon: <PeopleIcon />, to: '/clients' },
  { label: 'Customer Deposits', icon: <AccountBalanceWalletIcon />, to: '/depots' },
  { label: 'Purchases', icon: <LocalShippingIcon />, to: '/stock/entree' },
  { label: 'Expenses', icon: <ReceiptLongIcon />, to: '/charges' },
  { label: 'Losses', icon: <TrendingDownIcon />, to: '/finances/pertes' },
  { label: 'Profitability', icon: <InsightsIcon />, to: '/finances/tarification' },
  { label: 'Reports', icon: <BarChartIcon />, to: '/rapports' },
  { label: 'Investment', icon: <SavingsIcon />, to: '/finances/investissement' },
  { label: 'AI Assistant', icon: <AutoAwesomeIcon />, to: '/assistant' },
  { label: 'Users', icon: <PersonOutlineIcon />, to: '/parametres/utilisateurs' },
  { label: 'Settings', icon: <SettingsIcon />, to: '/parametres/produits' },
];

export default function MobileNavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mode, toggle } = useColorMode();
  const user = getCurrentUser();

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{ '& .MuiDrawer-paper': { width: 260, bgcolor: diane.navy, color: '#fff', display: 'flex', flexDirection: 'column' } }}
    >
      <Stack direction="row" alignItems="center" spacing={1.2} sx={{ px: 2.25, py: 2 }}>
        <Box component="img" src="/favicon.svg" alt="DIANE FRIGO" sx={{ width: 30, height: 30, borderRadius: '8px' }} />
        <Typography variant="body2" sx={{ fontWeight: 800, fontSize: 14 }}>DIANE FRIGO</Typography>
      </Stack>
      <List sx={{ px: 1, flexGrow: 1, overflowY: 'auto' }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.to + item.label}
            component={NavLink}
            to={item.to}
            end={item.to === '/'}
            onClick={onClose}
            sx={{
              borderRadius: 2, mb: 0.25, color: 'rgba(255,255,255,0.75)',
              '&.active': { bgcolor: diane.indigo, color: '#fff' },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 13.5 }} />
          </ListItemButton>
        ))}
      </List>

      <Stack
        direction="row" alignItems="center" spacing={1.2}
        sx={{ px: 2, py: 1.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }} noWrap>
            {user?.email ?? ''}
          </Typography>
        </Box>
        <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          <IconButton size="small" onClick={toggle} sx={{ color: 'rgba(255,255,255,0.75)' }}>
            {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Stack>
    </Drawer>
  );
}
