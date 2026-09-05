import { useState, useRef, useEffect } from 'react';
import { Box, Typography, Paper, Stack, TextField, IconButton, CircularProgress, Avatar } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { askAi } from '../../services/aiAdvisor';
import type { ChatMessage } from '../../types';
import { getCurrentUser } from '../../services/auth';
import { diane } from '../../theme';

const SUGGESTIONS = [
  'Which products should I restock first?',
  'How do my sales compare to last week?',
  'Which customers should I follow up with?',
  'Is my financial situation healthy this month?',
];

export default function AiChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const user = getCurrentUser();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(question: string) {
    if (!question.trim() || loading) return;
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: question }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const { text } = await askAi(question, messages);
      setMessages([...newMessages, { role: 'assistant', content: text }]);
    } catch (err: any) {
      setMessages([...newMessages, {
        role: 'assistant',
        content: err?.response?.data?.message ?? "Error: the AI assistant is not configured (missing API key).",
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>AI Assistant</Typography>

      <Paper sx={{ flexGrow: 1, p: 3, mb: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {messages.length === 0 && (
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <AutoAwesomeIcon sx={{ fontSize: 40, color: diane.blue, mb: 1 }} />
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Ask a question about your business — the assistant has access to your real data (stock, sales, finances, customers).
            </Typography>
            <Stack spacing={1} sx={{ width: '100%', maxWidth: 420 }}>
              {SUGGESTIONS.map((s) => (
                <Paper
                  key={s}
                  variant="outlined"
                  sx={{ p: 1.5, cursor: 'pointer', '&:hover': { bgcolor: diane.blueLight } }}
                  onClick={() => send(s)}
                >
                  <Typography variant="body2">{s}</Typography>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}

        <Stack spacing={2}>
          {messages.map((m, i) => (
            <Stack key={i} direction="row" spacing={1.5} justifyContent={m.role === 'user' ? 'flex-end' : 'flex-start'}>
              {m.role === 'assistant' && (
                <Avatar sx={{ bgcolor: diane.blue, width: 32, height: 32 }}>
                  <AutoAwesomeIcon fontSize="small" />
                </Avatar>
              )}
              <Box
                sx={{
                  maxWidth: '75%',
                  bgcolor: m.role === 'user' ? diane.blue : diane.bg,
                  color: m.role === 'user' ? '#fff' : 'text.primary',
                  borderRadius: 2,
                  px: 2, py: 1.2,
                  whiteSpace: 'pre-line',
                  fontSize: 14,
                }}
              >
                {m.content}
              </Box>
              {m.role === 'user' && (
                <Avatar sx={{ width: 32, height: 32 }}>{user?.email?.[0]?.toUpperCase() ?? 'U'}</Avatar>
              )}
            </Stack>
          ))}
          {loading && (
            <Stack direction="row" spacing={1.5}>
              <Avatar sx={{ bgcolor: diane.blue, width: 32, height: 32 }}>
                <AutoAwesomeIcon fontSize="small" />
              </Avatar>
              <CircularProgress size={20} sx={{ mt: 1 }} />
            </Stack>
          )}
        </Stack>
        <div ref={bottomRef} />
      </Paper>

      <Stack direction="row" spacing={1}>
        <TextField
          fullWidth
          placeholder="Type your question…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(input); }}
          disabled={loading}
        />
        <IconButton color="primary" onClick={() => send(input)} disabled={loading || !input.trim()}>
          <SendIcon />
        </IconButton>
      </Stack>
    </Box>
  );
}
