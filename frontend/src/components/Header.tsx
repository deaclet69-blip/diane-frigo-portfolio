import { AppBar, Toolbar, InputBase, IconButton, Avatar, Box, Typography, Stack } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { getCurrentUser, logout } from '../services/auth';

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrateur',
  RESPONSABLE: 'Responsable',
  VENDEUR: 'Vendeur',
  MAGASINIER: 'Magasinier',
};

export default function Header() {
  const user = getCurrentUser();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="transparent"
      sx={{ bgcolor: 'background.default', borderBottom: '1px solid rgba(15,23,42,0.06)' }}
    >
      <Toolbar sx={{ gap: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: '#fff',
            borderRadius: 2,
            px: 1.5,
            py: 0.5,
            flexGrow: 1,
            maxWidth: 480,
            boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
          }}
        >
          <SearchIcon sx={{ color: 'text.disabled', mr: 1 }} fontSize="small" />
          <InputBase placeholder="Rechercher un client, produit, facture…" fullWidth sx={{ fontSize: 14 }} />
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <IconButton>
          <NotificationsIcon />
        </IconButton>
        <IconButton>
          <HelpOutlineIcon />
        </IconButton>

        <Stack direction="row" alignItems="center" spacing={1} onClick={logout} sx={{ cursor: 'pointer' }}>
          <Avatar sx={{ width: 36, height: 36 }}>{user?.email?.[0]?.toUpperCase() ?? 'U'}</Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600} lineHeight={1.2}>
              {user?.email ?? 'Utilisateur'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user ? roleLabels[user.role] : ''}
            </Typography>
          </Box>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
