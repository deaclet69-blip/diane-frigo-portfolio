import { useState } from 'react';
import { Box, useMediaQuery } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar, { FULL_WIDTH, COMPACT_WIDTH } from '../components/Sidebar';
import Header from '../components/Header';
import MobileBottomNav from '../components/MobileBottomNav';
import MobileNavDrawer from '../components/MobileNavDrawer';
import AiChatBubble from '../components/AiChatBubble';
import { useBrowserNotifications } from '../hooks/useBrowserNotifications';
import { useSidebarState } from '../sidebarState';

// Desktop/tablette : sidebar pleine largeur ou réduite selon le choix de
// l'utilisateur (bouton menu en haut de la Sidebar — état persisté et
// initialisé selon la taille d'écran, voir App.tsx / sidebarState.tsx).
// Mobile (<600px, breakpoint MUI "sm") : sidebar masquée, remplacée par une
// navigation basse (§17 du brief) + un menu complet ouvert par le bouton
// hamburger du Header (toutes les pages, pas seulement les 5 raccourcis).
export default function AppLayout() {
  const isMobile = useMediaQuery('(max-width:599px)');
  const { collapsed } = useSidebarState();
  const sidebarWidth = isMobile ? 0 : collapsed ? COMPACT_WIDTH : FULL_WIDTH;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useBrowserNotifications();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box sx={{
        flexGrow: 1,
        width: { xs: '100%', sm: `calc(100% - ${sidebarWidth}px)` },
        transition: 'width 0.2s ease',
      }}>
        <Header onMenuClick={() => setMobileNavOpen(true)} />
        <Box sx={{ p: { xs: 2, sm: 3 }, pb: isMobile ? 'calc(120px + env(safe-area-inset-bottom))' : 5 }}>
          <Outlet />
          {/* Bloc vide bien réel (pas juste une marge CSS) pour garantir un
              espace libre au-dessus de la barre de navigation basse + la
              bulle IA sur mobile — corrige un défilement qui s'arrêtait
              trop tôt, signalé par l'utilisateur. */}
          {/* Espace de dégagement pour la barre de navigation du bas — le
              padding-bottom de 128px ci-dessus gère déjà l'essentiel (barre
              + bouton IA), ce spacer réduit sert juste de marge finale. */}
          {isMobile && <Box sx={{ height: 12 }} aria-hidden />}
        </Box>
      </Box>
      {isMobile && <MobileBottomNav />}
      {isMobile && <MobileNavDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />}
      <AiChatBubble />
    </Box>
  );
}
