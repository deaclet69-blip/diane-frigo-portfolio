import { useEffect, useState } from 'react';
import {
  AppBar, Toolbar, IconButton, Avatar, Box, Typography, Stack, Badge, Chip,
  Menu, MenuItem, ListItemIcon, Dialog, DialogTitle, DialogContent, DialogActions, Button,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/auth';
import { getStockAlerts } from '../services/stock';
import { diane } from '../theme';

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrator',
  RESPONSABLE: 'Manager',
  VENDEUR: 'Salesperson',
  MAGASINIER: 'Warehouse Staff',
};

const today = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const user = getCurrentUser();
  const [alertCount, setAlertCount] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getStockAlerts().then((items) => setAlertCount(items.length)).catch(() => {});
  }, []);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="transparent"
      sx={{ bgcolor: 'background.paper', borderBottom: '1px solid rgba(128,128,128,0.15)' }}
    >
      <Toolbar sx={{ gap: 1.5 }}>
        <IconButton onClick={onMenuClick} sx={{ display: { sm: 'none' } }}>
          <MenuIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />

        <Chip
          icon={<CalendarTodayIcon sx={{ fontSize: 16 }} />}
          label={today}
          sx={{ bgcolor: 'action.hover', fontWeight: 600, fontSize: 13, textTransform: 'capitalize', display: { xs: 'none', md: 'flex' } }}
        />

        <IconButton onClick={() => navigate('/notifications')}>
          <Badge badgeContent={alertCount} color="error">
            <NotificationsNoneIcon />
          </Badge>
        </IconButton>

        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          sx={{ cursor: 'pointer', bgcolor: 'action.hover', borderRadius: 3, px: 1, py: 0.5 }}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: diane.indigo }}>
            {user?.email?.[0]?.toUpperCase() ?? 'U'}
          </Avatar>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="body2" fontWeight={700} lineHeight={1.2}>
              {user?.email?.split('@')[0] ?? 'Utilisateur'}
            </Typography>
            <Typography variant="caption" color="text.secondary" lineHeight={1}>
              {user ? roleLabels[user.role] ?? user.role : ''}
            </Typography>
          </Box>
          <KeyboardArrowDownIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        </Stack>

        <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
          <MenuItem onClick={() => { setMenuAnchor(null); setConfirmOpen(true); }}>
            <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
            Sign out
          </MenuItem>
        </Menu>

        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Sign out?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              You'll need to sign back in with your email and password to return.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={logout}>Sign out</Button>
          </DialogActions>
        </Dialog>
      </Toolbar>
    </AppBar>
  );
}
