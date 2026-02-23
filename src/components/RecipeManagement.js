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
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import {
  ALERT_INVALID_JSON,
  ALERT_INVALID_RECIPES_FORMAT,
  CONFIRM_IMPORT_RECIPES,
  ADMIN_FLAG,
} from "../utils/constants";
import { supabase } from '../utils/supabase';

const RecipeManagement = ({ user }) => {
  const [recipes, setRecipes] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("add"); // 'add' or 'edit'
  const [currentRecipe, setCurrentRecipe] = useState({ name: "", ingredients: "", instructions: "", url: "", remark: "", order: 0 });
  const fileInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Load recipes from Supabase on mount and sort by order
  useEffect(() => {
    const loadRecipes = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('order');
      if (error) console.error(error);
      else setRecipes(data || []);
    };
    loadRecipes();
  }, [user]);

  // Save recipes to Supabase (always sorted by order)
  const saveRecipes = async (newRecipes) => {
    const sorted = newRecipes.sort((a, b) => a.order - b.order);
    setRecipes(sorted);
    // Upsert each recipe
    for (const recipe of sorted) {
      const { error } = await supabase
        .from('recipes')
        .upsert({ ...recipe, user_id: user.id });
      if (error) console.error(error);
    }
  };

  // Define columns (removed sorting since we use manual order)
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
      accessorKey: "url",
      header: "URL",
      cell: ({ getValue }) => {
        const value = getValue();
        return value ? (
          <a href={value} target="_blank" rel="noopener noreferrer">
            Click
          </a>
        ) : "";
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Box>
          <IconButton onClick={(e) => { e.stopPropagation(); moveUp(row.original.id); }} disabled={row.original.order === 1}>
            <ArrowUpwardIcon />
          </IconButton>
          <IconButton onClick={(e) => { e.stopPropagation(); moveDown(row.original.id); }} disabled={row.original.order === recipes.length}>
            <ArrowDownwardIcon />
          </IconButton>
        </Box>
      ),
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
  });

  // Move recipe up in order
  const moveUp = async (id) => {
    const index = recipes.findIndex((r) => r.id === id);
    if (index > 0) {
      const newRecipes = [...recipes];
      [newRecipes[index - 1], newRecipes[index]] = [newRecipes[index], newRecipes[index - 1]];
      // Update orders
      newRecipes.forEach((r, i) => (r.order = i + 1));
      await saveRecipes(newRecipes);
    }
  };

  // Move recipe down in order
  const moveDown = async (id) => {
    const index = recipes.findIndex((r) => r.id === id);
    if (index < recipes.length - 1) {
      const newRecipes = [...recipes];
      [newRecipes[index], newRecipes[index + 1]] = [newRecipes[index + 1], newRecipes[index]];
      // Update orders
      newRecipes.forEach((r, i) => (r.order = i + 1));
      await saveRecipes(newRecipes);
    }
  };

  const handleEdit = (recipe) => {
    setDialogMode("edit");
    setCurrentRecipe({ ...recipe });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    const newRecipes = recipes.filter((r) => r.id !== id);
    // Reassign orders after deletion
    newRecipes.forEach((r, i) => (r.order = i + 1));
    await saveRecipes(newRecipes);
  };

  const handleAdd = () => {
    setDialogMode("add");
    setCurrentRecipe({ name: "", ingredients: "", instructions: "", url: "", remark: "", order: recipes.length + 1 });
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
  };

  const handleSave = async () => {
    if (dialogMode === "add") {
      const newRecipe = { ...currentRecipe, id: Date.now() };
      await saveRecipes([...recipes, newRecipe]);
    } else {
      const updated = recipes.map((r) => (r.id === currentRecipe.id ? currentRecipe : r));
      await saveRecipes(updated);
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

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const importedRecipes = JSON.parse(e.target.result);
          if (Array.isArray(importedRecipes)) {
            if (window.confirm(CONFIRM_IMPORT_RECIPES)) {
              // Assign orders if missing
              importedRecipes.forEach((r, i) => {
                if (!r.order) r.order = i + 1;
              });
              await saveRecipes(importedRecipes);
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
                  <TableCell key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
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
            label="URL"
            value={currentRecipe.url}
            onChange={(e) => setCurrentRecipe({ ...currentRecipe, url: e.target.value })}
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
