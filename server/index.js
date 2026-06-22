import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';

import { getUserByCredentials } from './dao/userDao.js';
import networkRoutes from './routes/networkRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import { initDatabase } from './utils/seed.js';

const app = express();
const PORT = 3001;

// Middlewares
app.use(morgan('dev'));
app.use(express.json());

// CORS – two-server pattern (lab08 server.js pattern)
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Session
app.use(session({
  secret: 'last-race-session-secret-2026',
  resave: false,
  saveUninitialized: false
}));

// Passport – Local Strategy (lab08 server.js pattern)
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await getUserByCredentials(username, password);
    if (!user) return done(null, false, 'Incorrect username or password.');
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.use(passport.authenticate('session'));

// Auth routes
app.post('/api/sessions', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info || 'Incorrect username or password.' });
    req.login(user, (err) => {
      if (err) return next(err);
      return res.json(req.user);
    });
  })(req, res, next);
});

app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) return res.json(req.user);
  res.status(401).json({ error: 'Not authenticated' });
});

app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => res.json({ loggedOut: true }));
});

// API routes
app.use('/api', networkRoutes);
app.use('/api', gameRoutes);

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

// Init database and start server
initDatabase()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/`));
  })
  .catch(err => {
    console.error('Database init failed:', err);
    process.exit(1);
  });
