import { useEffect, useState } from 'react';
import {
  Box, Paper, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Button, Switch,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Stack, Chip,
  FormGroup, FormControlLabel, Checkbox, Typography, Alert,
} from '@mui/material';
import { getUsers, createUser, setUserActive, changeUserRole, changeUserPermissions } from '../../services/users';
import { PERMISSION_SECTIONS } from '../../constants/permissions';
import type { AppUser } from '../../types';

const roles = ['ADMIN', 'RESPONSABLE', 'VENDEUR', 'MAGASINIER'];

export default function UsersSettingsPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', roleName: 'VENDEUR', permissions: ['dashboard'] as string[],
  });
  const [permUser, setPermUser] = useState<AppUser | null>(null);
  const [permDraft, setPermDraft] = useState<string[]>([]);

  function reload() {
    getUsers().then(setUsers);
  }
  useEffect(reload, []);

  function togglePerm(list: string[], key: string, checked: boolean) {
    return checked ? [...list, key] : list.filter((k) => k !== key);
  }

  async function handleCreate() {
    if (!form.name || !form.email || !form.password) return;
    await createUser(form);
    setOpen(false);
    setForm({ name: '', email: '', password: '', roleName: 'VENDEUR', permissions: ['dashboard'] });
    reload();
  }

  function openPermDialog(u: AppUser) {
    setPermUser(u);
    setPermDraft(u.permissions ?? []);
  }

  async function handleSavePermissions() {
    if (!permUser) return;
    await changeUserPermissions(permUser.id, permDraft);
    setPermUser(null);
    reload();
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button variant="contained" onClick={() => setOpen(true)}>New User</Button>
      </Stack>

      <Paper>
        <TableContainer>
<Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Allowed Pages</TableCell>
              <TableCell>Active</TableCell>
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
                <TableCell sx={{ maxWidth: 320 }}>
                  {u.role.name === 'ADMIN' ? (
                    <Chip size="small" label="Full access (admin)" color="primary" variant="outlined" />
                  ) : (
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
                      {(u.permissions ?? []).length === 0 && (
                        <Typography variant="caption" color="text.secondary">No pages</Typography>
                      )}
                      {(u.permissions ?? []).map((key) => (
                        <Chip
                          key={key}
                          size="small"
                          label={PERMISSION_SECTIONS.find((s) => s.key === key)?.label ?? key}
                        />
                      ))}
                    </Stack>
                  )}
                  <Button size="small" onClick={() => openPermDialog(u)} disabled={u.role.name === 'ADMIN'}>
                    Edit Access
                  </Button>
                </TableCell>
                <TableCell>
                  <Switch checked={u.isActive} onChange={(e) => setUserActive(u.id, e.target.checked).then(reload)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
</TableContainer>
      </Paper>

      {/* Création d'un nouvel utilisateur */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
            <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth />
            <TextField label="Temporary Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} fullWidth />
            <TextField select label="Role" value={form.roleName} onChange={(e) => setForm({ ...form, roleName: e.target.value })} fullWidth>
              {roles.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </TextField>

            {form.roleName === 'ADMIN' ? (
              <Alert severity="info">An administrator always has access to every page.</Alert>
            ) : (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Pages accessible to this user
                </Typography>
                <FormGroup sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 1 }}>
                  {PERMISSION_SECTIONS.map((s) => (
                    <FormControlLabel
                      key={s.key}
                      control={
                        <Checkbox
                          size="small"
                          checked={form.permissions.includes(s.key)}
                          onChange={(e) => setForm({ ...form, permissions: togglePerm(form.permissions, s.key, e.target.checked) })}
                        />
                      }
                      label={s.label}
                    />
                  ))}
                </FormGroup>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Modification des accès d'un utilisateur existant */}
      <Dialog open={!!permUser} onClose={() => setPermUser(null)} fullWidth maxWidth="sm">
        <DialogTitle>Accessible Pages — {permUser?.name}</DialogTitle>
        <DialogContent>
          <FormGroup sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 1, mt: 1 }}>
            {PERMISSION_SECTIONS.map((s) => (
              <FormControlLabel
                key={s.key}
                control={
                  <Checkbox
                    size="small"
                    checked={permDraft.includes(s.key)}
                    onChange={(e) => setPermDraft(togglePerm(permDraft, s.key, e.target.checked))}
                  />
                }
                label={s.label}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermUser(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSavePermissions}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
