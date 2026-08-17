import { useEffect, useState } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { getFullDashboard } from '../../services/dashboard';
import type { FullDashboard } from '../../types';
import { diane } from '../../theme';

const alertStyle: Record<string, { bg: string; color: string; icon: JSX.Element }> = {
  warning: { bg: diane.orangeLight, color: diane.orange, icon: <WarningAmberIcon /> },
  error: { bg: diane.redLight, color: diane.red, icon: <Inventory2OutlinedIcon /> },
  info: { bg: diane.blueLight, color: diane.blue, icon: <AccountBalanceWalletOutlinedIcon /> },
};

export default function NotificationsPage() {
  const [data, setData] = useState<FullDashboard | null>(null);

  useEffect(() => {
    getFullDashboard().then(setData);
  }, []);

  return (
    <Box maxWidth={720}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>Alertes et notifications</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Toutes les alertes actuelles de ton activité — stock, paiements, dépôts.
      </Typography>

      <Paper sx={{ p: 2 }}>
        <List disablePadding>
          {data?.alerts.map((a, i) => {
            const s = alertStyle[a.type] ?? alertStyle.info;
            return (
              <ListItem key={i} sx={{ py: 1.5, borderBottom: i < data.alerts.length - 1 ? '1px solid #F0F0F0' : 'none' }}>
                <ListItemIcon sx={{ minWidth: 52 }}>
                  <Box sx={{
                    width: 40, height: 40, borderRadius: 2.5, bgcolor: s.bg, color: s.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {s.icon}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={<Typography fontWeight={700}>{a.title}</Typography>}
                  secondary={a.detail}
                />
              </ListItem>
            );
          })}
          {(data?.alerts.length ?? 0) === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              Tout va bien, aucune alerte pour le moment. 🎉
            </Typography>
          )}
        </List>
      </Paper>
    </Box>
  );
}
