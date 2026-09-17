import { useEffect, useState } from 'react';
import { Box, Typography, Paper, List, ListItemIcon, ListItemText, ListItemButton } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  useEffect(() => {
    getFullDashboard().then(setData);
  }, []);

  return (
    <Box maxWidth={720}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
        Alerts &amp; Notifications
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        All current alerts for your business — click an alert to see details.
      </Typography>

      <Paper sx={{ p: 2 }}>
        <List disablePadding>
          {data?.alerts.map((a, i) => {
            const s = alertStyle[a.type] ?? alertStyle.info;
            return (
              <ListItemButton
                key={i}
                onClick={() => navigate(a.link)}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  borderBottom: i < data.alerts.length - 1 ? '1px solid #F0F0F0' : 'none',
                }}
              >
                <ListItemIcon sx={{ minWidth: 52 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2.5,
                      bgcolor: s.bg,
                      color: s.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {s.icon}
                  </Box>
                </ListItemIcon>
                <ListItemText primary={<Typography fontWeight={700}>{a.title}</Typography>} secondary={a.detail} />
                <ChevronRightIcon sx={{ color: 'text.secondary' }} />
              </ListItemButton>
            );
          })}
          {(data?.alerts.length ?? 0) === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              All good, no alerts right now. 🎉
            </Typography>
          )}
        </List>
      </Paper>
    </Box>
  );
}
