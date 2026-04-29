import { useEffect, useState } from "react";
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableHead, TableRow, Chip,
  Drawer, IconButton, List, ListItem, ListItemText, Divider, Stack, ToggleButton, ToggleButtonGroup, Button,
  Snackbar, Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { api, peso, formatDate } from "../api.js";

const STATUS_COLORS = { completed: "success", pending: "warning", cancelled: "error" };

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [snack, setSnack] = useState(null);

  const load = () => {
    const params = filter !== "all" ? { status: filter } : {};
    return api.get("/orders", { params }).then((r) => setOrders(r.data));
  };

  useEffect(() => { load(); }, [filter]);

  const openDetail = async (orderId) => {
    const r = await api.get(`/orders/${orderId}`);
    setSelected(r.data);
  };

  const updateStatus = async (status) => {
    try {
      const r = await api.patch(`/orders/${selected.orderId}/status`, { status });
      setSelected(r.data);
      setSnack({ severity: "success", message: `Status set to ${status}` });
      load();
    } catch (e) {
      setSnack({ severity: "error", message: e.response?.data?.message || "Update failed" });
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Orders</Typography>
      <ToggleButtonGroup value={filter} exclusive onChange={(_, v) => v && setFilter(v)} size="small" sx={{ mb: 2 }}>
        <ToggleButton value="all">All</ToggleButton>
        <ToggleButton value="completed">Completed</ToggleButton>
        <ToggleButton value="pending">Pending</ToggleButton>
        <ToggleButton value="cancelled">Cancelled</ToggleButton>
      </ToggleButtonGroup>

      <Card>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Cashier</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.orderId} hover sx={{ cursor: "pointer" }} onClick={() => openDetail(o.orderId)}>
                  <TableCell>#{o.orderId}</TableCell>
                  <TableCell>{o.userName}</TableCell>
                  <TableCell>{formatDate(o.orderDate)}</TableCell>
                  <TableCell align="right">{peso(o.totalAmount)}</TableCell>
                  <TableCell><Chip size="small" label={o.status} color={STATUS_COLORS[o.status]} /></TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center"><Typography color="text.secondary">No orders.</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Drawer anchor="right" open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <Box sx={{ width: 380, p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">Order #{selected.orderId}</Typography>
              <IconButton onClick={() => setSelected(null)}><CloseIcon /></IconButton>
            </Stack>
            <Typography variant="body2" color="text.secondary">Cashier: {selected.userName}</Typography>
            <Typography variant="body2" color="text.secondary">Date: {formatDate(selected.orderDate)}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip size="small" label={selected.status} color={STATUS_COLORS[selected.status]} />
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>Items</Typography>
            <List dense>
              {selected.details.map((d) => (
                <ListItem key={d.detailId} disableGutters>
                  <ListItemText
                    primary={`${d.itemName} × ${d.quantity}`}
                    secondary={`${peso(d.unitPrice)} each`}
                  />
                  <Typography variant="body2">{peso(d.subtotal)}</Typography>
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6" color="primary">{peso(selected.totalAmount)}</Typography>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>Update Status</Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" color="warning" onClick={() => updateStatus("pending")}>Pending</Button>
              <Button size="small" variant="outlined" color="success" onClick={() => updateStatus("completed")}>Completed</Button>
              <Button size="small" variant="outlined" color="error" onClick={() => updateStatus("cancelled")}>Cancelled</Button>
            </Stack>
          </Box>
        )}
      </Drawer>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)}>
        {snack && <Alert severity={snack.severity} onClose={() => setSnack(null)}>{snack.message}</Alert>}
      </Snackbar>
    </Box>
  );
}
