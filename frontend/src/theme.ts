import { createTheme } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';

// Palette extraite de la maquette "futuriste professionnel" fournie par Diane
// (échantillonnée directement depuis l'image — voir conversation).
export const diane = {
  navy: '#0D1734',
  navyFooter: '#0B1B48',
  navyLight: '#16224A',
  blue: '#3B84FE',
  indigo: '#3A4EFD',
  blueLight: '#EAF1FD',
  green: '#22C55E',
  greenLight: '#E7F9EE',
  purple: '#8B5CF6',
  purpleLight: '#F3EAFE',
  orange: '#F59E0B',
  orangeLight: '#FEF3E2',
  red: '#EF4444',
  redLight: '#FDEAEA',
  bg: '#F4F7FE',
};

/** Vrai mode sombre (demande utilisateur) — la sidebar reste identique
 * (déjà foncée par design), seuls le fond et les cartes s'adaptent. */
export function getTheme(mode: PaletteMode) {
  const isDark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: { main: diane.indigo },
      success: { main: diane.green },
      warning: { main: diane.orange },
      error: { main: diane.red },
      background: {
        default: isDark ? '#0B1220' : diane.bg,
        paper: isDark ? '#131B34' : '#FFFFFF',
      },
      ...(isDark ? { text: { primary: '#E8ECF7', secondary: '#9AA4C0' } } : {}),
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif',
      h4: { fontWeight: 700 },
      h6: { fontWeight: 600 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            scrollbarWidth: 'none', // Firefox
          },
          body: {
            scrollbarWidth: 'none', // Firefox
            '&::-webkit-scrollbar': { display: 'none' }, // Chrome/Edge/Safari
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.35)' : '0 2px 12px rgba(13, 23, 52, 0.06)',
            backgroundImage: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600, borderRadius: 10 },
        },
      },
    },
  });
}

const theme = getTheme('light');
export default theme;
