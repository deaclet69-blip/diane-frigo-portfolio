import { useMemo, useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { RouterProvider } from 'react-router-dom';
import { getTheme } from './theme';
import { router } from './router';
import { ColorModeContext } from './colorMode';
import { SidebarStateContext } from './sidebarState';
import ApiErrorNotification from './components/ApiErrorNotification';

export default function App() {
  const [mode, setMode] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('colorMode') as 'light' | 'dark') ?? 'light',
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    const stored = localStorage.getItem('sidebarCollapsed');
    if (stored !== null) return stored === '1';
    // Aucune préférence enregistrée : la barre démarre ouverte au premier
    // chargement. C'est ensuite entièrement l'utilisateur qui décide de la
    // réduire ou non — son choix est mémorisé pour la prochaine visite.
    return false;
  });

  const colorMode = useMemo(
    () => ({
      mode,
      toggle: () => {
        setMode((prev) => {
          const next = prev === 'light' ? 'dark' : 'light';
          localStorage.setItem('colorMode', next);
          return next;
        });
      },
    }),
    [mode],
  );

  const sidebarState = useMemo(
    () => ({
      collapsed: sidebarCollapsed,
      toggle: () => {
        setSidebarCollapsed((prev) => {
          const next = !prev;
          localStorage.setItem('sidebarCollapsed', next ? '1' : '0');
          return next;
        });
      },
    }),
    [sidebarCollapsed],
  );

  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <SidebarStateContext.Provider value={sidebarState}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ApiErrorNotification />
          <RouterProvider router={router} />
        </ThemeProvider>
      </SidebarStateContext.Provider>
    </ColorModeContext.Provider>
  );
}
