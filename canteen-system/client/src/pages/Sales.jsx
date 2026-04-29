import { useEffect, useState } from "react";
import {
  Box, Card, CardContent, Typography, Grid, Stack, TextField, Table, TableHead, TableBody, TableCell, TableRow,
  Avatar,
} from "@mui/material";
import PaidIcon from "@mui/icons-material/Paid";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { api, peso, formatDate, formatDay } from "../api.js";

export default function Sales() {
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(weekAgo);
  const [to, setTo] = useState(today);
  const [summary, setSummary] = useState(null);
  const [topItems, setTopItems] = useState([]);
  const [sales, setSales] = useState([]);

  useEffect(() => {
    const params = { from, to: `${to} 23:59:59` };
    Promise.all([
      api.get("/sales/summary", { params }),
      api.get("/sales/top-items", { params: { ...params, limit: 10 } }),
      api.get("/sales", { params }),
    ]).then(([s, t, sl]) => {
      setSummary(s.data);
      setTopItems(t.data);
      setSales(sl.data);
    });
  }, [from, to]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Sales Report</Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
            <TextField type="date" label="From" InputLabelProps={{ shrink: true }} value={from} onChange={(e) => setFrom(e.target.value)} size="small" />
            <TextField type="date" label="To" InputLabelProps={{ shrink: true }} value={to} onChange={(e) => setTo(e.target.value)} size="small" />
          </Stack>
        </CardContent>
      </Card>

      {summary && (
        <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: "success.light", color: "success.dark" }}><PaidIcon /></Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Total Revenue</Typography>
                    <Typography variant="h5" fontWeight={700}>{peso(summary.totalSales)}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: "primary.light", color: "primary.dark" }}><ReceiptIcon /></Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Transactions</Typography>
                    <Typography variant="h5" fontWeight={700}>{summary.totalTransactions}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Revenue Over Time</Typography>
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={(summary?.byDay || []).map((d) => ({ day: formatDay(d.day), total: d.total }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(v) => peso(v)} />
                    <Line type="monotone" dataKey="total" stroke="#ea580c" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Top Selling Items</Typography>
              <Table size="small">
                <TableBody>
                  {topItems.map((it) => (
                    <TableRow key={it.menuId}>
                      <TableCell>{it.itemName}</TableCell>
                      <TableCell align="right">{it.quantitySold}</TableCell>
                      <TableCell align="right">{peso(it.revenue)}</TableCell>
                    </TableRow>
                  ))}
                  {topItems.length === 0 && (
                    <TableRow><TableCell align="center"><Typography variant="body2" color="text.secondary">No data</Typography></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Transactions</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Sale #</TableCell>
                    <TableCell>Order #</TableCell>
                    <TableCell>Cashier</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sales.map((s) => (
                    <TableRow key={s.saleId} hover>
                      <TableCell>#{s.saleId}</TableCell>
                      <TableCell>#{s.orderId}</TableCell>
                      <TableCell>{s.userName}</TableCell>
                      <TableCell>{formatDate(s.saleDate)}</TableCell>
                      <TableCell align="right">{peso(s.totalAmount)}</TableCell>
                    </TableRow>
                  ))}
                  {sales.length === 0 && (
                    <TableRow><TableCell colSpan={5} align="center"><Typography color="text.secondary">No sales in range.</Typography></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
