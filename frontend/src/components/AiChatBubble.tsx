import { useEffect, useRef, useState } from 'react';
import {
  Fab,
  Paper,
  Box,
  Typography,
  Stack,
  TextField,
  IconButton,
  Avatar,
  CircularProgress,
  Zoom,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { useNavigate, useLocation } from 'react-router-dom';
import { askAi } from '../services/aiAdvisor';
import type { ChatMessage } from '../types';
import { getCurrentUser } from '../services/auth';
import { diane } from '../theme';
import MarkdownText from './MarkdownText';

export default function AiChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const user = getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  // Sur la page Assistant IA elle-même, la bulle flottante fait doublon
  // avec le champ de saisie déjà présent et le recouvre — on ne l'affiche
  // pas du tout sur cette page (signalé par l'utilisateur).
  const onAssistantPage = location.pathname === '/assistant';
  // Détecte si un menu déroulant (Select, Menu, Popover — tous les
  // composants MUI de ce type) est ouvert QUELQUE PART sur la page, pour
  // masquer temporairement le bouton flottant et ne jamais le laisser
  // recouvrir un menu, un bouton ou une ligne de tableau en train d'être
  // utilisé (signalé par l'utilisateur).
  const [menuOpenElsewhere, setMenuOpenElsewhere] = useState(false);

  useEffect(() => {
    const check = () => {
      setMenuOpenElsewhere(!!document.querySelector('.MuiPopover-root, .MuiModal-root'));
    };
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true });
    check();
    return () => observer.disconnect();
  }, []);

  // Masque le bouton quand le contenu de la page ne dépasse pas beaucoup la
  // hauteur de l'écran (page courte, comme Stock Movement) — dans ce cas le
  // padding seul ne suffit pas : le bouton fixe reste visible en permanence
  // par-dessus un élément comme "Save Movement" sans qu'aucun défilement ne
  // se produise jamais. ResizeObserver (pas juste 'scroll'/'resize') pour
  // recalculer correctement quand le contenu change de hauteur après le
  // chargement des données — c'était la vraie faille de la version
  // précédente (signalé plusieurs fois par l'utilisateur).
  const [nearBottom, setNearBottom] = useState(false);
  useEffect(() => {
    const recompute = () => {
      const viewportHeight = window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;
      const scrollBottom = viewportHeight + window.scrollY;
      // Cas 1 : la page entière tient (presque) dans l'écran — un
      // formulaire court comme "Stock Movement" ne défile jamais assez pour
      // que le bouton s'éloigne de son bouton "Save" tout seul.
      const barelyScrolls = pageHeight <= viewportHeight * 1.3;
      // Cas 2 : page plus longue, mais on a scrollé près de la vraie fin.
      const isNearBottom = pageHeight - scrollBottom < 160;
      setNearBottom(barelyScrolls || isNearBottom);
    };
    recompute();
    window.addEventListener('scroll', recompute, { passive: true });
    window.addEventListener('resize', recompute);
    const resizeObserver = new ResizeObserver(recompute);
    resizeObserver.observe(document.body);
    return () => {
      window.removeEventListener('scroll', recompute);
      window.removeEventListener('resize', recompute);
      resizeObserver.disconnect();
    };
  }, []);

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
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: err?.response?.data?.message ?? 'AI assistant not configured (missing API key).',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (onAssistantPage) return null;

  return (
    <>
      <Zoom in={!open && !menuOpenElsewhere && !nearBottom}>
        <Fab
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            bottom: { xs: 'calc(92px + env(safe-area-inset-bottom, 0px))', sm: 28 },
            right: { xs: 16, sm: 24 },
            zIndex: 1300,
            width: 56,
            height: 56,
            minHeight: 56,
            bgcolor: diane.indigo,
            color: '#fff',
            '&:hover': { bgcolor: diane.navy },
            animation: 'diane-ai-glow 2.4s ease-in-out infinite',
            boxShadow: `0 0 0 0 ${diane.indigo}`,
            '@keyframes diane-ai-glow': {
              '0%': { boxShadow: `0 0 0 0 ${diane.indigo}66, 0 0 10px 2px ${diane.indigo}66` },
              '50%': { boxShadow: `0 0 0 10px ${diane.indigo}00, 0 0 22px 6px ${diane.blue}aa` },
              '100%': { boxShadow: `0 0 0 0 ${diane.indigo}00, 0 0 10px 2px ${diane.indigo}00` },
            },
          }}
        >
          <AutoAwesomeIcon
            sx={{
              animation: 'diane-ai-sparkle 2.4s ease-in-out infinite',
              '@keyframes diane-ai-sparkle': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.55 } },
            }}
          />
        </Fab>
      </Zoom>

      <Zoom in={open}>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: { xs: 'calc(92px + env(safe-area-inset-bottom, 0px))', sm: 28 },
            right: { xs: 16, sm: 24 },
            zIndex: 1300,
            width: { xs: 'calc(100vw - 32px)', sm: 360 },
            height: 480,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ p: 1.5, bgcolor: diane.indigo, color: '#fff' }}>
            <AutoAwesomeIcon fontSize="small" />
            <Typography variant="subtitle2" fontWeight={700} sx={{ flexGrow: 1 }}>
              AI Assistant
            </Typography>
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
                <Stack
                  key={i}
                  direction="row"
                  spacing={1}
                  justifyContent={m.role === 'user' ? 'flex-end' : 'flex-start'}
                >
                  {m.role === 'assistant' && (
                    <Avatar sx={{ bgcolor: diane.indigo, width: 24, height: 24 }}>
                      <AutoAwesomeIcon sx={{ fontSize: 14 }} />
                    </Avatar>
                  )}
                  <Box
                    sx={{
                      maxWidth: '78%',
                      bgcolor: m.role === 'user' ? diane.indigo : 'background.paper',
                      color: m.role === 'user' ? '#fff' : 'text.primary',
                      borderRadius: 2,
                      px: 1.5,
                      py: 1,
                      fontSize: 13,
                    }}
                  >
                    {m.role === 'assistant' ? <MarkdownText text={m.content} fontSize={13} /> : m.content}
                  </Box>
                  {m.role === 'user' && (
                    <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                      {user?.email?.[0]?.toUpperCase() ?? 'U'}
                    </Avatar>
                  )}
                </Stack>
              ))}
              {loading && <CircularProgress size={16} />}
            </Stack>
            <div ref={bottomRef} />
          </Box>

          <Stack direction="row" spacing={1} sx={{ p: 1.25, borderTop: '1px solid rgba(128,128,128,0.15)' }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Type your question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send();
              }}
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
