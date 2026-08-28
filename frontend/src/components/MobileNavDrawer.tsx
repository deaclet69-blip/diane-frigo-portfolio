import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Box, Typography, Stack } from '@mui/material';
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
import { diane } from '../theme';

const navItems = [
  { label: 'Tableau de bord', icon: <SpaceDashboardIcon />, to: '/' },
  { label: 'Ventes', icon: <ShoppingCartIcon />, to: '/ventes' },
  { label: 'Stock', icon: <Inventory2Icon />, to: '/stock' },
  { label: 'Produits', icon: <CategoryIcon />, to: '/parametres/produits' },
  { label: 'Clients', icon: <PeopleIcon />, to: '/clients' },
  { label: 'Dépôts clients', icon: <AccountBalanceWalletIcon />, to: '/depots' },
  { label: 'Achats', icon: <LocalShippingIcon />, to: '/stock/entree' },
  { label: 'Dépenses / Charges', icon: <ReceiptLongIcon />, to: '/charges' },
  { label: 'Pertes', icon: <TrendingDownIcon />, to: '/finances/pertes' },
  { label: 'Rentabilité', icon: <InsightsIcon />, to: '/finances/tarification' },
  { label: 'Rapports', icon: <BarChartIcon />, to: '/rapports' },
  { label: 'Investissement', icon: <SavingsIcon />, to: '/finances/investissement' },
  { label: 'Assistant IA', icon: <AutoAwesomeIcon />, to: '/assistant' },
  { label: 'Utilisateurs', icon: <PersonOutlineIcon />, to: '/parametres/utilisateurs' },
  { label: 'Paramètres', icon: <SettingsIcon />, to: '/parametres/produits' },
];

export default function MobileNavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{ '& .MuiDrawer-paper': { width: 260, bgcolor: diane.navy, color: '#fff' } }}
    >
      <Stack direction="row" alignItems="center" spacing={1.2} sx={{ px: 2.25, py: 2 }}>
        <Box component="img" src="/favicon.svg" alt="DIANE FRIGO" sx={{ width: 30, height: 30, borderRadius: '8px' }} />
        <Typography variant="body2" sx={{ fontWeight: 800, fontSize: 14 }}>DIANE FRIGO</Typography>
      </Stack>
      <List sx={{ px: 1 }}>
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
    </Drawer>
  );
}
