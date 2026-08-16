import { useEffect, useState } from 'react';
import { AppBar, Toolbar, IconButton, Avatar, Box, Typography, Stack, Badge, Chip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { getCurrentUser, logout } from '../services/auth';
import { getStockAlerts } from '../services/stock';
import { diane } from '../theme';

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrateur',
  RESPONSABLE: 'Responsable',
  VENDEUR: 'Vendeur',
  MAGASINIER: 'Magasinier',
};

const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const user = getCurrentUser();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    getStockAlerts().then((items) => setAlertCount(items.length)).catch(() => {});
  }, []);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="transparent"
      sx={{ bgcolor: '#fff', borderBottom: '1px solid rgba(13,23,52,0.06)' }}
    >
      <Toolbar sx={{ gap: 1.5 }}>
        <IconButton onClick={onMenuClick} sx={{ display: { sm: 'none' } }}>
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />

        <Chip
          icon={<CalendarTodayIcon sx={{ fontSize: 16 }} />}
          label={today}
          sx={{ bgcolor: diane.bg, fontWeight: 600, fontSize: 13, textTransform: 'capitalize', display: { xs: 'none', md: 'flex' } }}
        />

        <IconButton>
          <Badge badgeContent={alertCount} color="error">
            <NotificationsNoneIcon />
          </Badge>
        </IconButton>

        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          onClick={logout}
          sx={{ cursor: 'pointer', bgcolor: diane.bg, borderRadius: 3, px: 1, py: 0.5 }}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: diane.indigo }}>
            {user?.email?.[0]?.toUpperCase() ?? 'U'}
          </Avatar>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="body2" fontWeight={700} lineHeight={1.2}>
              {user?.email?.split('@')[0] ?? 'Utilisateur'}
            </Typography>
          </Box>
          <KeyboardArrowDownIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
