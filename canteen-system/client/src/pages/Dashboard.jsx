import { useEffect, useState } from "react";
import {
  Grid, Card, CardContent, Typography, Box, Avatar, List, ListItem, ListItemText, Chip, Stack, CircularProgress,
} from "@mui/material";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaidIcon from "@mui/icons-material/Paid";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { api, peso, formatDate, formatDay } from "../api.js";

function StatCard({ title, value, icon, color }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.dark` }}>{icon}</Avatar>
          <Box>
            <Typography variant="caption" color="text.secondary">{title}</Typography>
            <Typography variant="h5" fontWeight={700}>{value}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [topItems, setTopItems] = useState([]);

  useEffect(() => {
    const from = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    Promise.all([
      api.get("/dashboard/stats"),
      api.get("/dashboard/recent-activity"),
      api.get("/sales/summary", { params: { from } }),
      api.get("/sales/top-items", { params: { from, limit: 5 } }),
    ]).then(([s, a, sum, top]) => {
      setStats(s.data);
      setActivity(a.data);
      setChartData(sum.data.byDay.map((d) => ({ day: formatDay(d.day), total: d.total })));
      setTopItems(top.data);
    });
  }, []);

  if (!stats) return <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Overview of canteen operations</Typography>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Sales Today" value={peso(stats.salesToday)} icon={<PaidIcon />} color="success" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Orders Today" value={stats.ordersToday} icon={<ReceiptLongIcon />} color="primary" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Menu Items" value={`${stats.availableMenuItems}/${stats.totalMenuItems}`} icon={<RestaurantMenuIcon />} color="secondary" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title="Low Stock" value={stats.lowStockCount} icon={<WarningAmberIcon />} color="warning" />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Sales (Last 7 Days)</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Total this week: {peso(stats.salesThisWeek)}
              </Typography>
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(v) => peso(v)} />
                    <Bar dataKey="total" fill="#ea580c" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Top Items (7 days)</Typography>
              <List dense>
                {topItems.length === 0 && <Typography color="text.secondary" variant="body2">No sales yet.</Typography>}
                {topItems.map((it) => (
                  <ListItem key={it.menuId} disableGutters>
                    <ListItemText
                      primary={it.itemName}
                      secondary={`${it.quantitySold} sold · ${peso(it.revenue)}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Activity</Typography>
              <List>
                {activity.map((o) => (
                  <ListItem key={o.orderId} divider>
                    <ListItemText
                      primary={`${o.items || `Order #${o.orderId}`} · ${peso(o.totalAmount)}`}
                      secondary={`${o.userName} · ${formatDate(o.orderDate)}`}
                    />
                    <Chip label={o.status} size="small" color={o.status === "completed" ? "success" : o.status === "cancelled" ? "error" : "warning"} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
