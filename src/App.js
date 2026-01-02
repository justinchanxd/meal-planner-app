import React, { useState } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  CssBaseline,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import WeekCalendar from "./components/WeekCalendar";

const theme = createTheme({
  palette: {
    primary: {
      main: "#2196f3",
      dark: "#1769aa",
      light: "#4dabf5",
    },
    secondary: {
      main: "#2979ff",
      dark: "#1c54b2",
      light: "#5393ff",
    },
    background: {
      default: "#f0f8ff",
      paper: "#e3f2fd",
    },
  },
  typography: {
    fontSize: 18,
  },
});

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" sx={{ backgroundColor: "primary.light" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h5" sx={{ ml: 2 }}>
            Weekly Meal Planner
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <List sx={{ width: 250 }}>
          <ListItem
            button
            onClick={() => {
              setResetTrigger((prev) => prev + 1);
              setDrawerOpen(false);
            }}
          >
            <ListItemText primary="Homepage" sx={{ fontSize: "1.2rem" }} />
          </ListItem>
        </List>
      </Drawer>
      <WeekCalendar resetTrigger={resetTrigger} />
    </ThemeProvider>
  );
}

export default App;
