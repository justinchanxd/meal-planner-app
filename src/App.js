import React, { useState, useEffect } from "react";
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
  Box,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "./utils/supabase";
import WeekCalendar from "./components/WeekCalendar";
import RecipeManagement from "./components/RecipeManagement";
import AuthCallback from "./pages/AuthCallback";

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
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={["google"]}
            redirectTo={`${window.location.origin}/auth/callback`}
          />
        </Box>
      </ThemeProvider>
    );
  }

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
            Meal Planner 🍳
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <List sx={{ width: 200 }}>
          <ListItem
            button
            component={Link}
            to="/calendar"
            selected={location.pathname === "/calendar"}
            onClick={() => {
              setResetTrigger((prev) => prev + 1);
              setDrawerOpen(false);
            }}
            sx={{
              backgroundColor:
                location.pathname === "/calendar"
                  ? "primary.light"
                  : "transparent",
              "&.Mui-selected": {
                backgroundColor: "primary.light",
                "&:hover": {
                  backgroundColor: "primary.main",
                },
              },
            }}
          >
            <ListItemText
              primary="Calendar"
              sx={{ fontSize: "1.2rem" }}
            />
          </ListItem>
          <ListItem
            button
            component={Link}
            to="/recipe"
            selected={location.pathname === "/recipe"}
            onClick={() => setDrawerOpen(false)}
            sx={{
              backgroundColor:
                location.pathname === "/recipe"
                  ? "primary.light"
                  : "transparent",
              "&.Mui-selected": {
                backgroundColor: "primary.light",
                "&:hover": {
                  backgroundColor: "primary.main",
                },
              },
            }}
          >
            <ListItemText primary="Recipe" sx={{ fontSize: "1.2rem" }} />
          </ListItem>
        </List>
      </Drawer>
      <Routes>
        <Route path="/" element={<Navigate to="/calendar" replace />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/calendar"
          element={<WeekCalendar resetTrigger={resetTrigger} user={user} />}
        />
        <Route path="/recipe" element={<RecipeManagement user={user} />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
