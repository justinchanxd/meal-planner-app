# Meal Planner App

## Overview

The Meal Planner App is a React.js application with Material-UI, designed to help users plan meals. 
It features intuitive controls, summaries, and data persistence.
Powered by AI.

## Features

- **Weekly Calendar**: Manage lunch dinner portion 
- **Recipe**: Manage recipe
- **Data Persistence**: Auto-save to localStorage; export/import as JSON.
- **Responsive Design**: Optimized for mobile, tested on iPhone 12 mini.
- **Material-UI Theming**: Clean, modern interface.



## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd meal-planner-app
   ```
2. Install dependencies:
   ```
   npm install
   ```

### Running Locally

For Node.js 17+ (to avoid OpenSSL issues):

```
$env:NODE_OPTIONS="--openssl-legacy-provider"; npm start
```

For Node.js 16 or lower:

```
npm start
```

App runs at `http://localhost:3000`.

### Building for Production

```
npm run build
```

Generates optimized build in `build` folder.

### Deployment to GitHub Pages

1. Install gh-pages:
   ```
   npm install --save-dev gh-pages
   ```
2. Ensure `package.json` has:
   ```json
   "homepage": "https://yourusername.github.io/meal-planner-app/",
   "scripts": {
     "deploy": "gh-pages -d build"
   }
   ```
3. Deploy:
   ```
   npm run build
   npm run deploy
   ```
4. In GitHub repo settings > Pages, set source to `gh-pages` branch.

App will be live at `https://yourusername.github.io/meal-planner-app/`.

## Contributing

Open issues or PRs for improvements.

## License

MIT License.
