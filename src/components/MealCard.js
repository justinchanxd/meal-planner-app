import React from "react";
import {
  Paper,
  Typography,
  IconButton,
  Box,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import {
  CARD_MIN_HEIGHT,
  BORDER_COLOR_SELECTED,
  FONT_SIZE_BODY,
  ICON_FONT_SIZE,
  BUTTON_SIZE,
} from "../utils/constants";

const MealCard = ({ dateStr, type, i, meals, selectedMeals, toggleMealSelection, updateMeal }) => {
  const isSelected = selectedMeals.includes(`${i}-${type}`);
  return (
    <Paper
      elevation={3}
      sx={{
        p: 0.5,
        textAlign: "center",
        backgroundColor: isSelected ? "primary.light" : "background.paper",
        cursor: "pointer",
        border: isSelected ? `2px solid ${BORDER_COLOR_SELECTED}` : "2px solid transparent",
        minHeight: CARD_MIN_HEIGHT,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
      onClick={() => toggleMealSelection(i, type)}
    >
      <Box sx={{ mt: 0.25 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconButton
            size={BUTTON_SIZE}
            sx={{ width: 0.5, height: 0.5 }}
            onClick={(e) => {
              e.stopPropagation();
              updateMeal(dateStr, type, -1);
            }}
          >
            <RemoveIcon fontSize={ICON_FONT_SIZE} />
          </IconButton>
          <Typography variant="body2" sx={{ fontSize: FONT_SIZE_BODY, mx: 0.25 }}>
            {meals[dateStr]?.[type] || 0}
          </Typography>
          <IconButton
            size={BUTTON_SIZE}
            sx={{ width: 0.5, height: 0.5 }}
            onClick={(e) => {
              e.stopPropagation();
              updateMeal(dateStr, type, 1);
            }}
          >
            <AddIcon fontSize={ICON_FONT_SIZE} />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default MealCard;
