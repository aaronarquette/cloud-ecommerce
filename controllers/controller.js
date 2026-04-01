'use strict';

const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, UserDetail, Game, GameUser, Genre } = require('../models');

const controller = {

  showLogin(req, res) {
    if (req.session.user) return res.redirect('/');
    res.render('login', { error: null });
  },

  async handleLogin(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) return res.render('login', { error: 'Email tidak ditemukan' });

      const isValid = bcrypt.compareSync(password, user.password);
      if (!isValid) return res.render('login', { error: 'Password salah' });

      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: user.balance
      };

      if (user.role === 'admin') return res.redirect('/admin');
      res.redirect('/');

    } catch (error) {
      console.error(error);
      res.render('login', { error: 'Terjadi kesalahan server' });
    }
  },

  showRegister(req, res) {
    if (req.session.user) return res.redirect('/');
    res.render('register', { error: null });
  },

  async handleRegister(req, res) {
    try {
      const { username, email, password } = req.body;

      const existing = await User.findOne({ where: { email } });
      if (existing) return res.render('register', { error: 'Email sudah terdaftar' });

      const hashedPassword = bcrypt.hashSync(password, 10);

      const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        role: 'user',
        balance: 0
      });

      await UserDetail.create({
        description: 'Belum ada deskripsi.',
        imageUrl: 'https://randomuser.me/api/portraits/lego/1.jpg',
        UserId: newUser.id
      });

      res.redirect('/login');

    } catch (error) {
      console.error(error);
      res.render('register', { error: 'Gagal register' });
    }
  },

  handleLogout(req, res) {
    req.session.destroy(() => res.redirect('/login')); // FIX 6: tambah slash di '/login'
  },

  // ================= GAMES =================

  async index(req, res) {
    try {
      const { genre, search } = req.query;

      const where = {};
      if (search) where.title = { [Op.iLike]: `%${search}%` };
      if (genre) where.GenreId = genre;

      const games = await Game.findAll({
        where,
        include: Genre,
        order: [['createdAt', 'DESC']]
      });

      const genres = await Genre.findAll();

      res.render('home', { // FIX 3: 'games' → 'home' sesuai nama file home.ejs
        games,
        genres,
        user: req.session.user || null,
        currentGenre: genre || '',
        search: search || ''
      });

    } catch (error) {
      console.error(error);
      res.render('error', { message: 'Gagal load game' });
    }
  },

  async detail(req, res) {
    try {
      const game = await Game.findByPk(req.params.id, {
        include: [
          Genre,
          {
            model: GameUser,
            include: [{ model: User, attributes: ['username'] }]
          }
        ]
      });

      if (!game) return res.redirect('/');

      let alreadyBought = false;
      let userReview = null;

      if (req.session.user) {
        const purchase = await GameUser.findOne({
          where: { UserId: req.session.user.id, GameId: game.id }
        });
        alreadyBought = !!purchase;
        userReview = purchase;
      }

      const reviews = game.GameUsers.filter(r => r.rating !== null);
      const avgRating = reviews.length
        ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1)
        : null;

      res.render('gamedetail', {
        game,
        user: req.session.user || null,
        alreadyBought,
        userReview,
        avgRating,
        reviews,
        msg: req.query.msg || null  // FIX: kirim msg dari query string ke view
      });

    } catch (error) {
      console.error(error);
      res.render('error', { message: 'Gagal load detail' });
    }
  },

  async buyGame(req, res) {
    try {
      if (!req.session.user) return res.redirect('/login');

      const userId = req.session.user.id;
      const game = await Game.findByPk(req.params.id);

      if (!game) return res.redirect('/');

      const already = await GameUser.findOne({ where: { UserId: userId, GameId: game.id } });
      if (already) return res.redirect(`/games/${game.id}?msg=already_owned`);

      const user = await User.findByPk(userId);
      if (user.balance < game.price) {
        return res.redirect(`/games/${game.id}?msg=insufficient_balance`);
      }

      const newBalance = user.balance - game.price; // FIX 7: hitung dulu sebelum update

      await user.update({ balance: newBalance });

      await GameUser.create({
        UserId: userId,
        GameId: game.id,
        purchasedAt: new Date()
      });

      req.session.user.balance = newBalance; // FIX 7: pakai newBalance, bukan double-substract

      res.redirect(`/games/${game.id}?msg=success`);

    } catch (error) {
      console.error(error);
      res.render('error', { message: 'Gagal beli game' });
    }
  },

  async rateGame(req, res) {
    try {
      if (!req.session.user) return res.redirect('/login');

      const { rating, review } = req.body;

      const purchase = await GameUser.findOne({
        where: { UserId: req.session.user.id, GameId: req.params.id }
      });

      if (!purchase) return res.redirect(`/games/${req.params.id}`);

      await purchase.update({
        rating: parseInt(rating),
        review: review || null
      });

      res.redirect(`/games/${req.params.id}`);

    } catch (error) {
      console.error(error);
      res.render('error', { message: 'Gagal rating' });
    }
  },

  // ================= USER =================

  async showProfile(req, res) {
    try {
      const profileUser = await User.findByPk(req.params.id, {
        include: [
          UserDetail,
          {
            model: Game,
            through: { model: GameUser }
          }
        ]
      });

      res.render('userprofile', {
        profileUser,
        user: req.session.user || null
      });

    } catch (error) {
      console.error(error);
      res.render('error', { message: 'Gagal load profile' });
    }
  },

  async showWallet(req, res) {
    try {
      if (!req.session.user) return res.redirect('/login');

      const user = await User.findByPk(req.session.user.id);
      req.session.user.balance = user.balance;

      res.render('wallet', {
        user: req.session.user,
        balance: user.balance
      });

    } catch (error) {
      console.error(error);
      res.render('error', { message: 'Gagal wallet' });
    }
  },

  async topUp(req, res) {
    try {
      if (!req.session.user) return res.redirect('/login');

      const amount = parseInt(req.body.amount);
      if (!amount || amount <= 0) return res.redirect('/wallet');

      const user = await User.findByPk(req.session.user.id);
      const newBalance = user.balance + amount;

      await user.update({ balance: newBalance });
      req.session.user.balance = newBalance;

      res.redirect('/wallet');

    } catch (error) {
      console.error(error);
      res.render('error', { message: 'Gagal topup' });
    }
  },

  // ================= ADMIN =================

  async adminDashboard(req, res) {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/');
      }

      const totalGames = await Game.count();
      const totalUsers = await User.count({ where: { role: 'user' } });
      const totalTransactions = await GameUser.count();

      // FIX 5: hitung totalRevenue yang dipakai di admindashboard.ejs
      const allPurchases = await GameUser.findAll({
        include: [{ model: Game, attributes: ['price'] }]
      });
      const totalRevenue = allPurchases.reduce((sum, gu) => sum + (gu.Game?.price || 0), 0);

      res.render('admindashboard', { // FIX 4: 'admin/dashboard' → 'admindashboard'
        user: req.session.user,
        totalGames,
        totalUsers,
        totalTransactions,
        totalRevenue // FIX 5: kirim totalRevenue ke view
      });

    } catch (error) {
      console.error(error);
      res.render('error', { message: 'Gagal dashboard' });
    }
  },

  // FIX 7: tambah method admin CRUD yang hilang

  async adminGameList(req, res) {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/');
      }

      const games = await Game.findAll({
        include: Genre,
        order: [['createdAt', 'DESC']]
      });

      res.render('admingamelist', {
        user: req.session.user,
        games,
        success: req.query.success || null
      });

    } catch (error) {
      console.error(error);
      res.render('error', { message: 'Gagal load daftar game' });
    }
  },

  async adminGameForm(req, res) {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/');
      }

      const genres = await Genre.findAll();

      res.render('admingameform', {
        user: req.session.user,
        game: null,
        genres,
        error: null
      });

    } catch (error) {
      console.error(error);
      res.render('error', { message: 'Gagal load form' });
    }
  },

  async adminCreateGame(req, res) {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/');
      }

      const { title, price, description, imageUrl, GenreId } = req.body;

      await Game.create({
        title,
        price: parseInt(price),
        description,
        imageUrl,
        GenreId: parseInt(GenreId)
      });

      res.redirect('/admin/games?success=created');

    } catch (error) {
      console.error(error);
      const genres = await Genre.findAll();
      res.render('admingameform', {
        user: req.session.user,
        game: null,
        genres,
        error: 'Gagal menambahkan game'
      });
    }
  },

  async adminEditForm(req, res) {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/');
      }

      const game = await Game.findByPk(req.params.id, { include: Genre });
      if (!game) return res.redirect('/admin/games');

      const genres = await Genre.findAll();

      res.render('admingameform', {
        user: req.session.user,
        game,
        genres,
        error: null
      });

    } catch (error) {
      console.error(error);
      res.render('error', { message: 'Gagal load form edit' });
    }
  },

  async adminUpdateGame(req, res) {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/');
      }

      const { title, price, description, imageUrl, GenreId } = req.body;
      const game = await Game.findByPk(req.params.id);

      if (!game) return res.redirect('/admin/games');

      await game.update({
        title,
        price: parseInt(price),
        description,
        imageUrl,
        GenreId: parseInt(GenreId)
      });

      res.redirect('/admin/games?success=updated');

    } catch (error) {
      console.error(error);
      res.render('error', { message: 'Gagal update game' });
    }
  },

  async adminDeleteGame(req, res) {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/');
      }

      const game = await Game.findByPk(req.params.id);
      if (game) {
        await GameUser.destroy({ where: { GameId: game.id } });
        await game.destroy();
      }

      res.redirect('/admin/games?success=deleted');

    } catch (error) {
      console.error(error);
      res.render('error', { message: 'Gagal hapus game' });
    }
  }

};

module.exports = controller;