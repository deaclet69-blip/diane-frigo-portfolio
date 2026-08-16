import { createTheme } from '@mui/material/styles';

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

const theme = createTheme({
  palette: {
    primary: { main: diane.indigo },
    success: { main: diane.green },
    warning: { main: diane.orange },
    error: { main: diane.red },
    background: { default: diane.bg, paper: '#FFFFFF' },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif',
    h4: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { boxShadow: '0 2px 12px rgba(13, 23, 52, 0.06)' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 10 },
      },
    },
  },
});

export default theme;
