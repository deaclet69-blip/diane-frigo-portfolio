import { useEffect, useState } from 'react';
import { Box, Paper, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Chip } from '@mui/material';
import { getAuditLogs } from '../../services/admin';
import type { AuditLogEntry } from '../../types';
import { diane } from '../../theme';

const actionColors: Record<string, string> = {
  create: diane.green,
  update: diane.blue,
  void: diane.red,
  login: diane.navy,
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    getAuditLogs().then(setLogs);
  }, []);

  return (
    <Box>
      <Paper>
        <TableContainer>
<Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Utilisateur</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Élément</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((l) => (
              <TableRow key={l.id}>
                <TableCell>{new Date(l.createdAt).toLocaleString('fr-FR')}</TableCell>
                <TableCell>{l.user?.name ?? '—'}</TableCell>
                <TableCell>
                  <Chip label={l.action} size="small" sx={{ bgcolor: 'transparent', color: actionColors[l.action] ?? diane.navy, fontWeight: 700 }} />
                </TableCell>
                <TableCell>{l.entityType}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{l.entityId}</TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  Aucune entrée d'audit pour le moment.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
</TableContainer>
      </Paper>
    </Box>
  );
}
