# Sirte University Coding Quiz Platform

React frontend for the Faculty of Information Technology coding quiz platform at Sirte University. It includes student login, the challenge workspace, results, and administration pages.

## Run locally

1. Install Node.js and run `npm install`.
2. Start the PHP backend at `http://localhost/coding_quiz`.
3. Run `npm start` and open `http://localhost:3000`.

The frontend uses `http://localhost/coding_quiz` by default. To change it, set `REACT_APP_API_BASE_URL` before starting or building the app.

## Build

Run `npm run build` to create the production bundle. The generated `build/` folder and `node_modules/` are excluded from Git.

The API is kept in the separate `coding-quiz-backend` repository.
