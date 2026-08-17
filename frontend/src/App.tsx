import { useMemo, useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { RouterProvider } from 'react-router-dom';
import { getTheme } from './theme';
import { router } from './router';
import { ColorModeContext } from './colorMode';

export default function App() {
  const [mode, setMode] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('colorMode') as 'light' | 'dark') ?? 'light',
  );

  const colorMode = useMemo(() => ({
    mode,
    toggle: () => {
      setMode((prev) => {
        const next = prev === 'light' ? 'dark' : 'light';
        localStorage.setItem('colorMode', next);
        return next;
      });
    },
  }), [mode]);

  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RouterProvider router={router} />
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
