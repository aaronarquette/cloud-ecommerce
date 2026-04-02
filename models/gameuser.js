'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class GameUser extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      GameUser.belongsTo(models.User, { foreignKey: 'UserId' });
      GameUser.belongsTo(models.Game, { foreignKey: 'GameId' });
    }
  }
  GameUser.init({
    UserId: DataTypes.INTEGER,
    GameId: DataTypes.INTEGER,
    purchasedAt: DataTypes.DATE,
    rating: DataTypes.INTEGER,
    review: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'GameUser',
  });
  return GameUser;
};