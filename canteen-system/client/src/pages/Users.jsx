import { useEffect, useState } from "react";
import {
  Box, Card, CardContent, Typography, Table, TableHead, TableBody, TableCell, TableRow, Chip, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Stack, IconButton, Snackbar, Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { InputAdornment } from "@mui/material";
import { api, formatDate } from "../api.js";
import { useAuth } from "../auth.jsx";

const empty = { username: "", password: "", fullName: "", role: "staff" };

export default function Users() {
  const { user, refreshUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [snack, setSnack] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const load = () => api.get("/users").then((r) => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const submit = async () => {
    try {
      const payload = editing
        ? { username: form.username, fullName: form.fullName, role: form.role, ...(form.password ? { password: form.password } : {}) }
        : form;
      if (editing) await api.patch(`/users/${editing.userId}`, payload);
      else await api.post("/users", payload);
      setSnack({ severity: "success", message: editing ? "User updated" : "User created" });
      setOpen(false);
      setForm(empty);
      setEditing(null);
      load();
      if (editing && editing.userId === user?.userId) await refreshUser();
    } catch (e) {
      console.error("User submit error:", e);
      const status = e.response?.status;
      const serverMsg = e.response?.data?.message ?? (e.response?.data ? JSON.stringify(e.response.data) : null);
      setSnack({ severity: "error", message: status ? `${status}: ${serverMsg || e.message}` : (serverMsg || e.message) });
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({ username: u.username, password: "", fullName: u.fullName, role: u.role });
    setOpen(true);
  };

  const remove = async (u) => {
    if (!confirm(`Delete ${u.username}?`)) return;
    try {
      await api.delete(`/users/${u.userId}`);
      setSnack({ severity: "success", message: "User deleted" });
      load();
    } catch (e) {
      console.error("User delete error:", e);
      const status = e.response?.status;
      const serverMsg = e.response?.data?.message ?? (e.response?.data ? JSON.stringify(e.response.data) : null);
      setSnack({ severity: "error", message: status ? `${status}: ${serverMsg || e.message}` : (serverMsg || e.message) });
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4">Users</Typography>
          <Typography color="text.secondary">Manage admin and staff accounts</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>Add User</Button>
      </Stack>

      <Card>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Full Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.userId} hover>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.fullName}</TableCell>
                  <TableCell><Chip size="small" label={u.role} color={u.role === "admin" ? "primary" : "default"} /></TableCell>
                  <TableCell>{formatDate(u.createdAt)}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(u)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => remove(u)} disabled={u.userId === user?.userId}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? "Edit User" : "Add User"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} fullWidth />
            <TextField label="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} fullWidth />
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              fullWidth
              placeholder={editing ? "Leave blank to keep current password" : "Enter password"}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((s) => !s)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} fullWidth>
              <MenuItem value="staff">Staff</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpen(false); setEditing(null); }}>Cancel</Button>
          <Button onClick={submit} variant="contained">{editing ? "Save Changes" : "Create"}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)}>
        {snack && <Alert severity={snack.severity} onClose={() => setSnack(null)}>{snack.message}</Alert>}
      </Snackbar>
    </Box>
  );
}
