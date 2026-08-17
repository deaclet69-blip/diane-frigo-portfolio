import { Box, useMediaQuery } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Sidebar, { FULL_WIDTH, COMPACT_WIDTH } from '../components/Sidebar';
import Header from '../components/Header';
import MobileBottomNav from '../components/MobileBottomNav';
import AiChatBubble from '../components/AiChatBubble';
import { useBrowserNotifications } from '../hooks/useBrowserNotifications';

// Desktop : sidebar fixe pleine largeur. Tablette (<1100px) : sidebar
// compacte icônes seules. Mobile (<600px, breakpoint MUI "sm") : sidebar
// masquée, remplacée par une navigation basse (§17 du brief).
export default function AppLayout() {
  const isMobile = useMediaQuery('(max-width:599px)');
  const isCompact = useMediaQuery('(max-width:1100px)');
  const sidebarWidth = isMobile ? 0 : isCompact ? COMPACT_WIDTH : FULL_WIDTH;

  useBrowserNotifications();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, width: { xs: '100%', sm: `calc(100% - ${sidebarWidth}px)` } }}>
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
