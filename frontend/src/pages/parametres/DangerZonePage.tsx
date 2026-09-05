import { Box, Paper, Typography, Stack } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Version démo : la vraie fonctionnalité de réinitialisation est
// désactivée (elle demanderait le mot de passe de démo, qui est public,
// ce qui permettrait à n'importe quel visiteur d'effacer les données de
// démonstration).
export default function DangerZonePage() {
  return (
    <Box>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <InfoOutlinedIcon color="disabled" />
          <Typography variant="h6" fontWeight={700} color="text.secondary">
            Not Available in Demo
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          This feature is disabled in the public demo version to keep the sample data intact
          for other visitors.
        </Typography>
      </Paper>
    </Box>
  );
}
