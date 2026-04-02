'use strict';

const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, UserDetail, Game, GameUser, Genre } = require('../models');

const controller = {

  showLogin(req, res) {
    // isGuest middleware sudah handle redirect jika sudah login
    res.render('login', { error: null });
  },

  async handleLogin(req, res) {
    try {
      const { email, password } = req.body;

      // email otomatis lowercase karena setter di model
      const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
      if (!user) return res.render('login', { error: 'Email tidak ditemukan' });

      // ambil raw password dari DB (bukan getter), lalu compare
      const rawPassword = user.getDataValue('password');
      const isValid = bcrypt.compareSync(password, rawPassword);
      if (!isValid) return res.render('login', { error: 'Password salah' });

      req.session.user = {
        id: user.id,
        username: user.getDataValue('username'), // raw value untuk session
        email: user.getDataValue('email'),
        role: user.role,
        balance: user.getDataValue('balance')    // raw number untuk kalkulasi
      };

      if (user.role === 'admin') return res.redirect('/admin');
      res.redirect('/');

    } catch (error) {
      console.error(error);
      res.render('login', { error: 'Terjadi kesalahan server' });
    }
  },

  showRegister(req, res) {
    // isGuest middleware sudah handle redirect jika sudah login
    res.render('register', { error: null });
  },

  async handleRegister(req, res) {
    try {
      const { username, email, password } = req.body;

      const existing = await User.findOne({ where: { email: email.toLowerCase().trim() } });
      if (existing) return res.render('register', { error: 'Email sudah terdaftar' });

      // TIDAK perlu bcrypt.hashSync manual lagi
      // beforeCreate hook di model otomatis hash password
      const newUser = await User.create({
        username,
        email,      // setter model otomatis lowercase
        password,   // hook model otomatis hash
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
    req.session.destroy(() => res.redirect('/login'));
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

      res.render('home', {
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
        msg: req.query.msg || null
      });

    } catch (error) {
      console.error(error);
      res.render('error', { message: 'Gagal load detail' });
    }
  },

  async buyGame(req, res) {
    // isLoggedIn middleware sudah handle cek session
    try {
      const userId = req.session.user.id;
      const game = await Game.findByPk(req.params.id);

      if (!game) return res.redirect('/');

      const already = await GameUser.findOne({ where: { UserId: userId, GameId: game.id } });
      if (already) return res.redirect(`/games/${game.id}?msg=already_owned`);

      const user = await User.findByPk(userId);

      // ambil raw balance (bukan getter string "Rp...")
      const rawBalance = user.getDataValue('balance');
      if (rawBalance < game.price) {
        return res.redirect(`/games/${game.id}?msg=insufficient_balance`);
      }

      const newBalance = rawBalance - game.price;

      await user.update({ balance: newBalance });

      await GameUser.create({
        UserId: userId,
        GameId: game.id,
        purchasedAt: new Date()
      });

      req.session.user.balance = newBalance;

      res.redirect(`/games/${game.id}?msg=success`);

    } catch (error) {
      console.error(error);
      res.render('error', { message: 'Gagal beli game' });
    }
  },

  async rateGame(req, res) {
    // isLoggedIn middleware sudah handle cek session
    try {
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
    // isLoggedIn middleware sudah handle cek session
    try {
      const user = await User.findByPk(req.session.user.id);
      const rawBalance = user.getDataValue('balance');
      req.session.user.balance = rawBalance;

      res.render('wallet', {
        user: req.session.user,
        balance: rawBalance
      });

    } catch (error) {
      console.error(error);
      res.render('error', { message: 'Gagal wallet' });
    }
  },

  async topUp(req, res) {
    // isLoggedIn middleware sudah handle cek session
    try {
      const amount = parseInt(req.body.amount);
      if (!amount || amount <= 0) return res.redirect('/wallet');

      const user = await User.findByPk(req.session.user.id);
      const rawBalance = user.getDataValue('balance');
      const newBalance = rawBalance + amount;

      await user.update({ balance: newBalance });
      req.session.user.balance = newBalance;

      res.redirect('/wallet');

    } catch (error) {
      console.error(error);
      res.render('error', { message: 'Gagal topup' });
    }
  },

  // ================= ADMIN =================
  // isAdmin middleware sudah handle cek session + role di router

  async adminDashboard(req, res) {
    try {
      const totalGames = await Game.count();
      const totalUsers = await User.count({ where: { role: 'user' } });
      const totalTransactions = await GameUser.count();

      const allPurchases = await GameUser.findAll({
        include: [{ model: Game, attributes: ['price'] }]
      });
      const totalRevenue = allPurchases.reduce((sum, gu) => sum + (gu.Game?.price || 0), 0);

      res.render('admindashboard', {
        user: req.session.user,
        totalGames,
        totalUsers,
        totalTransactions,
        totalRevenue
      });

    } catch (error) {
      console.error(error);
      res.render('error', { message: 'Gagal dashboard' });
    }
  },

  async adminGameList(req, res) {
    try {
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