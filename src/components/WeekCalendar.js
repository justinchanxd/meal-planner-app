import React, { useState, useEffect } from "react";
import {
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { CARD_MIN_HEIGHT } from "../utils/constants";

const WeekCalendar = ({ resetTrigger }) => {
  const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const [currentWeekStart, setCurrentWeekStart] = useState(
    getMonday(new Date())
  );
  const [meals, setMeals] = useState({});

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("mealPlanner");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Filter to only date-based keys (YYYY-MM-DD)
      const cleanMeals = Object.fromEntries(
        Object.entries(parsed).filter(([key]) =>
          /^\d{4}-\d{2}-\d{2}$/.test(key)
        )
      );
      setMeals(cleanMeals);
      // Update localStorage with cleaned data
      localStorage.setItem("mealPlanner", JSON.stringify(cleanMeals));
    }
  }, []);

  const getWeekDays = (start) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const weekDays = getWeekDays(currentWeekStart);

  const [selectedMeals, setSelectedMeals] = useState(() => {
    const initial = [];
    for (let i = 0; i < 7; i++) {
      initial.push(`${i}-lunch`, `${i}-dinner`);
    }
    return initial;
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // Prevent page unload with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Reset to current week on trigger
  useEffect(() => {
    if (resetTrigger > 0) {
      setCurrentWeekStart(getMonday(new Date()));
    }
  }, [resetTrigger]);

  // Toggle meal selection
  const toggleMealSelection = (dayIndex, type) => {
    const key = `${dayIndex}-${type}`;
    setSelectedMeals((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Calculate selected summary
  const selectedLunch = selectedMeals
    .filter((key) => key.endsWith("-lunch"))
    .reduce((sum, key) => {
      const dayIndex = parseInt(key.split("-")[0]);
      return (
        sum +
        (meals[weekDays[dayIndex].toISOString().split("T")[0]]?.lunch || 0)
      );
    }, 0);
  const selectedDinner = selectedMeals
    .filter((key) => key.endsWith("-dinner"))
    .reduce((sum, key) => {
      const dayIndex = parseInt(key.split("-")[0]);
      return (
        sum +
        (meals[weekDays[dayIndex].toISOString().split("T")[0]]?.dinner || 0)
      );
    }, 0);
  const selectedTotal = selectedLunch + selectedDinner;
  const totalLunch = weekDays.reduce(
    (sum, date) => sum + (meals[date.toISOString().split("T")[0]]?.lunch || 0),
    0
  );
  const totalDinner = weekDays.reduce(
    (sum, date) => sum + (meals[date.toISOString().split("T")[0]]?.dinner || 0),
    0
  );
  const totalMeals = totalLunch + totalDinner;

  // Navigation
  const navigateWeek = (direction) => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + direction * 7);
    setCurrentWeekStart(newStart);
  };

  // Update counters
  const updateMeal = (dateStr, type, delta) => {
    setMeals((prev) => ({
      ...prev,
      [dateStr]: {
        lunch:
          type === "lunch"
            ? Math.max(0, (prev[dateStr]?.lunch || 0) + delta)
            : prev[dateStr]?.lunch || 0,
        dinner:
          type === "dinner"
            ? Math.max(0, (prev[dateStr]?.dinner || 0) + delta)
            : prev[dateStr]?.dinner || 0,
      },
    }));
    setHasUnsavedChanges(true);
  };

  // Save to localStorage
  const saveMeals = () => {
    localStorage.setItem("mealPlanner", JSON.stringify(meals));
    setHasUnsavedChanges(false);
    setSaveDialogOpen(true);
  };

  // Export as JSON
  const exportMeals = async () => {
    const filteredMeals = Object.fromEntries(
      Object.entries(meals)
        .filter(([key, value]) => {
          const lunch = value?.lunch || 0;
          const dinner = value?.dinner || 0;
          return lunch > 0 || dinner > 0;
        })
        .sort(([a], [b]) => a.localeCompare(b))
    );
    const dataStr = JSON.stringify(filteredMeals, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const file = new File([dataBlob], "meal-planner.json", {
      type: "application/json",
    });

    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({
          title: "Meal Planner Data",
          text: "Exported meal planner data",
          files: [file],
        });
      } catch (err) {
        console.error("Share failed:", err);
        // Fallback to download
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "meal-planner.json";
        link.click();
        URL.revokeObjectURL(url);
      }
    } else {
      // Fallback for browsers without Web Share API
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "meal-planner.json";
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  // Import from JSON
  const importMeals = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          setMeals(imported);
          localStorage.setItem("mealPlanner", JSON.stringify(imported));
          alert("Meals imported!");
        } catch (err) {
          alert("Invalid JSON file");
        }
      };
      reader.readAsText(file);
    }
  };

  // Clear all meals for current week
  const clearAllMeals = () => {
    const clearedMeals = { ...meals };
    weekDays.forEach((date) => {
      const dateStr = date.toISOString().split("T")[0];
      clearedMeals[dateStr] = { lunch: 0, dinner: 0 };
    });
    setMeals(clearedMeals);
    setHasUnsavedChanges(true);
  };
  const formatWeek = (start) => {
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}`;
  };

  return (
    <Box
      sx={{ p: 0.5, backgroundColor: "background.default", minHeight: "100vh" }}
    >
      <Typography variant="body1" align="center" gutterBottom>
        <IconButton
          size="small"
          sx={{ width: 20, height: 20, mr: 1 }}
          onClick={() => navigateWeek(-1)}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        Week of {formatWeek(currentWeekStart)}
        <IconButton
          size="small"
          sx={{ width: 20, height: 20, ml: 1 }}
          onClick={() => navigateWeek(1)}
        >
          <ArrowForwardIcon fontSize="small" />
        </IconButton>
      </Typography>
      <Grid container spacing={1} justifyContent="center">
        {weekDays.map((date, i) => {
          const dateStr = date.toISOString().split("T")[0];
          const dayName = date.toLocaleDateString("en-US", {
            weekday: "short",
          });
          const month = date.toLocaleDateString("en-US", { month: "short" });
          const day = date.toLocaleDateString("en-US", { day: "numeric" });
          return (
            <Grid item xs={1.6} sm={4} md={2} key={dateStr}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {/* Day Info Card */}
                <Paper
                  elevation={3}
                  sx={{
                    p: 0.5,
                    textAlign: "center",
                    backgroundColor: "background.paper",
                  }}
                >
                  <Typography variant="caption" sx={{ fontSize: "0.6rem" }}>
                    {dayName}
                  </Typography>
                  <br></br>
                  <Typography variant="caption" sx={{ fontSize: "0.6rem" }}>
                    {month} {day}
                  </Typography>
                </Paper>
                {/* Lunch Card */}
                <Paper
                  elevation={3}
                  sx={{
                    p: 0.5,
                    textAlign: "center",
                    backgroundColor: selectedMeals.includes(`${i}-lunch`)
                      ? "primary.light"
                      : "background.paper",
                    cursor: "pointer",
                    border: selectedMeals.includes(`${i}-lunch`)
                      ? "2px solid #2196f3"
                      : "2px solid transparent",
                    minHeight: CARD_MIN_HEIGHT,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                  onClick={() => toggleMealSelection(i, "lunch")}
                >
                  <Box sx={{ mt: 0.25 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconButton
                        size="small"
                        sx={{ width: 0.5, height: 0.5 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateMeal(dateStr, "lunch", -1);
                        }}
                      >
                        <RemoveIcon fontSize="0.1rem" />
                      </IconButton>
                      <Typography
                        variant="body2"
                        sx={{ fontSize: "0.8rem", mx: 0.25 }}
                      >
                        {meals[dateStr]?.lunch || 0}
                      </Typography>
                      <IconButton
                        size="small"
                        sx={{ width: 0.5, height: 0.5 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateMeal(dateStr, "lunch", 1);
                        }}
                      >
                        <AddIcon fontSize="0.01rem" />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
                {/* Dinner Card */}
                <Paper
                  elevation={3}
                  sx={{
                    p: 0.5,
                    textAlign: "center",
                    backgroundColor: selectedMeals.includes(`${i}-dinner`)
                      ? "primary.light"
                      : "background.paper",
                    cursor: "pointer",
                    border: selectedMeals.includes(`${i}-dinner`)
                      ? "2px solid #2196f3"
                      : "2px solid transparent",
                    minHeight: CARD_MIN_HEIGHT,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                  onClick={() => toggleMealSelection(i, "dinner")}
                >
                  <Box sx={{ mt: 0.25 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconButton
                        size="small"
                        sx={{ width: 0.5, height: 0.5 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateMeal(dateStr, "dinner", -1);
                        }}
                      >
                        <RemoveIcon fontSize="0.1rem" />
                      </IconButton>
                      <Typography
                        variant="body2"
                        sx={{ fontSize: "0.8rem", mx: 0.25 }}
                      >
                        {meals[dateStr]?.dinner || 0}
                      </Typography>
                      <IconButton
                        size="small"
                        sx={{ width: 0.5, height: 0.5 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateMeal(dateStr, "dinner", 1);
                        }}
                      >
                        <AddIcon fontSize="0.01rem" />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            </Grid>
          );
        })}
      </Grid>
      <Typography variant="body1" align="center" sx={{ mt: 2 }}>
        Selected Summary:
      </Typography>
      <Typography variant="body2" align="center">
        Lunch: {selectedLunch}
      </Typography>
      <Typography variant="body2" align="center">
        Dinner: {selectedDinner}
      </Typography>
      <Typography variant="body2" align="center">
        Total: {selectedTotal}
      </Typography>
      {/* <Typography variant="h5" align="center" sx={{ mt: 2 }}>
        Weekly Summary: Lunch: {totalLunch}, Dinner: {totalDinner}, Total:{" "}
        {totalMeals}
      </Typography> */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2, gap: 1 }}>
        <Button variant="contained" onClick={saveMeals}>
          Save
        </Button>
        <Button variant="outlined" onClick={clearAllMeals}>
          Clear All
        </Button>
        <Button variant="outlined" onClick={() => setSelectedMeals([])}>
          Unselect All
        </Button>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center", mt: 0.5, gap: 1 }}>
        <Button variant="outlined" onClick={exportMeals}>
          Export
        </Button>
        <Button variant="outlined" component="label">
          Import
          <input type="file" accept=".json" hidden onChange={importMeals} />
        </Button>
      </Box>
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Data Saved</DialogTitle>
        <DialogContent>Meal data saved successfully.</DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>OK</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WeekCalendar;
