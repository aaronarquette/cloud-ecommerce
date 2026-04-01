'use strict';
const path = require('path');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const rawData = require(path.join(__dirname, '../data/games.json'));

    const games = rawData.map(game => ({
      ...game,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await queryInterface.bulkInsert('Games', games, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Games', null, {});
  }
};