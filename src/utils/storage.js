const STORAGE_KEY = 'mealPlannerData';

export const saveToLocalStorage = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const loadFromLocalStorage = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
};

export const exportToJson = (data) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meal-planner-data.json';
    a.click();
    URL.revokeObjectURL(url);
};

export const importFromJson = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        const data = JSON.parse(event.target.result);
        callback(data);
    };
    reader.readAsText(file);
};