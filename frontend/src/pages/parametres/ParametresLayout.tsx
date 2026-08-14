import { Box, Typography, Tabs, Tab } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { label: 'Produits', path: '/parametres/produits' },
  { label: 'Utilisateurs', path: '/parametres/utilisateurs' },
  { label: 'Import Excel', path: '/parametres/import' },
  { label: 'Audit', path: '/parametres/audit' },
];

export default function ParametresLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const current = tabs.find((t) => location.pathname.startsWith(t.path))?.path ?? tabs[0].path;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>Paramètres</Typography>
      <Tabs value={current} onChange={(_, v) => navigate(v)} sx={{ mb: 3 }}>
        {tabs.map((t) => (
          <Tab key={t.path} label={t.label} value={t.path} />
        ))}
      </Tabs>
      <Outlet />
    </Box>
  );
}
