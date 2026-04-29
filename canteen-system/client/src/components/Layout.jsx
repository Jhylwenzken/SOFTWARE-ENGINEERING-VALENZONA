import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItemButton,
  ListItemIcon, ListItemText, Box, Avatar, Menu, MenuItem, Divider, useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import BarChartIcon from "@mui/icons-material/BarChart";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import GroupIcon from "@mui/icons-material/Group";
import LogoutIcon from "@mui/icons-material/Logout";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import { useAuth } from "../auth.jsx";

const drawerWidth = 240;

const NAV = [
  { to: "/", label: "Dashboard", icon: <DashboardIcon /> },
  { to: "/pos", label: "POS", icon: <PointOfSaleIcon /> },
  { to: "/menu", label: "Menu", icon: <RestaurantMenuIcon /> },
  { to: "/orders", label: "Orders", icon: <ReceiptLongIcon /> },
  { to: "/sales", label: "Sales", icon: <BarChartIcon /> },
  { to: "/inventory", label: "Inventory", icon: <Inventory2Icon /> },
  { to: "/users", label: "Users", icon: <GroupIcon />, adminOnly: true },
];

export default function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const displayName = user?.role === "admin" ? user?.username : user?.fullName;

  const items = NAV.filter((n) => !n.adminOnly || user?.role === "admin");

  const drawerContent = (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 2 }}>
        <Avatar sx={{ bgcolor: "primary.main" }}>
          <LocalCafeIcon />
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>CampusCanteen</Typography>
          <Typography variant="caption" color="text.secondary">POS & Inventory</Typography>
        </Box>
      </Box>
      <Divider />
      <List>
        {items.map((n) => (
          <ListItemButton
            key={n.to}
            selected={location.pathname === n.to}
            onClick={() => { navigate(n.to); setMobileOpen(false); }}
          >
            <ListItemIcon>{n.icon}</ListItemIcon>
            <ListItemText primary={n.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  const handleLogout = async () => {
    setAnchor(null);
    await logout();
    navigate("/login");
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{ zIndex: theme.zIndex.drawer + 1, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1, color: "primary.main", fontWeight: 700 }}>
            Canteen Information System
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" sx={{ display: { xs: "none", sm: "block" } }}>
              {displayName} <Typography component="span" variant="caption" color="text.secondary">({user?.role})</Typography>
            </Typography>
            <IconButton onClick={(e) => setAnchor(e.currentTarget)}>
              <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>
                {displayName?.[0] || "U"}
              </Avatar>
            </IconButton>
            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isMobile ? "temporary" : "permanent"}
          open={isMobile ? mobileOpen : true}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box", borderRight: 1, borderColor: "divider" },
          }}
        >
          <Toolbar />
          {drawerContent}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { md: `calc(100% - ${drawerWidth}px)` }, bgcolor: "background.default" }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
