import { Box, useMediaQuery } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar, { FULL_WIDTH, COMPACT_WIDTH } from '../components/Sidebar';
import Header from '../components/Header';
import MobileBottomNav from '../components/MobileBottomNav';
import AiChatBubble from '../components/AiChatBubble';
import { useBrowserNotifications } from '../hooks/useBrowserNotifications';
import { useSidebarState } from '../sidebarState';

// Desktop/tablette : sidebar pleine largeur ou réduite selon le choix de
// l'utilisateur (bouton menu en haut de la Sidebar — état persisté et
// initialisé selon la taille d'écran, voir App.tsx / sidebarState.tsx).
// Mobile (<600px, breakpoint MUI "sm") : sidebar masquée, remplacée par une
// navigation basse (§17 du brief).
export default function AppLayout() {
  const isMobile = useMediaQuery('(max-width:599px)');
  const { collapsed } = useSidebarState();
  const sidebarWidth = isMobile ? 0 : collapsed ? COMPACT_WIDTH : FULL_WIDTH;

  useBrowserNotifications();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box sx={{
        flexGrow: 1,
        width: { xs: '100%', sm: `calc(100% - ${sidebarWidth}px)` },
        transition: 'width 0.2s ease',
      }}>
        <Header />
        <Box sx={{ p: { xs: 2, sm: 3 }, pb: isMobile ? 10 : 3 }}>
          <Outlet />
        </Box>
      </Box>
      {isMobile && <MobileBottomNav />}
      <AiChatBubble />
    </Box>
  );
}
