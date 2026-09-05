import { useEffect, useState } from 'react';
import { Paper, Typography, Stack, IconButton, CircularProgress, Alert, Box } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useNavigate } from 'react-router-dom';
import { getAiSummary } from '../services/aiAdvisor';
import { diane } from '../theme';

export default function AiSummaryCard() {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  function load() {
    setLoading(true);
    setError(null);
    getAiSummary()
      .then((r) => setText(r.text))
      .catch((err) => setError(err?.response?.data?.message ?? "The AI assistant is not configured yet."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <AutoAwesomeIcon sx={{ color: diane.blue }} fontSize="small" />
          <Typography variant="subtitle1" fontWeight={700}>AI Assistant Analysis</Typography>
        </Stack>
        <IconButton size="small" onClick={load} disabled={loading}>
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Stack>

      {loading && (
        <Stack alignItems="center" sx={{ py: 3 }}>
          <CircularProgress size={24} />
        </Stack>
      )}

      {!loading && error && (
        <Alert severity="info">
          {error} Configure your API key in the backend's <code>.env</code> file
          (<code>GEMINI_API_KEY</code>), available for free at aistudio.google.com/apikey.
        </Alert>
      )}

      {!loading && !error && text && (
        <Box sx={{ whiteSpace: 'pre-line', fontSize: 14, lineHeight: 1.7 }}>{text}</Box>
      )}

      {!loading && !error && (
        <Typography
          variant="body2"
          sx={{ mt: 2, color: diane.blue, cursor: 'pointer', fontWeight: 600 }}
          onClick={() => navigate('/assistant')}
        >
          Ask the assistant a question →
        </Typography>
      )}
    </Paper>
  );
}
