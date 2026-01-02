# Meal Planner App

## Overview

The Meal Planner App is a React.js application designed to help users, particularly housewives, review and plan meals for each day of the week. The app features a calendar layout that allows users to easily navigate through the week and manage their meal portions for lunch and dinner.

## Features

- **Weekly Calendar Layout**: View and navigate through the days of the week.
- **Meal Controls**: Adjust portion sizes for lunch and dinner with intuitive controls.
- **Local Storage**: Save meal plans to local storage for persistence.
- **JSON Export/Import**: Export meal plans as JSON files and import them back into the app.

## Project Structure

```
meal-planner-app
├── public
│   └── index.html
├── src
│   ├── components
│   │   ├── Calendar.js
│   │   ├── MealCard.js
│   │   └── MealPlanner.js
│   ├── utils
│   │   └── storage.js
│   ├── App.js
│   └── index.js
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd meal-planner-app
   ```
3. Install the dependencies:
   ```
   npm install
   ```

### Running the Application

To start the development server, run:

For Node.js 17 or higher (to avoid OpenSSL compatibility issues):

```
$env:NODE_OPTIONS="--openssl-legacy-provider"; npm start
```

For Node.js 16 or lower:

```
npm start
```

The application will be available at `http://localhost:3000`.

### Building for Production

To create a production build, run:

```
npm run build
```

This will generate an optimized build in the `build` folder.

## Usage

- Navigate through the calendar to select a day.
- Use the meal controls to adjust portion sizes for lunch and dinner.
- Save your meal plans, which will persist even after refreshing the page.
- Export your meal plans as JSON files for backup or sharing.
- Import JSON files to restore meal plans.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License.
