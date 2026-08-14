import { useEffect, useState } from 'react';
import {
  Box, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button, Switch,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Stack, Chip,
} from '@mui/material';
import { getUsers, createUser, setUserActive, changeUserRole } from '../../services/users';
import type { AppUser } from '../../types';

const roles = ['ADMIN', 'RESPONSABLE', 'VENDEUR', 'MAGASINIER'];

export default function UsersSettingsPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', roleName: 'VENDEUR' });

  function reload() {
    getUsers().then(setUsers);
  }
  useEffect(reload, []);

  async function handleCreate() {
    if (!form.name || !form.email || !form.password) return;
    await createUser(form);
    setOpen(false);
    setForm({ name: '', email: '', password: '', roleName: 'VENDEUR' });
    reload();
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button variant="contained" onClick={() => setOpen(true)}>Nouvel utilisateur</Button>
      </Stack>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Actif</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell sx={{ fontWeight: 600 }}>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <TextField
                    select
                    size="small"
                    value={u.role.name}
                    onChange={(e) => changeUserRole(u.id, e.target.value).then(reload)}
                    sx={{ minWidth: 160 }}
                  >
                    {roles.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                  </TextField>
                </TableCell>
                <TableCell>
                  <Switch checked={u.isActive} onChange={(e) => setUserActive(u.id, e.target.checked).then(reload)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Nouvel utilisateur</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
            <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth />
            <TextField label="Mot de passe provisoire" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} fullWidth />
            <TextField select label="Rôle" value={form.roleName} onChange={(e) => setForm({ ...form, roleName: e.target.value })} fullWidth>
              {roles.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleCreate}>Créer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
