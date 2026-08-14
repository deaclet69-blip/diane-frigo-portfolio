import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography, Button, Stack, Tooltip, useMediaQuery } from '@mui/material';
import { NavLink, useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/SpaceDashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory2';
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BarChartIcon from '@mui/icons-material/BarChart';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import { diane } from '../theme';

const FULL_WIDTH = 260;
const COMPACT_WIDTH = 76;

// Structure calquée sur la maquette : 8 sections principales.
const navItems = [
  { label: 'Tableau de bord', icon: <DashboardIcon />, to: '/' },
  { label: 'Ventes', icon: <ShoppingCartIcon />, to: '/ventes' },
  { label: 'Stock', icon: <InventoryIcon />, to: '/stock' },
  { label: 'Clients', icon: <PeopleIcon />, to: '/clients' },
  { label: 'Dépôts', icon: <AccountBalanceWalletIcon />, to: '/depots' },
  { label: 'Finances', icon: <AttachMoneyIcon />, to: '/finances' },
  { label: 'Rapports', icon: <BarChartIcon />, to: '/rapports' },
  { label: 'Charges', icon: <ReceiptLongIcon />, to: '/charges' },
  { label: 'Assistant IA', icon: <AutoAwesomeIcon />, to: '/assistant' },
  // Pointe directement sur Produits tant que les autres pages de Paramètres
  // (Utilisateurs, Rôles, Général) n'existent pas encore.
  { label: 'Paramètres', icon: <SettingsIcon />, to: '/parametres/produits' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  // Tablette (§17) : sidebar compacte, icônes seules, tooltips au survol.
  const isCompact = useMediaQuery('(max-width:1100px)');
  const width = isCompact ? COMPACT_WIDTH : FULL_WIDTH;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width,
        flexShrink: 0,
        display: { xs: 'none', sm: 'block' }, // masquée sur mobile — remplacée par MobileBottomNav
        '& .MuiDrawer-paper': {
          width,
          bgcolor: diane.navy,
          color: '#fff',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          overflowX: 'hidden',
          transition: 'width 0.2s ease',
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: isCompact ? 0 : 2.5, py: 3, justifyContent: isCompact ? 'center' : 'flex-start' }}>
        <AcUnitIcon sx={{ color: '#fff' }} />
        {!isCompact && (
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
            DIANE FRIGO
          </Typography>
        )}
      </Stack>

      <List sx={{ flexGrow: 1, px: isCompact ? 0.5 : 1.5 }}>
        {navItems.map((item) => {
          const button = (
            <ListItemButton
              key={item.to}
              component={NavLink}
              to={item.to}
              end={item.to === '/'}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                justifyContent: isCompact ? 'center' : 'flex-start',
                color: 'rgba(255,255,255,0.75)',
                '&.active': { bgcolor: diane.blue, color: '#fff' },
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: isCompact ? 0 : 40, justifyContent: 'center' }}>
                {item.icon}
              </ListItemIcon>
              {!isCompact && (
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
              )}
            </ListItemButton>
          );
          return isCompact ? (
            <Tooltip key={item.to} title={item.label} placement="right">
              {button}
            </Tooltip>
          ) : button;
        })}
      </List>

      {/* Bloc "Action rapide" — reprend le bloc fixe en bas de la maquette */}
      <Box sx={{ p: isCompact ? 1 : 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {!isCompact && (
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', pl: 0.5 }}>
            Action rapide
          </Typography>
        )}
        <Stack spacing={1} sx={{ mt: 1 }}>
          <Tooltip title={isCompact ? 'Nouvelle vente' : ''} placement="right">
            <Button
              variant="contained"
              startIcon={isCompact ? undefined : <AddIcon />}
              onClick={() => navigate('/ventes/nouvelle')}
              sx={{ justifyContent: isCompact ? 'center' : 'flex-start', bgcolor: diane.blue, minWidth: 0 }}
            >
              {isCompact ? <AddIcon fontSize="small" /> : 'Nouvelle vente'}
            </Button>
          </Tooltip>
          {!isCompact && (
            <>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => navigate('/stock/entree')}
                sx={{ justifyContent: 'flex-start', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
              >
                Entrée stock
              </Button>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => navigate('/charges/nouvelle')}
                sx={{ justifyContent: 'flex-start', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
              >
                Nouvelle charge
              </Button>
            </>
          )}
        </Stack>
      </Box>
    </Drawer>
  );
}

export { FULL_WIDTH, COMPACT_WIDTH };
