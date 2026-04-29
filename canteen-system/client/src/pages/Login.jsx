import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert, Avatar, Stack, Paper,
} from "@mui/material";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import { useAuth } from "../auth.jsx";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate("/", { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      bgcolor: "background.default",
      p: 2,
    }}>
      <Box sx={{ width: "100%", maxWidth: 420 }}>
        <Stack alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56 }}>
            <LocalCafeIcon fontSize="large" />
          </Avatar>
          <Typography variant="h4" color="primary" fontWeight={700}>CampusCanteen</Typography>
          <Typography variant="body2" color="text.secondary">Information & Point of Sale System</Typography>
        </Stack>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Sign In</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter your credentials to access the system
            </Typography>
            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Username"
                  fullWidth
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                  required
                />
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {error && <Alert severity="error">{error}</Alert>}
                <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>

        {/* <Paper variant="outlined" sx={{ mt: 2, p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Demo Credentials</Typography>
          <Typography variant="body2" component="div" sx={{ fontFamily: "monospace" }}>
            Admin: admin / admin<br />
            Staff: staff / staff123
          </Typography>
        </Paper> */}
      </Box>
    </Box>
  );
}
