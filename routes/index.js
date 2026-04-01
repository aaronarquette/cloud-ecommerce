const express = require('express');
const router = express.Router();

const controller = require('../controllers/controller');

// ─── AUTH ─────────────────────────────────
router.get('/login', controller.showLogin);
router.post('/login', controller.handleLogin);
router.get('/register', controller.showRegister);
router.post('/register', controller.handleRegister);
router.get('/logout', controller.handleLogout);

// ─── GAMES ────────────────────────────────
router.get('/', controller.index);
router.get('/games/:id', controller.detail);
router.post('/games/:id/buy', controller.buyGame);
router.post('/games/:id/rate', controller.rateGame);

// ─── USER ─────────────────────────────────
router.get('/profile/:id', controller.showProfile);
router.get('/wallet', controller.showWallet);
router.post('/wallet/topup', controller.topUp);

// ─── ADMIN ────────────────────────────────
router.get('/admin', controller.adminDashboard);

// FIX 7: tambah route admin CRUD yang dibutuhkan oleh view tapi belum ada
router.get('/admin/games', controller.adminGameList);
router.get('/admin/games/add', controller.adminGameForm);
router.post('/admin/games', controller.adminCreateGame);
router.get('/admin/games/:id/edit', controller.adminEditForm);
router.post('/admin/games/:id/edit', controller.adminUpdateGame);
router.post('/admin/games/:id/delete', controller.adminDeleteGame);

module.exports = router;