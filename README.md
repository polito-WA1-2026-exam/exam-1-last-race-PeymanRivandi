# Exam #1: "Last Race"
## Student: s358407 RIVANDI PEYMAN

## React Client Application Routes

- Route `/`: Home page with game lore and phase-by-phase instructions. Accessible to everyone; anonymous users see only the instructions without the network map.
- Route `/login`: Login form with username and password. Redirects to `/` if the user is already authenticated.
- Route `/game`: Full game flow (Setup → Planning → Execution → Result). Requires authentication; redirects to `/login` otherwise.
- Route `/ranking`: Leaderboard showing the best score per registered player, sorted descending. Requires authentication; redirects to `/login` otherwise.

## API Server

- POST `/api/sessions`
  - Request body: `{ username, password }`
  - Response: user object `{ id, username }` on success, 401 on wrong credentials
- GET `/api/sessions/current`
  - No parameters
  - Response: current user object if authenticated, 401 otherwise
- DELETE `/api/sessions/current`
  - No parameters
  - Response: 200, destroys the session
- GET `/api/network`
  - Requires authentication
  - Response: array of line objects, each with `id, name, hex_color` and a `stations` array in stop order
- GET `/api/segments`
  - Requires authentication
  - Response: array of segment objects `{ from_id, from_name, to_id, to_name }` for all adjacent station pairs
- POST `/api/game/start`
  - Requires authentication; no request body
  - Picks a random start and destination at least 3 segments apart (BFS), stores them in the session
  - Response: `{ start: { id, name }, destination: { id, name } }`
- POST `/api/game/submit`
  - Requires authentication
  - Request body: `{ route: [stationId, ...] }`
  - Validates the route (connectivity, no repeated segments, line-change rules), fires one random event per segment, saves the score
  - Response: `{ valid, score, events: [{ from_id, to_id, description, effect, coins_after }] }`
- GET `/api/ranking`
  - Requires authentication
  - Response: array of `{ username, best_score }` sorted by best score descending

## Database Tables

- Table `users` - contains registered users: `id`, `username`, `hash`, `salt` (passwords hashed with scrypt)
- Table `lines` - contains metro lines: `id`, `name`, `color`, `hex_color`
- Table `stations` - contains station names: `id`, `name`
- Table `line_stations` - junction table linking lines to stations with a `position` column that defines the stop order along each line
- Table `events` - contains random events: `id`, `description`, `effect` (integer from −4 to +4)
- Table `games` - contains completed games: `id`, `user_id`, `score`, `played_at`

## Main React Components

- `App` (in `App.jsx`): root component, manages authentication state, wraps routes, and renders the feedback toast
- `NavBar` (in `components/NavBar.jsx`): top navigation bar with page links and login/logout button
- `HomePage` (in `components/HomePage.jsx`): lore text, phase-by-phase instruction cards, and play/login call-to-action banner
- `LoginPage` (in `components/LoginPage.jsx`): username and password form, calls the login API and navigates to home on success
- `GamePage` (in `components/GamePage.jsx`): orchestrates the four game phases by managing phase state and calling the game APIs
- `SetupPhase` (in `components/game/SetupPhase.jsx`): displays the full network map; player clicks Ready to advance to Planning
- `PlanningPhase` (in `components/game/PlanningPhase.jsx`): 90-second countdown timer, segment list with color-coded availability, and route builder
- `ExecutionPhase` (in `components/game/ExecutionPhase.jsx`): steps through events one at a time, showing the effect and updated coin total per segment
- `NetworkMap` (in `components/game/NetworkMap.jsx`): reusable SVG map; renders full lines in Setup phase, stations only in Planning phase
- `RankingPage` (in `components/RankingPage.jsx`): fetches and displays the best-score leaderboard, highlights the current user's row

## Screenshot

![Ranking page](./screenshots/ranking.png)

![Game in progress](./screenshots/game.png)

## Users Credentials

- jon, snow (has pre-existing game history)
- daenerys, dragon (has pre-existing game history)
- tyrion, lannister

## Use of AI Tools

