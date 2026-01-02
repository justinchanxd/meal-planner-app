import React, { useState, useEffect } from 'react';
import { saveToLocalStorage, loadFromLocalStorage } from '../utils/storage';

const MealPlanner = () => {
    const [meals, setMeals] = useState({
        Monday: { lunch: 0, dinner: 0 },
        Tuesday: { lunch: 0, dinner: 0 },
        Wednesday: { lunch: 0, dinner: 0 },
        Thursday: { lunch: 0, dinner: 0 },
        Friday: { lunch: 0, dinner: 0 },
        Saturday: { lunch: 0, dinner: 0 },
        Sunday: { lunch: 0, dinner: 0 },
    });

    useEffect(() => {
        const storedMeals = loadFromLocalStorage();
        if (storedMeals) {
            setMeals(storedMeals);
        }
    }, []);

    useEffect(() => {
        saveToLocalStorage(meals);
    }, [meals]);

    const updateMeal = (day, mealType, amount) => {
        setMeals(prevMeals => ({
            ...prevMeals,
            [day]: {
                ...prevMeals[day],
                [mealType]: Math.max(0, prevMeals[day][mealType] + amount),
            },
        }));
    };

    const exportMeals = () => {
        const dataStr = JSON.stringify(meals);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'meals.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const importMeals = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const importedMeals = JSON.parse(e.target.result);
            setMeals(importedMeals);
        };
        reader.readAsText(file);
    };

    return (
        <div>
            <h1>Meal Planner</h1>
            <button onClick={exportMeals}>Export Meals</button>
            <input type="file" onChange={importMeals} accept=".json" />
            {/* Render Calendar and MealCard components here */}
        </div>
    );
};

export default MealPlanner;