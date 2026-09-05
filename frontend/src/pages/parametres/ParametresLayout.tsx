import { Box, Typography, Tabs, Tab } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const baseTabs = [
  { label: 'Products', path: '/parametres/produits' },
  { label: 'Users', path: '/parametres/utilisateurs' },
  { label: 'Import Excel', path: '/parametres/import' },
  { label: 'Audit Log', path: '/parametres/audit' },
  // "Danger Zone" volontairement retirée dans cette version démo (le mot de
  // passe requis pour confirmer une réinitialisation est le mot de passe de
  // démo lui-même, partagé publiquement).
];

export default function ParametresLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const tabs = baseTabs;
  const current = tabs.find((t) => location.pathname.startsWith(t.path))?.path ?? tabs[0].path;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>Settings</Typography>
      <Tabs value={current} onChange={(_, v) => navigate(v)} sx={{ mb: 3 }}>
        {tabs.map((t) => (
          <Tab key={t.path} label={t.label} value={t.path} />
        ))}
      </Tabs>
      <Outlet />
    </Box>
  );
}
