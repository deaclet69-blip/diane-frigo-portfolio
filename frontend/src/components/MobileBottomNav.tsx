import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/SpaceDashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import InventoryIcon from '@mui/icons-material/Inventory2';
import PeopleIcon from '@mui/icons-material/People';
import { diane } from '../theme';

// Le module "Nouvelle vente" doit être particulièrement optimisé pour
// smartphone (§17) : accès direct en 1 tap depuis la nav basse.
const items = [
  { label: 'Home', icon: <DashboardIcon />, to: '/' },
  { label: 'Sales', icon: <ShoppingCartIcon />, to: '/ventes' },
  { label: 'Sell', icon: <AddCircleIcon sx={{ fontSize: 32 }} />, to: '/ventes/nouvelle' },
  { label: 'Stock', icon: <InventoryIcon />, to: '/stock' },
  { label: 'Customers', icon: <PeopleIcon />, to: '/clients' },
];

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const current = items.find((i) => i.to === location.pathname)?.to ?? false;

  return (
    <Paper
      elevation={3}
      sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1200 }}
    >
      <BottomNavigation value={current} showLabels sx={{ height: 64 }}>
        {items.map((item) => (
          <BottomNavigationAction
            key={item.to}
            label={item.label}
            icon={item.icon}
            value={item.to}
            onClick={() => navigate(item.to)}
            sx={{
              color: item.to === '/ventes/nouvelle' ? diane.blue : undefined,
              '&.Mui-selected': { color: diane.blue },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
