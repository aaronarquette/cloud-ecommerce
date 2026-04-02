const express = require('express');
const session = require('express-session')
const path    = require('path');  // bawaan Node.js, tidak perlu install
const router  = require('./routes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── In-Memory Session (tanpa install apapun) ───────────────────────────
//
//  Cara kerja:
//  - Setiap browser dapat "session id" unik yang disimpan di cookie-nya
//  - Data login disimpan di Map pakai id itu sebagai kunci
//  - Saat refresh: browser kirim cookie → server baca Map → user tetap login
//  - Saat logout: entry di Map dihapus + cookie dihapus dari browser
//
//  ⚠️ Data hilang kalau server di-restart (karena Map ada di memory)
//  Kalau nanti belajar express-session, cukup ganti blok ini saja

const sessions = new Map();

function buatId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function bacaCookies(header) {
  const result = {};
  if (!header) return result;
  header.split(';').forEach(item => {
    const [k, ...v] = item.trim().split('=');
    result[k.trim()] = v.join('=');
  });
  return result;
}

app.use((req, res, next) => {
  const cookies   = bacaCookies(req.headers.cookie);
  let   sessionId = cookies['sid'];

  // buat session baru kalau belum ada atau sudah dihapus (logout)
  if (!sessionId || !sessions.has(sessionId)) {
    sessionId = buatId();
    sessions.set(sessionId, {});
    res.setHeader('Set-Cookie', `sid=${sessionId}; HttpOnly; Path=/`);
  }

  const sessionData = sessions.get(sessionId);
  req.session = sessionData;

  // method destroy: dipakai controller saat logout
  req.session.destroy = (callback) => {
    sessions.delete(sessionId);
    // hapus cookie di browser dengan set expires ke masa lalu
    res.setHeader('Set-Cookie', 'sid=; HttpOnly; Path=/; Max-Age=0');
    if (typeof callback === 'function') callback();
  };

  res.locals.sessionUser = req.session.user || null;
  next();
});
// ───────────────────────────────────────────────────────────────────────

// ── Middleware ──
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(session({
  secret: 'cloud_gg_e_commerce', // A unique string used to sign the session ID cookie
  resave: false,               // Prevents resaving session if nothing changed
  saveUninitialized: true,     // Forces a session that is "uninitialized" to be saved to the store
  cookie: { 
    secure: false,             // Set to true if using HTTPS
    maxAge: 6000000            // Cookie expiration in milliseconds (e.g., 1 minute)
  }
}));

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