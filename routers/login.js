const router = require('express').Router();
const AuthController = require('../controllers/authController');

router.get('/', AuthController.showLogin);
router.post('/', AuthController.login);
router.get('/register', AuthController.showRegister);
router.post('/register', AuthController.register);

module.exports = router;