const router = require('express').Router()
const GameController = require('../controllers/gameController')

router.get('/:id', GameController.showDetailGame);
router.get('/:id/buy', GameController.showBuyGame);
router.post('/:id/buy', GameController.buyGame);

module.exports = router;