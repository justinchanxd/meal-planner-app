import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender } from "@tanstack/react-table";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import {
  ALERT_INVALID_JSON,
  ALERT_INVALID_RECIPES_FORMAT,
  CONFIRM_IMPORT_RECIPES,
  ADMIN_FLAG,
} from "../utils/constants";

const RecipeManagement = () => {
  const [recipes, setRecipes] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("add"); // 'add' or 'edit'
  const [currentRecipe, setCurrentRecipe] = useState({ name: "", ingredients: "", instructions: "", remark: "" });
  const fileInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Load recipes from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("recipes");
    if (saved) {
      setRecipes(JSON.parse(saved));
    }
  }, []);

  // Save recipes to localStorage
  const saveRecipes = (newRecipes) => {
    setRecipes(newRecipes);
    localStorage.setItem("recipes", JSON.stringify(newRecipes));
  };

  // Define columns
  const columns = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "ingredients",
      header: "Ingredients",
    },
    {
      accessorKey: "remark",
      header: "Remark",
    },
  ];

  const filteredRecipes = recipes.filter((r) =>
    Object.values(r)
      .filter((val) => typeof val === 'string')
      .some((str) => str.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const table = useReactTable({
    data: filteredRecipes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleEdit = (recipe) => {
    setDialogMode("edit");
    setCurrentRecipe({ ...recipe });
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    const newRecipes = recipes.filter((r) => r.id !== id);
    saveRecipes(newRecipes);
  };

  const handleAdd = () => {
    setDialogMode("add");
    setCurrentRecipe({ name: "", ingredients: "", instructions: "", remark: "" });
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
  };

  const handleSave = () => {
    if (dialogMode === "add") {
      const newRecipe = { ...currentRecipe, id: Date.now() };
      saveRecipes([...recipes, newRecipe]);
    } else {
      const updated = recipes.map((r) => (r.id === currentRecipe.id ? currentRecipe : r));
      saveRecipes(updated);
    }
    setDialogOpen(false);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(recipes, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "recipes.json";
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedRecipes = JSON.parse(e.target.result);
          if (Array.isArray(importedRecipes)) {
            if (window.confirm(CONFIRM_IMPORT_RECIPES)) {
              saveRecipes(importedRecipes);
            }
          } else {
            alert(ALERT_INVALID_RECIPES_FORMAT);
          }
        } catch (error) {
          alert(ALERT_INVALID_JSON);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <Box className="pageContainer">
      <Typography variant="h5" className="titleTypography">
        Recipe📝
      </Typography>
      <Box className="boxMb2" sx={{ display: "flex", justifyContent: "center" }}>
        <TextField
          label="Search recipes"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="textField"
          sx={{ maxWidth: 400 }}
        />
      </Box>
      <Box className="boxMb2 boxGap2" sx={{ display: "flex", justifyContent: "center" }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} className="buttonMp buttonFixed">
          Add Recipe
        </Button>
        <Button variant="outlined" onClick={handleExport} disabled={recipes.length === 0} className="buttonMp buttonFixed">
          Export Recipes
        </Button>
        {ADMIN_FLAG ? (
          <Button variant="outlined" onClick={handleImportClick} className="buttonMp buttonFixed">
            Import Recipes
          </Button>
        ) : ""}
        {ADMIN_FLAG ? (
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept=".json"
          />
        ) : ""}
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableCell key={header.id} onClick={header.column.getToggleSortingHandler()}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: " 🔼",
                      desc: " 🔽",
                    }[header.column.getIsSorted()] ?? null}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={table.getAllColumns().length} align="center">
                  No recipes found. Click "Add Recipe" to get started.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => {
                    setDialogMode("edit");
                    setCurrentRecipe({ ...row.original });
                    setDialogOpen(true);
                  }}
                  className="tableRow"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} className="dialog">
        <DialogTitle>{dialogMode === "add" ? "Add Recipe" : "Edit Recipe"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            value={currentRecipe.name}
            onChange={(e) => setCurrentRecipe({ ...currentRecipe, name: e.target.value })}
            className="textField"
            required
          />
          <TextField
            label="Ingredients"
            value={currentRecipe.ingredients}
            onChange={(e) => setCurrentRecipe({ ...currentRecipe, ingredients: e.target.value })}
            className="textField"
            multiline
            rows={4}
          />
          <TextField
            label="Instructions"
            value={currentRecipe.instructions}
            onChange={(e) => setCurrentRecipe({ ...currentRecipe, instructions: e.target.value })}
            className="textField"
            multiline
            rows={4}
          />
          <TextField
            label="Remark"
            value={currentRecipe.remark}
            onChange={(e) => setCurrentRecipe({ ...currentRecipe, remark: e.target.value })}
            className="textField"
            multiline
            rows={4}
          />
        </DialogContent>
        <DialogActions>
          {dialogMode === "edit" && (
            <Button
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this recipe?")) {
                  handleDelete(currentRecipe.id);
                  setDialogOpen(false);
                }
              }}
              variant="outlined"
              color="error"
              className="buttonMp buttonFixed"
            >
              Delete
            </Button>
          )}
          <Button onClick={() => setDialogOpen(false)} className="buttonMp buttonFixed">Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={!currentRecipe.name.trim()} className="buttonMp buttonFixed">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecipeManagement;
