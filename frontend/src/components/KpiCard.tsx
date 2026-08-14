import { Paper, Stack, Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface KpiCardProps {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: string;
  sublabel?: string;
  sublabelColor?: string;
}

export default function KpiCard({ icon, iconBg, label, value, sublabel, sublabelColor }: KpiCardProps) {
  return (
    <Paper sx={{ p: 2.5, flex: 1, minWidth: 180 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            bgcolor: iconBg,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Stack>
      <Typography variant="h5" fontWeight={700}>
        {value}
      </Typography>
      {sublabel && (
        <Typography variant="caption" sx={{ color: sublabelColor ?? 'text.secondary' }}>
          {sublabel}
        </Typography>
      )}
    </Paper>
  );
}
