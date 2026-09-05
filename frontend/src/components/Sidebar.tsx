import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography, Stack,
  Tooltip, IconButton, Avatar,
} from '@mui/material';
import { NavLink, useNavigate } from 'react-router-dom';
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
import ViewSidebarOutlinedIcon from '@mui/icons-material/ViewSidebarOutlined';
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import { diane } from '../theme';
import { useColorMode } from '../colorMode';
import { useSidebarState } from '../sidebarState';
import { getCurrentUser } from '../services/auth';
import { hasPermission } from '../constants/permissions';

const FULL_WIDTH = 272;
const COMPACT_WIDTH = 76;

// Structure calquée sur la nouvelle maquette "futuriste professionnel".
// `key` doit correspondre à une clé de PERMISSION_SECTIONS (constants/permissions.ts).
const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: <SpaceDashboardIcon />, to: '/', hasSub: false },
  { key: 'ventes', label: 'Sales', icon: <ShoppingCartIcon />, to: '/ventes', hasSub: true },
  { key: 'stock', label: 'Stock', icon: <Inventory2Icon />, to: '/stock', hasSub: true },
  { key: 'produits', label: 'Products', icon: <CategoryIcon />, to: '/parametres/produits', hasSub: false },
  { key: 'clients', label: 'Customers', icon: <PeopleIcon />, to: '/clients', hasSub: true },
  { key: 'depots', label: 'Customer Deposits', icon: <AccountBalanceWalletIcon />, to: '/depots', hasSub: false },
  { key: 'achats', label: 'Purchases', icon: <LocalShippingIcon />, to: '/stock/entree', hasSub: false },
  { key: 'charges', label: 'Expenses', icon: <ReceiptLongIcon />, to: '/charges', hasSub: true },
  { key: 'pertes', label: 'Losses', icon: <TrendingDownIcon />, to: '/finances/pertes', hasSub: false },
  { key: 'rentabilite', label: 'Profitability', icon: <InsightsIcon />, to: '/finances/tarification', hasSub: false },
  { key: 'rapports', label: 'Reports', icon: <BarChartIcon />, to: '/rapports', hasSub: true },
  { key: 'investissement', label: 'Investment', icon: <SavingsIcon />, to: '/finances/investissement', hasSub: false },
  { key: 'assistant', label: 'AI Assistant', icon: <AutoAwesomeIcon />, to: '/assistant', hasSub: false },
  { key: 'utilisateurs', label: 'Users', icon: <PersonOutlineIcon />, to: '/parametres/utilisateurs', hasSub: false },
  { key: 'parametres', label: 'Settings', icon: <SettingsIcon />, to: '/parametres/produits', hasSub: true },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  // Purement manuel désormais : l'utilisateur ouvre/ferme via la poignée
  // sur le bord, état mémorisé (voir sidebarState.tsx).
  const { collapsed, toggle: toggleSidebar } = useSidebarState();
  const isCompact = collapsed;
  const width = isCompact ? COMPACT_WIDTH : FULL_WIDTH;
  const { mode, toggle } = useColorMode();
  const visibleNavItems = navItems.filter((item) => hasPermission(user, item.key));

  return (
    <>
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
        {/* px fixe (jamais conditionné par isCompact) : le logo "DIANE FRIGO"
            reste exactement à la même position, ouvert ou fermé — seul le
            texte à côté apparaît/disparaît. */}
        <Stack direction="row" alignItems="center" spacing={1.2} sx={{ px: 2.25, py: 2.25 }}>
          <Box
            component="img"
            src="/favicon.svg"
            alt="DIANE FRIGO"
            sx={{ width: 32, height: 32, flexShrink: 0, borderRadius: '8px' }}
          />
          {!isCompact && (
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 800, letterSpacing: 0.3, lineHeight: 1.1, fontSize: 14 }}>
                DIANE FRIGO
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', letterSpacing: 1.3, fontSize: 9 }}>
                MANAGEMENT
              </Typography>
            </Box>
          )}
        </Stack>
        <Box sx={{ mx: isCompact ? 1 : 2.25, mb: 1, height: '1px', bgcolor: 'rgba(255,255,255,0.08)' }} />

        <List sx={{
          flexGrow: 1, px: isCompact ? 0.75 : 1.25, pt: 0.5, overflowY: 'auto',
          // Défilement invisible : fonctionne quand même sur les très petits
          // écrans, mais sans barre visible qui casse le design.
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}>
          {visibleNavItems.map((item) => {
            const button = (
              <ListItemButton
                key={item.to + item.label}
                component={NavLink}
                to={item.to}
                end={item.to === '/'}
                sx={{
                  position: 'relative',
                  borderRadius: isCompact ? 2 : 2.5,
                  mb: isCompact ? 0.5 : 0.15,
                  py: isCompact ? 0.75 : 0.6,
                  minHeight: 36,
                  justifyContent: 'center',
                  color: 'rgba(255,255,255,0.68)',
                  transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
                  // Petit repère coloré à gauche même en mode réduit, pour
                  // que la page active se reconnaisse au premier coup d'œil.
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: isCompact ? 6 : 0,
                    top: '20%',
                    bottom: '20%',
                    width: 3,
                    borderRadius: 3,
                    bgcolor: diane.blue,
                    opacity: 0,
                    transition: 'opacity 0.15s ease',
                  },
                  '&.active': {
                    bgcolor: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    boxShadow: isCompact ? `inset 0 0 0 1px ${diane.indigo}55` : 'none',
                  },
                  '&.active::before': { opacity: 1 },
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: isCompact ? 0 : 34, justifyContent: 'center', '& svg': { fontSize: 19 } }}>
                  {item.icon}
                </ListItemIcon>
                {!isCompact && (
                  <>
                    <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 12.5, fontWeight: 500 }} />
                    {item.hasSub && <ChevronRightIcon sx={{ fontSize: 16, color: 'rgba(255,255,255,0.35)' }} />}
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

        {!isCompact ? (
          <Box sx={{ px: 1.25, pb: 1 }}>
            <Box
              sx={{
                borderRadius: 3,
                p: 1.5,
                background: `linear-gradient(160deg, ${diane.indigo} 0%, ${diane.navy} 100%)`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>DIANE FRIGO</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
                Smart management for your cold storage business
              </Typography>
              <LocalShippingIcon sx={{ position: 'absolute', right: -6, bottom: -8, fontSize: 56, color: 'rgba(255,255,255,0.1)' }} />
            </Box>
          </Box>
        ) : (
          // Version réduite du même bloc : un médaillon dégradé avec l'icône
          // de la marque, pour ne pas laisser un vide "trop simple" en bas
          // de la barre compacte.
          <Box sx={{ display: 'flex', justifyContent: 'center', pb: 1.5 }}>
            <Tooltip title="DIANE FRIGO — gestion de la chambre froide" placement="right">
              <Box
                sx={{
                  width: 40, height: 40, borderRadius: '12px',
                  background: `linear-gradient(160deg, ${diane.indigo} 0%, ${diane.navy} 100%)`,
                  border: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <LocalShippingIcon sx={{ fontSize: 20, color: 'rgba(255,255,255,0.85)' }} />
              </Box>
            </Tooltip>
          </Box>
        )}

        <Stack
          direction="row"
          alignItems="center"
          spacing={1.2}
          sx={{ px: isCompact ? 1 : 2, py: 1.25, borderTop: '1px solid rgba(255,255,255,0.08)', justifyContent: isCompact ? 'center' : 'flex-start' }}
        >
          <Avatar sx={{ width: 34, height: 34, bgcolor: diane.blue, fontSize: 14 }}>
            {user?.email?.[0]?.toUpperCase() ?? 'U'}
          </Avatar>
          {!isCompact && (
            <>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} noWrap>{user?.email?.split('@')[0] ?? 'Utilisateur'}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  {user?.role === 'ADMIN' ? 'Administrator' : user?.role ?? ''}
                </Typography>
              </Box>
              <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                <IconButton size="small" onClick={toggle} sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </>
          )}
        </Stack>
      </Drawer>

      {/* Poignée de bascule : petit bouton rond à cheval sur le bord de la
          barre (moitié dedans, moitié dans le contenu) — ne bouge jamais
          avec le logo ni le texte, toujours au même endroit vertical. */}
      <Tooltip title={collapsed ? 'Ouvrir le menu' : 'Réduire le menu'} placement="right">
        <IconButton
          onClick={toggleSidebar}
          size="small"
          sx={{
            display: { xs: 'none', sm: 'flex' },
            position: 'fixed',
            top: 28,
            left: width - 14,
            zIndex: 1250,
            width: 28,
            height: 28,
            bgcolor: diane.navy,
            color: '#fff',
            border: `2px solid ${diane.indigo}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
            transition: 'left 0.2s ease, background-color 0.15s ease',
            '&:hover': { bgcolor: diane.indigo },
          }}
        >
          {collapsed ? <ViewSidebarOutlinedIcon sx={{ fontSize: 15 }} /> : <ViewSidebarIcon sx={{ fontSize: 15 }} />}
        </IconButton>
      </Tooltip>
    </>
  );
}

export { FULL_WIDTH, COMPACT_WIDTH };
