import { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Alert, Stack } from '@mui/material';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/auth';
import { diane } from '../../theme';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Email ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: diane.bg,
      }}
    >
      <Paper sx={{ p: 4, width: 380 }}>
        <Stack alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <AcUnitIcon sx={{ color: diane.navy, fontSize: 36 }} />
          <Typography variant="h6" fontWeight={800}>DIANE FRIGO</Typography>
          <Typography variant="body2" color="text.secondary">
            Connexion à votre espace de gestion
          </Typography>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />
            <Button type="submit" variant="contained" size="large" disabled={loading}>
              {loading ? 'Connexion…' : 'Se connecter'}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
