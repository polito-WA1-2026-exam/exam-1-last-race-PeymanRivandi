/*** Importing modules ***/
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import UserDao from './dao-users.js';
import { initDb } from './db.js';

const userDao = new UserDao();

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


/*** Start server ***/
await initDb();

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/`));
