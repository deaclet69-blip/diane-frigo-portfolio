import { useEffect, useRef, useState } from 'react';
import { Fab, Paper, Box, Typography, Stack, TextField, IconButton, Avatar, CircularProgress, Zoom } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { useNavigate } from 'react-router-dom';
import { askAi } from '../services/aiAdvisor';
import type { ChatMessage } from '../types';
import { getCurrentUser } from '../services/auth';
import { diane } from '../theme';

export default function AiChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const user = getCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, open]);

  async function send() {
    const question = input.trim();
    if (!question || loading) return;
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
        content: err?.response?.data?.message ?? "AI assistant not configured (missing API key).",
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Zoom in={!open}>
        <Fab
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed', bottom: { xs: 84, sm: 24 }, right: 24, zIndex: 1300,
            bgcolor: diane.indigo, color: '#fff', '&:hover': { bgcolor: diane.navy },
            animation: 'diane-ai-glow 2.4s ease-in-out infinite',
            boxShadow: `0 0 0 0 ${diane.indigo}`,
            '@keyframes diane-ai-glow': {
              '0%':   { boxShadow: `0 0 0 0 ${diane.indigo}66, 0 0 10px 2px ${diane.indigo}66` },
              '50%':  { boxShadow: `0 0 0 10px ${diane.indigo}00, 0 0 22px 6px ${diane.blue}aa` },
              '100%': { boxShadow: `0 0 0 0 ${diane.indigo}00, 0 0 10px 2px ${diane.indigo}00` },
            },
          }}
        >
          <AutoAwesomeIcon sx={{ animation: 'diane-ai-sparkle 2.4s ease-in-out infinite', '@keyframes diane-ai-sparkle': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.55 } } }} />
        </Fab>
      </Zoom>

      <Zoom in={open}>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed', bottom: { xs: 84, sm: 24 }, right: 24, zIndex: 1300,
            width: { xs: 'calc(100vw - 32px)', sm: 360 }, height: 480,
            display: 'flex', flexDirection: 'column', borderRadius: 3, overflow: 'hidden',
          }}
        >
          <Stack
            direction="row" alignItems="center" spacing={1} sx={{ p: 1.5, bgcolor: diane.indigo, color: '#fff' }}
          >
            <AutoAwesomeIcon fontSize="small" />
            <Typography variant="subtitle2" fontWeight={700} sx={{ flexGrow: 1 }}>AI Assistant</Typography>
            <IconButton size="small" sx={{ color: '#fff' }} onClick={() => navigate('/assistant')}>
              <OpenInFullIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton size="small" sx={{ color: '#fff' }} onClick={() => setOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1.5, bgcolor: 'background.default' }}>
            {messages.length === 0 && (
              <Typography variant="caption" color="text.secondary">
                Ask a question about your business — stock, sales, finances, customers.
              </Typography>
            )}
            <Stack spacing={1.25}>
              {messages.map((m, i) => (
                <Stack key={i} direction="row" spacing={1} justifyContent={m.role === 'user' ? 'flex-end' : 'flex-start'}>
                  {m.role === 'assistant' && (
                    <Avatar sx={{ bgcolor: diane.indigo, width: 24, height: 24 }}>
                      <AutoAwesomeIcon sx={{ fontSize: 14 }} />
                    </Avatar>
                  )}
                  <Box sx={{
                    maxWidth: '78%', bgcolor: m.role === 'user' ? diane.indigo : 'background.paper',
                    color: m.role === 'user' ? '#fff' : 'text.primary',
                    borderRadius: 2, px: 1.5, py: 1, whiteSpace: 'pre-line', fontSize: 13,
                  }}>
                    {m.content}
                  </Box>
                  {m.role === 'user' && (
                    <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>{user?.email?.[0]?.toUpperCase() ?? 'U'}</Avatar>
                  )}
                </Stack>
              ))}
              {loading && <CircularProgress size={16} />}
            </Stack>
            <div ref={bottomRef} />
          </Box>

          <Stack direction="row" spacing={1} sx={{ p: 1.25, borderTop: '1px solid rgba(128,128,128,0.15)' }}>
            <TextField
              size="small" fullWidth placeholder="Type your question…" value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              disabled={loading}
            />
            <IconButton color="primary" onClick={send} disabled={loading || !input.trim()}>
              <SendIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Paper>
      </Zoom>
    </>
  );
}
