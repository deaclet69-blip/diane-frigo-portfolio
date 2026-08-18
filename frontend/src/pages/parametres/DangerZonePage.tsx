import { useState } from 'react';
import {
  Box, Paper, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert, Stack,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { resetAllData } from '../../services/system';
import { logout } from '../../services/auth';

type Step = 'closed' | 'confirm' | 'password';

export default function DangerZonePage() {
  const [step, setStep] = useState<Step>('closed');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function startFlow() {
    setError('');
    setPassword('');
    setStep('confirm');
  }

  function cancel() {
    setStep('closed');
    setPassword('');
    setError('');
  }

  async function handleConfirmPassword() {
    if (!password) {
      setError('Veuillez saisir votre mot de passe.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetAllData(password);
      // Toutes les données (dont potentiellement des jetons liés) ont été
      // effacées : on force une reconnexion propre plutôt que de laisser
      // l'utilisateur sur un tableau de bord désormais vide et incohérent.
      window.alert('Toutes les données ont été réinitialisées. Vous allez être déconnecté.');
      logout();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Mot de passe incorrect ou erreur serveur.');
      setLoading(false);
    }
  }

  return (
    <Box>
      <Paper variant="outlined" sx={{ p: 3, borderColor: 'error.main', borderWidth: 1.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <WarningAmberIcon color="error" />
          <Typography variant="h6" color="error.main" fontWeight={700}>
            Zone dangereuse
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Réinitialise toutes les données enregistrées de l'application (produits, ventes,
          stock, clients, dépenses, pertes, investissements, historique...). Les comptes
          utilisateurs ne sont pas supprimés. Cette action est irréversible.
        </Typography>
        <Button variant="outlined" color="error" onClick={startFlow}>
          Réinitialiser toutes les données
        </Button>
      </Paper>

      {/* Étape 1 : confirmation oui/non */}
      <Dialog open={step === 'confirm'} onClose={cancel}>
        <DialogTitle>Êtes-vous sûr ?</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 1 }}>
            Cette action va supprimer définitivement toutes les données enregistrées
            (ventes, stock, clients, finances...). Elle est impossible à annuler.
          </Alert>
          <Typography variant="body2">Voulez-vous vraiment continuer ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancel}>Non, annuler</Button>
          <Button color="error" variant="contained" onClick={() => setStep('password')}>
            Oui, continuer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Étape 2 : confirmation par mot de passe */}
      <Dialog open={step === 'password'} onClose={cancel}>
        <DialogTitle>Confirmez avec votre mot de passe</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Par sécurité, saisissez votre mot de passe pour confirmer la réinitialisation.
          </Typography>
          <TextField
            type="password"
            label="Mot de passe"
            fullWidth
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirmPassword()}
          />
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={cancel} disabled={loading}>Annuler</Button>
          <Button color="error" variant="contained" onClick={handleConfirmPassword} disabled={loading}>
            {loading ? 'Réinitialisation...' : 'Confirmer la réinitialisation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
