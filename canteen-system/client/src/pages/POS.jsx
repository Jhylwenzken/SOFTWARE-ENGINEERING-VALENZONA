import { useEffect, useState, useMemo } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Button, IconButton, TextField, Tabs, Tab, Chip,
  List, ListItem, ListItemText, Divider, Alert, Snackbar, Avatar, Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/Delete";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import { api, peso } from "../api.js";

export default function POS() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [snack, setSnack] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadItems = () => api.get("/menu-items", { params: { status: "available" } }).then((r) => setItems(r.data));

  useEffect(() => { loadItems(); }, []);

  const categories = useMemo(() => ["All", ...Array.from(new Set(items.map((i) => i.category)))], [items]);

  const filtered = items.filter((i) =>
    (category === "All" || i.category === category) &&
    (search === "" || i.itemName.toLowerCase().includes(search.toLowerCase()))
  );

  const addToCart = (item) => {
    if (item.stockQuantity <= 0) return setSnack({ severity: "warning", message: "Out of stock" });
    setCart((prev) => {
      const existing = prev.find((c) => c.menuId === item.menuId);
      if (existing) {
        if (existing.quantity >= item.stockQuantity) {
          setSnack({ severity: "warning", message: `Only ${item.stockQuantity} ${item.itemName} in stock` });
          return prev;
        }
        return prev.map((c) => c.menuId === item.menuId ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { menuId: item.menuId, itemName: item.itemName, price: item.price, quantity: 1, maxStock: item.stockQuantity }];
    });
  };

  const updateQty = (menuId, delta) => {
    setCart((prev) => prev.flatMap((c) => {
      if (c.menuId !== menuId) return [c];
      const newQty = c.quantity + delta;
      if (newQty <= 0) return [];
      if (newQty > c.maxStock) return [c];
      return [{ ...c, quantity: newQty }];
    }));
  };

  const removeItem = (menuId) => setCart((prev) => prev.filter((c) => c.menuId !== menuId));

  const total = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  const checkout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const r = await api.post("/orders", { items: cart.map((c) => ({ menuId: c.menuId, quantity: c.quantity })) });
      setSnack({ severity: "success", message: `Order #${r.data.orderId} placed · ${peso(r.data.totalAmount)}` });
      setCart([]);
      loadItems();
    } catch (e) {
      setSnack({ severity: "error", message: e.response?.data?.message || "Checkout failed" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Point of Sale</Typography>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
                <TextField
                  label="Search items"
                  size="small"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  fullWidth
                />
              </Stack>
              <Tabs value={category} onChange={(_, v) => setCategory(v)} variant="scrollable" scrollButtons="auto">
                {categories.map((c) => <Tab key={c} value={c} label={c} />)}
              </Tabs>
            </CardContent>
          </Card>
          <Grid container spacing={2}>
            {filtered.map((item) => (
              <Grid key={item.menuId} size={{ xs: 6, sm: 4, md: 3 }}>
                <Card
                  onClick={() => addToCart(item)}
                  sx={{
                    cursor: "pointer", height: "100%",
                    "&:hover": { boxShadow: 4, transform: "translateY(-2px)" },
                    transition: "all 0.15s",
                    opacity: item.stockQuantity > 0 ? 1 : 0.5,
                  }}
                >
                  <Box sx={{ height: 100, bgcolor: "grey.100", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.itemName} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                    ) : (
                      <Avatar sx={{ bgcolor: "primary.light" }}><RestaurantMenuIcon /></Avatar>
                    )}
                  </Box>
                  <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                    <Typography variant="body2" fontWeight={600} noWrap>{item.itemName}</Typography>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.5 }}>
                      <Typography variant="body2" color="primary" fontWeight={700}>{peso(item.price)}</Typography>
                      <Chip label={`${item.stockQuantity}`} size="small" color={item.stockQuantity <= 5 ? "warning" : "default"} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ position: { md: "sticky" }, top: { md: 80 } }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Current Order</Typography>
              {cart.length === 0 ? (
                <Typography color="text.secondary" variant="body2" sx={{ py: 4, textAlign: "center" }}>
                  Cart is empty. Click items to add.
                </Typography>
              ) : (
                <List dense>
                  {cart.map((c) => (
                    <ListItem key={c.menuId} disableGutters
                      secondaryAction={
                        <IconButton edge="end" size="small" onClick={() => removeItem(c.menuId)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={c.itemName}
                        secondary={
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                            <IconButton size="small" onClick={() => updateQty(c.menuId, -1)}><RemoveIcon fontSize="small" /></IconButton>
                            <Typography variant="body2">{c.quantity}</Typography>
                            <IconButton size="small" onClick={() => updateQty(c.menuId, 1)}><AddIcon fontSize="small" /></IconButton>
                            <Typography variant="caption" sx={{ ml: "auto" }}>{peso(c.price * c.quantity)}</Typography>
                          </Stack>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6" color="primary">{peso(total)}</Typography>
              </Stack>
              <Button fullWidth variant="contained" size="large" disabled={cart.length === 0 || submitting} onClick={checkout}>
                {submitting ? "Processing..." : "Checkout"}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar open={!!snack} autoHideDuration={3500} onClose={() => setSnack(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        {snack && <Alert severity={snack.severity} onClose={() => setSnack(null)}>{snack.message}</Alert>}
      </Snackbar>
    </Box>
  );
}
