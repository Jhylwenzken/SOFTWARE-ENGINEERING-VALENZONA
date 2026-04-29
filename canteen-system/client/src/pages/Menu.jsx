import { useEffect, useState } from "react";
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Chip, Stack,
  Snackbar, Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import ArchiveIcon from "@mui/icons-material/Archive";
import UnarchiveIcon from "@mui/icons-material/Unarchive";
import { api, peso } from "../api.js";
import { useAuth } from "../auth.jsx";

const CATEGORIES = ["Main Dish", "Snack", "Side", "Dessert", "Beverage"];
const empty = { itemName: "", description: "", price: "", category: "Main Dish", stockQuantity: 0, status: "available", imageUrl: "" };

export default function MenuPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [snack, setSnack] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  const load = () => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    return api.get("/menu-items", { params }).then((r) => setItems(r.data));
  };
  useEffect(() => { load(); }, [statusFilter]);

  const openAdd = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (it) => {
    setEditing(it);
    setForm({
      itemName: it.itemName, description: it.description || "", price: it.price,
      category: it.category, stockQuantity: it.stockQuantity, status: it.status, imageUrl: it.imageUrl || "",
    });
    setOpen(true);
  };

  const save = async () => {
    try {
      const payload = { ...form, price: Number(form.price), stockQuantity: Number(form.stockQuantity) };
      if (editing) await api.patch(`/menu-items/${editing.menuId}`, payload);
      else await api.post("/menu-items", payload);
      setSnack({ severity: "success", message: editing ? "Item updated" : "Item added" });
      setOpen(false);
      load();
    } catch (e) {
      setSnack({ severity: "error", message: e.response?.data?.message || "Save failed" });
    }
  };

  const remove = async (it) => {
    if (!confirm(`Delete ${it.itemName}?`)) return;
    try {
      await api.delete(`/menu-items/${it.menuId}`);
      setSnack({ severity: "success", message: "Item deleted" });
      load();
    } catch (e) {
      const message = e.response?.data?.message || "Delete failed";
      setSnack({ severity: "error", message: message.includes("order history") ? `${message} Use Archive instead.` : message });
    }
  };

  const forceDelete = async (it) => {
    if (!confirm(`Force delete ${it.itemName}? This will archive dependent history and remove the item.`)) return;
    try {
      await api.post(`/menu-items/${it.menuId}/force`);
      setSnack({ severity: "success", message: "Item force-deleted" });
      load();
    } catch (e) {
      setSnack({ severity: "error", message: e.response?.data?.message || "Force delete failed" });
    }
  };

  const toggleStatus = async (it) => {
    const nextStatus = it.status === "available" ? "unavailable" : "available";
    try {
      await api.patch(`/menu-items/${it.menuId}`, { status: nextStatus });
      setSnack({ severity: "success", message: nextStatus === "available" ? "Item restored" : "Item archived" });
      load();
    } catch (e) {
      setSnack({ severity: "error", message: e.response?.data?.message || "Status update failed" });
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4">Menu</Typography>
          <Typography color="text.secondary">{isAdmin ? "Manage menu items" : "Browse menu items"}</Typography>
        </Box>
        {isAdmin && <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>Add Item</Button>}
      </Stack>

      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2, flexWrap: "wrap" }}>
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="available">Available</MenuItem>
          <MenuItem value="unavailable">Unavailable</MenuItem>
        </TextField>
        {isAdmin && (
          <Typography variant="body2" color="text.secondary">
            Archive items with sales history instead of deleting them.
          </Typography>
        )}
      </Box>

      <Card>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Stock</TableCell>
                <TableCell>Status</TableCell>
                {isAdmin && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.menuId} hover>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      {it.imageUrl && <img src={it.imageUrl} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover" }} />}
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{it.itemName}</Typography>
                        {it.description && <Typography variant="caption" color="text.secondary">{it.description}</Typography>}
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>{it.category}</TableCell>
                  <TableCell align="right">{peso(it.price)}</TableCell>
                  <TableCell align="right">
                    <Chip label={it.stockQuantity} size="small" color={it.stockQuantity <= 5 ? "warning" : it.stockQuantity <= 10 ? "default" : "success"} variant={it.stockQuantity <= 10 ? "filled" : "outlined"} />
                  </TableCell>
                  <TableCell>
                    <Chip label={it.status} size="small" color={it.status === "available" ? "success" : "default"} />
                  </TableCell>
                  {isAdmin && (
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEdit(it)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => toggleStatus(it)} aria-label={it.status === "available" ? "Archive item" : "Restore item"}>
                        {it.status === "available" ? <ArchiveIcon fontSize="small" /> : <UnarchiveIcon fontSize="small" />}
                      </IconButton>
                      <IconButton size="small" onClick={() => remove(it)}><DeleteIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => forceDelete(it)} title="Force delete (archive history)">
                        <DeleteForeverIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Edit Item" : "Add Menu Item"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Item Name" value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} fullWidth />
            <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth multiline rows={2} />
            <Stack direction="row" spacing={2}>
              <TextField label="Price (₱)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} fullWidth />
              <TextField label="Stock" type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} fullWidth />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} fullWidth>
                {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
              <TextField select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} fullWidth>
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="unavailable">Unavailable</MenuItem>
              </TextField>
            </Stack>
            <TextField label="Image URL (optional)" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} fullWidth placeholder="/menu/adobo.png" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)}>
        {snack && <Alert severity={snack.severity} onClose={() => setSnack(null)}>{snack.message}</Alert>}
      </Snackbar>
    </Box>
  );
}
