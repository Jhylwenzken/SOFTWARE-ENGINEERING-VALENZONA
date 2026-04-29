import { useEffect, useState } from "react";
import {
  Box, Card, CardContent, Typography, Table, TableHead, TableBody, TableCell, TableRow, Chip,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, Snackbar, Alert,
  Grid,
} from "@mui/material";
import { api, formatDate } from "../api.js";
import { useAuth } from "../auth.jsx";

export default function Inventory() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(null);
  const [change, setChange] = useState(0);
  const [reason, setReason] = useState("");
  const [snack, setSnack] = useState(null);

  const load = () => Promise.all([
    api.get("/menu-items"),
    api.get("/inventory/stock-logs", { params: { limit: 30 } }),
  ]).then(([m, l]) => { setItems(m.data); setLogs(l.data); });

  useEffect(() => { load(); }, []);

  const openAdjust = (it) => {
    setTarget(it);
    setChange(0);
    setReason("");
    setOpen(true);
  };

  const submit = async () => {
    try {
      const ch = parseInt(change, 10);
      if (!ch || !reason) return setSnack({ severity: "warning", message: "Enter change and reason" });
      await api.post("/inventory/stock-adjust", { menuId: target.menuId, changeAmount: ch, reason });
      setSnack({ severity: "success", message: "Stock adjusted" });
      setOpen(false);
      load();
    } catch (e) {
      setSnack({ severity: "error", message: e.response?.data?.message || "Failed" });
    }
  };

  const stockColor = (q) => q <= 5 ? "error" : q <= 10 ? "warning" : "success";

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Inventory</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>Track stock levels and movement history</Typography>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Stock Levels</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Stock</TableCell>
                    {isAdmin && <TableCell align="right">Action</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((it) => (
                    <TableRow key={it.menuId} hover>
                      <TableCell>{it.itemName}</TableCell>
                      <TableCell>{it.category}</TableCell>
                      <TableCell align="right">
                        <Chip label={it.stockQuantity} size="small" color={stockColor(it.stockQuantity)} />
                      </TableCell>
                      {isAdmin && (
                        <TableCell align="right">
                          <Button size="small" onClick={() => openAdjust(it)}>Adjust</Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Stock Movement History</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Change</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>When</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((l) => (
                    <TableRow key={l.logId}>
                      <TableCell>{l.itemName}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color={l.changeAmount < 0 ? "error.main" : "success.main"} fontWeight={600}>
                          {l.changeAmount > 0 ? `+${l.changeAmount}` : l.changeAmount}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{l.reason}</Typography>
                        <Typography variant="caption" display="block" color="text.secondary">{l.userName}</Typography>
                      </TableCell>
                      <TableCell><Typography variant="caption">{formatDate(l.loggedAt)}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Adjust Stock — {target?.itemName}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">Current stock: {target?.stockQuantity}</Typography>
            <TextField
              label="Change Amount (positive to add, negative to remove)"
              type="number"
              value={change}
              onChange={(e) => setChange(e.target.value)}
              fullWidth
              autoFocus
            />
            <TextField
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              fullWidth
              placeholder="Restock / Damaged / Expired / etc."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)}>
        {snack && <Alert severity={snack.severity} onClose={() => setSnack(null)}>{snack.message}</Alert>}
      </Snackbar>
    </Box>
  );
}
