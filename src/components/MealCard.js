import React, { useState } from 'react';

const MealCard = ({ mealType, portion, onPortionChange }) => {
    const handleIncrease = () => {
        onPortionChange(portion + 1);
    };

    const handleDecrease = () => {
        if (portion > 1) {
            onPortionChange(portion - 1);
        }
    };

    return (
        <div className="meal-card">
            <h3>{mealType}</h3>
            <div className="portion-controls">
                <button onClick={handleDecrease}>-</button>
                <span>{portion}</span>
                <button onClick={handleIncrease}>+</button>
            </div>
        </div>
    );
};

export default MealCard;