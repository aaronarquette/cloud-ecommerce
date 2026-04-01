'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Game extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Game.belongsTo(models.Genre, { foreignKey: 'GenreId' });
      Game.belongsToMany(models.User, {
        through: models.GameUser,
        foreignKey: 'GameId'
      }); 
      Game.hasMany(models.GameUser, { foreignKey: 'GameId' });
    }
  }
  Game.init({
    title: DataTypes.STRING,
    price: DataTypes.INTEGER,
    description: DataTypes.STRING,
    imageUrl: DataTypes.STRING,
    GenreId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Game',
  });
  return Game;
};