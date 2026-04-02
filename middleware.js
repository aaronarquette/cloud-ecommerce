'use strict';

const middleware = {

  isLoggedIn(req, res, next) {
    if (!req.session.user) return res.redirect('/login');
    next();
  },

  isAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.redirect('/');
    }
    next();
  },

  isGuest(req, res, next) {
    if (req.session.user) return res.redirect('/');
    next();
  }

};

module.exports = middleware;