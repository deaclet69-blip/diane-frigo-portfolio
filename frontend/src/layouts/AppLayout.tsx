import { useState } from 'react';
import { Box, useMediaQuery } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar, { FULL_WIDTH, COMPACT_WIDTH } from '../components/Sidebar';
import Header from '../components/Header';
import MobileBottomNav, { BOTTOM_NAV_HEIGHT } from '../components/MobileBottomNav';
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
//
// Correction centralisée (bug remonté par l'utilisateur) : sur mobile, le
// contenu défilable passait derrière la Bottom Navigation, fixe en bas de
// l'écran. Un SEUL padding-bottom ici, sur le conteneur qui enveloppe
// <Outlet/>, s'applique automatiquement à TOUTES les pages qui utilisent ce
// layout — aucune page individuelle n'a besoin de son propre correctif.
// La valeur = la vraie hauteur de la nav basse (BOTTOM_NAV_HEIGHT, importée
// depuis le composant lui-même — une seule source de vérité) + la zone de
// sécurité réelle du téléphone (encoche/barre de geste, via
// env(safe-area-inset-bottom)) + 24px de confort visuel.
export default function AppLayout() {
  const isMobile = useMediaQuery('(max-width:599px)');
  const { collapsed } = useSidebarState();
  const sidebarWidth = isMobile ? 0 : collapsed ? COMPACT_WIDTH : FULL_WIDTH;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useBrowserNotifications();

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box sx={{
        flexGrow: 1,
        width: { xs: '100%', sm: `calc(100% - ${sidebarWidth}px)` },
        transition: 'width 0.2s ease',
      }}>
        <Header onMenuClick={() => setMobileNavOpen(true)} />
        <Box
          sx={{
            // pt/pr/pl séparés (au lieu du raccourci "p") — mélanger "p" et
            // "pb" dans le même sx pouvait faire gagner silencieusement le
            // raccourci "p" sur "pb" (conflit confirmé en inspectant le CSS
            // généré : "padding-bottom" retombait à 16px malgré la règle
            // calc() bien présente, mais perdante). Cause racine identifiée
            // et corrigée ici, à la source, plutôt qu'en rajoutant du
            // padding par-dessus.
            pt: { xs: 2, sm: 3 },
            pr: { xs: 2, sm: 3 },
            pl: { xs: 2, sm: 3 },
            pb: isMobile
              ? `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px) + 24px)`
              : 5,
          }}
        >
          <Outlet />
        </Box>
      </Box>
      {isMobile && <MobileBottomNav />}
      {isMobile && <MobileNavDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />}
      <AiChatBubble />
    </Box>
  );
}
