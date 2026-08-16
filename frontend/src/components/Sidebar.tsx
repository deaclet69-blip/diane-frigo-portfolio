import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography, Stack,
  Tooltip, useMediaQuery, IconButton, Avatar,
} from '@mui/material';
import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import HexagonIcon from '@mui/icons-material/Hexagon';
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
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import { diane } from '../theme';
import { getCurrentUser } from '../services/auth';

const FULL_WIDTH = 272;
const COMPACT_WIDTH = 76;

// Structure calquée sur la nouvelle maquette "futuriste professionnel".
const navItems = [
  { label: 'Tableau de bord', icon: <SpaceDashboardIcon />, to: '/', hasSub: false },
  { label: 'Ventes', icon: <ShoppingCartIcon />, to: '/ventes', hasSub: true },
  { label: 'Stock', icon: <Inventory2Icon />, to: '/stock', hasSub: true },
  { label: 'Produits', icon: <CategoryIcon />, to: '/parametres/produits', hasSub: false },
  { label: 'Clients', icon: <PeopleIcon />, to: '/clients', hasSub: true },
  { label: 'Dépôts clients', icon: <AccountBalanceWalletIcon />, to: '/depots', hasSub: false },
  { label: 'Achats', icon: <LocalShippingIcon />, to: '/stock/entree', hasSub: false },
  { label: 'Dépenses / Charges', icon: <ReceiptLongIcon />, to: '/charges', hasSub: true },
  { label: 'Pertes', icon: <TrendingDownIcon />, to: '/finances/pertes', hasSub: false },
  { label: 'Rentabilité', icon: <InsightsIcon />, to: '/finances/tarification', hasSub: false },
  { label: 'Rapports', icon: <BarChartIcon />, to: '/rapports', hasSub: true },
  { label: 'Investissement', icon: <SavingsIcon />, to: '/finances/investissement', hasSub: false },
  { label: 'Assistant IA', icon: <AutoAwesomeIcon />, to: '/assistant', hasSub: false },
  { label: 'Utilisateurs', icon: <PersonOutlineIcon />, to: '/parametres/utilisateurs', hasSub: false },
  { label: 'Paramètres', icon: <SettingsIcon />, to: '/parametres/produits', hasSub: true },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const isCompact = useMediaQuery('(max-width:1200px)');
  const width = isCompact ? COMPACT_WIDTH : FULL_WIDTH;
  const [darkVisual, setDarkVisual] = useState(false); // bascule visuelle (voir note en bas)

  return (
    <Drawer
      variant="permanent"
      sx={{
        width,
        flexShrink: 0,
        display: { xs: 'none', sm: 'block' },
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
      <Stack direction="row" alignItems="center" spacing={1.2} sx={{ px: isCompact ? 0 : 2.5, py: 2.75, justifyContent: isCompact ? 'center' : 'flex-start' }}>
        <Box sx={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
          <HexagonIcon sx={{ fontSize: 36, color: diane.blue }} />
          <HexagonIcon sx={{ fontSize: 20, color: diane.navy, position: 'absolute', top: 8, left: 8 }} />
        </Box>
        {!isCompact && (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: 0.3, lineHeight: 1.1 }}>
              DIANE FRIGO
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', letterSpacing: 1.5, fontSize: 10 }}>
              MANAGEMENT
            </Typography>
          </Box>
        )}
      </Stack>

      <List sx={{ flexGrow: 1, px: isCompact ? 0.5 : 1.5, overflowY: 'auto' }}>
        {navItems.map((item) => {
          const button = (
            <ListItemButton
              key={item.to + item.label}
              component={NavLink}
              to={item.to}
              end={item.to === '/'}
              sx={{
                borderRadius: 2.5,
                mb: 0.4,
                py: 1,
                justifyContent: isCompact ? 'center' : 'flex-start',
                color: 'rgba(255,255,255,0.68)',
                '&.active': { bgcolor: diane.indigo, color: '#fff' },
                '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: isCompact ? 0 : 38, justifyContent: 'center' }}>
                {item.icon}
              </ListItemIcon>
              {!isCompact && (
                <>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 13.5, fontWeight: 500 }} />
                  {item.hasSub && <ChevronRightIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.35)' }} />}
                </>
              )}
            </ListItemButton>
          );
          return isCompact ? (
            <Tooltip key={item.to + item.label} title={item.label} placement="right">
              {button}
            </Tooltip>
          ) : button;
        })}
      </List>

      {!isCompact && (
        <Box sx={{ px: 1.5, pb: 1.5 }}>
          <Box
            sx={{
              borderRadius: 3,
              p: 2,
              background: `linear-gradient(160deg, ${diane.indigo} 0%, ${diane.navy} 100%)`,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>DIANE FRIGO</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              La gestion intelligente de votre chambre froide
            </Typography>
            <LocalShippingIcon sx={{ position: 'absolute', right: -8, bottom: -10, fontSize: 72, color: 'rgba(255,255,255,0.1)' }} />
          </Box>
        </Box>
      )}

      <Stack
        direction="row"
        alignItems="center"
        spacing={1.2}
        sx={{ px: isCompact ? 1 : 2, py: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Avatar sx={{ width: 34, height: 34, bgcolor: diane.blue, fontSize: 14 }}>
          {user?.email?.[0]?.toUpperCase() ?? 'U'}
        </Avatar>
        {!isCompact && (
          <>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700} noWrap>{user?.email?.split('@')[0] ?? 'Utilisateur'}</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                {user?.role === 'ADMIN' ? 'Administrateur' : user?.role ?? ''}
              </Typography>
            </Box>
            <Tooltip title="Bascule visuelle — thème sombre complet à venir">
              <IconButton size="small" onClick={() => setDarkVisual((v) => !v)} sx={{ color: 'rgba(255,255,255,0.6)' }}>
                {darkVisual ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </>
        )}
      </Stack>
    </Drawer>
  );
}

export { FULL_WIDTH, COMPACT_WIDTH };
