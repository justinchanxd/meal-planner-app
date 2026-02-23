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
import MealCard from "./MealCard";
import {
  CARD_MIN_HEIGHT,
  STORAGE_KEY,
  LOCALE,
  DATE_OPTIONS_WEEKDAY,
  DATE_OPTIONS_MONTH,
  DATE_OPTIONS_DAY,
  DATE_OPTIONS_MONTH_DAY,
  BORDER_COLOR_SELECTED,
  FONT_SIZE_CAPTION,
  FONT_SIZE_BODY,
  FONT_SIZE_BUTTON,
  ICON_FONT_SIZE,
  MIME_TYPE_JSON,
  EXPORT_FILENAME,
  DIALOG_TITLE_SAVED,
  DIALOG_MESSAGE_SAVED,
  ALERT_INVALID_JSON,
  ALERT_IMPORTED,
  BEFORE_UNLOAD_MESSAGE,
  SHARE_TITLE,
  SHARE_TEXT,
  DATE_REGEX,
  BUTTON_SIZE,
  DIALOG_BUTTON_OK,
} from "../utils/constants";
import { supabase } from '../utils/supabase';

const WeekCalendar = ({ resetTrigger, user }) => {
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
  const [loading, setLoading] = useState(true);

  // Load from Supabase on mount
  useEffect(() => {
    const loadMeals = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id);
      if (error) console.error(error);
      else {
        const mealsObj = {};
        data.forEach(meal => {
          mealsObj[meal.date] = { lunch: meal.lunch, dinner: meal.dinner };
        });
        setMeals(mealsObj);
      }
      setLoading(false);
    };
    loadMeals();
  }, [user]);

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

  const [selectedMeals, setSelectedMeals] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // Prevent page unload with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = BEFORE_UNLOAD_MESSAGE;
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

  // Generalized calculation for selected meals
  const calculateSelected = (mealType) =>
    selectedMeals
      .filter((key) => key.endsWith(`-${mealType}`))
      .reduce((sum, key) => {
        const dayIndex = parseInt(key.split("-")[0]);
        return (
          sum +
          (meals[weekDays[dayIndex].toISOString().split("T")[0]]?.[mealType] ||
            0)
        );
      }, 0);

  const selectedLunch = calculateSelected("lunch");
  const selectedDinner = calculateSelected("dinner");
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

  // Save to Supabase
  const saveMeals = async () => {
    if (!user) return;
    const mealsToSave = Object.entries(meals).map(([date, { lunch, dinner }]) => ({
      user_id: user.id,
      date,
      lunch,
      dinner
    }));
    const { error } = await supabase.from('meals').upsert(mealsToSave);
    if (error) console.error(error);
    else {
      setHasUnsavedChanges(false);
      setSaveDialogOpen(true);
    }
  };

  // Export as JSON
  const exportMeals = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id);
    if (error) console.error(error);
    else {
      const filteredMeals = {};
      data.forEach(meal => {
        if (meal.lunch > 0 || meal.dinner > 0) {
          filteredMeals[meal.date] = { lunch: meal.lunch, dinner: meal.dinner };
        }
      });
      const sortedMeals = Object.fromEntries(
        Object.entries(filteredMeals).sort(([a], [b]) => a.localeCompare(b))
      );
      const dataStr = JSON.stringify(sortedMeals, null, 2);
      const dataBlob = new Blob([dataStr], { type: MIME_TYPE_JSON });
      const file = new File([dataBlob], EXPORT_FILENAME, {
        type: MIME_TYPE_JSON,
      });

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            title: SHARE_TITLE,
            text: SHARE_TEXT,
            files: [file],
          });
        } catch (err) {
          console.error("Share failed:", err);
          // Fallback to download
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement("a");
          link.href = url;
          link.download = EXPORT_FILENAME;
          link.click();
          URL.revokeObjectURL(url);
        }
      } else {
        // Fallback for browsers without Web Share API
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = EXPORT_FILENAME;
        link.click();
        URL.revokeObjectURL(url);
      }
    }
  };

  // Import from JSON
  const importMeals = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          setMeals(imported);
          // Save to Supabase
          const mealsToSave = Object.entries(imported).map(([date, { lunch, dinner }]) => ({
            user_id: user.id,
            date,
            lunch,
            dinner
          }));
          const { error } = await supabase.from('meals').upsert(mealsToSave);
          if (error) console.error(error);
          else alert(ALERT_IMPORTED);
        } catch (err) {
          alert(ALERT_INVALID_JSON);
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
    return `${start.toLocaleDateString(
      LOCALE,
      DATE_OPTIONS_MONTH_DAY
    )} - ${end.toLocaleDateString(LOCALE, DATE_OPTIONS_MONTH_DAY)}`;
  };

  if (loading) {
    return (
      <Box className="pageContainer" sx={{ textAlign: "center", mt: 4 }}>
        <Typography variant="h6">Loading your meals...</Typography>
      </Box>
    );
  }

  return (
    <Box className="pageContainer">
      <Typography variant="h5" className="titleTypography">
        Meal Calendar📅
      </Typography>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
        }}
      >
        <IconButton onClick={() => navigateWeek(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="body1" className="subtitleTypography">
          Week of {formatWeek(currentWeekStart)}
        </Typography>
        <IconButton onClick={() => navigateWeek(1)}>
          <ArrowForwardIcon />
        </IconButton>
      </Box>
      <Grid container spacing={1} justifyContent="center">
        {weekDays.map((date, i) => {
          const dateStr = date.toISOString().split("T")[0];
          const dayName = date.toLocaleDateString(LOCALE, DATE_OPTIONS_WEEKDAY);
          const month = date.toLocaleDateString(LOCALE, DATE_OPTIONS_MONTH);
          const day = date.toLocaleDateString(LOCALE, DATE_OPTIONS_DAY);
          const today = new Date();
          const localDateStr =
            today.getFullYear() +
            "-" +
            String(today.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(today.getDate()).padStart(2, "0");
          const isToday = dateStr === localDateStr;
          return (
            <Grid item xs={1.6} sm={1.5} md={1.5} key={dateStr}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {/* Day Info Card */}
                <Paper
                  style={{ padding: 0 }}
                  elevation={3}
                  sx={{
                    p: 0.5,
                    textAlign: "center",
                    backgroundColor: isToday
                      ? "primary.light"
                      : "background.paper",
                    border: isToday
                      ? `2px solid ${BORDER_COLOR_SELECTED}`
                      : "2px solid transparent",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontSize: FONT_SIZE_CAPTION }}
                  >
                    {dayName}
                  </Typography>
                  <br></br>
                  <Typography
                    variant="caption"
                    sx={{ fontSize: FONT_SIZE_CAPTION }}
                  >
                    {month} {day}
                  </Typography>
                </Paper>
                {/* Lunch Card */}
                <MealCard
                  dateStr={dateStr}
                  type="lunch"
                  i={i}
                  meals={meals}
                  selectedMeals={selectedMeals}
                  toggleMealSelection={toggleMealSelection}
                  updateMeal={updateMeal}
                />
                {/* Dinner Card */}
                <MealCard
                  dateStr={dateStr}
                  type="dinner"
                  i={i}
                  meals={meals}
                  selectedMeals={selectedMeals}
                  toggleMealSelection={toggleMealSelection}
                  updateMeal={updateMeal}
                />
              </Box>
            </Grid>
          );
        })}
      </Grid>

      <Typography variant="body1" align="center" sx={{ mt: 2 }}>
        📊Selected Summary:
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

      <Box sx={{ display: "flex", justifyContent: "center", mt: 2, gap: 1 }}>
        <Button variant="contained" onClick={saveMeals} className="buttonMp">
          Save
        </Button>
        <Button variant="outlined" onClick={clearAllMeals} className="buttonMp">
          Clear All
        </Button>
        <Button
          variant="outlined"
          onClick={() => setSelectedMeals([])}
          className="buttonMp"
        >
          Unselect All
        </Button>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center", mt: 0.5, gap: 1 }}>
        <Button variant="outlined" onClick={exportMeals} className="buttonMp">
          Export
        </Button>
        <Button variant="outlined" component="label" className="buttonMp">
          Import
          <input type="file" accept=".json" hidden onChange={importMeals} />
        </Button>
      </Box>
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>{DIALOG_TITLE_SAVED}</DialogTitle>
        <DialogContent>{DIALOG_MESSAGE_SAVED}</DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)} className="buttonMp">
            {DIALOG_BUTTON_OK}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WeekCalendar;
