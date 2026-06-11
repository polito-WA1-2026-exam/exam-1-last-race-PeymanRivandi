/*** Importing modules ***/
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { check, validationResult } from 'express-validator';
import UserDao from './dao-users.js';
import NetworkDao from './dao-network.js';
import GameDao from './dao-game.js';
import { initDb } from './db.js';

const userDao   = new UserDao();
const networkDao = new NetworkDao();
const gameDao   = new GameDao();

/*** Init express and set up the middlewares ***/
const app = express();
app.use(morgan('dev'));
app.use(express.json());

/** Set up and enable Cross-Origin Resource Sharing (CORS) **/
const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true,
};
app.use(cors(corsOptions));


/*** Passport ***/

import passport from 'passport';
import LocalStrategy from 'passport-local';
import session from 'express-session';

/** Local strategy: verify username + password against the DB **/
passport.use(new LocalStrategy(async function verify(username, password, callback) {
    const user = await userDao.getUserByCredentials(username, password);
    if (!user)
        return callback(null, false, 'Incorrect username or password');
    return callback(null, user);
}));

// Store the whole user object in the session
passport.serializeUser(function (user, callback) {
    callback(null, user);
});

// Retrieve the user object from the session
passport.deserializeUser(function (user, callback) {
    return callback(null, user);
});

/** Creating the session **/
app.use(session({
    secret: 'This is a very secret information used to initialize the session!',
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.authenticate('session'));

/** Authentication verification middleware **/
const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated())
        return next();
    return res.status(401).json({ error: 'Not authorized' });
};


/*** Validation error helpers (same pattern as course) ***/
const errorFormatter = ({ msg }) => msg;
const onValidationErrors = (validationResult, res) => {
    const errors = validationResult.formatWith(errorFormatter);
    return res.status(422).json({ validationErrors: errors.mapped() });
};


/*** Auth APIs ***/

// POST /api/sessions — login
app.post('/api/sessions', function (req, res, next) {
    passport.authenticate('local', (err, user, info) => {
        if (err)
            return next(err);
        if (!user)
            return res.status(401).json({ error: info });
        req.login(user, (err) => {
            if (err)
                return next(err);
            return res.json(req.user);
        });
    })(req, res, next);
});

// GET /api/sessions/current — check if logged in
app.get('/api/sessions/current', (req, res) => {
    if (req.isAuthenticated())
        res.status(200).json(req.user);
    else
        res.status(401).json({ error: 'Not authenticated' });
});

// DELETE /api/sessions/current — logout
app.delete('/api/sessions/current', (req, res) => {
    req.logout(() => {
        res.end();
    });
});


/*** Network APIs ***/

// GET /api/network — all lines with their ordered stations (Setup phase map)
app.get('/api/network', isLoggedIn, (req, res) => {
    networkDao.getNetwork()
        .then(network => res.json(network))
        .catch(err => res.status(500).json(err));
});

// GET /api/segments — all adjacent station pairs, no line info (Planning phase list)
app.get('/api/segments', isLoggedIn, (req, res) => {
    networkDao.getSegments()
        .then(segments => res.json(segments))
        .catch(err => res.status(500).json(err));
});


/*** Game helper functions ***/

// BFS: returns { stationId: distance } from a starting station
function bfsDistances(startId, adjacency) {
    const dist = { [startId]: 0 };
    const queue = [startId];
    while (queue.length > 0) {
        const curr = queue.shift();
        for (const neighbor of (adjacency[curr] || [])) {
            if (dist[neighbor] === undefined) {
                dist[neighbor] = dist[curr] + 1;
                queue.push(neighbor);
            }
        }
    }
    return dist;
}

// Checks that a route array is valid:
//   - every consecutive pair is a real segment in the network
//   - no segment is used more than once (bidirectional: A-B == B-A)
//   - line changes are only made at interchange stations
function validateRoute(route, segmentLines, interchangeIds) {
    // Track used segments to enforce "no segment more than once" (EXAM_FINAL rule)
    const usedSegments = new Set();

    // Build per-segment line options and check each segment exists
    const segmentLineOptions = [];
    for (let i = 0; i < route.length - 1; i++) {
        const key = `${Math.min(route[i], route[i + 1])}-${Math.max(route[i], route[i + 1])}`;
        if (!segmentLines[key]) return false;        // segment not in network
        if (usedSegments.has(key)) return false;     // segment used twice
        usedSegments.add(key);
        segmentLineOptions.push(segmentLines[key]);
    }

    // BFS over (segmentIndex, currentLine) states to check line-change rules
    // A line change is only allowed when the connecting station is an interchange
    let reachableLines = new Set(segmentLineOptions[0]);

    for (let i = 0; i < segmentLineOptions.length - 1; i++) {
        const connectingStation = route[i + 1];
        const isInterchange = interchangeIds.has(connectingStation);
        const nextOptions = segmentLineOptions[i + 1];

        const nextReachable = new Set();
        for (const line of reachableLines) {
            if (nextOptions.includes(line))
                nextReachable.add(line);        // continue on same line
            if (isInterchange) {
                for (const nl of nextOptions)
                    nextReachable.add(nl);      // switch line at interchange
            }
        }

        if (nextReachable.size === 0) return false;
        reachableLines = nextReachable;
    }

    return true;
}


/*** Game APIs ***/

// POST /api/game/start — pick a random start + destination (min 3 segments apart)
app.post('/api/game/start', isLoggedIn, async (req, res) => {
    try {
        const [adjacency, stations] = await Promise.all([
            gameDao.getAdjacency(),
            gameDao.getAllStations(),
        ]);

        // Shuffle stations so the chosen start is random
        const shuffled = [...stations].sort(() => Math.random() - 0.5);

        for (const startStation of shuffled) {
            const distances = bfsDistances(startStation.id, adjacency);
            const validDests = stations.filter(s =>
                s.id !== startStation.id && (distances[s.id] ?? -1) >= 3
            );

            if (validDests.length > 0) {
                const dest = validDests[Math.floor(Math.random() * validDests.length)];
                req.session.currentGame = { startId: startStation.id, destId: dest.id };
                return res.json({ start: startStation, destination: dest });
            }
        }

        res.status(500).json({ error: 'No valid start/destination pair found' });
    } catch (err) {
        res.status(500).end();
    }
});

// POST /api/game/submit — validate route, run events, save score
app.post('/api/game/submit',
    isLoggedIn,
    [check('route').isArray()],
    async (req, res) => {
        const invalidFields = validationResult(req);
        if (!invalidFields.isEmpty())
            return onValidationErrors(invalidFields, res);

        const game = req.session.currentGame;
        if (!game)
            return res.status(400).json({ error: 'No game in progress' });

        const route = req.body.route;

        // A route is incomplete if it has fewer than 2 stations,
        // doesn't start at the assigned station, or doesn't end at the destination
        const isComplete =
            route.length >= 2 &&
            route[0] === game.startId &&
            route[route.length - 1] === game.destId;

        if (!isComplete) {
            await gameDao.saveGame(req.user.id, 0);
            delete req.session.currentGame;
            return res.json({ valid: false, score: 0, events: [] });
        }

        try {
            const { segmentLines, interchangeIds } = await gameDao.getValidationData();
            const routeIsValid = validateRoute(route, segmentLines, interchangeIds);

            if (!routeIsValid) {
                await gameDao.saveGame(req.user.id, 0);
                delete req.session.currentGame;
                return res.json({ valid: false, score: 0, events: [] });
            }

            // Valid route — fire one random event per segment
            let coins = 20;
            const events = [];
            for (let i = 0; i < route.length - 1; i++) {
                const event = await gameDao.getRandomEvent();
                coins += event.effect;
                events.push({
                    from_id:     route[i],
                    to_id:       route[i + 1],
                    description: event.description,
                    effect:      event.effect,
                    coins_after: coins,
                });
            }

            const finalScore = Math.max(0, coins);
            await gameDao.saveGame(req.user.id, finalScore);
            delete req.session.currentGame;

            return res.json({ valid: true, score: finalScore, events });
        } catch (err) {
            res.status(500).end();
        }
    }
);

// GET /api/ranking — best score per user, sorted descending
app.get('/api/ranking', isLoggedIn, (req, res) => {
    gameDao.getRanking()
        .then(ranking => res.json(ranking))
        .catch(err => res.status(500).json(err));
});


/*** Start server ***/
await initDb();

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/`));
