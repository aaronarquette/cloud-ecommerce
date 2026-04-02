const express = require('express');
const path    = require('path');
const session = require('express-session');   // ← npm install express-session
const router  = require('./routes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Session ──
app.use(session({
  secret: process.env.SESSION_SECRET || 'gamestore-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,  // 1 hari
  }
}));

// ── Inject sessionUser ke semua view ──
app.use((req, res, next) => {
  res.locals.sessionUser = req.session.user || null;
  next();
});

// ── Middleware ──
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// ── Template Engine ──
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Routes ──
app.use('/', router);

// ── 404 Handler ──
app.use((req, res) => {
  res.status(404).render('error', { message: 'Halaman tidak ditemukan' });
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`\n🎮 GameStore running at http://localhost:${PORT}`);
  console.log(`    Admin login: admin@mail.com / 123\n`);
});