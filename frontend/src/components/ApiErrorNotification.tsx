import { useEffect, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

export interface ApiErrorDetail {
  message: string;
  severity?: 'error' | 'warning';
}

// Écoute l'événement 'api-error' déclenché par l'intercepteur axios
// (services/api.ts) et affiche un message clair en bas de l'écran.
// Objectif : qu'une page ne reste plus jamais vide sans explication quand
// le serveur refuse une requête (permission manquante, erreur serveur...).
export default function ApiErrorNotification() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ApiErrorDetail>({ message: '' });

  useEffect(() => {
    function handleApiError(e: Event) {
      const custom = e as CustomEvent<ApiErrorDetail>;
      setDetail(custom.detail);
      setOpen(true);
    }
    window.addEventListener('api-error', handleApiError);
    return () => window.removeEventListener('api-error', handleApiError);
  }, []);

  return (
    <Snackbar
      open={open}
      autoHideDuration={7000}
      onClose={() => setOpen(false)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        onClose={() => setOpen(false)}
        severity={detail.severity ?? 'error'}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {detail.message}
      </Alert>
    </Snackbar>
  );
}
