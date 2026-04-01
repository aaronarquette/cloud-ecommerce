const router = require('express').Router();
const Controller = require('../controllers/controller');

const loginRouter = require('./login');
const gameRouter = require('./game');

router.get('/', Controller.showHomePage);
router.use('/login', loginRouter);
router.use('/game', gameRouter);
router.get('/profile/:username', Controller.showUserProfile);

module.exports = router;