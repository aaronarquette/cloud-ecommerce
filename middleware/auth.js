// Cek apakah user sudah login
function isLoggedIn(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// Cek apakah user adalah admin
function isAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/');
  }
  next();
}

module.exports = { isLoggedIn, isAdmin };