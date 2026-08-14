import { createTheme } from '@mui/material/styles';

// Palette reprise directement de la maquette (section 7 du brief) :
// bleu marine (sidebar), bleu vif (actions), vert/orange/rouge (statuts).
export const diane = {
  navy: '#0B2545',
  navyDark: '#081B33',
  blue: '#1565D8',
  blueLight: '#EAF1FD',
  green: '#1FA45A',
  orange: '#F0932B',
  red: '#E14545',
  bg: '#F5F7FA',
};

const theme = createTheme({
  palette: {
    primary: { main: diane.blue },
    success: { main: diane.green },
    warning: { main: diane.orange },
    error: { main: diane.red },
    background: { default: diane.bg, paper: '#FFFFFF' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif',
    h4: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
      },
    },
  },
});

export default theme;
